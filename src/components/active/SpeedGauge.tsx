import { StyleSheet, Text, View } from 'react-native';
import { DriveState } from '../../types/driving';

type SpeedGaugeProps = {
  driveState: DriveState;
  currentSpeedKmh: number;
  speedLimitKmh: number;
};

export function SpeedGauge({
  driveState,
  currentSpeedKmh,
  speedLimitKmh,
}: SpeedGaugeProps) {
  return (
    <View style={styles.row}>
      <View>
        <Text
          style={[
            styles.speedValue,
            driveState === 'alert' && styles.alertText,
            driveState === 'warning' && styles.warningText,
          ]}
        >
          {Math.round(currentSpeedKmh)}
        </Text>
        <Text style={styles.speedUnit}>km/h</Text>
      </View>

      <View style={styles.limitBadge}>
        <Text style={styles.limitBadgeValue}>{speedLimitKmh}</Text>
        <Text style={styles.limitBadgeText}>Limit</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#13263A',
    borderRadius: 14,
    padding: 18,
  },
  speedValue: {
    fontSize: 90,
    fontWeight: '900',
    color: '#55E278',
    lineHeight: 94,
  },
  warningText: {
    color: '#FFBF58',
  },
  alertText: {
    color: '#FF4D4D',
  },
  speedUnit: {
    marginTop: -4,
    color: '#C8D8EF',
    fontSize: 36,
    fontWeight: '700',
  },
  limitBadge: {
    width: 104,
    height: 104,
    borderRadius: 14,
    backgroundColor: '#F2F4F7',
    borderWidth: 3,
    borderColor: '#B8C2CF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  limitBadgeValue: {
    color: '#1D222B',
    fontWeight: '900',
    fontSize: 44,
    lineHeight: 48,
  },
  limitBadgeText: {
    color: '#2C3340',
    fontSize: 18,
    fontWeight: '700',
  },
});
