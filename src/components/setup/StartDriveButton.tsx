import { Pressable, StyleSheet, Text } from 'react-native';

type StartDriveButtonProps = {
  onPress: () => void;
};

export function StartDriveButton({ onPress }: StartDriveButtonProps) {
  return (
    <Pressable onPress={onPress} style={styles.button}>
      <Text style={styles.text}>START DRIVE</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    marginTop: 26,
    alignSelf: 'center',
    width: 190,
    height: 190,
    borderRadius: 95,
    borderWidth: 3,
    borderColor: '#4CEF85',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(29, 197, 98, 0.14)',
  },
  text: {
    color: '#4CEF85',
    fontWeight: '900',
    fontSize: 28,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
});
