import { NextResponse } from "next/server";
import { getCarrierContext, getCarrierShipmentDetail, updateCarrierShipmentStatus } from "@/lib/carrier/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(_: Request, { params }: { params: Promise<{ shipmentId: string }> }) {
  const { shipmentId } = await params;
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

  const data = await getCarrierShipmentDetail(supabase, context.profile, context.carrier, shipmentId);
  if (!data) {
    return NextResponse.json(
      {
        error: {
          code: "NOT_FOUND",
          message: "Shipment was not found.",
        },
      },
      { status: 404 }
    );
  }

  return NextResponse.json({ data });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ shipmentId: string }> }) {
  const { shipmentId } = await params;
  const payload = (await request.json().catch(() => ({}))) as {
    status?: string;
    location?: string | null;
    note?: string | null;
  };

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

  const result = await updateCarrierShipmentStatus(supabase, context, {
    shipmentId,
    status: payload.status ?? "",
    location: payload.location ?? null,
    note: payload.note ?? null,
  });

  if (!result.ok) {
    return NextResponse.json(
      {
        error: {
          code: result.code,
          message: result.message,
        },
      },
      { status: result.code === "NOT_FOUND" ? 404 : result.code === "FORBIDDEN" ? 403 : 400 }
    );
  }

  return NextResponse.json({ data: result.data });
}
