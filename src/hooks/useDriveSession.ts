import * as Location from 'expo-location';
import * as Speech from 'expo-speech';
import { Linking } from 'react-native';
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

const SPEED_LIMIT_REFRESH_MS = 15000;

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
  const [alertThresholdKmh, setAlertThresholdKmh] = useState(DEFAULT_ALERT_THRESHOLD_KMH);
  const [latestTripSummary, setLatestTripSummary] = useState<TripSummary | null>(null);

  const locationSubRef = useRef<Location.LocationSubscription | null>(null);
  const overLimitStartRef = useRef<number | null>(null);
  const lastAlertAtRef = useRef(0);
  const speedLimitRef = useRef(speedLimitKmh);
  const speedLimitSourceRef = useRef<SpeedLimitSource>(speedLimitSource);
  const alertThresholdRef = useRef(alertThresholdKmh);
  const sessionStartedAtRef = useRef<number | null>(null);
  const maxSpeedKmhRef = useRef(0);
  const maxOverKmhRef = useRef(0);
  const warningCountRef = useRef(0);
  const alertCountRef = useRef(0);
  const previousDriveStateRef = useRef<DriveState>('safe');
  const lastSpeedLimitFetchAtRef = useRef(0);
  const isSpeedLimitFetchInFlightRef = useRef(false);

  useEffect(() => {
    speedLimitRef.current = speedLimitKmh;
  }, [speedLimitKmh]);

  useEffect(() => {
    speedLimitSourceRef.current = speedLimitSource;
  }, [speedLimitSource]);

  useEffect(() => {
    alertThresholdRef.current = alertThresholdKmh;
  }, [alertThresholdKmh]);

  const overByKmh = Math.max(0, currentSpeedKmh - speedLimitKmh);
  const driveState = getDriveState(overByKmh, alertThresholdKmh);

  const requestLocationAccess = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status === 'granted') {
      setPermissionState('granted');
      setStatusText('Location access granted. You can start drive now.');
      return true;
    }

    setPermissionState('denied');
    setLocationStatus('inactive');
    setStatusText('Location permission denied. Enable it in settings.');
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
    overLimitStartRef.current = null;
    setLocationStatus('inactive');
    setSpeedLimitSource('manual');
    setStatusText('Tracking stopped.');
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

    lastAlertAtRef.current = now;
    setStatusText(`Alert sent: ${Math.round(overKmh)} km/h over limit.`);
    await Speech.speak(
      `Reduce speed. You are ${Math.round(overKmh)} kilometers per hour over the speed limit.`,
      {
        rate: 0.95,
        pitch: 1,
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
      setIsTracking(true);
      setLatestTripSummary(null);
      resetSessionMetrics();
      overLimitStartRef.current = null;
      lastAlertAtRef.current = 0;
      lastSpeedLimitFetchAtRef.current = 0;

      locationSubRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 1000,
          distanceInterval: 2,
          mayShowUserSettingsDialog: true,
        },
        (location) => {
          const now = Date.now();
          const speedMps = Math.max(0, location.coords.speed ?? 0);
          const kmh = speedMps * 3.6;
          const over = kmh - speedLimitRef.current;

          setCurrentSpeedKmh(kmh);
          recordSessionMetrics(kmh, over);

          const canRefreshSpeedLimit =
            !isSpeedLimitFetchInFlightRef.current &&
            now - lastSpeedLimitFetchAtRef.current >= SPEED_LIMIT_REFRESH_MS;

          if (canRefreshSpeedLimit) {
            isSpeedLimitFetchInFlightRef.current = true;
            lastSpeedLimitFetchAtRef.current = now;

            void resolveLiveSpeedLimitKmh({
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            })
              .then((result) => {
                if (result.speedLimitKmh) {
                  setSpeedLimitKmh(result.speedLimitKmh);
                  setSpeedLimitSource('live');
                } else {
                  setSpeedLimitSource('unknown');
                }
              })
              .catch(() => {
                setSpeedLimitSource('unknown');
              })
              .finally(() => {
                isSpeedLimitFetchInFlightRef.current = false;
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
    recordSessionMetrics(speedKmh, speedKmh - speedLimitRef.current);
    setStatusText(`Demo speed set to ${Math.round(speedKmh)} km/h.`);
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
      } else if (status === 'denied') {
        setPermissionState('denied');
      } else {
        setPermissionState('unknown');
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
