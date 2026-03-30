import { StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing } from '../../theme/tokens';
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
    backgroundColor: colors.gauge.panel,
    borderRadius: radii.xl,
    padding: spacing.xl,
  },
  speedValue: {
    fontSize: 90,
    fontWeight: '900',
    color: colors.gauge.speedSafe,
    lineHeight: 94,
  },
  warningText: {
    color: colors.gauge.speedWarning,
  },
  alertText: {
    color: colors.gauge.speedAlert,
  },
  speedUnit: {
    marginTop: -4,
    color: colors.gauge.unit,
    fontSize: 36,
    fontWeight: '700',
  },
  limitBadge: {
    width: 104,
    height: 104,
    borderRadius: radii.xl,
    backgroundColor: colors.gauge.limitBadgeBackground,
    borderWidth: 3,
    borderColor: colors.gauge.limitBadgeBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  limitBadgeValue: {
    color: colors.gauge.limitBadgeValue,
    fontWeight: '900',
    fontSize: 44,
    lineHeight: 48,
  },
  limitBadgeText: {
    color: colors.gauge.limitBadgeLabel,
    fontSize: 18,
    fontWeight: '700',
  },
});
