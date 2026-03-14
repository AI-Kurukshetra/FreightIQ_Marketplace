export type MapTrackingUpdate = {
  status: string;
  label: string;
  timestamp: string;
  location: string | null;
};

export type MapJourneyFeedItem = {
  id: string;
  loadId: string;
  loadTitle: string;
  routeLabel: string;
  originAddress: string;
  originLat: number | null;
  originLng: number | null;
  destinationAddress: string;
  destinationLat: number | null;
  destinationLng: number | null;
  transportMode: string;
  status: string;
  distanceKm: number | null;
  estimatedDelivery: string | null;
  actualDelivery: string | null;
  createdAt: string;
  trackingUpdates: MapTrackingUpdate[];
  carrierName?: string;
};

export type MapWaypoint = {
  address: string;
  lat: number;
  lng: number;
  source: "database" | "geocoded";
};

export type MapRouteJourney = {
  id: string;
  routeSource: "ors" | "fallback" | "unresolved";
  routeCoordinates: Array<[number, number]>;
  origin: MapWaypoint | null;
  destination: MapWaypoint | null;
  distanceKm: number | null;
};
