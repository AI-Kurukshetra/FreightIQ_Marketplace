import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getShipperContext, getShipperDashboardData } from "@/lib/shipper/server";

export async function GET() {
  const supabase = await createClient();
  const context = await getShipperContext(supabase);

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

  const data = await getShipperDashboardData(supabase, context.profile);
  return NextResponse.json({ data });
}
