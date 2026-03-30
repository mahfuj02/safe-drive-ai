import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  MAX_SPEED_LIMIT_KMH,
  MIN_SPEED_LIMIT_KMH,
  WARNING_THRESHOLDS,
} from '../../constants/driving';
import { LocationStatus } from '../../types/driving';
import { clamp } from '../../utils/math';

type SetupPanelProps = {
  locationStatus: LocationStatus;
  alertThresholdKmh: number;
  speedLimitKmh: number;
  onSelectThreshold: (value: number) => void;
  onChangeSpeedLimit: (value: number) => void;
  onStartDrive: () => void;
};

export function SetupPanel({
  locationStatus,
  alertThresholdKmh,
  speedLimitKmh,
  onSelectThreshold,
  onChangeSpeedLimit,
  onStartDrive,
}: SetupPanelProps) {
  return (
    <>
      <Text style={styles.title}>SafeDrive AI</Text>

      <View style={styles.setupCard}>
        <Text style={styles.sectionTitle}>Permissions Status</Text>
        <Text style={styles.permissionText}>Location: {locationStatus === 'active' ? 'Active' : 'Inactive'}</Text>
        <Text style={styles.permissionText}>Voice: Active</Text>
        <Text style={styles.permissionText}>Background: Planned for v2</Text>
      </View>

      <View style={styles.setupCard}>
        <Text style={styles.sectionTitle}>Warning Threshold</Text>
        <View style={styles.thresholdRow}>
          {WARNING_THRESHOLDS.map((threshold) => (
            <Pressable
              key={threshold}
              onPress={() => onSelectThreshold(threshold)}
              style={[styles.thresholdButton, alertThresholdKmh === threshold && styles.thresholdButtonActive]}
            >
              <Text
                style={[
                  styles.thresholdButtonText,
                  alertThresholdKmh === threshold && styles.thresholdButtonTextActive,
                ]}
              >
                +{threshold} km/h
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.setupCard}>
        <Text style={styles.sectionTitle}>Speed Limit</Text>
        <View style={styles.limitControls}>
          <Pressable
            onPress={() => onChangeSpeedLimit(clamp(speedLimitKmh - 5, MIN_SPEED_LIMIT_KMH, MAX_SPEED_LIMIT_KMH))}
            style={styles.limitButton}
          >
            <Text style={styles.limitButtonText}>-5</Text>
          </Pressable>

          <Text style={styles.limitValue}>{speedLimitKmh} km/h</Text>

          <Pressable
            onPress={() => onChangeSpeedLimit(clamp(speedLimitKmh + 5, MIN_SPEED_LIMIT_KMH, MAX_SPEED_LIMIT_KMH))}
            style={styles.limitButton}
          >
            <Text style={styles.limitButtonText}>+5</Text>
          </Pressable>
        </View>
      </View>

      <Pressable onPress={onStartDrive} style={styles.startCircleButton}>
        <Text style={styles.startCircleText}>START DRIVE</Text>
      </Pressable>
    </>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 42,
    fontWeight: '900',
    marginTop: 18,
    color: '#F5F8FF',
    letterSpacing: 0.2,
  },
  setupCard: {
    backgroundColor: '#13253A',
    borderRadius: 14,
    padding: 14,
    marginTop: 14,
  },
  sectionTitle: {
    color: '#E8EEFF',
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 8,
  },
  permissionText: {
    color: '#B9CAE2',
    fontSize: 14,
    marginBottom: 4,
  },
  thresholdRow: {
    flexDirection: 'row',
    gap: 8,
  },
  thresholdButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#395070',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  thresholdButtonActive: {
    backgroundColor: '#38D66D',
    borderColor: '#38D66D',
  },
  thresholdButtonText: {
    color: '#C0D0E7',
    fontWeight: '700',
    fontSize: 12,
  },
  thresholdButtonTextActive: {
    color: '#102214',
  },
  limitControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  limitButton: {
    backgroundColor: '#0C182A',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  limitButtonText: {
    color: '#D4E3F7',
    fontWeight: '800',
    fontSize: 16,
  },
  limitValue: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 23,
  },
  startCircleButton: {
    marginTop: 26,
    alignSelf: 'center',
    width: 190,
    height: 190,
    borderRadius: 95,
    borderWidth: 3,
    borderColor: '#4CEF85',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(29, 197, 98, 0.14)',
  },
  startCircleText: {
    color: '#4CEF85',
    fontWeight: '900',
    fontSize: 28,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
});
