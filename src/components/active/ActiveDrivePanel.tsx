import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing } from '../../theme/tokens';
import { DriveState } from '../../types/driving';
import { DriveStateBanner } from './DriveStateBanner';
import { SpeedGauge } from './SpeedGauge';

type ActiveDrivePanelProps = {
  driveState: DriveState;
  currentSpeedKmh: number;
  speedLimitKmh: number;
  overByKmh: number;
  onStopDrive: () => void;
};

export function ActiveDrivePanel({
  driveState,
  currentSpeedKmh,
  speedLimitKmh,
  overByKmh,
  onStopDrive,
}: ActiveDrivePanelProps) {
  return (
    <>
      <Text style={styles.driveRoadText}>Driving on: Winnipeg Route</Text>

      <DriveStateBanner driveState={driveState} />

      <SpeedGauge
        driveState={driveState}
        currentSpeedKmh={currentSpeedKmh}
        speedLimitKmh={speedLimitKmh}
      />

      <Text style={styles.overText}>Over: {Math.round(overByKmh)} km/h</Text>

      <Pressable onPress={onStopDrive} style={styles.stopDriveButton}>
        <Text style={styles.stopDriveText}>STOP DRIVE</Text>
      </Pressable>
    </>
  );
}

const styles = StyleSheet.create({
  driveRoadText: {
    color: colors.text.muted,
    marginTop: 4,
    marginBottom: spacing.md,
    fontSize: 16,
    fontWeight: '700',
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
