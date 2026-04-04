type Coordinates = {
  latitude: number;
  longitude: number;
};

type OverpassNode = {
  lat: number;
  lon: number;
};

type OverpassWay = {
  type: 'way';
  tags?: {
    maxspeed?: string;
    'maxspeed:forward'?: string;
    'maxspeed:backward'?: string;
    'maxspeed:school'?: string;
    'maxspeed:conditional'?: string;
    name?: string;
    highway?: string;
  };
  geometry?: OverpassNode[];
};

type OverpassResponse = {
  elements: OverpassWay[];
};

export type LiveSpeedLimitResult = {
  speedLimitKmh: number | null;
  roadName?: string;
  roadClass?: string;
  nextLowerLimitKmh?: number;
  nextLowerLimitDistanceMeters?: number;
  isSchoolZoneActive?: boolean;
  schoolZoneLimitKmh?: number;
};

const OVERPASS_ENDPOINT = 'https://overpass-api.de/api/interpreter';

function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

function distanceMeters(a: Coordinates, b: Coordinates): number {
  const earthRadius = 6371000;
  const dLat = toRadians(b.latitude - a.latitude);
  const dLon = toRadians(b.longitude - a.longitude);
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);

  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  return 2 * earthRadius * Math.asin(Math.sqrt(h));
}

function parseMaxSpeedToKmh(raw: string | undefined): number | null {
  if (!raw) {
    return null;
  }

  const lowered = raw.toLowerCase().trim();

  if (lowered.includes('signals') || lowered.includes('none') || lowered.includes('variable')) {
    return null;
  }

  const numeric = Number.parseFloat(lowered.replace(',', '.'));

  if (!Number.isFinite(numeric) || numeric <= 0) {
    return null;
  }

  if (lowered.includes('mph')) {
    return Math.round(numeric * 1.60934);
  }

  return Math.round(numeric);
}

type ConditionalLimit = {
  limitKmh: number;
  conditionText: string;
};

type WayLimitContext = {
  speedLimitKmh: number | null;
  isSchoolZoneActive: boolean;
  schoolZoneLimitKmh: number | null;
};

function parseConditionalLimits(raw: string | undefined): ConditionalLimit[] {
  if (!raw) {
    return [];
  }

  const matches = raw.matchAll(/([^@;]+?)\s*@\s*\(([^)]+)\)/g);
  const parsed: ConditionalLimit[] = [];

  for (const match of matches) {
    const limit = parseMaxSpeedToKmh(match[1]?.trim());
    const conditionText = match[2]?.trim();

    if (!limit || !conditionText) {
      continue;
    }

    parsed.push({ limitKmh: limit, conditionText });
  }

  return parsed;
}

function timeToMinutes(value: string): number | null {
  const parts = value.split(':');

  if (parts.length !== 2) {
    return null;
  }

  const hours = Number.parseInt(parts[0], 10);
  const minutes = Number.parseInt(parts[1], 10);

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return null;
  }

  return hours * 60 + minutes;
}

function isNowWithinCondition(conditionText: string, now: Date): boolean {
  const dayMap: Record<string, number> = {
    su: 0,
    mo: 1,
    tu: 2,
    we: 3,
    th: 4,
    fr: 5,
    sa: 6,
  };

  const normalized = conditionText.toLowerCase();
  const currentDay = now.getDay();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const dayMatches = [...normalized.matchAll(/\b(mo|tu|we|th|fr|sa|su)(?:\s*-\s*(mo|tu|we|th|fr|sa|su))?\b/g)];

  let dayMatchesNow = true;
  if (dayMatches.length > 0) {
    dayMatchesNow = false;

    for (const match of dayMatches) {
      const startDay = dayMap[match[1]];
      const endToken = match[2] ?? match[1];
      const endDay = dayMap[endToken];

      if (startDay === undefined || endDay === undefined) {
        continue;
      }

      if (startDay <= endDay) {
        if (currentDay >= startDay && currentDay <= endDay) {
          dayMatchesNow = true;
          break;
        }
      } else if (currentDay >= startDay || currentDay <= endDay) {
        dayMatchesNow = true;
        break;
      }
    }
  }

  const timeMatch = normalized.match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/);
  let timeMatchesNow = true;

  if (timeMatch) {
    const startMinutes = timeToMinutes(timeMatch[1]);
    const endMinutes = timeToMinutes(timeMatch[2]);

    if (startMinutes !== null && endMinutes !== null) {
      if (startMinutes <= endMinutes) {
        timeMatchesNow = currentMinutes >= startMinutes && currentMinutes <= endMinutes;
      } else {
        timeMatchesNow = currentMinutes >= startMinutes || currentMinutes <= endMinutes;
      }
    }
  }

  return dayMatchesNow && timeMatchesNow;
}

