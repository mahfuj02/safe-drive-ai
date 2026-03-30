import * as Location from 'expo-location';
import * as Speech from 'expo-speech';
import { useEffect, useRef, useState } from 'react';
import {
  ALERT_COOLDOWN_MS,
  ALERT_SUSTAIN_MS,
  DEFAULT_ALERT_THRESHOLD_KMH,
  DEFAULT_SPEED_LIMIT_KMH,
} from '../constants/driving';
import { DriveState, LocationStatus } from '../types/driving';

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
  const [statusText, setStatusText] = useState('Tap Start Drive to begin.');
  const [locationStatus, setLocationStatus] = useState<LocationStatus>('inactive');
  const [alertThresholdKmh, setAlertThresholdKmh] = useState(DEFAULT_ALERT_THRESHOLD_KMH);

  const locationSubRef = useRef<Location.LocationSubscription | null>(null);
  const overLimitStartRef = useRef<number | null>(null);
  const lastAlertAtRef = useRef(0);
  const speedLimitRef = useRef(speedLimitKmh);
  const alertThresholdRef = useRef(alertThresholdKmh);

  useEffect(() => {
    speedLimitRef.current = speedLimitKmh;
  }, [speedLimitKmh]);

  useEffect(() => {
    alertThresholdRef.current = alertThresholdKmh;
  }, [alertThresholdKmh]);

  const overByKmh = Math.max(0, currentSpeedKmh - speedLimitKmh);
  const driveState = getDriveState(overByKmh, alertThresholdKmh);

  const stopTracking = () => {
    if (locationSubRef.current) {
      locationSubRef.current.remove();
      locationSubRef.current = null;
    }

    setIsTracking(false);
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
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        setLocationStatus('inactive');
        setStatusText('Location permission denied. Enable it in settings.');
        return;
      }

      setStatusText('Tracking in progress...');
      setLocationStatus('active');
      setIsTracking(true);
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
          void maybeSpeakOverspeedAlert(over);
        },
      );
    } catch {
      setStatusText('Unable to start tracking. Please retry.');
      setIsTracking(false);
      setLocationStatus('inactive');
    }
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
    statusText,
    locationStatus,
    alertThresholdKmh,
    setAlertThresholdKmh,
    overByKmh,
    driveState,
    startTracking,
    stopTracking,
  };
}
