import { NextResponse } from "next/server";
import { getCarrierContext, getCarrierSettingsSnapshot, updateCarrierSettings } from "@/lib/carrier/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
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

  const data = await getCarrierSettingsSnapshot(supabase, context.profile, context.carrier);
  return NextResponse.json({ data });
}

export async function PATCH(request: Request) {
  const payload = (await request.json().catch(() => ({}))) as {
    fullName?: string;
    companyName?: string;
    fleetSize?: number;
    serviceModes?: string[];
    corridorsText?: string;
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

  const result = await updateCarrierSettings(supabase, context, {
    fullName: payload.fullName ?? "",
    companyName: payload.companyName ?? "",
    fleetSize: payload.fleetSize ?? 0,
    serviceModes: payload.serviceModes ?? [],
    corridorsText: payload.corridorsText ?? "",
  });

  if (!result.ok) {
    return NextResponse.json(
      {
        error: {
          code: result.code,
          message: result.message,
        },
      },
      { status: result.code === "FORBIDDEN" ? 403 : 400 }
    );
  }

  return NextResponse.json({ data: result.data });
}
