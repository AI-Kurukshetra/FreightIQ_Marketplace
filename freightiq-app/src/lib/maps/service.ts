import { greatCircle, lineString, length } from "@turf/turf";
import type { MapJourneyFeedItem, MapRouteJourney, MapWaypoint } from "./types";

const geocodeCache = new Map<string, Promise<MapWaypoint | null>>();
const routeCache = new Map<string, Promise<MapRouteJourney>>();

function normalizeTransportMode(mode: string) {
  switch (mode) {
    case "air":
    case "express_air":
      return "air";
    case "truck":
    case "ev_truck":
    case "van":
    case "flatbed":
    case "reefer":
    case "drayage":
    case "intermodal":
      return "truck";
    default:
      return mode;
  }
}

function hasCoordinates(lat: number | null, lng: number | null) {
  return (
    typeof lat === "number" &&
    typeof lng === "number" &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    (lat !== 0 || lng !== 0)
  );
}

function normalizeAddress(address: string) {
  return address.trim().toLowerCase();
}

function createWaypoint(
  address: string,
  lat: number,
  lng: number,
  source: MapWaypoint["source"]
): MapWaypoint {
  return {
    address,
    lat,
    lng,
    source,
  };
}

async function geocodeAddress(address: string): Promise<MapWaypoint | null> {
  const normalized = normalizeAddress(address);

  if (!normalized) {
    return null;
  }

  const cached = geocodeCache.get(normalized);
  if (cached) {
    return cached;
  }

  const request = (async () => {
    const params = new URLSearchParams({
      q: address,
      format: "jsonv2",
      limit: "1",
    });

    const contact = process.env.NOMINATIM_CONTACT_EMAIL?.trim();
    if (contact) {
      params.set("email", contact);
    }

    const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
      headers: {
        "Accept-Language": "en",
        "User-Agent": `FreightIQ/1.0${contact ? ` (${contact})` : ""}`,
      },
      next: { revalidate: 60 * 60 * 24 },
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as Array<{ lat: string; lon: string; display_name?: string }>;
    const match = payload[0];

    if (!match) {
      return null;
    }

    const lat = Number(match.lat);
    const lng = Number(match.lon);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return null;
    }

    return createWaypoint(address || match.display_name || normalized, lat, lng, "geocoded");
  })();

  geocodeCache.set(normalized, request);
  return request;
}

async function resolveWaypoint(
  address: string,
  lat: number | null,
  lng: number | null
): Promise<MapWaypoint | null> {
  if (hasCoordinates(lat, lng)) {
    return createWaypoint(address, lat as number, lng as number, "database");
  }

  return geocodeAddress(address);
}

function fallbackGeometry(
  origin: MapWaypoint,
  destination: MapWaypoint,
  mode: string
): Array<[number, number]> {
  if (normalizeTransportMode(mode) === "air") {
    const arc = greatCircle([origin.lng, origin.lat], [destination.lng, destination.lat], { npoints: 64 });
    const coordinates =
      arc.geometry.type === "MultiLineString"
        ? arc.geometry.coordinates.flat()
        : arc.geometry.coordinates;

    return coordinates as Array<[number, number]>;
  }

  return [
    [origin.lng, origin.lat],
    [destination.lng, destination.lat],
  ];
}

async function fetchOpenRouteServiceGeometry(
  origin: MapWaypoint,
  destination: MapWaypoint,
  mode: string
): Promise<{ coordinates: Array<[number, number]>; distanceKm: number | null } | null> {
  const apiKey = process.env.OPENROUTESERVICE_API_KEY?.trim();
  const normalizedMode = normalizeTransportMode(mode);

  if (!apiKey || normalizedMode !== "truck") {
    return null;
  }

  const response = await fetch("https://api.openrouteservice.org/v2/directions/driving-hgv/geojson", {
    method: "POST",
    headers: {
      Authorization: apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      coordinates: [
        [origin.lng, origin.lat],
        [destination.lng, destination.lat],
      ],
    }),
    next: { revalidate: 60 * 60 },
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as {
    features?: Array<{
      geometry?: { coordinates?: Array<[number, number]> };
      properties?: { summary?: { distance?: number } };
    }>;
  };

  const feature = payload.features?.[0];
  const coordinates = feature?.geometry?.coordinates;

  if (!coordinates || coordinates.length < 2) {
    return null;
  }

  return {
    coordinates,
    distanceKm:
      typeof feature?.properties?.summary?.distance === "number"
        ? Number((feature.properties.summary.distance / 1000).toFixed(1))
        : null,
  };
}

function measureDistanceKm(coordinates: Array<[number, number]>) {
  if (coordinates.length < 2) {
    return null;
  }

  return Number(length(lineString(coordinates), { units: "kilometers" }).toFixed(1));
}

export async function buildJourneyRoute(journey: MapJourneyFeedItem): Promise<MapRouteJourney> {
  const cacheKey = JSON.stringify({
    id: journey.id,
    transportMode: journey.transportMode,
    originAddress: normalizeAddress(journey.originAddress),
    originLat: journey.originLat,
    originLng: journey.originLng,
    destinationAddress: normalizeAddress(journey.destinationAddress),
    destinationLat: journey.destinationLat,
    destinationLng: journey.destinationLng,
  });

  const cached = routeCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const request = (async () => {
    const [origin, destination] = await Promise.all([
      resolveWaypoint(journey.originAddress, journey.originLat, journey.originLng),
      resolveWaypoint(journey.destinationAddress, journey.destinationLat, journey.destinationLng),
    ]);

    if (!origin || !destination) {
      return {
        id: journey.id,
        routeSource: "unresolved" as const,
        routeCoordinates: [],
        origin,
        destination,
        distanceKm: null,
      };
    }

    const orsRoute = await fetchOpenRouteServiceGeometry(origin, destination, journey.transportMode);
    if (orsRoute) {
      return {
        id: journey.id,
        routeSource: "ors" as const,
        routeCoordinates: orsRoute.coordinates,
        origin,
        destination,
        distanceKm: orsRoute.distanceKm ?? measureDistanceKm(orsRoute.coordinates),
      };
    }

    const routeCoordinates = fallbackGeometry(origin, destination, journey.transportMode);

    return {
      id: journey.id,
      routeSource: "fallback" as const,
      routeCoordinates,
      origin,
      destination,
      distanceKm: measureDistanceKm(routeCoordinates),
    };
  })();

  routeCache.set(cacheKey, request);
  return request;
}
