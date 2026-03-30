import { Pressable, StyleSheet, Text } from 'react-native';
import { SectionCard } from '../common/SectionCard';
import { LocationStatus, PermissionState } from '../../types/driving';
import { colors, radii, spacing } from '../../theme/tokens';

type PermissionStatusCardProps = {
  locationStatus: LocationStatus;
  permissionState: PermissionState;
  onOpenSettings: () => void;
};

export function PermissionStatusCard({
  locationStatus,
  permissionState,
  onOpenSettings,
}: PermissionStatusCardProps) {
  return (
    <SectionCard title="Permissions Status">
      <Text style={styles.helperText}>
        Allow location access to enable real-time speed monitoring and voice warnings.
      </Text>
      <Text style={styles.permissionText}>Location: {locationStatus === 'active' ? 'Active' : 'Inactive'}</Text>
      <Text style={styles.permissionText}>Permission: {permissionState}</Text>
      <Text style={styles.permissionText}>Voice: Active</Text>
      <Text style={styles.permissionText}>Background: Planned for v2</Text>

      {permissionState === 'denied' && (
        <Pressable onPress={onOpenSettings} style={styles.settingsButton}>
          <Text style={styles.settingsButtonText}>Open Settings</Text>
        </Pressable>
      )}
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  helperText: {
    color: colors.text.secondary,
    fontSize: 13,
    marginBottom: spacing.sm,
  },
  permissionText: {
    color: colors.text.muted,
    fontSize: 14,
    marginBottom: spacing.xs,
  },
  settingsButton: {
    marginTop: spacing.sm,
    backgroundColor: colors.button.dark,
    borderRadius: radii.md,
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  settingsButtonText: {
    color: colors.button.darkText,
    fontWeight: '800',
    fontSize: 12,
  },
});
