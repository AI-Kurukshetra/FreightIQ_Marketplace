"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { deleteCarrierRoute, getCarrierContext, postCarrierRoute } from "@/lib/carrier/server";
import { createClient } from "@/lib/supabase/server";

function normalizeSourcePath(path: string) {
  return path.startsWith("/dashboard") ? path : "/dashboard";
}

export async function postCarrierRouteAction(formData: FormData) {
  const sourcePath = normalizeSourcePath(String(formData.get("sourcePath") ?? "/dashboard"));
  const origin = String(formData.get("origin") ?? "");
  const destination = String(formData.get("destination") ?? "");
  const radiusRaw = String(formData.get("radiusKm") ?? "").trim();
  const radiusKm = radiusRaw ? Number(radiusRaw) : null;

  const supabase = await createClient();
  const context = await getCarrierContext(supabase);

  if (!context.ok) {
    redirect(context.code === "FORBIDDEN" ? "/dashboard" : "/auth?mode=login&next=/dashboard");
  }

  const result = await postCarrierRoute(supabase, context, {
    origin,
    destination,
    radiusKm,
  });

  if (!result.ok) {
    redirect(`${sourcePath}?route_error=${result.code.toLowerCase()}`);
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/marketplace");
  redirect(`${sourcePath}?route_posted=1`);
}

export async function removeCarrierRouteAction(formData: FormData) {
  const sourcePath = normalizeSourcePath(String(formData.get("sourcePath") ?? "/dashboard"));
  const origin = String(formData.get("origin") ?? "");
  const destination = String(formData.get("destination") ?? "");

  const supabase = await createClient();
  const context = await getCarrierContext(supabase);

  if (!context.ok) {
    redirect(context.code === "FORBIDDEN" ? "/dashboard" : "/auth?mode=login&next=/dashboard");
  }

  const result = await deleteCarrierRoute(supabase, context, {
    origin,
    destination,
  });

  if (!result.ok) {
    redirect(`${sourcePath}?route_error=${result.code.toLowerCase()}`);
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/marketplace");
  redirect(`${sourcePath}?route_removed=1`);
}
