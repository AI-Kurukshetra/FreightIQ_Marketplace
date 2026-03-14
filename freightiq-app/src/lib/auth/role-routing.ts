type RawRoleProfile = {
  role: string | null;
};

const CARRIER_ALLOWED_PREFIXES = ["/dashboard/marketplace", "/dashboard/shipments", "/dashboard/settings"];
const SHIPPER_ONLY_PREFIXES = ["/dashboard/loads", "/dashboard/tracking", "/dashboard/sustainability", "/dashboard/reports"];

export function safeNextPath(next: string | null | undefined): string {
  if (!next) {
    return "/dashboard";
  }

  if (!next.startsWith("/") || next.startsWith("//")) {
    return "/dashboard";
  }

  return next;
}

export function isShipperRole(role: string | null | undefined): boolean {
  return role === "shipper" || role === "admin";
}

export function isCarrierRole(role: string | null | undefined): boolean {
  return role === "carrier";
}

export async function getProfileRole(
  supabase: { from: (table: "profiles") => any },
  userId: string
): Promise<string | null> {
  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  const profile = data as RawRoleProfile | null;
  return typeof profile?.role === "string" ? profile.role : null;
}

export function resolveDashboardPathForRole(
  role: string | null | undefined,
  requestedPath: string | null | undefined
): string {
  const nextPath = safeNextPath(requestedPath);

  if (isCarrierRole(role)) {
    if (
      nextPath === "/dashboard" ||
      CARRIER_ALLOWED_PREFIXES.some((prefix) => nextPath === prefix || nextPath.startsWith(`${prefix}/`))
    ) {
      return nextPath;
    }

    return "/dashboard";
  }

  if (isShipperRole(role)) {
    if (SHIPPER_ONLY_PREFIXES.some((prefix) => nextPath === prefix || nextPath.startsWith(`${prefix}/`))) {
      return nextPath;
    }

    if (nextPath === "/dashboard" || nextPath.startsWith("/dashboard/settings")) {
      return nextPath;
    }

    return "/dashboard";
  }

  return "/dashboard";
}
