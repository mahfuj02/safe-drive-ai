import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing } from '../../theme/tokens';
import { DriveState, SpeedLimitSource } from '../../types/driving';
import { DebugStateControls } from './DebugStateControls';
import { DriveStateBanner } from './DriveStateBanner';
import { SpeedGauge } from './SpeedGauge';

type ActiveDrivePanelProps = {
  driveState: DriveState;
  currentSpeedKmh: number;
  speedLimitKmh: number;
  speedLimitSource: SpeedLimitSource;
  overByKmh: number;
  alertThresholdKmh: number;
  isDemoMode: boolean;
  onSetDemoSpeed: (speedKmh: number) => void;
  onStopDrive: () => void;
};

export function ActiveDrivePanel({
  driveState,
  currentSpeedKmh,
  speedLimitKmh,
  speedLimitSource,
  overByKmh,
  alertThresholdKmh,
  isDemoMode,
  onSetDemoSpeed,
  onStopDrive,
}: ActiveDrivePanelProps) {
  return (
    <>
      <View style={styles.headerRow}>
        <Text style={styles.driveRoadText}>Driving on: Winnipeg Route</Text>
        <View style={[styles.modeBadge, isDemoMode ? styles.demoBadge : styles.liveBadge]}>
          <Text style={styles.modeBadgeText}>{isDemoMode ? 'DEMO' : 'LIVE'}</Text>
        </View>
      </View>

      <DriveStateBanner driveState={driveState} />

      <SpeedGauge
        driveState={driveState}
        currentSpeedKmh={currentSpeedKmh}
        speedLimitKmh={speedLimitKmh}
        speedLimitSource={speedLimitSource}
      />

      <Text style={styles.overText}>
        Over: {speedLimitSource === 'live' ? `${Math.round(overByKmh)} km/h` : 'Not available'}
      </Text>

      {__DEV__ && isDemoMode && (
        <DebugStateControls
          onSetSafe={() => onSetDemoSpeed(speedLimitKmh - 2)}
          onSetWarning={() => onSetDemoSpeed(speedLimitKmh + Math.max(1, alertThresholdKmh - 1))}
          onSetAlert={() => onSetDemoSpeed(speedLimitKmh + alertThresholdKmh + 4)}
        />
      )}

      <Pressable onPress={onStopDrive} style={styles.stopDriveButton}>
        <Text style={styles.stopDriveText}>STOP DRIVE</Text>
      </Pressable>
    </>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  driveRoadText: {
    color: colors.text.muted,
    marginTop: 4,
    fontSize: 16,
    fontWeight: '700',
  },
  modeBadge: {
    borderRadius: radii.md,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  liveBadge: {
    backgroundColor: colors.state.safeBackground,
  },
  demoBadge: {
    backgroundColor: colors.state.warningBackground,
  },
  modeBadgeText: {
    color: colors.text.primary,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  overText: {
    color: colors.text.primary,
    marginTop: spacing.lg,
    marginBottom: spacing.xxl,
    fontSize: 22,
    fontWeight: '800',
  },
  stopDriveButton: {
    marginTop: 'auto',
    borderRadius: radii.lg,
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: colors.button.stopBackground,
  },
  stopDriveText: {
    fontSize: 43,
    fontWeight: '900',
    color: colors.button.stopText,
    letterSpacing: 1,
  },
});
