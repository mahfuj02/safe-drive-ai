import { StyleSheet, Text } from 'react-native';
import { SectionCard } from '../common/SectionCard';
import { LocationStatus } from '../../types/driving';

type PermissionStatusCardProps = {
  locationStatus: LocationStatus;
};

export function PermissionStatusCard({ locationStatus }: PermissionStatusCardProps) {
  return (
    <SectionCard title="Permissions Status">
      <Text style={styles.permissionText}>Location: {locationStatus === 'active' ? 'Active' : 'Inactive'}</Text>
      <Text style={styles.permissionText}>Voice: Active</Text>
      <Text style={styles.permissionText}>Background: Planned for v2</Text>
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  permissionText: {
    color: '#B9CAE2',
    fontSize: 14,
    marginBottom: 4,
  },
});
