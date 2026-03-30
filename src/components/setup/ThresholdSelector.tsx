import { Pressable, StyleSheet, Text, View } from 'react-native';
import { WARNING_THRESHOLDS } from '../../constants/driving';
import { colors, radii, spacing } from '../../theme/tokens';
import { SectionCard } from '../common/SectionCard';

type ThresholdSelectorProps = {
  selectedThresholdKmh: number;
  onSelectThreshold: (value: number) => void;
};

export function ThresholdSelector({
  selectedThresholdKmh,
  onSelectThreshold,
}: ThresholdSelectorProps) {
  return (
    <SectionCard title="Warning Threshold">
      <View style={styles.row}>
        {WARNING_THRESHOLDS.map((threshold) => (
          <Pressable
            key={threshold}
            onPress={() => onSelectThreshold(threshold)}
            style={[
              styles.button,
              selectedThresholdKmh === threshold && styles.buttonActive,
            ]}
          >
            <Text
              style={[
                styles.buttonText,
                selectedThresholdKmh === threshold && styles.buttonTextActive,
              ]}
            >
              +{threshold} km/h
            </Text>
          </Pressable>
        ))}
      </View>
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  button: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#395070',
    borderRadius: radii.sm,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  buttonActive: {
    backgroundColor: colors.button.start,
    borderColor: colors.button.start,
  },
  buttonText: {
    color: '#C0D0E7',
    fontWeight: '700',
    fontSize: 12,
  },
  buttonTextActive: {
    color: '#102214',
  },
});
