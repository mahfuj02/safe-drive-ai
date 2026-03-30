export type LocationStatus = 'active' | 'inactive';

export type PermissionState = 'unknown' | 'granted' | 'denied';

export type DriveState = 'safe' | 'warning' | 'alert';

export type TripSummary = {
	durationSec: number;
	maxSpeedKmh: number;
	speedLimitKmh: number;
	maxOverKmh: number;
	warningCount: number;
	alertCount: number;
	isDemoMode: boolean;
};
