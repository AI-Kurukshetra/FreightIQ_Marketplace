import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createShipperLoad, getShipperContext, listShipperLoads } from "@/lib/shipper/server";

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

  const loads = await listShipperLoads(supabase, context.profile.id, 50);
  return NextResponse.json({ data: loads });
}

export async function POST(request: Request) {
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

  const body = (await request.json()) as Record<string, unknown>;
  const result = await createShipperLoad(supabase, context.profile, {
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

  return NextResponse.json({ data: result.load }, { status: 201 });
}
