import { NextResponse } from "next/server";
import { getCarrierContext, listCarrierMarketplaceLoads } from "@/lib/carrier/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const context = await getCarrierContext(supabase);

  if (!context.ok) {
    return NextResponse.json(
      {
        error: {
          code: context.code,
          message: context.message,
        },
      },
      { status: context.status }
    );
  }

  const { searchParams } = new URL(request.url);
  const minBudgetRaw = searchParams.get("minBudget");
  const data = await listCarrierMarketplaceLoads(supabase, context.carrier, 50, {
    search: searchParams.get("search"),
    mode: searchParams.get("mode"),
    freightType: searchParams.get("freightType"),
    pickupWindow: searchParams.get("pickupWindow"),
    minBudget: minBudgetRaw ? Number(minBudgetRaw) : null,
  });

  return NextResponse.json({ data });
}
