import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  MAX_SPEED_LIMIT_KMH,
  MIN_SPEED_LIMIT_KMH,
} from '../../constants/driving';
import { clamp } from '../../utils/math';
import { SectionCard } from '../common/SectionCard';

type SpeedLimitControlProps = {
  speedLimitKmh: number;
  onChangeSpeedLimit: (value: number) => void;
};

export function SpeedLimitControl({
  speedLimitKmh,
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
    backgroundColor: '#0C182A',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  buttonText: {
    color: '#D4E3F7',
    fontWeight: '800',
    fontSize: 16,
  },
  limitValue: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 23,
  },
});
