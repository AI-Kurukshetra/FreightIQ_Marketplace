import { NextResponse } from "next/server";
import { getCarrierContext, listCarrierShipments } from "@/lib/carrier/server";
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
  const data = await listCarrierShipments(supabase, context.carrier?.id ?? null, 50, {
    status: searchParams.get("status"),
    search: searchParams.get("search"),
  });
  return NextResponse.json({ data });
}
