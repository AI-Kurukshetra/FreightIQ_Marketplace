import { isCarrierRole } from "@/lib/auth/role-routing";
import { createClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

const ACTIVE_SHIPMENT_STATUSES = new Set(["matched", "picked_up", "in_transit"]);
const SHIPMENT_STATUS_ORDER = ["matched", "picked_up", "in_transit", "delivered"] as const;
const LOAD_SELECT =
  "id,title,origin_address,origin_lat,origin_lng,destination_address,destination_lat,destination_lng,pickup_date,delivery_date,budget_usd,status,co2_score,preferred_mode,weight_kg,volume_m3,freight_type,created_at";
const CARRIER_SELECT =
  "id,owner_id,company_name,fleet_size,service_modes,coverage_corridors,rating,total_deliveries,verified,created_at";
const SHIPMENT_SELECT =
  "id,load_id,carrier_id,agreed_price_usd,transport_mode,co2_kg,distance_km,status,tracking_updates,estimated_delivery,actual_delivery,created_at";

type RawProfile = {
  id: string;
  email: string | null;
  full_name: string | null;
  company_name: string | null;
  role: string;
  subscription_tier: string | null;
};

type RawCarrier = {
  id: string;
  owner_id: string;
  company_name: string;
  fleet_size: number;
  service_modes: string[] | null;
  coverage_corridors: unknown;
  rating: number;
  total_deliveries: number;
  verified: boolean;
  created_at: string;
};

type RawLoad = {
  id: string;
  title: string;
  origin_address: string;
  origin_lat: number | null;
  origin_lng: number | null;
  destination_address: string;
  destination_lat: number | null;
  destination_lng: number | null;
  pickup_date: string | null;
  delivery_date: string | null;
  budget_usd: number | null;
  status: string;
  co2_score: number | null;
  preferred_mode: string | null;
  weight_kg: number | null;
  volume_m3: number | null;
  freight_type: string | null;
  created_at: string;
};

type RawShipment = {
  id: string;
  load_id: string;
  carrier_id: string;
  agreed_price_usd: number | null;
  transport_mode: string;
  co2_kg: number | null;
  distance_km: number | null;
  status: string;
  tracking_updates: unknown;
  estimated_delivery: string | null;
  actual_delivery: string | null;
  created_at: string;
};

type RawModalComparison = {
  id: string;
  load_id: string;
  truck_co2: number | null;
  rail_co2: number | null;
  sea_co2: number | null;
  air_co2: number | null;
  truck_cost: number | null;
  rail_cost: number | null;
  sea_cost: number | null;
  air_cost: number | null;
  truck_days: number | null;
  rail_days: number | null;
  sea_days: number | null;
  air_days: number | null;
  created_at: string;
};

export type CarrierProfile = {
  id: string;
  email: string | null;
  fullName: string | null;
  companyName: string | null;
  role: string;
  subscriptionTier: string | null;
};

export type CarrierCoverageCorridor = {
  origin: string;
  destination: string;
  radiusKm: number | null;
};

export type CarrierRecord = {
  id: string;
  companyName: string;
  fleetSize: number;
  serviceModes: string[];
  coverageCorridors: CarrierCoverageCorridor[];
  rating: number;
  totalDeliveries: number;
  verified: boolean;
  createdAt: string;
};

export type CarrierLoadOpportunity = {
  id: string;
  title: string;
  originAddress: string;
  originLat: number | null;
  originLng: number | null;
  destinationAddress: string;
  destinationLat: number | null;
  destinationLng: number | null;
  routeLabel: string;
  pickupDate: string | null;
  deliveryDate: string | null;
  budgetUsd: number | null;
  status: string;
  co2Score: number | null;
  preferredMode: string;
  weightKg: number | null;
  volumeM3: number | null;
  freightType: string | null;
  createdAt: string;
  matchScore: number;
  fitLabel: string;
};

export type CarrierTrackingUpdate = {
  status: string;
  label: string;
  timestamp: string;
  location: string | null;
};

export type CarrierShipment = {
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
  agreedPriceUsd: number | null;
  transportMode: string;
  co2Kg: number | null;
  distanceKm: number | null;
  status: string;
  estimatedDelivery: string | null;
  actualDelivery: string | null;
  createdAt: string;
  trackingUpdates: CarrierTrackingUpdate[];
};

export type CarrierDashboardData = {
  profile: CarrierProfile;
  carrier: CarrierRecord | null;
  metrics: {
    availableLoads: number;
    assignedShipments: number;
    activeShipments: number;
    deliveredShipments: number;
  };
  recentOpportunities: CarrierLoadOpportunity[];
  recentShipments: CarrierShipment[];
};

export type CarrierContext =
  | { ok: true; userId: string; profile: CarrierProfile; carrier: CarrierRecord | null }
  | { ok: false; status: number; code: string; message: string };

export type CarrierMarketplaceFilters = {
  search?: string | null;
  mode?: string | null;
  freightType?: string | null;
  pickupWindow?: string | null;
  minBudget?: number | null;
};

export type CarrierLoadDetail = {
  profile: CarrierProfile;
  carrier: CarrierRecord | null;
  load: CarrierLoadOpportunity;
  modalComparison: RawModalComparison | null;
  estimatedDistanceKm: number | null;
  suggestedPriceUsd: number | null;
  activeShipment: CarrierShipment | null;
};

export type CarrierSettingsSnapshot = {
  profile: CarrierProfile;
  carrier: CarrierRecord | null;
  corridorsText: string;
};

export type CarrierStatusUpdateInput = {
  shipmentId: string;
  status: string;
  location: string | null;
  note: string | null;
};

export type CarrierSettingsUpdateInput = {
  fullName: string;
  companyName: string;
  fleetSize: number;
  serviceModes: string[];
  corridorsText: string;
};

export type CarrierRoutePostInput = {
  origin: string;
  destination: string;
  radiusKm: number | null;
};

export type CarrierRouteDeleteInput = {
  origin: string;
  destination: string;
};

type ResultErrorCode = "VALIDATION_ERROR" | "NOT_FOUND" | "FORBIDDEN" | "CONFLICT" | "UNKNOWN_ERROR";

type CarrierMutationResult<T> =
  | { ok: true; data: T }
  | { ok: false; code: ResultErrorCode; message: string };

function round(value: number) {
  return Math.round(value * 10) / 10;
}

function haversineDistanceKm(
  startLat: number | null,
  startLng: number | null,
  endLat: number | null,
  endLng: number | null
) {
  if (
    startLat == null ||
    startLng == null ||
    endLat == null ||
    endLng == null ||
    !Number.isFinite(startLat) ||
    !Number.isFinite(startLng) ||
    !Number.isFinite(endLat) ||
    !Number.isFinite(endLng)
  ) {
    return null;
  }

  const earthRadiusKm = 6371;
  const dLat = ((endLat - startLat) * Math.PI) / 180;
  const dLng = ((endLng - startLng) * Math.PI) / 180;
  const lat1 = (startLat * Math.PI) / 180;
  const lat2 = (endLat * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return round(earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function normalize(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
}

function parseCoverageCorridors(value: unknown): CarrierCoverageCorridor[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const record = item as Record<string, unknown>;
      const origin = typeof record.origin === "string" ? record.origin.trim() : "";
      const destination = typeof record.destination === "string" ? record.destination.trim() : "";
      const rawRadius = typeof record.radius_km === "number" ? record.radius_km : null;

      if (!origin || !destination) {
        return null;
      }

      return {
        origin,
        destination,
        radiusKm: rawRadius,
      };
    })
    .filter((item): item is CarrierCoverageCorridor => item !== null);
}

function formatCorridorsText(corridors: CarrierCoverageCorridor[]) {
  return corridors.map((corridor) => `${corridor.origin} -> ${corridor.destination}`).join("\n");
}

function parseCorridorsText(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [originPart, destinationPart] = line.split("->").map((part) => part.trim());
      if (!originPart || !destinationPart) {
        return null;
      }

      return {
        origin: originPart,
        destination: destinationPart,
        radius_km: 120,
      };
    })
    .filter((item): item is { origin: string; destination: string; radius_km: number } => item !== null);
}

