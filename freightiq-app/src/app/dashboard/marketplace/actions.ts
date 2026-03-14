"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { acceptCarrierLoad, getCarrierContext } from "@/lib/carrier/server";
import { createClient } from "@/lib/supabase/server";

export async function acceptLoadAction(formData: FormData) {
  const loadId = String(formData.get("loadId") ?? "");
  const agreedPriceRaw = String(formData.get("agreedPriceUsd") ?? "").trim();
  const sourcePath = String(formData.get("sourcePath") ?? "/dashboard/marketplace");

  const supabase = await createClient();
  const context = await getCarrierContext(supabase);

  if (!context.ok) {
    redirect(context.code === "FORBIDDEN" ? "/dashboard" : "/auth?mode=login&next=/dashboard/marketplace");
  }

  const result = await acceptCarrierLoad(supabase, context, {
    loadId,
    agreedPriceUsd: agreedPriceRaw ? Number(agreedPriceRaw) : null,
  });

  if (!result.ok) {
    const target = sourcePath.startsWith("/dashboard/marketplace/") ? sourcePath : `/dashboard/marketplace/${loadId}`;
    redirect(`${target}?error=${result.code.toLowerCase()}`);
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/marketplace");
  revalidatePath("/dashboard/shipments");
  redirect(`/dashboard/shipments/${result.data.shipmentId}?accepted=1`);
}
