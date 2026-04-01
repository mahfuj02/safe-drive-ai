import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, radii, spacing } from '../../theme/tokens';

type StartDriveButtonProps = {
  onPress: () => void;
  isLoading?: boolean;
  isEnabled?: boolean;
};

export function StartDriveButton({
  onPress,
  isLoading = false,
  isEnabled = true,
}: StartDriveButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={isLoading || !isEnabled}
      style={[styles.button, (isLoading || !isEnabled) && styles.buttonDisabled]}
    >
      <Text style={styles.text}>
        {isLoading ? 'STARTING...' : isEnabled ? 'START DRIVE' : 'ALLOW LOCATION FIRST'}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    marginTop: 26,
    alignSelf: 'center',
    width: 190,
    height: 190,
    borderRadius: radii.round,
    borderWidth: 3,
    borderColor: colors.button.start,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(29, 197, 98, 0.14)',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  text: {
    color: colors.button.start,
    fontWeight: '900',
    fontSize: 28,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
});
