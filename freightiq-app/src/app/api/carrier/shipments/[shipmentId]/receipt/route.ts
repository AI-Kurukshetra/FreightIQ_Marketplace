import { NextResponse } from "next/server";
import { getCarrierContext, getCarrierShipmentDetail } from "@/lib/carrier/server";
import { renderCode39 } from "@/lib/receipt/code39";
import { createClient } from "@/lib/supabase/server";

const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;

function toPdfText(value: string) {
  return value
    .replaceAll("\\", "\\\\")
    .replaceAll("(", "\\(")
    .replaceAll(")", "\\)")
    .replace(/[\r\n]+/g, " ")
    .replace(/[^\x20-\x7E]/g, "?")
    .trim();
}

function clip(value: string, max: number) {
  return value.length > max ? `${value.slice(0, max - 3)}...` : value;
}

function yFromTop(top: number) {
  return PAGE_HEIGHT - top;
}

function rectY(top: number, height: number) {
  return PAGE_HEIGHT - top - height;
}

function fillRect(x: number, top: number, width: number, height: number, rgb: [number, number, number]) {
  const [r, g, b] = rgb;
  return `${r} ${g} ${b} rg\n${x} ${rectY(top, height)} ${width} ${height} re f`;
}

function strokeRect(x: number, top: number, width: number, height: number, rgb: [number, number, number], lineWidth = 1) {
  const [r, g, b] = rgb;
  return `${lineWidth} w\n${r} ${g} ${b} RG\n${x} ${rectY(top, height)} ${width} ${height} re S`;
}

function drawLine(x1: number, top: number, x2: number, rgb: [number, number, number], lineWidth = 1) {
  const [r, g, b] = rgb;
  const y = yFromTop(top);
  return `${lineWidth} w\n${r} ${g} ${b} RG\n${x1} ${y} m\n${x2} ${y} l S`;
}

function drawText(
  text: string,
  x: number,
  top: number,
  size: number,
  font: "F1" | "F2",
  rgb: [number, number, number]
) {
  const [r, g, b] = rgb;
  return `${r} ${g} ${b} rg\nBT\n/${font} ${size} Tf\n1 0 0 1 ${x} ${yFromTop(top)} Tm\n(${toPdfText(text)}) Tj\nET`;
}