function resolveWayLimitContext(way: OverpassWay, now: Date): WayLimitContext {
  const schoolZoneLimit = parseMaxSpeedToKmh(way.tags?.['maxspeed:school']);

  const explicitLimit =
    parseMaxSpeedToKmh(way.tags?.maxspeed) ??
    parseMaxSpeedToKmh(way.tags?.['maxspeed:forward']) ??
    parseMaxSpeedToKmh(way.tags?.['maxspeed:backward']);

  const defaultLimit = defaultUrbanLimitForRoadClass(way.tags?.highway);
  let resolvedLimit = explicitLimit ?? defaultLimit;
  let isSchoolZoneActive = false;

  for (const conditional of parseConditionalLimits(way.tags?.['maxspeed:conditional'])) {
    if (!isNowWithinCondition(conditional.conditionText, now)) {
      continue;
    }

    resolvedLimit = conditional.limitKmh;

    if (
      conditional.conditionText.toLowerCase().includes('school') ||
      conditional.limitKmh === schoolZoneLimit
    ) {
      isSchoolZoneActive = true;
    }

    break;
  }

  if (!isSchoolZoneActive && schoolZoneLimit !== null && resolvedLimit === schoolZoneLimit) {
    isSchoolZoneActive = true;
  }

  return {
    speedLimitKmh: resolvedLimit,
    isSchoolZoneActive,
    schoolZoneLimitKmh: schoolZoneLimit,
  };
}

function parseWaySpeedLimitKmh(way: OverpassWay): number | null {
  return resolveWayLimitContext(way, new Date()).speedLimitKmh;
}

function toDegrees(rad: number): number {
  return (rad * 180) / Math.PI;
}

function bearingDegrees(from: Coordinates, to: Coordinates): number {
  const lat1 = toRadians(from.latitude);
  const lat2 = toRadians(to.latitude);
  const dLon = toRadians(to.longitude - from.longitude);

  const y = Math.sin(dLon) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);

  return (toDegrees(Math.atan2(y, x)) + 360) % 360;
}

function headingDeltaDegrees(a: number, b: number): number {
  const diff = Math.abs(a - b) % 360;
  return diff > 180 ? 360 - diff : diff;
}

function closestNodeOnWay(
  way: OverpassWay,
  location: Coordinates,
): { node: OverpassNode; distanceMeters: number } | null {
  if (!way.geometry || way.geometry.length === 0) {
    return null;
  }

  let winner: { node: OverpassNode; distanceMeters: number } | null = null;

  for (const node of way.geometry) {
    const d = distanceMeters(location, { latitude: node.lat, longitude: node.lon });

    if (!winner || d < winner.distanceMeters) {
      winner = { node, distanceMeters: d };
    }
  }

  return winner;
}

function findUpcomingLowerLimit(
  ways: OverpassWay[],
  location: Coordinates,
  headingDegrees: number | undefined,
  currentLimitKmh: number,
): { nextLowerLimitKmh: number; nextLowerLimitDistanceMeters: number } | null {
  if (!Number.isFinite(headingDegrees)) {
    return null;
  }

  let winner: { nextLowerLimitKmh: number; nextLowerLimitDistanceMeters: number; score: number } | null =
    null;

  for (const way of ways) {
    const wayLimit = parseWaySpeedLimitKmh(way);

    if (!wayLimit || wayLimit >= currentLimitKmh) {
      continue;
    }

    const closest = closestNodeOnWay(way, location);

    if (!closest || closest.distanceMeters > 350) {
      continue;
    }

    const candidateBearing = bearingDegrees(location, {
      latitude: closest.node.lat,
      longitude: closest.node.lon,
    });
    const headingOffset = headingDeltaDegrees(headingDegrees as number, candidateBearing);

    if (headingOffset > 75) {
      continue;
    }

    const score = closest.distanceMeters + headingOffset * 2;

    if (!winner || score < winner.score) {
      winner = {
        nextLowerLimitKmh: wayLimit,
        nextLowerLimitDistanceMeters: Math.round(closest.distanceMeters),
        score,
      };
    }
  }

  if (!winner) {
    return null;
  }

  return {
    nextLowerLimitKmh: winner.nextLowerLimitKmh,
    nextLowerLimitDistanceMeters: winner.nextLowerLimitDistanceMeters,
  };
}

