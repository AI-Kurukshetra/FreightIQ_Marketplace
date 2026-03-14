import { NextResponse } from "next/server";
import { acceptCarrierLoad, getCarrierContext } from "@/lib/carrier/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request, { params }: { params: Promise<{ loadId: string }> }) {
  const { loadId } = await params;
  const payload = (await request.json().catch(() => ({}))) as { agreedPriceUsd?: number | null };

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

  const result = await acceptCarrierLoad(supabase, context, {
    loadId,
    agreedPriceUsd: payload.agreedPriceUsd ?? null,
  });

  if (!result.ok) {
    return NextResponse.json(
      {
        error: {
          code: result.code,
          message: result.message,
        },
      },
      { status: result.code === "NOT_FOUND" ? 404 : result.code === "FORBIDDEN" ? 403 : result.code === "CONFLICT" ? 409 : 400 }
    );
  }

  return NextResponse.json({ data: result.data }, { status: 201 });
}
