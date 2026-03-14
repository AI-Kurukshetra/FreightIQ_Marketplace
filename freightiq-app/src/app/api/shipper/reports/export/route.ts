import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getShipperContext, getShipperReportsData } from "@/lib/shipper/server";

function escapeCsv(value: string | number | null | undefined) {
  const text = value == null ? "" : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

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

  const reports = await getShipperReportsData(supabase, context.profile);
  const header = [
    "shipment_id",
    "load_title",
    "carrier_name",
    "status",
    "co2_kg",
    "offset_kg",
    "transport_mode",
    "reported_at",
  ];
  const rows = reports.shipmentReports.map((report) =>
    [
      report.shipmentId,
      report.loadTitle,
      report.carrierName,
      report.status,
      report.co2Kg ?? "",
      report.offsetKg,
      report.transportMode,
      report.reportedAt,
    ]
      .map(escapeCsv)
      .join(",")
  );

  const csv = [header.map(escapeCsv).join(","), ...rows].join("\n");
  const fileDate = new Date().toISOString().slice(0, 10);

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="shipper-reports-${fileDate}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
