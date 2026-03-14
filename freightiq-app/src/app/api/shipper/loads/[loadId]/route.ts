import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { deleteShipperLoad, getShipperContext, getShipperLoadDetail, updateShipperLoad } from "@/lib/shipper/server";

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

export async function PATCH(
  request: Request,
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

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const result = await updateShipperLoad(supabase, context.profile, {
    loadId,
    title: String(body.title ?? ""),
    originAddress: String(body.originAddress ?? ""),
    destinationAddress: String(body.destinationAddress ?? ""),
    preferredMode: typeof body.preferredMode === "string" ? body.preferredMode : null,
    weightKg: typeof body.weightKg === "number" ? body.weightKg : null,
    volumeM3: typeof body.volumeM3 === "number" ? body.volumeM3 : null,
    freightType: typeof body.freightType === "string" ? body.freightType : null,
    pickupDate: typeof body.pickupDate === "string" ? body.pickupDate : null,
    deliveryDate: typeof body.deliveryDate === "string" ? body.deliveryDate : null,
    budgetUsd: typeof body.budgetUsd === "number" ? body.budgetUsd : null,
  });

  if (!result.ok) {
    return NextResponse.json(
      {
        error: {
          code: result.code,
          message: result.message,
        },
      },
      { status: result.status }
    );
  }

  return NextResponse.json({ data: result.load });
}

export async function DELETE(
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

  const result = await deleteShipperLoad(supabase, context.profile, loadId);

  if (!result.ok) {
    return NextResponse.json(
      {
        error: {
          code: result.code,
          message: result.message,
        },
      },
      { status: result.status }
    );
  }

  return NextResponse.json({ data: { loadId: result.loadId } });
}
