import { Pressable, StyleSheet, Text, View } from 'react-native';
import { DriveState } from '../../types/driving';

type ActiveDrivePanelProps = {
  driveState: DriveState;
  currentSpeedKmh: number;
  speedLimitKmh: number;
  overByKmh: number;
  onStopDrive: () => void;
};

export function ActiveDrivePanel({
  driveState,
  currentSpeedKmh,
  speedLimitKmh,
  overByKmh,
  onStopDrive,
}: ActiveDrivePanelProps) {
  return (
    <>
      <Text style={styles.driveRoadText}>Driving on: Winnipeg Route</Text>

      {driveState === 'alert' ? (
        <Text style={styles.stateBannerAlert}>!! SLOW DOWN !!</Text>
      ) : driveState === 'warning' ? (
        <Text style={styles.stateBannerWarning}>Approaching alert threshold</Text>
      ) : (
        <Text style={styles.stateBannerSafe}>Safe driving state</Text>
      )}

      <View style={styles.activeRow}>
        <View>
          <Text
            style={[
              styles.activeSpeedValue,
              driveState === 'alert' && styles.alertText,
              driveState === 'warning' && styles.warningText,
            ]}
          >
            {Math.round(currentSpeedKmh)}
          </Text>
          <Text style={styles.activeUnit}>km/h</Text>
        </View>

        <View style={styles.limitBadge}>
          <Text style={styles.limitBadgeValue}>{speedLimitKmh}</Text>
          <Text style={styles.limitBadgeText}>Limit</Text>
        </View>
      </View>

      <Text style={styles.overText}>Over: {Math.round(overByKmh)} km/h</Text>

      <Pressable onPress={onStopDrive} style={styles.stopDriveButton}>
        <Text style={styles.stopDriveText}>STOP DRIVE</Text>
      </Pressable>
    </>
  );
}

const styles = StyleSheet.create({
  driveRoadText: {
    color: '#C6D3E8',
    marginTop: 4,
    marginBottom: 10,
    fontSize: 16,
    fontWeight: '700',
  },
  stateBannerSafe: {
    color: '#79F79B',
    backgroundColor: 'rgba(22, 110, 44, 0.45)',
    borderRadius: 8,
    paddingVertical: 8,
    textAlign: 'center',
    fontWeight: '800',
    marginBottom: 14,
  },
  stateBannerWarning: {
    color: '#FFD37A',
    backgroundColor: 'rgba(124, 84, 13, 0.48)',
    borderRadius: 8,
    paddingVertical: 8,
    textAlign: 'center',
    fontWeight: '900',
    marginBottom: 14,
  },
  stateBannerAlert: {
    color: '#FFE5E5',
    backgroundColor: 'rgba(161, 16, 16, 0.9)',
    borderRadius: 8,
    paddingVertical: 8,
    textAlign: 'center',
    fontWeight: '900',
    marginBottom: 14,
  },
  activeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#13263A',
    borderRadius: 14,
    padding: 18,
  },
  activeSpeedValue: {
    fontSize: 90,
    fontWeight: '900',
    color: '#55E278',
    lineHeight: 94,
  },
  warningText: {
    color: '#FFBF58',
  },
  alertText: {
    color: '#FF4D4D',
  },
  activeUnit: {
    marginTop: -4,
    color: '#C8D8EF',
    fontSize: 36,
    fontWeight: '700',
  },
  limitBadge: {
    width: 104,
    height: 104,
    borderRadius: 14,
    backgroundColor: '#F2F4F7',
    borderWidth: 3,
    borderColor: '#B8C2CF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  limitBadgeValue: {
    color: '#1D222B',
    fontWeight: '900',
    fontSize: 44,
    lineHeight: 48,
  },
  limitBadgeText: {
    color: '#2C3340',
    fontSize: 18,
    fontWeight: '700',
  },
  overText: {
    color: '#E4EEFB',
    marginTop: 14,
    marginBottom: 20,
    fontSize: 22,
    fontWeight: '800',
  },
  stopDriveButton: {
    marginTop: 'auto',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: '#A31616',
  },
  stopDriveText: {
    fontSize: 43,
    fontWeight: '900',
    color: '#FFEEEE',
    letterSpacing: 1,
  },
});