function formatDateTime(value: string | null) {
  if (!value) {
    return "N/A";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "N/A";
  }

  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatCurrency(value: number | null) {
  if (value == null || !Number.isFinite(value)) {
    return "TBD";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatLabel(value: string) {
  return value.replaceAll("_", " ");
}

function buildPdf(content: string) {
  const streamLength = Buffer.byteLength(content, "utf8");
  const objects = [
    "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj",
    "2 0 obj\n<< /Type /Pages /Count 1 /Kids [3 0 R] >>\nendobj",
    `3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>
endobj`,
    "4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj",
    "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj",
    `6 0 obj
<< /Length ${streamLength} >>
stream
${content}
endstream
endobj`,
  ];

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [];

  for (const object of objects) {
    offsets.push(Buffer.byteLength(pdf, "utf8"));
    pdf += `${object}\n`;
  }

  const xrefOffset = Buffer.byteLength(pdf, "utf8");
  pdf += `xref
0 ${objects.length + 1}
0000000000 65535 f 
`;

  for (const offset of offsets) {
    pdf += `${String(offset).padStart(10, "0")} 00000 n 
`;
  }

  pdf += `trailer
<< /Size ${objects.length + 1} /Root 1 0 R >>
startxref
${xrefOffset}
%%EOF`;

  return Buffer.from(pdf, "utf8");
}

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

  const detail = await getCarrierShipmentDetail(supabase, context.profile, context.carrier, shipmentId);

  if (!detail) {
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

  if (detail.shipment.status !== "delivered") {
    return NextResponse.json(
      {
        error: {
          code: "CONFLICT",
          message: "Receipt is available only for delivered shipments.",
        },
      },
      { status: 409 }
    );
  }

  const shipment = detail.shipment;
  const receiptNumber = `FIQ-${shipment.id.slice(0, 8).toUpperCase()}`;
  const issuedAt = new Date().toISOString();
  const barcode = renderCode39(receiptNumber, {
    height: 48,
    narrowWidth: 1.5,
    wideWidth: 3.2,
    gapWidth: 1,
    quietZone: 12,
  });

  const summaryRows = [
    ["Receipt Number", receiptNumber],
    ["Shipment ID", shipment.id],
    ["Load ID", shipment.loadId],
    ["Load Title", shipment.loadTitle],
    ["Status", formatLabel(shipment.status)],
    ["Origin", shipment.originAddress],
    ["Destination", shipment.destinationAddress],
    ["Carrier", detail.carrier?.companyName ?? "N/A"],
    ["Operator", detail.profile.fullName ?? detail.profile.email ?? "N/A"],
    ["Transport Mode", formatLabel(shipment.transportMode)],
    ["Agreed Price", formatCurrency(shipment.agreedPriceUsd)],
    ["Distance", shipment.distanceKm != null ? `${shipment.distanceKm} km` : "Pending"],
    ["CO2", shipment.co2Kg != null ? `${shipment.co2Kg} kg` : "Pending"],
    ["Estimated Delivery", formatDateTime(shipment.estimatedDelivery)],
    ["Actual Delivery", formatDateTime(shipment.actualDelivery)],
  ] as const;

  const timeline = shipment.trackingUpdates.slice(-4);
  const commands: string[] = [];

  commands.push(fillRect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, [0.97, 0.98, 0.99]));
  commands.push(fillRect(24, 24, PAGE_WIDTH - 48, PAGE_HEIGHT - 48, [1, 1, 1]));
  commands.push(strokeRect(24, 24, PAGE_WIDTH - 48, PAGE_HEIGHT - 48, [0.8, 0.85, 0.9], 1));
  commands.push(fillRect(24, 24, PAGE_WIDTH - 48, 96, [0.06, 0.09, 0.16]));
  commands.push(drawText("FreightIQ Delivery Receipt", 42, 62, 20, "F2", [0.91, 0.94, 0.97]));
  commands.push(drawText(`Generated on ${formatDateTime(issuedAt)}`, 42, 84, 10, "F1", [0.81, 0.86, 0.91]));
  commands.push(drawText("This receipt confirms successful shipment delivery.", 42, 100, 10, "F1", [0.81, 0.86, 0.91]));

  const barcodeBoxX = 350;
  const barcodeBoxTop = 42;
  const barcodeBoxW = 220;
  const barcodeBoxH = 74;
  const barcodeInnerX = barcodeBoxX + 10;
  const barcodeInnerTop = barcodeBoxTop + 8;
  const barcodeAreaW = barcodeBoxW - 20;
  const barcodeScale = Math.min(1, barcodeAreaW / barcode.width);

  commands.push(fillRect(barcodeBoxX, barcodeBoxTop, barcodeBoxW, barcodeBoxH, [0.97, 0.98, 0.99]));
  commands.push(strokeRect(barcodeBoxX, barcodeBoxTop, barcodeBoxW, barcodeBoxH, [0.85, 0.89, 0.93], 1));

  for (const bar of barcode.bars) {
    commands.push(fillRect(barcodeInnerX + bar.x * barcodeScale, barcodeInnerTop, bar.width * barcodeScale, barcode.height, [0.06, 0.09, 0.16]));
  }

  commands.push(drawText(receiptNumber, barcodeBoxX + 10, barcodeBoxTop + 64, 9, "F1", [0.2, 0.27, 0.36]));

  commands.push(drawText("Shipment Summary", 42, 146, 13, "F2", [0.06, 0.09, 0.16]));
  commands.push(drawLine(42, 154, 553, [0.89, 0.91, 0.94], 1));

  summaryRows.forEach(([label, value], index) => {
    const top = 174 + index * 20;
    commands.push(drawText(`${label}:`, 42, top, 10, "F1", [0.25, 0.29, 0.33]));
    commands.push(drawText(clip(value, 72), 180, top, 10, "F2", [0.06, 0.09, 0.16]));
  });

  commands.push(drawText("Recent Tracking Updates", 42, 506, 13, "F2", [0.06, 0.09, 0.16]));
  commands.push(drawLine(42, 514, 553, [0.89, 0.91, 0.94], 1));

  if (timeline.length === 0) {
    commands.push(drawText("No tracking updates available.", 42, 538, 10, "F1", [0.4, 0.46, 0.54]));
  } else {
    timeline.forEach((update, index) => {
      const rowTop = 538 + index * 48;
      const detailLine = `${formatDateTime(update.timestamp)}${update.location ? ` | ${update.location}` : ""}`;
      commands.push(drawText(`- ${clip(update.label, 76)}`, 42, rowTop, 10, "F2", [0.06, 0.09, 0.16]));
      commands.push(drawText(clip(detailLine, 84), 56, rowTop + 16, 9, "F1", [0.39, 0.45, 0.52]));
    });
  }

  commands.push(drawLine(42, 778, 553, [0.89, 0.91, 0.94], 1));
  commands.push(
    drawText(
      `Receipt ${receiptNumber} | FreightIQ system generated proof-of-delivery`,
      42,
      796,
      9,
      "F1",
      [0.39, 0.45, 0.52]
    )
  );

  const pdfBuffer = buildPdf(commands.join("\n"));

  return new NextResponse(pdfBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="shipment-receipt-${shipment.id.slice(0, 8)}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
