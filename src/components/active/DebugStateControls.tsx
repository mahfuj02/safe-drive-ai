import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing } from '../../theme/tokens';

type DebugStateControlsProps = {
  onSetSafe: () => void;
  onSetWarning: () => void;
  onSetAlert: () => void;
  onSetSchoolZoneActive: () => void;
  onSetSchoolZoneInactive: () => void;
  onSetUpcomingLimit: () => void;
  onClearContext: () => void;
};

export function DebugStateControls({
  onSetSafe,
  onSetWarning,
  onSetAlert,
  onSetSchoolZoneActive,
  onSetSchoolZoneInactive,
  onSetUpcomingLimit,
  onClearContext,
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

      <Text style={styles.labelSecondary}>Demo Road/Zone Controls</Text>
      <View style={styles.rowWrap}>
        <Pressable onPress={onSetSchoolZoneActive} style={styles.buttonWide}>
          <Text style={styles.buttonText}>School Active</Text>
        </Pressable>
        <Pressable onPress={onSetSchoolZoneInactive} style={styles.buttonWide}>
          <Text style={styles.buttonText}>School Inactive</Text>
        </Pressable>
      </View>

      <View style={styles.rowWrap}>
        <Pressable onPress={onSetUpcomingLimit} style={styles.buttonWide}>
          <Text style={styles.buttonText}>Upcoming Limit</Text>
        </Pressable>
        <Pressable onPress={onClearContext} style={styles.buttonWide}>
          <Text style={styles.buttonText}>Clear Context</Text>
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
  labelSecondary: {
    color: colors.text.secondary,
    fontSize: 12,
    fontWeight: '800',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  rowWrap: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  button: {
    flex: 1,
    backgroundColor: colors.button.dark,
    borderRadius: radii.sm,
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  buttonWide: {
    flex: 1,
    backgroundColor: colors.button.dark,
    borderRadius: radii.sm,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  buttonText: {
    color: colors.button.darkText,
    fontWeight: '700',
    fontSize: 12,
  },
});
