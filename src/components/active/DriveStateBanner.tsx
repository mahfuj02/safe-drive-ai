import { StyleSheet, Text } from 'react-native';
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
    color: '#79F79B',
    backgroundColor: 'rgba(22, 110, 44, 0.45)',
    borderRadius: 8,
    paddingVertical: 8,
    textAlign: 'center',
    fontWeight: '800',
    marginBottom: 14,
  },
  warning: {
    color: '#FFD37A',
    backgroundColor: 'rgba(124, 84, 13, 0.48)',
    borderRadius: 8,
    paddingVertical: 8,
    textAlign: 'center',
    fontWeight: '900',
    marginBottom: 14,
  },
  alert: {
    color: '#FFE5E5',
    backgroundColor: 'rgba(161, 16, 16, 0.9)',
    borderRadius: 8,
    paddingVertical: 8,
    textAlign: 'center',
    fontWeight: '900',
    marginBottom: 14,
  },
});
