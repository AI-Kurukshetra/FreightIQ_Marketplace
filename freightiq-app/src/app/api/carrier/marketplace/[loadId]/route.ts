import { NextResponse } from "next/server";
import { getCarrierContext, getCarrierMarketplaceLoadDetail } from "@/lib/carrier/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(_: Request, { params }: { params: Promise<{ loadId: string }> }) {
  const { loadId } = await params;
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

  const data = await getCarrierMarketplaceLoadDetail(supabase, context.profile, context.carrier, loadId);

  if (!data) {
    return NextResponse.json(
      {
        error: {
          code: "NOT_FOUND",
          message: "Load was not found.",
        },
      },
      { status: 404 }
    );
  }

  return NextResponse.json({ data });
}
