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
import { DriveState, LocationStatus, PermissionState, TripSummary } from '../types/driving';

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
  const [alertThresholdKmh, setAlertThresholdKmh] = useState(DEFAULT_ALERT_THRESHOLD_KMH);
  const [latestTripSummary, setLatestTripSummary] = useState<TripSummary | null>(null);

  const locationSubRef = useRef<Location.LocationSubscription | null>(null);
  const overLimitStartRef = useRef<number | null>(null);
  const lastAlertAtRef = useRef(0);
  const speedLimitRef = useRef(speedLimitKmh);
  const alertThresholdRef = useRef(alertThresholdKmh);
  const sessionStartedAtRef = useRef<number | null>(null);
  const maxSpeedKmhRef = useRef(0);
  const maxOverKmhRef = useRef(0);
  const warningCountRef = useRef(0);
  const alertCountRef = useRef(0);
  const previousDriveStateRef = useRef<DriveState>('safe');

  useEffect(() => {
    speedLimitRef.current = speedLimitKmh;
  }, [speedLimitKmh]);

  useEffect(() => {
    alertThresholdRef.current = alertThresholdKmh;
  }, [alertThresholdKmh]);

  const overByKmh = Math.max(0, currentSpeedKmh - speedLimitKmh);
  const driveState = getDriveState(overByKmh, alertThresholdKmh);

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
    setStatusText('Tracking stopped.');
  };

  const maybeSpeakOverspeedAlert = async (overKmh: number) => {
    const now = Date.now();

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
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        setPermissionState('denied');
        setLocationStatus('inactive');
        setStatusText('Location permission denied. Enable it in settings.');
        return;
      }

      setPermissionState('granted');
      setStatusText('Tracking in progress...');
      setIsDemoMode(false);
      setLocationStatus('active');
      setIsTracking(true);
      setLatestTripSummary(null);
      resetSessionMetrics();
      overLimitStartRef.current = null;
      lastAlertAtRef.current = 0;

      locationSubRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 1000,
          distanceInterval: 2,
          mayShowUserSettingsDialog: true,
        },
        (location) => {
          const speedMps = Math.max(0, location.coords.speed ?? 0);
          const kmh = speedMps * 3.6;
          const over = kmh - speedLimitRef.current;

          setCurrentSpeedKmh(kmh);
          recordSessionMetrics(kmh, over);
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
    return () => {
      if (locationSubRef.current) {
        locationSubRef.current.remove();
      }
    };
  }, []);

  return {
    speedLimitKmh,
    setSpeedLimitKmh,
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
    startTracking,
    startDemoMode,
    setDemoSpeedKmh,
    closeTripSummary,
    openAppSettings,
    stopTracking,
  };
}
