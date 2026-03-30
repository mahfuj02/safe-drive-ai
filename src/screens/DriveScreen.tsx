import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActiveDrivePanel } from '../components/active/ActiveDrivePanel';
import { SetupPanel } from '../components/setup/SetupPanel';
import { useDriveSession } from '../hooks/useDriveSession';

export function DriveScreen() {
  const {
    speedLimitKmh,
    setSpeedLimitKmh,
    currentSpeedKmh,
    isTracking,
    statusText,
    locationStatus,
    alertThresholdKmh,
    setAlertThresholdKmh,
    overByKmh,
    driveState,
    startTracking,
    stopTracking,
  } = useDriveSession();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View
        style={[
          styles.container,
          isTracking && driveState === 'warning' && styles.containerWarning,
          isTracking && driveState === 'alert' && styles.containerAlert,
        ]}
      >
        {!isTracking ? (
          <SetupPanel
            locationStatus={locationStatus}
            alertThresholdKmh={alertThresholdKmh}
            speedLimitKmh={speedLimitKmh}
            onSelectThreshold={setAlertThresholdKmh}
            onChangeSpeedLimit={setSpeedLimitKmh}
            onStartDrive={startTracking}
          />
        ) : (
          <ActiveDrivePanel
            driveState={driveState}
            currentSpeedKmh={currentSpeedKmh}
            speedLimitKmh={speedLimitKmh}
            overByKmh={overByKmh}
            onStopDrive={stopTracking}
          />
        )}

        <Text style={styles.statusText}>{statusText}</Text>
        <StatusBar style="light" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#08111E',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 20,
    backgroundColor: '#08111E',
  },
  containerWarning: {
    backgroundColor: '#171510',
  },
  containerAlert: {
    backgroundColor: '#4F0808',
  },
  statusText: {
    marginTop: 10,
    color: '#A9BAD1',
    fontSize: 12,
    textAlign: 'center',
  },
});
