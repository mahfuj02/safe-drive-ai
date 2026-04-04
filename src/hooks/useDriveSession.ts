import * as Location from 'expo-location';
import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';
import { Linking, Vibration } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import {
  ALERT_COOLDOWN_MS,
  ALERT_SUSTAIN_MS,
  DEFAULT_ALERT_THRESHOLD_KMH,
  DEFAULT_SPEED_LIMIT_KMH,
} from '../constants/driving';
import { resolveLiveSpeedLimitKmh } from '../services/speedLimit/liveSpeedLimitService';
import {
  DriveState,
  LocationStatus,
  PermissionState,
  SpeedLimitSource,
  TripSummary,
} from '../types/driving';

const SPEED_LIMIT_REFRESH_MS = 7000;
const SPEED_LIMIT_MOVE_REFRESH_METERS = 70;
const ROAD_LABEL_REFRESH_MS = 15000;
const LIVE_LIMIT_STALE_MS = 35000;
const UPCOMING_LIMIT_PREWARN_DISTANCE_METERS = 220;
const UPCOMING_LIMIT_WARN_COOLDOWN_MS = 30000;
const ALERT_VIBRATION_PATTERN_MS: number[] = [0, 450, 140, 450];

type LocationPoint = {
  latitude: number;
  longitude: number;
};

type SpeedSample = {
  point: LocationPoint;
  atMs: number;
};

type RoadLabelCandidate = {
  roadName?: string;
  roadClass?: string;
  street?: string;
  district?: string;
  city?: string;
};

function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

function distanceMeters(a: LocationPoint, b: LocationPoint): number {
  const earthRadius = 6371000;
  const dLat = toRadians(b.latitude - a.latitude);
  const dLon = toRadians(b.longitude - a.longitude);
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);

  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  return 2 * earthRadius * Math.asin(Math.sqrt(h));
}

function buildRoadLabel(candidate: RoadLabelCandidate): string {
  if (candidate.roadName) {
    return candidate.roadName;
  }

  if (candidate.street) {
    return candidate.street;
  }

  if (candidate.roadClass) {
    return candidate.roadClass.replace(/_/g, ' ');
  }

  if (candidate.district && candidate.city) {
    return `${candidate.district}, ${candidate.city}`;
  }

  if (candidate.city) {
    return candidate.city;
  }

  return 'Road not detected';
}

function getDriveState(overByKmh: number, alertThresholdKmh: number): DriveState {
  if (overByKmh >= alertThresholdKmh) {
    return 'alert';
  }

  if (overByKmh >= Math.max(1, alertThresholdKmh - 3)) {
    return 'warning';
  }

  return 'safe';
}

