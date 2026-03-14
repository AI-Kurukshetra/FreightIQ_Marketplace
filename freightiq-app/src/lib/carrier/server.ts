import { isCarrierRole } from "@/lib/auth/role-routing";
import { createClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

const ACTIVE_SHIPMENT_STATUSES = new Set(["matched", "picked_up", "in_transit"]);

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
  rating: number;
  total_deliveries: number;
  verified: boolean;
  created_at: string;
};

type RawLoad = {
  id: string;
  title: string;
  origin_address: string;
  destination_address: string;
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

export type CarrierProfile = {
  id: string;
  email: string | null;
  fullName: string | null;
  companyName: string | null;
  role: string;
  subscriptionTier: string | null;
};

export type CarrierRecord = {
  id: string;
  companyName: string;
  fleetSize: number;
  serviceModes: string[];
  rating: number;
  totalDeliveries: number;
  verified: boolean;
  createdAt: string;
};

export type CarrierLoadOpportunity = {
  id: string;
  title: string;
  originAddress: string;
  destinationAddress: string;
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
    rating: carrier.rating,
    totalDeliveries: carrier.total_deliveries,
    verified: carrier.verified,
    createdAt: carrier.created_at,
  };
}

function mapLoad(load: RawLoad): CarrierLoadOpportunity {
  return {
    id: load.id,
    title: load.title,
    originAddress: load.origin_address,
    destinationAddress: load.destination_address,
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
  };
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

function mapShipment(shipment: RawShipment, load?: CarrierLoadOpportunity): CarrierShipment {
  return {
    id: shipment.id,
    loadId: shipment.load_id,
    loadTitle: load?.title ?? `Load ${shipment.load_id.slice(0, 8)}`,
    routeLabel: load?.routeLabel ?? "Route details unavailable",
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

  const { data: carrier } = await supabase
    .from("carriers")
    .select("id,owner_id,company_name,fleet_size,service_modes,rating,total_deliveries,verified,created_at")
    .eq("owner_id", profile.id)
    .maybeSingle<RawCarrier>();

  return {
    ok: true,
    userId: user.id,
    profile: mapProfile(profile),
    carrier: carrier ? mapCarrier(carrier) : null,
  };
}

export async function listCarrierMarketplaceLoads(
  supabase: SupabaseServerClient,
  carrier: CarrierRecord | null,
  limit = 50
): Promise<CarrierLoadOpportunity[]> {
  const { data } = await supabase
    .from("loads")
    .select(
      "id,title,origin_address,destination_address,pickup_date,delivery_date,budget_usd,status,co2_score,preferred_mode,weight_kg,volume_m3,freight_type,created_at"
    )
    .eq("status", "open")
    .order("created_at", { ascending: false })
    .limit(Math.max(limit * 3, limit))
    .returns<RawLoad[]>();

  const loads = (data ?? []).map(mapLoad);

  if (!carrier || carrier.serviceModes.length === 0) {
    return loads.slice(0, limit);
  }

  return loads
    .filter((load) => carrier.serviceModes.includes(load.preferredMode))
    .slice(0, limit);
}

export async function listCarrierShipments(
  supabase: SupabaseServerClient,
  carrierId: string | null,
  limit = 50
): Promise<CarrierShipment[]> {
  if (!carrierId) {
    return [];
  }

  const { data: shipments } = await supabase
    .from("shipments")
    .select(
      "id,load_id,carrier_id,agreed_price_usd,transport_mode,co2_kg,distance_km,status,tracking_updates,estimated_delivery,actual_delivery,created_at"
    )
    .eq("carrier_id", carrierId)
    .order("created_at", { ascending: false })
    .limit(limit)
    .returns<RawShipment[]>();

  const loadIds = Array.from(new Set((shipments ?? []).map((shipment) => shipment.load_id)));
  const { data: loads } = loadIds.length
    ? await supabase
        .from("loads")
        .select(
          "id,title,origin_address,destination_address,pickup_date,delivery_date,budget_usd,status,co2_score,preferred_mode,weight_kg,volume_m3,freight_type,created_at"
        )
        .in("id", loadIds)
        .returns<RawLoad[]>()
    : { data: [] as RawLoad[] };

  const loadMap = new Map((loads ?? []).map((load) => [load.id, mapLoad(load)]));

  return (shipments ?? []).map((shipment) => mapShipment(shipment, loadMap.get(shipment.load_id)));
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
