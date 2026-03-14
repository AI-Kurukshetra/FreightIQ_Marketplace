"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createShipperLoad, getShipperContext } from "@/lib/shipper/server";

export async function createLoadAction(formData: FormData) {
  const supabase = await createClient();
  const context = await getShipperContext(supabase);

  if (!context.ok) {
    redirect(context.code === "FORBIDDEN" ? "/dashboard" : "/auth?mode=login&next=/dashboard/loads/new");
  }

  const weightKgRaw = String(formData.get("weightKg") ?? "").trim();
  const volumeM3Raw = String(formData.get("volumeM3") ?? "").trim();
  const budgetUsdRaw = String(formData.get("budgetUsd") ?? "").trim();

  const result = await createShipperLoad(supabase, context.profile, {
    title: String(formData.get("title") ?? ""),
    originAddress: String(formData.get("originAddress") ?? ""),
    destinationAddress: String(formData.get("destinationAddress") ?? ""),
    preferredMode: String(formData.get("preferredMode") ?? "truck"),
    weightKg: weightKgRaw ? Number(weightKgRaw) : null,
    volumeM3: volumeM3Raw ? Number(volumeM3Raw) : null,
    freightType: String(formData.get("freightType") ?? ""),
    pickupDate: String(formData.get("pickupDate") ?? ""),
    deliveryDate: String(formData.get("deliveryDate") ?? ""),
    budgetUsd: budgetUsdRaw ? Number(budgetUsdRaw) : null,
  });

  if (!result.ok) {
    const error = result.code === "VALIDATION_ERROR" ? "missing_fields" : "create_failed";
    redirect(`/dashboard/loads/new?error=${error}`);
  }

  redirect(`/dashboard/loads/${result.load.id}?created=1`);
}
