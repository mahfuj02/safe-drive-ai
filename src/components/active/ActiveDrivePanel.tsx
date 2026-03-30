import { Pressable, StyleSheet, Text, View } from 'react-native';
import { DriveState } from '../../types/driving';
import { DriveStateBanner } from './DriveStateBanner';
import { SpeedGauge } from './SpeedGauge';

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

      <DriveStateBanner driveState={driveState} />

      <SpeedGauge
        driveState={driveState}
        currentSpeedKmh={currentSpeedKmh}
        speedLimitKmh={speedLimitKmh}
      />

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
