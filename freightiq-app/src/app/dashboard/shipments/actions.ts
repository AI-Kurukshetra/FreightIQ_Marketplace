"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCarrierContext, updateCarrierShipmentStatus } from "@/lib/carrier/server";
import { createClient } from "@/lib/supabase/server";

export async function updateShipmentStatusAction(formData: FormData) {
  const shipmentId = String(formData.get("shipmentId") ?? "");
  const status = String(formData.get("status") ?? "");
  const location = String(formData.get("location") ?? "").trim() || null;
  const note = String(formData.get("note") ?? "").trim() || null;
  const sourcePath = String(formData.get("sourcePath") ?? "/dashboard/shipments");

  const supabase = await createClient();
  const context = await getCarrierContext(supabase);

  if (!context.ok) {
    redirect(context.code === "FORBIDDEN" ? "/dashboard" : "/auth?mode=login&next=/dashboard/shipments");
  }

  const result = await updateCarrierShipmentStatus(supabase, context, {
    shipmentId,
    status,
    location,
    note,
  });

  const baseTarget = sourcePath.startsWith("/dashboard/shipments/") ? sourcePath : `/dashboard/shipments/${shipmentId}`;

  if (!result.ok) {
    redirect(`${baseTarget}?error=${result.code.toLowerCase()}`);
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/shipments");
  revalidatePath(`/dashboard/shipments/${shipmentId}`);

  if (result.data.status === "delivered") {
    redirect(`${baseTarget}?updated=1&receipt=1`);
  }

  redirect(`${baseTarget}?updated=1`);
}
