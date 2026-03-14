import { redirect } from "next/navigation";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { getCarrierContext, listCarrierShipments } from "@/lib/carrier/server";
import { createClient } from "@/lib/supabase/server";

export default async function CarrierShipmentsPage() {
  const supabase = await createClient();
  const context = await getCarrierContext(supabase);

  if (!context.ok) {
    redirect(context.code === "FORBIDDEN" ? "/dashboard" : "/auth?mode=login&next=/dashboard/shipments");
  }

  const shipments = await listCarrierShipments(supabase, context.carrier?.id ?? null, 50);

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Assigned Shipments</h1>
        <p className="mt-2 text-[var(--muted)]">
          Monitor the loads already assigned to your carrier and review the latest tracking timeline.
        </p>
      </div>

      <div className="space-y-5">
        {shipments.length > 0 ? (
          shipments.map((shipment) => (
            <article key={shipment.id} className="rounded-2xl border border-[var(--brand)]/10 bg-slate-800/40 p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold">{shipment.loadTitle}</h2>
                  <p className="text-sm text-slate-400">{shipment.routeLabel}</p>
                  <p className="mt-1 text-xs uppercase tracking-wider text-slate-500">
                    {shipment.transportMode} • {shipment.distanceKm != null ? `${shipment.distanceKm} km` : "Distance pending"}
                  </p>
                </div>
                <StatusBadge status={shipment.status} />
              </div>

              <div className="mt-5 grid gap-5 md:grid-cols-3">
                <InfoCard label="Agreed Price" value={shipment.agreedPriceUsd != null ? `$${shipment.agreedPriceUsd}` : "TBD"} />
                <InfoCard
                  label="Estimated Delivery"
                  value={shipment.estimatedDelivery ? new Date(shipment.estimatedDelivery).toLocaleString() : "TBD"}
                />
                <InfoCard label="CO2" value={shipment.co2Kg != null ? `${shipment.co2Kg} kg` : "Pending"} />
              </div>

              <div className="mt-6">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Timeline</p>
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
            No shipments are assigned to this carrier yet.
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
