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
    name?: string;
  };
  geometry?: OverpassNode[];
};

type OverpassResponse = {
  elements: OverpassWay[];
};

export type LiveSpeedLimitResult = {
  speedLimitKmh: number | null;
  roadName?: string;
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

function nearestWay(
  ways: OverpassWay[],
  location: Coordinates,
): { way: OverpassWay; distance: number } | null {
  let winner: { way: OverpassWay; distance: number } | null = null;

  for (const way of ways) {
    if (!way.geometry || way.geometry.length === 0) {
      continue;
    }

    let bestDistance = Number.POSITIVE_INFINITY;

    for (const point of way.geometry) {
      const d = distanceMeters(location, {
        latitude: point.lat,
        longitude: point.lon,
      });

      if (d < bestDistance) {
        bestDistance = d;
      }
    }

    if (!winner || bestDistance < winner.distance) {
      winner = { way, distance: bestDistance };
    }
  }

  return winner;
}

export async function resolveLiveSpeedLimitKmh(
  location: Coordinates,
): Promise<LiveSpeedLimitResult> {
  const query = `
[out:json][timeout:8];
(
  way(around:250,${location.latitude},${location.longitude})["highway"]["maxspeed"];
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

  const parsedLimit = parseMaxSpeedToKmh(nearest.way.tags?.maxspeed);

  if (!parsedLimit) {
    return { speedLimitKmh: null, roadName: nearest.way.tags?.name };
  }

  return {
    speedLimitKmh: parsedLimit,
    roadName: nearest.way.tags?.name,
  };
}
