import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing } from '../../theme/tokens';

type SectionCardProps = {
  title: string;
  children: ReactNode;
};

export function SectionCard({ title, children }: SectionCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card.background,
    borderRadius: radii.xl,
    padding: spacing.lg,
    marginTop: spacing.lg,
  },
  title: {
    color: colors.card.title,
    fontSize: 17,
    fontWeight: '800',
    marginBottom: spacing.sm,
  },
});
