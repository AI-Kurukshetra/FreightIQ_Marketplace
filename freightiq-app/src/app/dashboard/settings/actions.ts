"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCarrierContext, updateCarrierSettings } from "@/lib/carrier/server";
import { createClient } from "@/lib/supabase/server";

export async function updateCarrierSettingsAction(formData: FormData) {
  const supabase = await createClient();
  const context = await getCarrierContext(supabase);

  if (!context.ok) {
    redirect(context.code === "FORBIDDEN" ? "/dashboard" : "/auth?mode=login&next=/dashboard/settings");
  }

  const serviceModes = formData.getAll("serviceModes").map((value) => String(value));
  const fleetSizeRaw = String(formData.get("fleetSize") ?? "").trim();

  const result = await updateCarrierSettings(supabase, context, {
    fullName: String(formData.get("fullName") ?? ""),
    companyName: String(formData.get("companyName") ?? ""),
    fleetSize: fleetSizeRaw ? Number(fleetSizeRaw) : 0,
    serviceModes,
    corridorsText: String(formData.get("corridorsText") ?? ""),
  });

  if (!result.ok) {
    redirect(`/dashboard/settings?error=${result.code.toLowerCase()}`);
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/marketplace");
  redirect("/dashboard/settings?saved=1");
}
