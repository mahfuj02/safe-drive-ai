import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActiveDrivePanel } from '../components/active/ActiveDrivePanel';
import { SetupPanel } from '../components/setup/SetupPanel';
import { TripSummaryModal } from '../components/summary/TripSummaryModal';
import { useDriveSession } from '../hooks/useDriveSession';
import { colors, spacing } from '../theme/tokens';

export function DriveScreen() {
  const {
    speedLimitKmh,
    setSpeedLimitKmh,
    speedLimitSource,
    currentSpeedKmh,
    isTracking,
    isStarting,
    isDemoMode,
    latestTripSummary,
    statusText,
    locationStatus,
    permissionState,
    alertThresholdKmh,
    setAlertThresholdKmh,
    overByKmh,
    driveState,
    requestLocationAccess,
    startTracking,
    startDemoMode,
    setDemoSpeedKmh,
    closeTripSummary,
    openAppSettings,
    stopTracking,
  } = useDriveSession();

  const handleStartNewDrive = () => {
    closeTripSummary();
    void startTracking();
  };

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
            permissionState={permissionState}
            isStarting={isStarting}
            alertThresholdKmh={alertThresholdKmh}
            speedLimitKmh={speedLimitKmh}
            speedLimitSource={speedLimitSource}
            onSelectThreshold={setAlertThresholdKmh}
            onChangeSpeedLimit={setSpeedLimitKmh}
            onRequestLocationAccess={requestLocationAccess}
            onStartDrive={startTracking}
            onStartDemoDrive={startDemoMode}
            onOpenSettings={openAppSettings}
          />
        ) : (
          <ActiveDrivePanel
            driveState={driveState}
            currentSpeedKmh={currentSpeedKmh}
            speedLimitKmh={speedLimitKmh}
            speedLimitSource={speedLimitSource}
            overByKmh={overByKmh}
            alertThresholdKmh={alertThresholdKmh}
            isDemoMode={isDemoMode}
            onSetDemoSpeed={setDemoSpeedKmh}
            onStopDrive={stopTracking}
          />
        )}

        <Text style={styles.statusText}>{statusText}</Text>
        <StatusBar style="light" />
      </View>

      <TripSummaryModal
        summary={latestTripSummary}
        onClose={closeTripSummary}
        onStartNewDrive={handleStartNewDrive}
      />
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