function defaultUrbanLimitForRoadClass(roadClass: string | undefined): number | null {
  if (!roadClass) {
    return null;
  }

  const defaults: Record<string, number> = {
    motorway: 100,
    trunk: 80,
    primary: 60,
    secondary: 60,
    tertiary: 50,
    unclassified: 50,
    residential: 50,
    service: 30,
    living_street: 20,
  };

  return defaults[roadClass] ?? null;
}

function distancePointToSegmentMeters(
  location: Coordinates,
  a: Coordinates,
  b: Coordinates,
): number {
  const metersPerDegLat = 111320;
  const latRad = toRadians(location.latitude);
  const metersPerDegLon = 111320 * Math.cos(latRad);

  const pointX = (location.longitude - a.longitude) * metersPerDegLon;
  const pointY = (location.latitude - a.latitude) * metersPerDegLat;
  const segmentX = (b.longitude - a.longitude) * metersPerDegLon;
  const segmentY = (b.latitude - a.latitude) * metersPerDegLat;
  const segmentLenSq = segmentX * segmentX + segmentY * segmentY;

  if (segmentLenSq === 0) {
    return Math.hypot(pointX, pointY);
  }

  const t = Math.max(0, Math.min(1, (pointX * segmentX + pointY * segmentY) / segmentLenSq));
  const projectionX = t * segmentX;
  const projectionY = t * segmentY;

  return Math.hypot(pointX - projectionX, pointY - projectionY);
}

function distanceToWayMeters(way: OverpassWay, location: Coordinates): number {
  if (!way.geometry || way.geometry.length === 0) {
    return Number.POSITIVE_INFINITY;
  }

  if (way.geometry.length === 1) {
    return distanceMeters(location, {
      latitude: way.geometry[0].lat,
      longitude: way.geometry[0].lon,
    });
  }

  let bestDistance = Number.POSITIVE_INFINITY;

  for (let index = 1; index < way.geometry.length; index += 1) {
    const previous = way.geometry[index - 1];
    const current = way.geometry[index];
    const segmentDistance = distancePointToSegmentMeters(
      location,
      { latitude: previous.lat, longitude: previous.lon },
      { latitude: current.lat, longitude: current.lon },
    );

    if (segmentDistance < bestDistance) {
      bestDistance = segmentDistance;
    }
  }

  return bestDistance;
}

function nearestWay(
  ways: OverpassWay[],
  location: Coordinates,
): { way: OverpassWay; distance: number } | null {
  let winner: { way: OverpassWay; distance: number } | null = null;

  for (const way of ways) {
    const bestDistance = distanceToWayMeters(way, location);

    if (!winner || bestDistance < winner.distance) {
      winner = { way, distance: bestDistance };
    }
  }

  return winner;
}

export async function resolveLiveSpeedLimitKmh(
  location: Coordinates,
  headingDegrees?: number,
): Promise<LiveSpeedLimitResult> {
  const now = new Date();
  const query = `
[out:json][timeout:8];
(
  way(around:300,${location.latitude},${location.longitude})
    ["highway"~"^(motorway|trunk|primary|secondary|tertiary|unclassified|residential|service|living_street)$"];
);
out geom 50;
`;

  const response = await fetch(OVERPASS_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain;charset=UTF-8',
    },
    body: query,
  });

  if (!response.ok) {
    throw new Error(`Overpass request failed: ${response.status}`);
  }

  const data = (await response.json()) as OverpassResponse;
  const ways = data.elements.filter((element) => element.type === 'way');

  const nearest = nearestWay(ways, location);

  if (!nearest) {
    return { speedLimitKmh: null };
  }

  const limitContext = resolveWayLimitContext(nearest.way, now);
  const parsedLimit = limitContext.speedLimitKmh;

  if (!parsedLimit) {
    return {
      speedLimitKmh: null,
      roadName: nearest.way.tags?.name,
      roadClass: nearest.way.tags?.highway,
    };
  }

  const nextLowerLimit = findUpcomingLowerLimit(ways, location, headingDegrees, parsedLimit);

  return {
    speedLimitKmh: parsedLimit,
    roadName: nearest.way.tags?.name,
    roadClass: nearest.way.tags?.highway,
    nextLowerLimitKmh: nextLowerLimit?.nextLowerLimitKmh,
    nextLowerLimitDistanceMeters: nextLowerLimit?.nextLowerLimitDistanceMeters,
    isSchoolZoneActive: limitContext.isSchoolZoneActive,
    schoolZoneLimitKmh: limitContext.schoolZoneLimitKmh ?? undefined,
  };
}
