import { StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing } from '../../theme/tokens';
import { DriveState, SpeedLimitSource } from '../../types/driving';

type SpeedGaugeProps = {
  driveState: DriveState;
  currentSpeedKmh: number;
  speedLimitKmh: number;
  speedLimitSource: SpeedLimitSource;
};

export function SpeedGauge({
  driveState,
  currentSpeedKmh,
  speedLimitKmh,
  speedLimitSource,
}: SpeedGaugeProps) {
  const hasLiveLimit = speedLimitSource === 'live';
  const isWarning = driveState === 'warning';
  const isAlert = driveState === 'alert';

  return (
    <View style={[styles.row, isWarning && styles.rowWarning, isAlert && styles.rowAlert]}>
      <View>
        <Text
          style={[
            styles.speedValue,
            isAlert && styles.alertText,
            isWarning && styles.warningText,
          ]}
        >
          {Math.round(currentSpeedKmh)}
        </Text>
        <Text style={[styles.speedUnit, isWarning && styles.speedUnitWarning, isAlert && styles.speedUnitAlert]}>
          km/h
        </Text>
      </View>

      <View style={styles.limitBadge}>
        <Text style={styles.limitBadgeValue}>{hasLiveLimit ? speedLimitKmh : '--'}</Text>
        <Text style={styles.limitBadgeText}>Limit</Text>
      </View>

      <Text style={[styles.sourceText, hasLiveLimit ? styles.sourceLive : styles.sourceUnknown]}>
        {hasLiveLimit ? 'Live speed limit' : 'Limit unavailable'}
      </Text>
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
    position: 'relative',
  },
  rowWarning: {
    backgroundColor: colors.gauge.panelWarning,
  },
  rowAlert: {
    backgroundColor: colors.gauge.panelAlert,
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
  speedUnitWarning: {
    color: colors.gauge.unitWarning,
  },
  speedUnitAlert: {
    color: colors.gauge.unitAlert,
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
  sourceText: {
    position: 'absolute',
    left: spacing.xl,
    bottom: spacing.sm,
    fontSize: 12,
    fontWeight: '700',
  },
  sourceLive: {
    color: colors.state.liveText,
  },
  sourceUnknown: {
    color: colors.state.unknownText,
  },
});
