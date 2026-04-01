import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LocationStatus, PermissionState, SpeedLimitSource } from '../../types/driving';
import { colors, spacing } from '../../theme/tokens';
import { PermissionStatusCard } from './PermissionStatusCard';
import { SpeedLimitControl } from './SpeedLimitControl';
import { StartDriveButton } from './StartDriveButton';
import { ThresholdSelector } from './ThresholdSelector';

type SetupPanelProps = {
  locationStatus: LocationStatus;
  permissionState: PermissionState;
  isStarting: boolean;
  alertThresholdKmh: number;
  speedLimitKmh: number;
  speedLimitSource: SpeedLimitSource;
  onSelectThreshold: (value: number) => void;
  onChangeSpeedLimit: (value: number) => void;
  onRequestLocationAccess: () => void;
  onStartDrive: () => void;
  onStartDemoDrive: () => void;
  onOpenSettings: () => void;
};

export function SetupPanel({
  locationStatus,
  permissionState,
  isStarting,
  alertThresholdKmh,
  speedLimitKmh,
  speedLimitSource,
  onSelectThreshold,
  onChangeSpeedLimit,
  onRequestLocationAccess,
  onStartDrive,
  onStartDemoDrive,
  onOpenSettings,
}: SetupPanelProps) {
  const canStartDrive = permissionState === 'granted';

  return (
    <>
      <Text style={styles.title}>SafeDrive AI</Text>

      <PermissionStatusCard
        locationStatus={locationStatus}
        permissionState={permissionState}
        onOpenSettings={onOpenSettings}
      />

      <ThresholdSelector
        selectedThresholdKmh={alertThresholdKmh}
        onSelectThreshold={onSelectThreshold}
      />

      <SpeedLimitControl
        speedLimitKmh={speedLimitKmh}
        speedLimitSource={speedLimitSource}
        onChangeSpeedLimit={onChangeSpeedLimit}
      />

      {!canStartDrive && (
        <Pressable onPress={onRequestLocationAccess} style={styles.allowLocationButton}>
          <Text style={styles.allowLocationButtonText}>ALLOW LOCATION ACCESS</Text>
        </Pressable>
      )}

      <StartDriveButton onPress={onStartDrive} isLoading={isStarting} isEnabled={canStartDrive} />

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
  allowLocationButton: {
    marginTop: spacing.lg,
    backgroundColor: colors.button.dark,
    borderRadius: 10,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  allowLocationButtonText: {
    color: colors.button.darkText,
    fontWeight: '900',
    fontSize: 13,
  },
});
