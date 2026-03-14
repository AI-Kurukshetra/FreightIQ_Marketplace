import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { RealtimeJourneyBoard } from "@/components/maps/realtime-journey-board";
import { createClient } from "@/lib/supabase/server";
import { getShipperContext, getShipperShipmentDetail } from "@/lib/shipper/server";

export default async function ShipperShipmentDetailPage({
  params,
}: {
  params: Promise<{ shipmentId: string }>;
}) {
  const { shipmentId } = await params;
  const supabase = await createClient();
  const context = await getShipperContext(supabase);

  if (!context.ok) {
    redirect(context.code === "FORBIDDEN" ? "/dashboard" : "/auth?mode=login&next=/dashboard/tracking");
  }

  const detail = await getShipperShipmentDetail(supabase, context.profile, shipmentId);

  if (!detail) {
    notFound();
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--brand)]">Shipment Detail</p>
          <h1 className="mt-2 text-3xl font-bold">{detail.shipment.loadTitle}</h1>
          <p className="mt-2 text-slate-400">{detail.shipment.routeLabel}</p>
        </div>

        <div className="flex items-center gap-3">
          <StatusBadge status={detail.shipment.status} />
          <Link
            href="/dashboard/tracking"
            className="rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-300 hover:text-white"
          >
            Back to tracking
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <InfoCard label="Carrier" value={detail.shipment.carrierName} />
        <InfoCard label="Mode" value={detail.shipment.transportMode.replaceAll("_", " ")} />
        <InfoCard
          label="Agreed Price"
          value={detail.shipment.agreedPriceUsd != null ? `$${detail.shipment.agreedPriceUsd}` : "TBD"}
        />
        <InfoCard
          label="ETA"
          value={detail.shipment.estimatedDelivery ? new Date(detail.shipment.estimatedDelivery).toLocaleString() : "TBD"}
        />
      </div>

      <RealtimeJourneyBoard
        title="Shipment Route Canvas"
        description="Follow the current route path, mapped endpoints, and simulated live shipment position for this booking."
        initialJourneys={[detail.shipment]}
        refreshUrl="/api/shipper/shipments"
        emptyTitle="Shipment mapping is unavailable"
        emptyBody="Route geometry will render here once mapped coordinates are available for both endpoints."
        roleLabel="shipper"
      />

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-2xl border border-[var(--brand)]/10 bg-slate-800/40 p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold">Booking Snapshot</h2>
            <Link href={`/dashboard/loads/${detail.load.id}`} className="text-sm font-bold text-[var(--brand)] hover:underline">
              Open load
            </Link>
          </div>

          <div className="mt-5 space-y-4 text-sm text-slate-300">
            <DetailRow label="Load" value={detail.load.title} />
            <DetailRow label="Origin" value={detail.load.originAddress} />
            <DetailRow label="Destination" value={detail.load.destinationAddress} />
            <DetailRow label="Pickup date" value={detail.load.pickupDate ?? "Not scheduled"} />
            <DetailRow label="Delivery date" value={detail.load.deliveryDate ?? "Not scheduled"} />
            <DetailRow label="Distance" value={detail.shipment.distanceKm != null ? `${detail.shipment.distanceKm} km` : "TBD"} />
            <DetailRow label="CO2" value={detail.shipment.co2Kg != null ? `${detail.shipment.co2Kg} kg` : "Pending"} />
          </div>
        </section>

        <section className="rounded-2xl border border-[var(--brand)]/10 bg-slate-800/40 p-6">
          <h2 className="text-xl font-bold">Tracking Timeline</h2>

          <div className="mt-5 space-y-4">
            {detail.shipment.trackingUpdates.length > 0 ? (
              detail.shipment.trackingUpdates.map((update, index) => (
                <div key={`${detail.shipment.id}-${update.timestamp}-${index}`} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="mt-1 h-3 w-3 rounded-full bg-[var(--brand)]" />
                    {index < detail.shipment.trackingUpdates.length - 1 ? (
                      <div className="mt-2 h-full min-h-10 w-px bg-white/10" />
                    ) : null}
                  </div>
                  <div className="pb-3">
                    <p className="text-sm font-semibold text-white">{update.label}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.12em] text-slate-500">
                      {update.status.replaceAll("_", " ")}
                    </p>
                    <p className="mt-2 text-sm text-slate-300">{new Date(update.timestamp).toLocaleString()}</p>
                    {update.location ? <p className="text-sm text-slate-400">{update.location}</p> : null}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400">No tracking milestones have been recorded for this shipment yet.</p>
            )}
          </div>
        </section>
      </div>
    </section>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--brand)]/10 bg-slate-800/40 p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-lg font-bold capitalize text-white">{value}</p>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/5 pb-3 last:border-b-0 last:pb-0">
      <span className="text-slate-500">{label}</span>
      <span className="max-w-[60%] text-right text-white">{value}</span>
    </div>
  );
}
