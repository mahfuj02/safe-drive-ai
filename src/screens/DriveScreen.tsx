import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActiveDrivePanel } from '../components/active/ActiveDrivePanel';
import { SetupPanel } from '../components/setup/SetupPanel';
import { useDriveSession } from '../hooks/useDriveSession';
import { colors, spacing } from '../theme/tokens';

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
    backgroundColor: colors.screen.safeBackground,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
    backgroundColor: colors.screen.safeBackground,
  },
  containerWarning: {
    backgroundColor: colors.screen.warningBackground,
  },
  containerAlert: {
    backgroundColor: colors.screen.alertBackground,
  },
  statusText: {
    marginTop: spacing.md,
    color: colors.text.secondary,
    fontSize: 12,
    textAlign: 'center',
  },
});