export function useDriveSession() {
  const [speedLimitKmh, setSpeedLimitKmh] = useState(DEFAULT_SPEED_LIMIT_KMH);
  const [currentSpeedKmh, setCurrentSpeedKmh] = useState(0);
  const [isTracking, setIsTracking] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [statusText, setStatusText] = useState('Tap Start Drive to begin.');
  const [locationStatus, setLocationStatus] = useState<LocationStatus>('inactive');
  const [permissionState, setPermissionState] = useState<PermissionState>('unknown');
  const [speedLimitSource, setSpeedLimitSource] = useState<SpeedLimitSource>('manual');
  const [roadLabel, setRoadLabel] = useState('Road not detected');
  const [limitContextLabel, setLimitContextLabel] = useState<string | null>(null);
  const [upcomingLimitPreview, setUpcomingLimitPreview] = useState<string | null>(null);
  const [alertThresholdKmh, setAlertThresholdKmh] = useState(DEFAULT_ALERT_THRESHOLD_KMH);
  const [latestTripSummary, setLatestTripSummary] = useState<TripSummary | null>(null);

  const locationSubRef = useRef<Location.LocationSubscription | null>(null);
  const overLimitStartRef = useRef<number | null>(null);
  const lastAlertAtRef = useRef(0);
  const speedLimitRef = useRef(speedLimitKmh);
  const speedLimitSourceRef = useRef<SpeedLimitSource>(speedLimitSource);
  const roadLabelRef = useRef(roadLabel);
  const alertThresholdRef = useRef(alertThresholdKmh);
  const sessionStartedAtRef = useRef<number | null>(null);
  const maxSpeedKmhRef = useRef(0);
  const maxOverKmhRef = useRef(0);
  const warningCountRef = useRef(0);
  const alertCountRef = useRef(0);
  const previousDriveStateRef = useRef<DriveState>('safe');
  const lastSpeedLimitFetchAtRef = useRef(0);
  const isSpeedLimitFetchInFlightRef = useRef(false);
  const lastFetchPointRef = useRef<LocationPoint | null>(null);
  const lastLiveSpeedLimitRef = useRef<number | null>(null);
  const lastLiveRoadLabelRef = useRef<string>('Road not detected');
  const lastLiveResolvedAtRef = useRef(0);
  const previousSpeedSampleRef = useRef<SpeedSample | null>(null);
  const displayedSpeedKmhRef = useRef(0);
  const lastRoadLabelFetchAtRef = useRef(0);
  const lastUpcomingWarnAtRef = useRef(0);
  const lastUpcomingWarnKeyRef = useRef('');

  useEffect(() => {
    speedLimitRef.current = speedLimitKmh;
  }, [speedLimitKmh]);

  useEffect(() => {
    speedLimitSourceRef.current = speedLimitSource;
  }, [speedLimitSource]);

  useEffect(() => {
    roadLabelRef.current = roadLabel;
  }, [roadLabel]);

  useEffect(() => {
    alertThresholdRef.current = alertThresholdKmh;
  }, [alertThresholdKmh]);

  const overByKmh = Math.max(0, currentSpeedKmh - speedLimitKmh);
  const driveState = getDriveState(overByKmh, alertThresholdKmh);

  const requestLocationAccess = async () => {
    setStatusText('Requesting location permission...');

    const currentPermission = await Location.getForegroundPermissionsAsync();

    if (currentPermission.status === 'granted') {
      setPermissionState('granted');
      setLocationStatus('active');
      setStatusText('Location access already granted. You can start drive now.');
      return true;
    }

    if (!currentPermission.canAskAgain) {
      setPermissionState('denied');
      setLocationStatus('inactive');
      setStatusText('Permission blocked by OS. Tap Open Settings to allow location.');
      return false;
    }

    const requestedPermission = await Location.requestForegroundPermissionsAsync();

    if (requestedPermission.status === 'granted') {
      setPermissionState('granted');
      setLocationStatus('active');
      setStatusText('Location access granted. You can start drive now.');
      return true;
    }

    setPermissionState('denied');
    setLocationStatus('inactive');
    if (!requestedPermission.canAskAgain) {
      setStatusText('Permission blocked by OS. Tap Open Settings to allow location.');
    } else {
      setStatusText('Location permission denied. Please allow to start drive.');
    }
    return false;
  };

  const resetSessionMetrics = () => {
    sessionStartedAtRef.current = Date.now();
    maxSpeedKmhRef.current = 0;
    maxOverKmhRef.current = 0;
    warningCountRef.current = 0;
    alertCountRef.current = 0;
    previousDriveStateRef.current = 'safe';
  };

  const recordSessionMetrics = (speedKmh: number, overKmh: number) => {
    const safeOverKmh = Math.max(0, overKmh);

    if (speedKmh > maxSpeedKmhRef.current) {
      maxSpeedKmhRef.current = speedKmh;
    }

    if (safeOverKmh > maxOverKmhRef.current) {
      maxOverKmhRef.current = safeOverKmh;
    }

    const nextState = getDriveState(safeOverKmh, alertThresholdRef.current);

    if (nextState !== previousDriveStateRef.current) {
      if (nextState === 'warning') {
        warningCountRef.current += 1;
      }

      if (nextState === 'alert') {
        alertCountRef.current += 1;
      }

      previousDriveStateRef.current = nextState;
    }
  };

  const stopTracking = () => {
    const wasTracking = isTracking;
    const wasDemoMode = isDemoMode;

    if (locationSubRef.current) {
      locationSubRef.current.remove();
      locationSubRef.current = null;
    }

    if (wasTracking) {
      const startedAt = sessionStartedAtRef.current ?? Date.now();
      const durationSec = Math.max(1, Math.round((Date.now() - startedAt) / 1000));

      setLatestTripSummary({
        durationSec,
        maxSpeedKmh: Math.round(maxSpeedKmhRef.current),
        speedLimitKmh: speedLimitRef.current,
        maxOverKmh: Math.round(maxOverKmhRef.current),
        warningCount: warningCountRef.current,
        alertCount: alertCountRef.current,
        isDemoMode: wasDemoMode,
      });
    }

    setIsTracking(false);
    setIsDemoMode(false);
    setCurrentSpeedKmh(0);
    displayedSpeedKmhRef.current = 0;
    previousSpeedSampleRef.current = null;
    overLimitStartRef.current = null;
    if (permissionState === 'granted') {
      setLocationStatus('active');
    }
    setSpeedLimitSource('manual');
    setLimitContextLabel(null);
    setUpcomingLimitPreview(null);
    if (!wasTracking || wasDemoMode) {
      setRoadLabel('Road not detected');
    }
    setStatusText('Tracking stopped.');
  };

  const triggerCriticalOverspeedAlert = async (overKmh: number) => {
    lastAlertAtRef.current = Date.now();
    setStatusText(`Critical alert: ${Math.round(overKmh)} km/h over limit. Reduce speed now.`);
    Vibration.vibrate(ALERT_VIBRATION_PATTERN_MS, false);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    await Speech.speak(
      `Reduce speed now. You are ${Math.round(overKmh)} kilometers per hour over the speed limit.`,
      {
        rate: 0.9,
        pitch: 1,
        volume: 1,
      },
    );
  };

  const maybeSpeakOverspeedAlert = async (overKmh: number) => {
    const now = Date.now();

    if (!isDemoMode && speedLimitSourceRef.current !== 'live') {
      overLimitStartRef.current = null;
      return;
    }

    if (overKmh < alertThresholdRef.current) {
      overLimitStartRef.current = null;
      return;
    }

    if (overLimitStartRef.current === null) {
      overLimitStartRef.current = now;
      return;
    }

    const sustained = now - overLimitStartRef.current >= ALERT_SUSTAIN_MS;
    const inCooldown = now - lastAlertAtRef.current < ALERT_COOLDOWN_MS;

    if (!sustained || inCooldown) {
      return;
    }

    await triggerCriticalOverspeedAlert(overKmh);
  };

  const maybeSpeakUpcomingLimitWarning = async (
    nextLowerLimitKmh: number,
    distanceMeters: number,
    currentSpeedKmh: number,
  ) => {
    if (isDemoMode || speedLimitSourceRef.current !== 'live') {
      return;
    }

    if (distanceMeters > UPCOMING_LIMIT_PREWARN_DISTANCE_METERS) {
      return;
    }

    if (currentSpeedKmh < nextLowerLimitKmh - 3) {
      return;
    }

    const now = Date.now();
    const warnKey = `${nextLowerLimitKmh}:${Math.round(distanceMeters / 10)}`;
    const inCooldown = now - lastUpcomingWarnAtRef.current < UPCOMING_LIMIT_WARN_COOLDOWN_MS;

    if (inCooldown && warnKey === lastUpcomingWarnKeyRef.current) {
      return;
    }

    lastUpcomingWarnAtRef.current = now;
    lastUpcomingWarnKeyRef.current = warnKey;
    setStatusText(
      `Upcoming limit: ${nextLowerLimitKmh} km/h in ${Math.round(distanceMeters)} m. Slow down.`,
    );

    await Speech.speak(
      `Speed limit ahead ${nextLowerLimitKmh}. Reduce speed now.`,
      {
        rate: 0.96,
        pitch: 1,
        volume: 1,
      },
    );
  };

  const startTracking = async () => {
    setIsStarting(true);

    try {
      if (permissionState !== 'granted') {
        setLocationStatus('inactive');
        setStatusText('Allow location access first, then tap Start Drive.');
        return;
      }

      setStatusText('Tracking in progress...');
      setIsDemoMode(false);
      setLocationStatus('active');
      setSpeedLimitSource('unknown');
      setRoadLabel('Searching road...');
      setLimitContextLabel(null);
      setUpcomingLimitPreview(null);
      setIsTracking(true);
      setLatestTripSummary(null);
      resetSessionMetrics();
      overLimitStartRef.current = null;
      lastAlertAtRef.current = 0;
      lastSpeedLimitFetchAtRef.current = 0;
      lastRoadLabelFetchAtRef.current = 0;
      lastFetchPointRef.current = null;
      previousSpeedSampleRef.current = null;
      displayedSpeedKmhRef.current = 0;
      lastUpcomingWarnAtRef.current = 0;
      lastUpcomingWarnKeyRef.current = '';

      locationSubRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 1000,
          distanceInterval: 2,
          mayShowUserSettingsDialog: true,
        },
        (location) => {
          const now = Date.now();
          const point = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          };
          const speedMps = Math.max(0, location.coords.speed ?? 0);
          const rawSpeedKmh = speedMps * 3.6;
          const previousSample = previousSpeedSampleRef.current;
          let currentSpeedFromGpsKmh = rawSpeedKmh;

          if (previousSample) {
            const elapsedSec = Math.max(0.001, (now - previousSample.atMs) / 1000);
            const traveledMeters = distanceMeters(previousSample.point, point);
            const derivedSpeedKmh = (traveledMeters / elapsedSec) * 3.6;
            if (currentSpeedFromGpsKmh <= 0.5 && derivedSpeedKmh > 0.5) {
              currentSpeedFromGpsKmh = derivedSpeedKmh;
            }
          }

          previousSpeedSampleRef.current = { point, atMs: now };
          displayedSpeedKmhRef.current = currentSpeedFromGpsKmh;

          const over = currentSpeedFromGpsKmh - speedLimitRef.current;

          setCurrentSpeedKmh(currentSpeedFromGpsKmh);
          recordSessionMetrics(currentSpeedFromGpsKmh, over);

          const distanceSinceLastFetch = lastFetchPointRef.current
            ? distanceMeters(lastFetchPointRef.current, point)
            : Number.POSITIVE_INFINITY;

          const shouldRefreshByTime = now - lastSpeedLimitFetchAtRef.current >= SPEED_LIMIT_REFRESH_MS;
          const shouldRefreshByMovement = distanceSinceLastFetch >= SPEED_LIMIT_MOVE_REFRESH_METERS;

          const canRefreshSpeedLimit =
            !isSpeedLimitFetchInFlightRef.current &&
            (shouldRefreshByTime || shouldRefreshByMovement);

          if (canRefreshSpeedLimit) {
            isSpeedLimitFetchInFlightRef.current = true;
            lastSpeedLimitFetchAtRef.current = now;
            lastFetchPointRef.current = point;

            const headingDegrees =
              typeof location.coords.heading === 'number' && location.coords.heading >= 0
                ? location.coords.heading
                : undefined;

            void resolveLiveSpeedLimitKmh(point, headingDegrees)
              .then((result) => {
                if (result.speedLimitKmh) {
                  setSpeedLimitKmh(result.speedLimitKmh);
                  setSpeedLimitSource('live');
                  const nextRoadLabel = result.roadName ?? result.roadClass ?? 'Unnamed road';
                  setRoadLabel(nextRoadLabel);

                  if (result.isSchoolZoneActive) {
                    setLimitContextLabel(`School zone active${result.schoolZoneLimitKmh ? `: ${result.schoolZoneLimitKmh} km/h` : ''}`);
                  } else if (result.schoolZoneLimitKmh) {
                    setLimitContextLabel(`School zone rule detected (${result.schoolZoneLimitKmh} km/h) but inactive now`);
                  } else {
                    setLimitContextLabel(null);
                  }

                  if (result.nextLowerLimitKmh && result.nextLowerLimitDistanceMeters) {
                    const nextDistance = Math.round(result.nextLowerLimitDistanceMeters);
                    setUpcomingLimitPreview(
                      `Ahead: ${result.nextLowerLimitKmh} km/h in ${nextDistance} m`,
                    );
                    void maybeSpeakUpcomingLimitWarning(
                      result.nextLowerLimitKmh,
                      nextDistance,
                      currentSpeedFromGpsKmh,
                    );
                  } else {
                    setUpcomingLimitPreview(null);
                  }

                  lastLiveSpeedLimitRef.current = result.speedLimitKmh;
                  lastLiveRoadLabelRef.current = nextRoadLabel;
                  lastLiveResolvedAtRef.current = Date.now();
                } else {
                  const hasFreshCachedLive =
                    lastLiveSpeedLimitRef.current !== null &&
                    Date.now() - lastLiveResolvedAtRef.current <= LIVE_LIMIT_STALE_MS;

                  if (hasFreshCachedLive) {
                    const cachedLimit = lastLiveSpeedLimitRef.current;
                    if (cachedLimit === null) {
                      return;
                    }

                    setSpeedLimitKmh(cachedLimit);
                    setSpeedLimitSource('live');
                    setRoadLabel(lastLiveRoadLabelRef.current);
                  } else {
                    setSpeedLimitSource('unknown');
                    setLimitContextLabel(null);
                    setUpcomingLimitPreview(null);
                    setRoadLabel(result.roadName ?? result.roadClass ?? 'Road not detected');
                  }
                }
              })
              .catch(() => {
                const hasFreshCachedLive =
                  lastLiveSpeedLimitRef.current !== null &&
                  Date.now() - lastLiveResolvedAtRef.current <= LIVE_LIMIT_STALE_MS;

                if (hasFreshCachedLive) {
                  const cachedLimit = lastLiveSpeedLimitRef.current;
                  if (cachedLimit === null) {
                    return;
                  }

                  setSpeedLimitKmh(cachedLimit);
                  setSpeedLimitSource('live');
                  setRoadLabel(lastLiveRoadLabelRef.current);
                } else {
                  setSpeedLimitSource('unknown');
                  setLimitContextLabel(null);
                  setUpcomingLimitPreview(null);
                  setRoadLabel('Road lookup unavailable');
                }
              })
              .finally(() => {
                isSpeedLimitFetchInFlightRef.current = false;
              });
          }

          const shouldRefreshRoadLabel =
            now - lastRoadLabelFetchAtRef.current >= ROAD_LABEL_REFRESH_MS &&
            roadLabelRef.current === 'Road not detected';

          if (shouldRefreshRoadLabel) {
            lastRoadLabelFetchAtRef.current = now;

            void Location.reverseGeocodeAsync(point)
              .then((results) => {
                const firstResult = results[0];

                if (!firstResult) {
                  return;
                }

                const nextLabel = buildRoadLabel({
                  roadName: firstResult.street ?? undefined,
                  street: firstResult.street ?? undefined,
                  district: firstResult.district ?? undefined,
                  city: firstResult.city ?? undefined,
                });

                if (nextLabel !== 'Road not detected') {
                  setRoadLabel(nextLabel);
                }
              })
              .catch(() => {
                // Keep the current label if reverse geocoding fails.
              });
          }

          void maybeSpeakOverspeedAlert(over);
        },
      );
    } catch {
      setStatusText('Unable to start tracking. Please retry.');
      setIsTracking(false);
      setLocationStatus('inactive');
    } finally {
      setIsStarting(false);
    }
  };

  const startDemoMode = () => {
    if (locationSubRef.current) {
      locationSubRef.current.remove();
      locationSubRef.current = null;
    }

    setIsTracking(true);
    setIsDemoMode(true);
    setSpeedLimitSource('manual');
    setRoadLabel('Demo route');
    setLimitContextLabel(null);
    setUpcomingLimitPreview(null);
    setLatestTripSummary(null);
    resetSessionMetrics();
    setLocationStatus('inactive');
    const safeDemoSpeed = speedLimitRef.current - 2;
    setCurrentSpeedKmh(safeDemoSpeed);
    recordSessionMetrics(safeDemoSpeed, safeDemoSpeed - speedLimitRef.current);
    setStatusText('Demo mode active. Use controls to test states.');
    overLimitStartRef.current = null;
    lastAlertAtRef.current = 0;
  };

  const setDemoSpeedKmh = (speedKmh: number) => {
    setCurrentSpeedKmh(speedKmh);
    const overKmh = speedKmh - speedLimitRef.current;
    recordSessionMetrics(speedKmh, overKmh);
    setStatusText(`Demo speed set to ${Math.round(speedKmh)} km/h.`);

    const inAlert = overKmh >= alertThresholdRef.current;
    const canTriggerNow = Date.now() - lastAlertAtRef.current >= 1500;

    if (inAlert && canTriggerNow) {
      void triggerCriticalOverspeedAlert(overKmh);
    }
  };

  const closeTripSummary = () => {
    setLatestTripSummary(null);
  };

  const openAppSettings = async () => {
    await Linking.openSettings();
  };

  useEffect(() => {
    void Location.getForegroundPermissionsAsync().then(({ status }) => {
      if (status === 'granted') {
        setPermissionState('granted');
        setLocationStatus('active');
      } else if (status === 'denied') {
        setPermissionState('denied');
        setLocationStatus('inactive');
      } else {
        setPermissionState('unknown');
        setLocationStatus('inactive');
      }
    });

    return () => {
      if (locationSubRef.current) {
        locationSubRef.current.remove();
      }
    };
  }, []);

  return {
    speedLimitKmh,
    setSpeedLimitKmh,
    speedLimitSource,
    roadLabel,
    limitContextLabel,
    upcomingLimitPreview,
    currentSpeedKmh,
    isTracking,
    isStarting,
    isDemoMode,
    latestTripSummary,
    statusText,
    locationStatus,
    permissionState,
    alertThresholdKmh,
    setAlertThresholdKmh,
    overByKmh,
    driveState,
    requestLocationAccess,
    startTracking,
    startDemoMode,
    setDemoSpeedKmh,
    closeTripSummary,
    openAppSettings,
    stopTracking,
  };
}
