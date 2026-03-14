"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createShipperLoad, deleteShipperLoad, getShipperContext, updateShipperLoad } from "@/lib/shipper/server";

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

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/loads");
  revalidatePath(`/dashboard/loads/${result.load.id}`);
  redirect(`/dashboard/loads/${result.load.id}?created=1`);
}

export async function updateLoadAction(formData: FormData) {
  const supabase = await createClient();
  const context = await getShipperContext(supabase);

  if (!context.ok) {
    redirect(context.code === "FORBIDDEN" ? "/dashboard" : "/auth?mode=login&next=/dashboard/loads");
  }

  const loadId = String(formData.get("loadId") ?? "").trim();
  const sourcePath = String(formData.get("sourcePath") ?? `/dashboard/loads/${loadId}/edit`);
  const weightKgRaw = String(formData.get("weightKg") ?? "").trim();
  const volumeM3Raw = String(formData.get("volumeM3") ?? "").trim();
  const budgetUsdRaw = String(formData.get("budgetUsd") ?? "").trim();

  const result = await updateShipperLoad(supabase, context.profile, {
    loadId,
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
    const error =
      result.code === "VALIDATION_ERROR"
        ? "missing_fields"
        : result.code === "LOAD_NOT_FOUND"
          ? "not_found"
          : result.code === "LOAD_LOCKED"
            ? "locked"
            : "update_failed";
    redirect(`${sourcePath}?error=${error}`);
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/loads");
  revalidatePath(`/dashboard/loads/${loadId}`);
  revalidatePath(`/dashboard/loads/${loadId}/edit`);
  redirect(`/dashboard/loads/${loadId}?updated=1`);
}

export async function deleteLoadAction(formData: FormData) {
  const supabase = await createClient();
  const context = await getShipperContext(supabase);

  if (!context.ok) {
    redirect(context.code === "FORBIDDEN" ? "/dashboard" : "/auth?mode=login&next=/dashboard/loads");
  }

  const loadId = String(formData.get("loadId") ?? "").trim();
  const sourcePath = String(formData.get("sourcePath") ?? "/dashboard/loads");
  const result = await deleteShipperLoad(supabase, context.profile, loadId);

  if (!result.ok) {
    const error =
      result.code === "VALIDATION_ERROR"
        ? "invalid_id"
        : result.code === "LOAD_NOT_FOUND"
          ? "not_found"
          : result.code === "LOAD_LOCKED"
            ? "locked"
            : "delete_failed";
    redirect(`${sourcePath}?error=${error}`);
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/loads");
  revalidatePath(`/dashboard/loads/${loadId}`);
  revalidatePath(`/dashboard/loads/${loadId}/edit`);
  redirect("/dashboard/loads?deleted=1");
}
