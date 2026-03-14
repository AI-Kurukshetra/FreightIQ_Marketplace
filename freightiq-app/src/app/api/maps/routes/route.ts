import { NextResponse } from "next/server";
import { buildJourneyRoute } from "@/lib/maps/service";
import type { MapJourneyFeedItem } from "@/lib/maps/types";

type RoutesRequestBody = {
  journeys?: MapJourneyFeedItem[];
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as RoutesRequestBody | null;
  const journeys = Array.isArray(body?.journeys) ? body.journeys.slice(0, 8) : [];

  if (journeys.length === 0) {
    return NextResponse.json({ data: [] });
  }

  const data = await Promise.all(journeys.map((journey) => buildJourneyRoute(journey)));

  return NextResponse.json(
    { data },
    {
      headers: {
        "Cache-Control": "s-maxage=300, stale-while-revalidate=3600",
      },
    }
  );
}
