import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getShipperContext, getShipperLoadDetail } from "@/lib/shipper/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ loadId: string }> }
) {
  const { loadId } = await params;
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

  const data = await getShipperLoadDetail(supabase, context.profile, loadId);

  if (!data) {
    return NextResponse.json(
      {
        error: {
          code: "LOAD_NOT_FOUND",
          message: "Load was not found.",
        },
      },
      { status: 404 }
    );
  }

  return NextResponse.json({ data });
}
