import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

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
    backgroundColor: '#13253A',
    borderRadius: 14,
    padding: 14,
    marginTop: 14,
  },
  title: {
    color: '#E8EEFF',
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 8,
  },
});
