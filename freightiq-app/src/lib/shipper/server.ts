import { createClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

const ALLOWED_SHIPPER_ROLES = new Set(["shipper", "admin"]);
const ACTIVE_LOAD_STATUSES = new Set(["open", "matched", "in_transit"]);
const ACTIVE_SHIPMENT_STATUSES = new Set(["matched", "picked_up", "in_transit"]);
const MODE_ORDER = ["truck", "rail", "sea", "air"] as const;
const EMISSION_FACTORS: Record<(typeof MODE_ORDER)[number], number> = {
  truck: 0.096,
  rail: 0.028,
  sea: 0.016,
  air: 0.602,
};

type RawProfile = {
  id: string;
  email: string | null;
  full_name: string | null;
  company_name: string | null;
  role: string;
  subscription_tier: string | null;
};

type RawLoad = {
  id: string;
  shipper_id: string | null;
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

type RawCo2Record = {
  id: string;
  shipment_id: string;
  shipper_id: string;
  transport_mode: string;
  distance_km: number;
  weight_kg: number;
  co2_kg: number;
  offset_purchased: boolean;
  offset_kg: number;
  recorded_at: string;
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

export type ShipperProfile = {
  id: string;
  email: string | null;
  fullName: string | null;
  companyName: string | null;
  role: string;
  subscriptionTier: string | null;
};

export type ShipperLoad = {
  id: string;
  title: string;
  originAddress: string;
  destinationAddress: string;
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

export type ShipmentTrackingUpdate = {
  status: string;
  label: string;
  timestamp: string;
  location: string | null;
};

export type ShipperShipment = {
  id: string;
  loadId: string;
  loadTitle: string;
  routeLabel: string;
  carrierId: string;
  carrierName: string;
  agreedPriceUsd: number | null;
  transportMode: string;
  co2Kg: number | null;
  distanceKm: number | null;
  status: string;
  estimatedDelivery: string | null;
  actualDelivery: string | null;
  createdAt: string;
  trackingUpdates: ShipmentTrackingUpdate[];
};

export type ShipperDashboardRecommendation = {
  carrierId: string;
  carrierName: string;
  matchedLoadId: string;
  matchedLoadTitle: string;
  routeLabel: string;
  serviceModes: string[];
  rating: number;
  verified: boolean;
  greenScore: string;
  estimatedSavingsKg: number | null;
};

export type ShipperDashboardData = {
  profile: ShipperProfile;
  metrics: {
    totalLoads: number;
    activeLoads: number;
    activeShipments: number;
    deliveredLoads: number;
    totalCo2Kg: number;
    totalOffsetKg: number;
    averageMatchRate: number;
  };
  recentLoads: ShipperLoad[];
  recentShipments: ShipperShipment[];
  recommendations: ShipperDashboardRecommendation[];
};

export type ShipperLoadDetail = {
  profile: ShipperProfile;
  load: ShipperLoad;
  shipment: ShipperShipment | null;
  modalComparison: RawModalComparison | null;
};

export type ShipperSustainabilityData = {
  profile: ShipperProfile;
  totals: {
    totalCo2Kg: number;
    totalOffsetKg: number;
    shipmentsMeasured: number;
    greenerShipments: number;
    baselineSavingsKg: number;
  };
  modalSplit: Array<{ mode: string; shipments: number; co2Kg: number }>;
  monthlyFootprint: Array<{ month: string; co2Kg: number; offsetKg: number }>;
  recentRecords: Array<{
    id: string;
    loadTitle: string;
    mode: string;
    co2Kg: number;
    offsetKg: number;
    recordedAt: string;
  }>;
};

export type ShipperReportsData = {
  profile: ShipperProfile;
  summary: {
    totalReports: number;
    deliveredShipments: number;
    activeShipments: number;
    totalCo2Kg: number;
    totalOffsetKg: number;
  };
  monthlyReports: Array<{
    month: string;
    totalShipments: number;
    deliveredShipments: number;
    totalCo2Kg: number;
    totalOffsetKg: number;
  }>;
  shipmentReports: Array<{
    shipmentId: string;
    loadTitle: string;
    carrierName: string;
    status: string;
    co2Kg: number | null;
    offsetKg: number;
    transportMode: string;
    reportedAt: string;
  }>;
};

export type CreateShipperLoadInput = {
  title: string;
  originAddress: string;
  destinationAddress: string;
  preferredMode?: string | null;
  weightKg?: number | null;
  volumeM3?: number | null;
  freightType?: string | null;
  pickupDate?: string | null;
  deliveryDate?: string | null;
  budgetUsd?: number | null;
};

export type ShipperContext =
  | { ok: true; userId: string; profile: ShipperProfile }
  | { ok: false; status: number; code: string; message: string };

function mapProfile(profile: RawProfile): ShipperProfile {
  return {
    id: profile.id,
    email: profile.email,
    fullName: profile.full_name,
    companyName: profile.company_name,
    role: profile.role,
    subscriptionTier: profile.subscription_tier,
  };
}

function mapLoad(load: RawLoad): ShipperLoad {
  return {
    id: load.id,
    title: load.title,
    originAddress: load.origin_address,
    destinationAddress: load.destination_address,
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

function parseTrackingUpdates(value: unknown): ShipmentTrackingUpdate[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const record = item as Record<string, unknown>;
      const timestamp = typeof record.timestamp === "string" ? record.timestamp : "";

      return {
        status: typeof record.status === "string" ? record.status : "matched",
        label: typeof record.label === "string" ? record.label : "Status updated",
        timestamp,
        location: typeof record.location === "string" ? record.location : null,
      };
    })
    .filter((item): item is ShipmentTrackingUpdate => item !== null)
    .sort((left, right) => left.timestamp.localeCompare(right.timestamp));
}

function monthLabel(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatGreenScore(rating: number) {
  if (rating >= 4.8) return "A+";
  if (rating >= 4.5) return "A";
  if (rating >= 4.2) return "B+";
  return "B";
}

function round(value: number) {
  return Math.round(value * 10) / 10;
}

function getModalCo2Value(comparison: RawModalComparison | null, mode: string) {
  if (!comparison) {
    return null;
  }

  switch (mode) {
    case "rail":
      return comparison.rail_co2;
    case "sea":
      return comparison.sea_co2;
    case "air":
      return comparison.air_co2;
    default:
      return comparison.truck_co2;
  }
}

function buildApproximateModalComparison(weightKg: number | null, preferredMode: string) {
  if (!weightKg || !Number.isFinite(weightKg) || weightKg <= 0) {
    return null;
  }

  const estimatedDistanceKm = 250;
  const weightTonnes = weightKg / 1000;

  return MODE_ORDER.reduce<Record<string, number>>((acc, mode) => {
    acc[mode] = round(estimatedDistanceKm * weightTonnes * EMISSION_FACTORS[mode]);
    return acc;
  }, { truck: 0, rail: 0, sea: 0, air: 0, [preferredMode]: 0 });
}

export async function getShipperContext(supabase: SupabaseServerClient): Promise<ShipperContext> {
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

  if (!ALLOWED_SHIPPER_ROLES.has(profile.role)) {
    return {
      ok: false,
      status: 403,
      code: "FORBIDDEN",
      message: "Shipper access is required.",
    };
  }

  return {
    ok: true,
    userId: user.id,
    profile: mapProfile(profile),
  };
}

export async function listShipperLoads(
  supabase: SupabaseServerClient,
  shipperId: string,
  limit = 50
): Promise<ShipperLoad[]> {
  const { data } = await supabase
    .from("loads")
    .select(
      "id,shipper_id,title,origin_address,destination_address,pickup_date,delivery_date,budget_usd,status,co2_score,preferred_mode,weight_kg,volume_m3,freight_type,created_at"
    )
    .eq("shipper_id", shipperId)
    .order("created_at", { ascending: false })
    .limit(limit)
    .returns<RawLoad[]>();

  return (data ?? []).map(mapLoad);
}

export async function listShipperShipments(
  supabase: SupabaseServerClient,
  shipperId: string,
  limit = 50
): Promise<ShipperShipment[]> {
  const loads = await listShipperLoads(supabase, shipperId, 100);
  const loadIds = loads.map((load) => load.id);

  if (loadIds.length === 0) {
    return [];
  }

  const { data: shipments } = await supabase
    .from("shipments")
    .select(
      "id,load_id,carrier_id,agreed_price_usd,transport_mode,co2_kg,distance_km,status,tracking_updates,estimated_delivery,actual_delivery,created_at"
    )
    .in("load_id", loadIds)
    .order("created_at", { ascending: false })
    .limit(limit)
    .returns<RawShipment[]>();

  const carrierIds = Array.from(new Set((shipments ?? []).map((shipment) => shipment.carrier_id)));
  const { data: carriers } = carrierIds.length
    ? await supabase
        .from("carriers")
        .select("id,owner_id,company_name,fleet_size,service_modes,coverage_corridors,rating,total_deliveries,verified,created_at")
        .in("id", carrierIds)
        .returns<RawCarrier[]>()
    : { data: [] as RawCarrier[] };

  const loadMap = new Map(loads.map((load) => [load.id, load]));
  const carrierMap = new Map((carriers ?? []).map((carrier) => [carrier.id, carrier]));

  return (shipments ?? []).map((shipment) => {
    const load = loadMap.get(shipment.load_id);
    const carrier = carrierMap.get(shipment.carrier_id);

    return {
      id: shipment.id,
      loadId: shipment.load_id,
      loadTitle: load?.title ?? "Shipment",
      routeLabel: load ? `${load.originAddress} -> ${load.destinationAddress}` : "Route unavailable",
      carrierId: shipment.carrier_id,
      carrierName: carrier?.company_name ?? "Assigned carrier",
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
  });
}

export async function getShipperDashboardData(
  supabase: SupabaseServerClient,
  profile: ShipperProfile
): Promise<ShipperDashboardData> {
  const [loads, shipments, co2Records, carriers] = await Promise.all([
    listShipperLoads(supabase, profile.id, 8),
    listShipperShipments(supabase, profile.id, 5),
    supabase
      .from("co2_records")
      .select("id,shipment_id,shipper_id,transport_mode,distance_km,weight_kg,co2_kg,offset_purchased,offset_kg,recorded_at")
      .eq("shipper_id", profile.id)
      .order("recorded_at", { ascending: false })
      .returns<RawCo2Record[]>(),
    supabase
      .from("carriers")
      .select("id,owner_id,company_name,fleet_size,service_modes,coverage_corridors,rating,total_deliveries,verified,created_at")
      .eq("verified", true)
      .order("rating", { ascending: false })
      .limit(6)
      .returns<RawCarrier[]>(),
  ]);

  const loadIds = loads.map((load) => load.id);
  const { data: comparisons } = loadIds.length
    ? await supabase
        .from("modal_comparisons")
        .select(
          "id,load_id,truck_co2,rail_co2,sea_co2,air_co2,truck_cost,rail_cost,sea_cost,air_cost,truck_days,rail_days,sea_days,air_days,created_at"
        )
        .in("load_id", loadIds)
        .returns<RawModalComparison[]>()
    : { data: [] as RawModalComparison[] };

  const comparisonMap = new Map((comparisons ?? []).map((comparison) => [comparison.load_id, comparison]));
  const activeLoads = loads.filter((load) => ACTIVE_LOAD_STATUSES.has(load.status)).length;
  const deliveredLoads = loads.filter((load) => load.status === "delivered").length;
  const activeShipments = shipments.filter((shipment) => ACTIVE_SHIPMENT_STATUSES.has(shipment.status)).length;
  const totalCo2Kg = round((co2Records.data ?? []).reduce((sum, record) => sum + record.co2_kg, 0));
  const totalOffsetKg = round((co2Records.data ?? []).reduce((sum, record) => sum + record.offset_kg, 0));
  const averageMatchRate = loads.length > 0 ? Math.round((shipments.length / loads.length) * 100) : 0;

  const recommendations = loads
    .filter((load) => load.status === "open")
    .slice(0, 3)
    .flatMap((load) => {
      const comparison = comparisonMap.get(load.id) ?? null;

      return (carriers.data ?? [])
        .filter((carrier) => (carrier.service_modes ?? []).includes(load.preferredMode))
        .slice(0, 1)
        .map<ShipperDashboardRecommendation>((carrier) => {
          const savingsTarget =
            getModalCo2Value(comparison, "truck") != null && load.preferredMode !== "truck"
              ? round((getModalCo2Value(comparison, "truck") ?? 0) - (getModalCo2Value(comparison, load.preferredMode) ?? 0))
              : null;

          return {
            carrierId: carrier.id,
            carrierName: carrier.company_name,
            matchedLoadId: load.id,
            matchedLoadTitle: load.title,
            routeLabel: `${load.originAddress} -> ${load.destinationAddress}`,
            serviceModes: carrier.service_modes ?? [],
            rating: carrier.rating,
            verified: carrier.verified,
            greenScore: formatGreenScore(carrier.rating),
            estimatedSavingsKg: savingsTarget,
          };
        });
    });

  return {
    profile,
    metrics: {
      totalLoads: loads.length,
      activeLoads,
      activeShipments,
      deliveredLoads,
      totalCo2Kg,
      totalOffsetKg,
      averageMatchRate,
    },
    recentLoads: loads,
    recentShipments: shipments,
    recommendations,
  };
}

export async function getShipperLoadDetail(
  supabase: SupabaseServerClient,
  profile: ShipperProfile,
  loadId: string
): Promise<ShipperLoadDetail | null> {
  const { data: load } = await supabase
    .from("loads")
    .select(
      "id,shipper_id,title,origin_address,destination_address,pickup_date,delivery_date,budget_usd,status,co2_score,preferred_mode,weight_kg,volume_m3,freight_type,created_at"
    )
    .eq("shipper_id", profile.id)
    .eq("id", loadId)
    .maybeSingle<RawLoad>();

  if (!load) {
    return null;
  }

  const [shipments, comparison] = await Promise.all([
    listShipperShipments(supabase, profile.id, 50),
    supabase
      .from("modal_comparisons")
      .select(
        "id,load_id,truck_co2,rail_co2,sea_co2,air_co2,truck_cost,rail_cost,sea_cost,air_cost,truck_days,rail_days,sea_days,air_days,created_at"
      )
      .eq("load_id", loadId)
      .maybeSingle<RawModalComparison>(),
  ]);

  return {
    profile,
    load: mapLoad(load),
    shipment: shipments.find((shipment) => shipment.loadId === loadId) ?? null,
    modalComparison: comparison.data ?? buildFallbackComparison(load),
  };
}

function buildFallbackComparison(load: RawLoad): RawModalComparison | null {
  const approx = buildApproximateModalComparison(load.weight_kg, load.preferred_mode ?? "truck");
  if (!approx) {
    return null;
  }

  return {
    id: `generated-${load.id}`,
    load_id: load.id,
    truck_co2: approx.truck,
    rail_co2: approx.rail,
    sea_co2: approx.sea,
    air_co2: approx.air,
    truck_cost: load.budget_usd,
    rail_cost: load.budget_usd ? round(load.budget_usd * 0.94) : null,
    sea_cost: load.budget_usd ? round(load.budget_usd * 0.89) : null,
    air_cost: load.budget_usd ? round(load.budget_usd * 1.7) : null,
    truck_days: 2.2,
    rail_days: 3.1,
    sea_days: 4.8,
    air_days: 0.8,
    created_at: load.created_at,
  };
}

export async function getShipperSustainabilityData(
  supabase: SupabaseServerClient,
  profile: ShipperProfile
): Promise<ShipperSustainabilityData> {
  const [shipments, co2Records] = await Promise.all([
    listShipperShipments(supabase, profile.id, 100),
    supabase
      .from("co2_records")
      .select("id,shipment_id,shipper_id,transport_mode,distance_km,weight_kg,co2_kg,offset_purchased,offset_kg,recorded_at")
      .eq("shipper_id", profile.id)
      .order("recorded_at", { ascending: false })
      .returns<RawCo2Record[]>(),
  ]);

  const loadIds = shipments.map((shipment) => shipment.loadId);
  const { data: comparisons } = loadIds.length
    ? await supabase
        .from("modal_comparisons")
        .select(
          "id,load_id,truck_co2,rail_co2,sea_co2,air_co2,truck_cost,rail_cost,sea_cost,air_cost,truck_days,rail_days,sea_days,air_days,created_at"
        )
        .in("load_id", loadIds)
        .returns<RawModalComparison[]>()
    : { data: [] as RawModalComparison[] };

  const comparisonMap = new Map((comparisons ?? []).map((comparison) => [comparison.load_id, comparison]));
  const records = co2Records.data ?? [];
  const modalAccumulator = new Map<string, { mode: string; shipments: number; co2Kg: number }>();
  const monthlyAccumulator = new Map<string, { month: string; co2Kg: number; offsetKg: number }>();

  let baselineSavingsKg = 0;
  let greenerShipments = 0;

  for (const record of records) {
    const current = modalAccumulator.get(record.transport_mode) ?? {
      mode: record.transport_mode,
      shipments: 0,
      co2Kg: 0,
    };
    current.shipments += 1;
    current.co2Kg += record.co2_kg;
    modalAccumulator.set(record.transport_mode, current);

    const month = monthLabel(record.recorded_at);
    const monthly = monthlyAccumulator.get(month) ?? { month, co2Kg: 0, offsetKg: 0 };
    monthly.co2Kg += record.co2_kg;
    monthly.offsetKg += record.offset_kg;
    monthlyAccumulator.set(month, monthly);

    const shipment = shipments.find((item) => item.id === record.shipment_id);
    const comparison = shipment ? comparisonMap.get(shipment.loadId) : undefined;
    const baseline = comparison?.truck_co2;
    if (baseline != null && baseline > record.co2_kg) {
      greenerShipments += 1;
      baselineSavingsKg += baseline - record.co2_kg;
    }
  }

  return {
    profile,
    totals: {
      totalCo2Kg: round(records.reduce((sum, record) => sum + record.co2_kg, 0)),
      totalOffsetKg: round(records.reduce((sum, record) => sum + record.offset_kg, 0)),
      shipmentsMeasured: records.length,
      greenerShipments,
      baselineSavingsKg: round(baselineSavingsKg),
    },
    modalSplit: Array.from(modalAccumulator.values()).map((item) => ({
      mode: item.mode,
      shipments: item.shipments,
      co2Kg: round(item.co2Kg),
    })),
    monthlyFootprint: Array.from(monthlyAccumulator.values()),
    recentRecords: records.slice(0, 6).map((record) => {
      const shipment = shipments.find((item) => item.id === record.shipment_id);
      return {
        id: record.id,
        loadTitle: shipment?.loadTitle ?? "Shipment",
        mode: record.transport_mode,
        co2Kg: record.co2_kg,
        offsetKg: record.offset_kg,
        recordedAt: record.recorded_at,
      };
    }),
  };
}

export async function getShipperReportsData(
  supabase: SupabaseServerClient,
  profile: ShipperProfile
): Promise<ShipperReportsData> {
  const [shipments, co2Records] = await Promise.all([
    listShipperShipments(supabase, profile.id, 100),
    supabase
      .from("co2_records")
      .select("id,shipment_id,shipper_id,transport_mode,distance_km,weight_kg,co2_kg,offset_purchased,offset_kg,recorded_at")
      .eq("shipper_id", profile.id)
      .order("recorded_at", { ascending: false })
      .returns<RawCo2Record[]>(),
  ]);

  const monthlySummary = new Map<string, { month: string; totalShipments: number; deliveredShipments: number; totalCo2Kg: number; totalOffsetKg: number }>();
  const co2Map = new Map((co2Records.data ?? []).map((record) => [record.shipment_id, record]));

  for (const shipment of shipments) {
    const stamp = shipment.actualDelivery ?? shipment.estimatedDelivery ?? shipment.createdAt;
    const month = monthLabel(stamp);
    const summary = monthlySummary.get(month) ?? {
      month,
      totalShipments: 0,
      deliveredShipments: 0,
      totalCo2Kg: 0,
      totalOffsetKg: 0,
    };
    const co2Record = co2Map.get(shipment.id);

    summary.totalShipments += 1;
    if (shipment.status === "delivered") {
      summary.deliveredShipments += 1;
    }
    summary.totalCo2Kg += co2Record?.co2_kg ?? 0;
    summary.totalOffsetKg += co2Record?.offset_kg ?? 0;
    monthlySummary.set(month, summary);
  }

  return {
    profile,
    summary: {
      totalReports: monthlySummary.size,
      deliveredShipments: shipments.filter((shipment) => shipment.status === "delivered").length,
      activeShipments: shipments.filter((shipment) => ACTIVE_SHIPMENT_STATUSES.has(shipment.status)).length,
      totalCo2Kg: round((co2Records.data ?? []).reduce((sum, record) => sum + record.co2_kg, 0)),
      totalOffsetKg: round((co2Records.data ?? []).reduce((sum, record) => sum + record.offset_kg, 0)),
    },
    monthlyReports: Array.from(monthlySummary.values()),
    shipmentReports: shipments.map((shipment) => {
      const co2Record = co2Map.get(shipment.id);
      return {
        shipmentId: shipment.id,
        loadTitle: shipment.loadTitle,
        carrierName: shipment.carrierName,
        status: shipment.status,
        co2Kg: co2Record?.co2_kg ?? shipment.co2Kg,
        offsetKg: co2Record?.offset_kg ?? 0,
        transportMode: shipment.transportMode,
        reportedAt: co2Record?.recorded_at ?? shipment.createdAt,
      };
    }),
  };
}

export async function createShipperLoad(
  supabase: SupabaseServerClient,
  profile: ShipperProfile,
  input: CreateShipperLoadInput
) {
  const title = input.title.trim();
  const originAddress = input.originAddress.trim();
  const destinationAddress = input.destinationAddress.trim();
  const preferredMode =
    input.preferredMode && MODE_ORDER.includes(input.preferredMode as (typeof MODE_ORDER)[number])
      ? input.preferredMode
      : "truck";

  if (!title || !originAddress || !destinationAddress) {
    return {
      ok: false as const,
      status: 422,
      code: "VALIDATION_ERROR",
      message: "Title, origin address, and destination address are required.",
    };
  }

  const payload = {
    shipper_id: profile.id,
    title,
    origin_address: originAddress,
    origin_lat: 0,
    origin_lng: 0,
    destination_address: destinationAddress,
    destination_lat: 0,
    destination_lng: 0,
    weight_kg: input.weightKg ?? null,
    volume_m3: input.volumeM3 ?? null,
    freight_type: input.freightType?.trim() || null,
    pickup_date: input.pickupDate || null,
    delivery_date: input.deliveryDate || null,
    budget_usd: input.budgetUsd ?? null,
    status: "open",
    co2_score: null,
    preferred_mode: preferredMode,
  };

  const { data, error } = await supabase
    .from("loads")
    .insert(payload)
    .select(
      "id,shipper_id,title,origin_address,destination_address,pickup_date,delivery_date,budget_usd,status,co2_score,preferred_mode,weight_kg,volume_m3,freight_type,created_at"
    )
    .single<RawLoad>();

  if (error || !data) {
    return {
      ok: false as const,
      status: 500,
      code: "LOAD_CREATE_FAILED",
      message: "Unable to create load right now.",
    };
  }

  return {
    ok: true as const,
    load: mapLoad(data),
  };
}
