import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LocationStatus } from '../../types/driving';
import { colors, spacing } from '../../theme/tokens';
import { PermissionStatusCard } from './PermissionStatusCard';
import { SpeedLimitControl } from './SpeedLimitControl';
import { StartDriveButton } from './StartDriveButton';
import { ThresholdSelector } from './ThresholdSelector';

type SetupPanelProps = {
  locationStatus: LocationStatus;
  alertThresholdKmh: number;
  speedLimitKmh: number;
  onSelectThreshold: (value: number) => void;
  onChangeSpeedLimit: (value: number) => void;
  onStartDrive: () => void;
  onStartDemoDrive: () => void;
};

export function SetupPanel({
  locationStatus,
  alertThresholdKmh,
  speedLimitKmh,
  onSelectThreshold,
  onChangeSpeedLimit,
  onStartDrive,
  onStartDemoDrive,
}: SetupPanelProps) {
  return (
    <>
      <Text style={styles.title}>SafeDrive AI</Text>

      <PermissionStatusCard locationStatus={locationStatus} />

      <ThresholdSelector
        selectedThresholdKmh={alertThresholdKmh}
        onSelectThreshold={onSelectThreshold}
      />

      <SpeedLimitControl
        speedLimitKmh={speedLimitKmh}
        onChangeSpeedLimit={onChangeSpeedLimit}
      />

      <StartDriveButton onPress={onStartDrive} />

      {__DEV__ && (
        <View style={styles.demoRow}>
          <Pressable onPress={onStartDemoDrive} style={styles.demoButton}>
            <Text style={styles.demoButtonText}>START DEMO MODE</Text>
          </Pressable>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 42,
    fontWeight: '900',
    marginTop: spacing.xl,
    color: colors.text.primary,
    letterSpacing: 0.2,
  },
  demoRow: {
    marginTop: spacing.lg,
  },
  demoButton: {
    backgroundColor: colors.button.dark,
    borderRadius: 10,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  demoButtonText: {
    color: colors.button.darkText,
    fontWeight: '800',
    fontSize: 13,
  },
});
