import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing } from '../../theme/tokens';

type DebugStateControlsProps = {
  onSetSafe: () => void;
  onSetWarning: () => void;
  onSetAlert: () => void;
};

export function DebugStateControls({
  onSetSafe,
  onSetWarning,
  onSetAlert,
}: DebugStateControlsProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Demo State Controls</Text>
      <View style={styles.row}>
        <Pressable onPress={onSetSafe} style={styles.button}>
          <Text style={styles.buttonText}>Safe</Text>
        </Pressable>
        <Pressable onPress={onSetWarning} style={styles.button}>
          <Text style={styles.buttonText}>Warning</Text>
        </Pressable>
        <Pressable onPress={onSetAlert} style={styles.button}>
          <Text style={styles.buttonText}>Alert</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.lg,
    backgroundColor: colors.card.background,
    borderRadius: radii.xl,
    padding: spacing.lg,
  },
  label: {
    color: colors.text.primary,
    fontSize: 13,
    fontWeight: '800',
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  button: {
    flex: 1,
    backgroundColor: colors.button.dark,
    borderRadius: radii.sm,
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  buttonText: {
    color: colors.button.darkText,
    fontWeight: '700',
    fontSize: 12,
  },
});
