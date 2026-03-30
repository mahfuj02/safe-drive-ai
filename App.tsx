import { StatusBar } from 'expo-status-bar';
import * as Location from 'expo-location';
import * as Speech from 'expo-speech';
import { useEffect, useRef, useState } from 'react';
import {
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const DEFAULT_SPEED_LIMIT_KMH = 50;
const ALERT_THRESHOLD_KMH = 8;
const ALERT_SUSTAIN_MS = 4000;
const ALERT_COOLDOWN_MS = 25000;

function clamp(n: number, min: number, max: number): number {
  return Math.min(Math.max(n, min), max);
}

export default function App() {
  const [speedLimitKmh, setSpeedLimitKmh] = useState(DEFAULT_SPEED_LIMIT_KMH);
  const [currentSpeedKmh, setCurrentSpeedKmh] = useState(0);
  const [isTracking, setIsTracking] = useState(false);
  const [statusText, setStatusText] = useState('Tap Start Drive to begin.');

  const locationSubRef = useRef<Location.LocationSubscription | null>(null);
  const overLimitStartRef = useRef<number | null>(null);
  const lastAlertAtRef = useRef(0);

  const overByKmh = Math.max(0, currentSpeedKmh - speedLimitKmh);

  const stopTracking = () => {
    if (locationSubRef.current) {
      locationSubRef.current.remove();
      locationSubRef.current = null;
    }

    setIsTracking(false);
    setCurrentSpeedKmh(0);
    overLimitStartRef.current = null;
    setStatusText('Tracking stopped.');
  };

  const maybeSpeakOverspeedAlert = async (overKmh: number) => {
    const now = Date.now();

    if (overKmh < ALERT_THRESHOLD_KMH) {
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
        setStatusText('Location permission denied. Enable it in settings.');
        return;
      }

      setStatusText('Tracking in progress...');
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

          setCurrentSpeedKmh(kmh);
          void maybeSpeakOverspeedAlert(kmh - speedLimitKmh);
        },
      );
    } catch {
      setStatusText('Unable to start tracking. Please retry.');
      setIsTracking(false);
    }
  };

  useEffect(() => {
    return () => {
      if (locationSubRef.current) {
        locationSubRef.current.remove();
      }
    };
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>SAFE DRIVE AI</Text>
        <Text style={styles.subtitle}>Winnipeg MVP - Speed Alert</Text>

        <View style={styles.speedPanel}>
          <Text style={styles.panelLabel}>Current Speed</Text>
          <Text style={styles.speedValue}>{Math.round(currentSpeedKmh)}</Text>
          <Text style={styles.unitText}>km/h</Text>
        </View>

        <View style={styles.limitPanel}>
          <Text style={styles.panelLabel}>Speed Limit</Text>
          <View style={styles.limitControls}>
            <Pressable
              onPress={() => setSpeedLimitKmh((prev) => clamp(prev - 5, 20, 120))}
              style={styles.limitButton}
            >
              <Text style={styles.limitButtonText}>-5</Text>
            </Pressable>

            <Text style={styles.limitValue}>{speedLimitKmh} km/h</Text>

            <Pressable
              onPress={() => setSpeedLimitKmh((prev) => clamp(prev + 5, 20, 120))}
              style={styles.limitButton}
            >
              <Text style={styles.limitButtonText}>+5</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.overPanel}>
          <Text style={styles.panelLabel}>Over Limit</Text>
          <Text style={[styles.overValue, overByKmh >= ALERT_THRESHOLD_KMH && styles.overValueHot]}>
            {Math.round(overByKmh)} km/h
          </Text>
          <Text style={styles.helperText}>
            Voice alert triggers at +{ALERT_THRESHOLD_KMH} km/h for {ALERT_SUSTAIN_MS / 1000}s.
          </Text>
        </View>

        <Pressable
          onPress={isTracking ? stopTracking : startTracking}
          style={[styles.primaryButton, isTracking ? styles.stopButton : styles.startButton]}
        >
          <Text style={styles.primaryButtonText}>{isTracking ? 'Stop Drive' : 'Start Drive'}</Text>
        </Pressable>

        <Text style={styles.statusText}>{statusText}</Text>

        <StatusBar style="light" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0A1A2F',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 20,
    backgroundColor: '#0A1A2F',
  },
  title: {
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: 1,
    color: '#F4C95D',
  },
  subtitle: {
    marginTop: 4,
    marginBottom: 18,
    color: '#B8C4D6',
    fontSize: 14,
  },
  speedPanel: {
    backgroundColor: '#112845',
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
  },
  panelLabel: {
    color: '#AFC1D8',
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  speedValue: {
    marginTop: 8,
    fontSize: 64,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  unitText: {
    color: '#B8C4D6',
    fontSize: 14,
  },
  limitPanel: {
    backgroundColor: '#163158',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },
  limitControls: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  limitButton: {
    backgroundColor: '#0A1A2F',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  limitButtonText: {
    color: '#F4C95D',
    fontWeight: '800',
    fontSize: 16,
  },
  limitValue: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 22,
  },
  overPanel: {
    backgroundColor: '#1A3C67',
    borderRadius: 16,
    padding: 16,
    marginBottom: 18,
  },
  overValue: {
    marginTop: 8,
    color: '#D8E5F6',
    fontWeight: '800',
    fontSize: 28,
  },
  overValueHot: {
    color: '#FF7A59',
  },
  helperText: {
    marginTop: 6,
    color: '#AFC1D8',
    fontSize: 12,
  },
  primaryButton: {
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: '#1FA46A',
  },
  stopButton: {
    backgroundColor: '#D9534F',
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  statusText: {
    marginTop: 14,
    color: '#B8C4D6',
    fontSize: 13,
  },
});
