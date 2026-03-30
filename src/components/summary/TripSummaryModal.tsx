import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing } from '../../theme/tokens';
import { TripSummary } from '../../types/driving';

type TripSummaryModalProps = {
  summary: TripSummary | null;
  onClose: () => void;
  onStartNewDrive: () => void;
};

function formatDuration(durationSec: number): string {
  const min = Math.floor(durationSec / 60);
  const sec = durationSec % 60;
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

export function TripSummaryModal({
  summary,
  onClose,
  onStartNewDrive,
}: TripSummaryModalProps) {
  return (
    <Modal
      visible={summary !== null}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Trip Summary</Text>

          {summary && (
            <>
              <SummaryRow label="Mode" value={summary.isDemoMode ? 'Demo' : 'Live'} />
              <SummaryRow label="Duration" value={formatDuration(summary.durationSec)} />
              <SummaryRow label="Max Speed" value={`${summary.maxSpeedKmh} km/h`} />
              <SummaryRow label="Speed Limit" value={`${summary.speedLimitKmh} km/h`} />
              <SummaryRow label="Max Over" value={`${summary.maxOverKmh} km/h`} />
              <SummaryRow label="Warnings" value={`${summary.warningCount}`} />
              <SummaryRow label="Alerts" value={`${summary.alertCount}`} />
            </>
          )}

          <View style={styles.actions}>
            <Pressable onPress={onClose} style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>Done</Text>
            </Pressable>
            <Pressable onPress={onStartNewDrive} style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>Start New Drive</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: colors.modal.overlay,
  },
  sheet: {
    backgroundColor: colors.modal.sheetBackground,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing.xxl,
    paddingBottom: 26,
  },
  title: {
    color: colors.text.primary,
    fontSize: 22,
    fontWeight: '900',
    marginBottom: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  rowLabel: {
    color: colors.modal.label,
    fontSize: 14,
  },
  rowValue: {
    color: colors.modal.value,
    fontSize: 15,
    fontWeight: '800',
  },
  actions: {
    marginTop: spacing.xl,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  secondaryButton: {
    flex: 1,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.modal.buttonBackground,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: colors.modal.buttonText,
    fontWeight: '700',
    fontSize: 13,
  },
  primaryButton: {
    flex: 1,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.button.start,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#102214',
    fontWeight: '900',
    fontSize: 13,
  },
});
