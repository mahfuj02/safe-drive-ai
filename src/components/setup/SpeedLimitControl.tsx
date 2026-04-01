import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  MAX_SPEED_LIMIT_KMH,
  MIN_SPEED_LIMIT_KMH,
} from '../../constants/driving';
import { SpeedLimitSource } from '../../types/driving';
import { colors, radii, spacing } from '../../theme/tokens';
import { clamp } from '../../utils/math';
import { SectionCard } from '../common/SectionCard';

type SpeedLimitControlProps = {
  speedLimitKmh: number;
  speedLimitSource: SpeedLimitSource;
  onChangeSpeedLimit: (value: number) => void;
};

export function SpeedLimitControl({
  speedLimitKmh,
  speedLimitSource,
  onChangeSpeedLimit,
}: SpeedLimitControlProps) {
  return (
    <SectionCard title="Speed Limit">
      <View style={styles.controls}>
        <Pressable
          onPress={() =>
            onChangeSpeedLimit(clamp(speedLimitKmh - 5, MIN_SPEED_LIMIT_KMH, MAX_SPEED_LIMIT_KMH))
          }
          style={styles.button}
        >
          <Text style={styles.buttonText}>-5</Text>
        </Pressable>

        <Text style={styles.limitValue}>{speedLimitKmh} km/h</Text>

        <Pressable
          onPress={() =>
            onChangeSpeedLimit(clamp(speedLimitKmh + 5, MIN_SPEED_LIMIT_KMH, MAX_SPEED_LIMIT_KMH))
          }
          style={styles.button}
        >
          <Text style={styles.buttonText}>+5</Text>
        </Pressable>
      </View>

      <Text style={styles.sourceText}>
        Source: {speedLimitSource === 'live' ? 'Live map data' : speedLimitSource === 'unknown' ? 'Unknown (fallback)' : 'Manual'}
      </Text>
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  button: {
    backgroundColor: colors.button.dark,
    borderRadius: radii.md,
    paddingHorizontal: 12,
    paddingVertical: spacing.sm,
  },
  buttonText: {
    color: colors.button.darkText,
    fontWeight: '800',
    fontSize: 16,
  },
  limitValue: {
    color: colors.text.primary,
    fontWeight: '900',
    fontSize: 23,
  },
  sourceText: {
    marginTop: spacing.sm,
    color: colors.text.secondary,
    fontSize: 12,
  },
});
