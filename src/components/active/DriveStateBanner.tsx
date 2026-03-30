import { StyleSheet, Text } from 'react-native';
import { colors, radii, spacing } from '../../theme/tokens';
import { DriveState } from '../../types/driving';

type DriveStateBannerProps = {
  driveState: DriveState;
};

export function DriveStateBanner({ driveState }: DriveStateBannerProps) {
  if (driveState === 'alert') {
    return <Text style={styles.alert}>!! SLOW DOWN !!</Text>;
  }

  if (driveState === 'warning') {
    return <Text style={styles.warning}>Approaching alert threshold</Text>;
  }

  return <Text style={styles.safe}>Safe driving state</Text>;
}

const styles = StyleSheet.create({
  safe: {
    color: colors.state.safeText,
    backgroundColor: colors.state.safeBackground,
    borderRadius: radii.sm,
    paddingVertical: spacing.sm,
    textAlign: 'center',
    fontWeight: '800',
    marginBottom: spacing.lg,
  },
  warning: {
    color: colors.state.warningText,
    backgroundColor: colors.state.warningBackground,
    borderRadius: radii.sm,
    paddingVertical: spacing.sm,
    textAlign: 'center',
    fontWeight: '900',
    marginBottom: spacing.lg,
  },
  alert: {
    color: colors.state.alertText,
    backgroundColor: colors.state.alertBackground,
    borderRadius: radii.sm,
    paddingVertical: spacing.sm,
    textAlign: 'center',
    fontWeight: '900',
    marginBottom: spacing.lg,
  },
});
