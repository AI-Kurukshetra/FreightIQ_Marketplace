import Link from "next/link";
import { redirect } from "next/navigation";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { RealtimeJourneyBoard } from "@/components/maps/realtime-journey-board";
import { createClient } from "@/lib/supabase/server";
import { getShipperContext, listShipperShipments } from "@/lib/shipper/server";

export default async function TrackingPage() {
  const supabase = await createClient();
  const context = await getShipperContext(supabase);

  if (!context.ok) {
    redirect(context.code === "FORBIDDEN" ? "/dashboard" : "/auth?mode=login&next=/dashboard/tracking");
  }

  const shipments = await listShipperShipments(supabase, context.profile.id, 50);
  const activeShipments = shipments.filter((shipment) => ["matched", "picked_up", "in_transit"].includes(shipment.status)).length;
  const deliveredShipments = shipments.filter((shipment) => shipment.status === "delivered").length;
  const totalSpend = shipments.reduce((sum, shipment) => sum + (shipment.agreedPriceUsd ?? 0), 0);

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Active Shipments</h1>
        <p className="mt-2 text-[var(--muted)]">Review current shipment progress and latest carrier updates.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <InfoCard label="Tracked Shipments" value={shipments.length.toString()} />
        <InfoCard label="Active Movement" value={activeShipments.toString()} />
        <InfoCard label="Booked Spend" value={totalSpend > 0 ? `$${Math.round(totalSpend)}` : "TBD"} />
      </div>

      <RealtimeJourneyBoard
        title="Live Shipment Tracking"
        description="Route geometry, current shipment position, and timeline progress refresh automatically while your freight is in motion."
        initialJourneys={shipments.slice(0, 8)}
        refreshUrl="/api/shipper/shipments"
        emptyTitle="There are no carrier-assigned shipments to track"
        emptyBody="As soon as a shipment is matched, the route map will appear here with live progress from the latest status updates."
        roleLabel="shipper"
      />

      <div className="space-y-5">
        {shipments.length > 0 ? (
          shipments.map((shipment) => (
            <article key={shipment.id} className="rounded-2xl border border-[var(--brand)]/10 bg-slate-800/40 p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold">{shipment.loadTitle}</h2>
                  <p className="text-sm text-slate-400">{shipment.routeLabel}</p>
                  <p className="mt-1 text-xs uppercase tracking-wider text-slate-500">
                    {shipment.carrierName} • {shipment.transportMode}
                  </p>
                </div>
                <StatusBadge status={shipment.status} />
              </div>

              <div className="mt-5 grid gap-5 md:grid-cols-3">
                <InfoCard label="Agreed Price" value={shipment.agreedPriceUsd != null ? `$${shipment.agreedPriceUsd}` : "TBD"} />
                <InfoCard label="Distance" value={shipment.distanceKm != null ? `${shipment.distanceKm} km` : "TBD"} />
                <InfoCard
                  label="Estimated Delivery"
                  value={shipment.estimatedDelivery ? new Date(shipment.estimatedDelivery).toLocaleString() : "TBD"}
                />
              </div>

              <div className="mt-6">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Timeline</p>
                  <Link
                    href={`/dashboard/tracking/${shipment.id}`}
                    className="text-sm font-bold text-[var(--brand)] hover:underline"
                  >
                    Open detail
                  </Link>
                </div>
                <div className="mt-3 space-y-3">
                  {shipment.trackingUpdates.length > 0 ? (
                    shipment.trackingUpdates.map((update) => (
                      <div key={`${shipment.id}-${update.timestamp}-${update.status}`} className="flex gap-3">
                        <div className="mt-1 h-3 w-3 rounded-full bg-[var(--brand)]" />
                        <div>
                          <p className="text-sm font-semibold text-white">{update.label}</p>
                          <p className="text-xs text-slate-400">
                            {new Date(update.timestamp).toLocaleString()}
                            {update.location ? ` • ${update.location}` : ""}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-400">No tracking updates yet.</p>
                  )}
                </div>
              </div>
            </article>
          ))
        ) : (
          <div className="rounded-2xl border border-[var(--brand)]/10 bg-slate-800/40 p-10 text-center text-slate-400">
            {deliveredShipments > 0 ? "No active shipments right now." : "No shipments are linked to your loads yet."}
          </div>
        )}
      </div>
    </section>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-black/10 p-4">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}