function normalizeRouteKey(origin: string, destination: string) {
  return `${normalize(origin)}::${normalize(destination)}`;
}

function corridorMatchesLoad(corridor: CarrierCoverageCorridor, load: CarrierLoadOpportunity) {
  const corridorOrigin = normalize(corridor.origin);
  const corridorDestination = normalize(corridor.destination);
  const loadOrigin = normalize(load.originAddress);
  const loadDestination = normalize(load.destinationAddress);

  if (!corridorOrigin || !corridorDestination || !loadOrigin || !loadDestination) {
    return false;
  }

  return loadOrigin.includes(corridorOrigin) && loadDestination.includes(corridorDestination);
}

function fitLabel(score: number) {
  if (score >= 88) return "Prime fit";
  if (score >= 75) return "Strong fit";
  if (score >= 60) return "Qualified";
  return "Review fit";
}

function scoreCarrierMatch(carrier: CarrierRecord | null, load: CarrierLoadOpportunity) {
  if (!carrier) {
    return 52;
  }

  let score = 45;

  if (carrier.serviceModes.includes(load.preferredMode)) {
    score += 22;
  }

  if (carrier.coverageCorridors.some((corridor) => corridorMatchesLoad(corridor, load))) {
    score += 12;
  }

  if (carrier.verified) {
    score += 8;
  }

  score += Math.min(Math.round(carrier.rating * 4), 20);

  if (load.pickupDate) {
    const diffDays = Math.ceil((new Date(load.pickupDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (diffDays <= 1) score += 6;
    else if (diffDays <= 3) score += 3;
  }

  return Math.max(0, Math.min(100, score));
}

function matchesCarrierFilters(load: CarrierLoadOpportunity, filters: CarrierMarketplaceFilters) {
  if (filters.mode && load.preferredMode !== filters.mode) {
    return false;
  }

  if (filters.freightType && normalize(load.freightType) !== normalize(filters.freightType)) {
    return false;
  }

  if (filters.minBudget != null && (load.budgetUsd ?? 0) < filters.minBudget) {
    return false;
  }

  if (filters.search) {
    const search = normalize(filters.search);
    const haystack = [load.title, load.originAddress, load.destinationAddress, load.freightType]
      .map((item) => normalize(item))
      .join(" ");

    if (!haystack.includes(search)) {
      return false;
    }
  }

  if (filters.pickupWindow && load.pickupDate) {
    const pickupDate = new Date(load.pickupDate);
    const now = new Date();
    const diffDays = Math.ceil((pickupDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (filters.pickupWindow === "today" && diffDays !== 0) {
      return false;
    }

    if (filters.pickupWindow === "week" && (diffDays < 0 || diffDays > 7)) {
      return false;
    }
  }

  return true;
}

function parseTrackingUpdates(value: unknown): CarrierTrackingUpdate[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const record = item as Record<string, unknown>;
      return {
        status: typeof record.status === "string" ? record.status : "matched",
        label: typeof record.label === "string" ? record.label : "Status updated",
        timestamp: typeof record.timestamp === "string" ? record.timestamp : "",
        location: typeof record.location === "string" ? record.location : null,
      };
    })
    .filter((item): item is CarrierTrackingUpdate => item !== null)
    .sort((left, right) => left.timestamp.localeCompare(right.timestamp));
}

function mapProfile(profile: RawProfile): CarrierProfile {
  return {
    id: profile.id,
    email: profile.email,
    fullName: profile.full_name,
    companyName: profile.company_name,
    role: profile.role,
    subscriptionTier: profile.subscription_tier,
  };
}

function mapCarrier(carrier: RawCarrier): CarrierRecord {
  return {
    id: carrier.id,
    companyName: carrier.company_name,
    fleetSize: carrier.fleet_size,
    serviceModes: carrier.service_modes ?? [],
    coverageCorridors: parseCoverageCorridors(carrier.coverage_corridors),
    rating: carrier.rating,
    totalDeliveries: carrier.total_deliveries,
    verified: carrier.verified,
    createdAt: carrier.created_at,
  };
}

function mapLoad(load: RawLoad, carrier: CarrierRecord | null = null): CarrierLoadOpportunity {
  const mapped = {
    id: load.id,
    title: load.title,
    originAddress: load.origin_address,
    originLat: load.origin_lat,
    originLng: load.origin_lng,
    destinationAddress: load.destination_address,
    destinationLat: load.destination_lat,
    destinationLng: load.destination_lng,
    routeLabel: `${load.origin_address} -> ${load.destination_address}`,
    pickupDate: load.pickup_date,
    deliveryDate: load.delivery_date,
    budgetUsd: load.budget_usd,
    status: load.status,
    co2Score: load.co2_score,
    preferredMode: load.preferred_mode ?? "truck",
    weightKg: load.weight_kg,
    volumeM3: load.volume_m3,
    freightType: load.freight_type,
    createdAt: load.created_at,
    matchScore: 0,
    fitLabel: "Review fit",
  } satisfies CarrierLoadOpportunity;

  const score = scoreCarrierMatch(carrier, mapped);
  return {
    ...mapped,
    matchScore: score,
    fitLabel: fitLabel(score),
  };
}

function mapShipment(shipment: RawShipment, load?: CarrierLoadOpportunity): CarrierShipment {
  return {
    id: shipment.id,
    loadId: shipment.load_id,
    loadTitle: load?.title ?? `Load ${shipment.load_id.slice(0, 8)}`,
    routeLabel: load?.routeLabel ?? "Route details unavailable",
    originAddress: load?.originAddress ?? "Origin unavailable",
    originLat: load?.originLat ?? null,
    originLng: load?.originLng ?? null,
    destinationAddress: load?.destinationAddress ?? "Destination unavailable",
    destinationLat: load?.destinationLat ?? null,
    destinationLng: load?.destinationLng ?? null,
    agreedPriceUsd: shipment.agreed_price_usd,
    transportMode: shipment.transport_mode,
    co2Kg: shipment.co2_kg,
    distanceKm: shipment.distance_km,
    status: shipment.status,
    estimatedDelivery: shipment.estimated_delivery,
    actualDelivery: shipment.actual_delivery,
    createdAt: shipment.created_at,
    trackingUpdates: parseTrackingUpdates(shipment.tracking_updates),
  };
}

function inferDistanceKm(load: CarrierLoadOpportunity) {
  return (
    haversineDistanceKm(load.originLat, load.originLng, load.destinationLat, load.destinationLng) ??
    null
  );
}

function canTransitionShipment(currentStatus: string, nextStatus: string) {
  const currentIndex = SHIPMENT_STATUS_ORDER.indexOf(currentStatus as (typeof SHIPMENT_STATUS_ORDER)[number]);
  const nextIndex = SHIPMENT_STATUS_ORDER.indexOf(nextStatus as (typeof SHIPMENT_STATUS_ORDER)[number]);

  if (currentIndex === -1 || nextIndex === -1) {
    return false;
  }

  if (currentStatus === "delivered") {
    return false;
  }

  return nextIndex >= currentIndex && nextIndex - currentIndex <= 2;
}

function buildTrackingUpdate(status: string, location: string | null, note: string | null) {
  const now = new Date().toISOString();

  let label = "Status updated";
  if (status === "matched") label = "Carrier confirmed the shipment assignment";
  if (status === "picked_up") label = "Shipment picked up from origin";
  if (status === "in_transit") label = "Shipment is actively moving across the route";
  if (status === "delivered") label = "Shipment delivered successfully";

  if (note) {
    label = note;
  }

  return {
    status,
    label,
    timestamp: now,
    location,
  };
}

async function getCarrierRecordByOwner(supabase: SupabaseServerClient, ownerId: string) {
  const { data } = await supabase
    .from("carriers")
    .select(CARRIER_SELECT)
    .eq("owner_id", ownerId)
    .maybeSingle<RawCarrier>();

  return data ? mapCarrier(data) : null;
}

export async function getCarrierContext(supabase: SupabaseServerClient): Promise<CarrierContext> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false,
      status: 401,
      code: "UNAUTHORIZED",
      message: "Authentication required.",
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id,email,full_name,company_name,role,subscription_tier")
    .eq("id", user.id)
    .maybeSingle<RawProfile>();

  if (!profile) {
    return {
      ok: false,
      status: 404,
      code: "PROFILE_NOT_FOUND",
      message: "Profile record was not found.",
    };
  }

  if (!isCarrierRole(profile.role)) {
    return {
      ok: false,
      status: 403,
      code: "FORBIDDEN",
      message: "Carrier access is required.",
    };
  }

  const carrier = await getCarrierRecordByOwner(supabase, profile.id);

  return {
    ok: true,
    userId: user.id,
    profile: mapProfile(profile),
    carrier,
  };
}

export async function listCarrierMarketplaceLoads(
  supabase: SupabaseServerClient,
  carrier: CarrierRecord | null,
  limit = 50,
  filters: CarrierMarketplaceFilters = {}
): Promise<CarrierLoadOpportunity[]> {
  const { data } = await supabase
    .from("loads")
    .select(LOAD_SELECT)
    .eq("status", "open")
    .order("created_at", { ascending: false })
    .limit(Math.max(limit * 3, limit))
    .returns<RawLoad[]>();

  let loads = (data ?? []).map((load) => mapLoad(load, carrier));

  if (carrier?.serviceModes.length) {
    loads = loads.filter((load) => carrier.serviceModes.includes(load.preferredMode));
  }

  loads = loads.filter((load) => matchesCarrierFilters(load, filters));

  return loads
    .sort((left, right) => right.matchScore - left.matchScore || left.title.localeCompare(right.title))
    .slice(0, limit);
}

export async function listCarrierShipments(
  supabase: SupabaseServerClient,
  carrierId: string | null,
  limit = 50,
  filters?: { status?: string | null; search?: string | null }
): Promise<CarrierShipment[]> {
  if (!carrierId) {
    return [];
  }

  let query = supabase
    .from("shipments")
    .select(SHIPMENT_SELECT)
    .eq("carrier_id", carrierId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }

  const { data: shipments } = await query.returns<RawShipment[]>();

  const loadIds = Array.from(new Set((shipments ?? []).map((shipment) => shipment.load_id)));
  const { data: loads } = loadIds.length
    ? await supabase.from("loads").select(LOAD_SELECT).in("id", loadIds).returns<RawLoad[]>()
    : { data: [] as RawLoad[] };

  const loadMap = new Map((loads ?? []).map((load) => [load.id, mapLoad(load)]));
  let mapped = (shipments ?? []).map((shipment) => mapShipment(shipment, loadMap.get(shipment.load_id)));

  if (filters?.search) {
    const search = normalize(filters.search);
    mapped = mapped.filter((shipment) =>
      [shipment.loadTitle, shipment.originAddress, shipment.destinationAddress, shipment.transportMode]
        .map((item) => normalize(item))
        .join(" ")
        .includes(search)
    );
  }

  return mapped;
}

export async function getCarrierMarketplaceLoadDetail(
  supabase: SupabaseServerClient,
  profile: CarrierProfile,
  carrier: CarrierRecord | null,
  loadId: string
): Promise<CarrierLoadDetail | null> {
  const { data: load } = await supabase
    .from("loads")
    .select(LOAD_SELECT)
    .eq("id", loadId)
    .maybeSingle<RawLoad>();

  if (!load) {
    return null;
  }

  const mappedLoad = mapLoad(load, carrier);
  const { data: modalComparison } = await supabase
    .from("modal_comparisons")
    .select(
      "id,load_id,truck_co2,rail_co2,sea_co2,air_co2,truck_cost,rail_cost,sea_cost,air_cost,truck_days,rail_days,sea_days,air_days,created_at"
    )
    .eq("load_id", loadId)
    .maybeSingle<RawModalComparison>();

  const { data: shipment } = carrier
    ? await supabase
        .from("shipments")
        .select(SHIPMENT_SELECT)
        .eq("load_id", loadId)
        .eq("carrier_id", carrier.id)
        .maybeSingle<RawShipment>()
    : { data: null as RawShipment | null };

  return {
    profile,
    carrier,
    load: mappedLoad,
    modalComparison: modalComparison ?? null,
    estimatedDistanceKm: inferDistanceKm(mappedLoad),
    suggestedPriceUsd: mappedLoad.budgetUsd != null ? round(mappedLoad.budgetUsd * 0.97) : null,
    activeShipment: shipment ? mapShipment(shipment, mappedLoad) : null,
  };
}

export async function getCarrierShipmentDetail(
  supabase: SupabaseServerClient,
  profile: CarrierProfile,
  carrier: CarrierRecord | null,
  shipmentId: string
): Promise<{ profile: CarrierProfile; carrier: CarrierRecord | null; shipment: CarrierShipment } | null> {
  if (!carrier) {
    return null;
  }

  const { data: shipment } = await supabase
    .from("shipments")
    .select(SHIPMENT_SELECT)
    .eq("id", shipmentId)
    .eq("carrier_id", carrier.id)
    .maybeSingle<RawShipment>();

  if (!shipment) {
    return null;
  }

  const { data: load } = await supabase
    .from("loads")
    .select(LOAD_SELECT)
    .eq("id", shipment.load_id)
    .maybeSingle<RawLoad>();

  return {
    profile,
    carrier,
    shipment: mapShipment(shipment, load ? mapLoad(load, carrier) : undefined),
  };
}

export async function getCarrierSettingsSnapshot(
  supabase: SupabaseServerClient,
  profile: CarrierProfile,
  carrier: CarrierRecord | null
): Promise<CarrierSettingsSnapshot> {
  return {
    profile,
    carrier,
    corridorsText: formatCorridorsText(carrier?.coverageCorridors ?? []),
  };
}

export async function acceptCarrierLoad(
  supabase: SupabaseServerClient,
  context: Extract<CarrierContext, { ok: true }>,
  input: { loadId: string; agreedPriceUsd: number | null }
): Promise<CarrierMutationResult<{ shipmentId: string }>> {
  if (!context.carrier) {
    return {
      ok: false,
      code: "FORBIDDEN",
      message: "Create a carrier profile before accepting a load.",
    };
  }

  const { data: load } = await supabase
    .from("loads")
    .select(LOAD_SELECT)
    .eq("id", input.loadId)
    .maybeSingle<RawLoad>();

  if (!load) {
    return {
      ok: false,
      code: "NOT_FOUND",
      message: "Load was not found.",
    };
  }

  if (load.status !== "open") {
    return {
      ok: false,
      code: "CONFLICT",
      message: "This load is no longer open for assignment.",
    };
  }

  const mappedLoad = mapLoad(load, context.carrier);
  if (!context.carrier.serviceModes.includes(mappedLoad.preferredMode)) {
    return {
      ok: false,
      code: "FORBIDDEN",
      message: "This load does not match your configured service modes.",
    };
  }

  const { data: existingShipment } = await supabase
    .from("shipments")
    .select("id,status")
    .eq("load_id", input.loadId)
    .neq("status", "cancelled")
    .maybeSingle<{ id: string; status: string }>();

  if (existingShipment) {
    return {
      ok: false,
      code: "CONFLICT",
      message: "A shipment already exists for this load.",
    };
  }

  const estimatedDelivery =
    mappedLoad.deliveryDate != null
      ? new Date(`${mappedLoad.deliveryDate}T17:00:00Z`).toISOString()
      : new Date(Date.now() + 1000 * 60 * 60 * 36).toISOString();

  const agreedPriceUsd =
    input.agreedPriceUsd != null && Number.isFinite(input.agreedPriceUsd) && input.agreedPriceUsd > 0
      ? round(input.agreedPriceUsd)
      : mappedLoad.budgetUsd != null
        ? round(mappedLoad.budgetUsd * 0.97)
        : null;

  const insertPayload = {
    load_id: input.loadId,
    carrier_id: context.carrier.id,
    agreed_price_usd: agreedPriceUsd,
    transport_mode: mappedLoad.preferredMode,
    co2_kg: mappedLoad.co2Score,
    distance_km: inferDistanceKm(mappedLoad),
    status: "matched",
    tracking_updates: [
      buildTrackingUpdate("matched", mappedLoad.originAddress, "Carrier accepted the load assignment"),
    ],
    estimated_delivery: estimatedDelivery,
  };

  const { data: shipment, error } = await supabase
    .from("shipments")
    .insert(insertPayload)
    .select("id")
    .single<{ id: string }>();

  if (error || !shipment) {
    return {
      ok: false,
      code: "UNKNOWN_ERROR",
      message: "Shipment creation failed.",
    };
  }

  return {
    ok: true,
    data: { shipmentId: shipment.id },
  };
}

export async function updateCarrierShipmentStatus(
  supabase: SupabaseServerClient,
  context: Extract<CarrierContext, { ok: true }>,
  input: CarrierStatusUpdateInput
): Promise<CarrierMutationResult<{ shipmentId: string; status: string }>> {
  if (!context.carrier) {
    return {
      ok: false,
      code: "FORBIDDEN",
      message: "Carrier profile is required.",
    };
  }

  if (!SHIPMENT_STATUS_ORDER.includes(input.status as (typeof SHIPMENT_STATUS_ORDER)[number])) {
    return {
      ok: false,
      code: "VALIDATION_ERROR",
      message: "Invalid shipment status.",
    };
  }

  const { data: shipment } = await supabase
    .from("shipments")
    .select(SHIPMENT_SELECT)
    .eq("id", input.shipmentId)
    .eq("carrier_id", context.carrier.id)
    .maybeSingle<RawShipment>();

  if (!shipment) {
    return {
      ok: false,
      code: "NOT_FOUND",
      message: "Shipment was not found.",
    };
  }

  if (!canTransitionShipment(shipment.status, input.status)) {
    return {
      ok: false,
      code: "VALIDATION_ERROR",
      message: "Invalid shipment transition.",
    };
  }

  const currentUpdates = parseTrackingUpdates(shipment.tracking_updates);
  const nextUpdates = [...currentUpdates, buildTrackingUpdate(input.status, input.location, input.note)];
  const actualDelivery = input.status === "delivered" ? new Date().toISOString() : shipment.actual_delivery;

  const { error } = await supabase
    .from("shipments")
    .update({
      status: input.status,
      tracking_updates: nextUpdates,
      actual_delivery: actualDelivery,
    })
    .eq("id", input.shipmentId)
    .eq("carrier_id", context.carrier.id);

  if (error) {
    return {
      ok: false,
      code: "UNKNOWN_ERROR",
      message: "Shipment update failed.",
    };
  }

  if (input.status === "delivered" && shipment.status !== "delivered") {
    await supabase
      .from("carriers")
      .update({ total_deliveries: context.carrier.totalDeliveries + 1 })
      .eq("id", context.carrier.id);
  }

  return {
    ok: true,
    data: { shipmentId: input.shipmentId, status: input.status },
  };
}

export async function updateCarrierSettings(
  supabase: SupabaseServerClient,
  context: Extract<CarrierContext, { ok: true }>,
  input: CarrierSettingsUpdateInput
): Promise<CarrierMutationResult<{ carrierId: string }>> {
  const fullName = input.fullName.trim();
  const companyName = input.companyName.trim();
  const serviceModes = Array.from(new Set(input.serviceModes.map((mode) => mode.trim()).filter(Boolean)));
  const fleetSize = Number.isFinite(input.fleetSize) ? Math.max(0, Math.round(input.fleetSize)) : 0;
  const coverageCorridors = parseCorridorsText(input.corridorsText);

  if (!fullName || !companyName || serviceModes.length === 0) {
    return {
      ok: false,
      code: "VALIDATION_ERROR",
      message: "Full name, company name, and at least one service mode are required.",
    };
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      full_name: fullName,
      company_name: companyName,
    })
    .eq("id", context.profile.id);

  if (profileError) {
    return {
      ok: false,
      code: "UNKNOWN_ERROR",
      message: "Profile update failed.",
    };
  }

  if (context.carrier) {
    const { error: carrierError } = await supabase
      .from("carriers")
      .update({
        company_name: companyName,
        fleet_size: fleetSize,
        service_modes: serviceModes,
        coverage_corridors: coverageCorridors,
      })
      .eq("id", context.carrier.id);

    if (carrierError) {
      return {
        ok: false,
        code: "UNKNOWN_ERROR",
        message: "Carrier profile update failed.",
      };
    }

    return {
      ok: true,
      data: { carrierId: context.carrier.id },
    };
  }

  const { data: carrier, error: insertError } = await supabase
    .from("carriers")
    .insert({
      owner_id: context.profile.id,
      company_name: companyName,
      fleet_size: fleetSize,
      service_modes: serviceModes,
      coverage_corridors: coverageCorridors,
      verified: false,
    })
    .select("id")
    .single<{ id: string }>();

  if (insertError || !carrier) {
    return {
      ok: false,
      code: "UNKNOWN_ERROR",
      message: "Carrier profile creation failed.",
    };
  }

  return {
    ok: true,
    data: { carrierId: carrier.id },
  };
}

export async function postCarrierRoute(
  supabase: SupabaseServerClient,
  context: Extract<CarrierContext, { ok: true }>,
  input: CarrierRoutePostInput
): Promise<CarrierMutationResult<{ carrierId: string; corridorCount: number }>> {
  if (!context.carrier) {
    return {
      ok: false,
      code: "FORBIDDEN",
      message: "Carrier profile is required.",
    };
  }

  const origin = input.origin.trim();
  const destination = input.destination.trim();
  const radiusKm =
    input.radiusKm != null && Number.isFinite(input.radiusKm) && input.radiusKm > 0
      ? Math.round(input.radiusKm)
      : 120;

  if (!origin || !destination) {
    return {
      ok: false,
      code: "VALIDATION_ERROR",
      message: "Origin and destination are required.",
    };
  }

  const nextKey = normalizeRouteKey(origin, destination);
  const duplicate = context.carrier.coverageCorridors.some(
    (corridor) => normalizeRouteKey(corridor.origin, corridor.destination) === nextKey
  );

  if (duplicate) {
    return {
      ok: false,
      code: "CONFLICT",
      message: "This route already exists in your posted corridors.",
    };
  }

  const nextCorridors = [
    ...context.carrier.coverageCorridors.map((corridor) => ({
      origin: corridor.origin,
      destination: corridor.destination,
      radius_km: corridor.radiusKm ?? 120,
    })),
    {
      origin,
      destination,
      radius_km: radiusKm,
    },
  ];

  const { error } = await supabase
    .from("carriers")
    .update({
      coverage_corridors: nextCorridors,
    })
    .eq("id", context.carrier.id);

  if (error) {
    return {
      ok: false,
      code: "UNKNOWN_ERROR",
      message: "Unable to post route right now.",
    };
  }

  return {
    ok: true,
    data: {
      carrierId: context.carrier.id,
      corridorCount: nextCorridors.length,
    },
  };
}

export async function deleteCarrierRoute(
  supabase: SupabaseServerClient,
  context: Extract<CarrierContext, { ok: true }>,
  input: CarrierRouteDeleteInput
): Promise<CarrierMutationResult<{ carrierId: string; corridorCount: number }>> {
  if (!context.carrier) {
    return {
      ok: false,
      code: "FORBIDDEN",
      message: "Carrier profile is required.",
    };
  }

  const origin = input.origin.trim();
  const destination = input.destination.trim();

  if (!origin || !destination) {
    return {
      ok: false,
      code: "VALIDATION_ERROR",
      message: "Origin and destination are required.",
    };
  }

  const removeKey = normalizeRouteKey(origin, destination);
  const nextCorridors = context.carrier.coverageCorridors
    .map((corridor) => ({
      origin: corridor.origin,
      destination: corridor.destination,
      radius_km: corridor.radiusKm ?? 120,
    }))
    .filter((corridor) => normalizeRouteKey(corridor.origin, corridor.destination) !== removeKey);

  if (nextCorridors.length === context.carrier.coverageCorridors.length) {
    return {
      ok: false,
      code: "NOT_FOUND",
      message: "Route was not found in posted corridors.",
    };
  }

  const { error } = await supabase
    .from("carriers")
    .update({
      coverage_corridors: nextCorridors,
    })
    .eq("id", context.carrier.id);

  if (error) {
    return {
      ok: false,
      code: "UNKNOWN_ERROR",
      message: "Unable to remove route right now.",
    };
  }

  return {
    ok: true,
    data: {
      carrierId: context.carrier.id,
      corridorCount: nextCorridors.length,
    },
  };
}

export async function getCarrierDashboardData(
  supabase: SupabaseServerClient,
  profile: CarrierProfile,
  carrier: CarrierRecord | null
): Promise<CarrierDashboardData> {
  const [recentOpportunities, recentShipments] = await Promise.all([
    listCarrierMarketplaceLoads(supabase, carrier, 6),
    listCarrierShipments(supabase, carrier?.id ?? null, 6),
  ]);

  return {
    profile,
    carrier,
    metrics: {
      availableLoads: recentOpportunities.length,
      assignedShipments: recentShipments.length,
      activeShipments: recentShipments.filter((shipment) => ACTIVE_SHIPMENT_STATUSES.has(shipment.status)).length,
      deliveredShipments: recentShipments.filter((shipment) => shipment.status === "delivered").length,
    },
    recentOpportunities,
    recentShipments,
  };
}
