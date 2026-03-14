import { notFound, redirect } from "next/navigation";
import { DeliveryReceiptDownload } from "@/components/dashboard/delivery-receipt-download";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { RealtimeJourneyBoard } from "@/components/maps/realtime-journey-board";
import { SubmitButton } from "@/components/shared/submit-button";
import { getCarrierContext, getCarrierShipmentDetail } from "@/lib/carrier/server";
import { createClient } from "@/lib/supabase/server";
import { updateShipmentStatusAction } from "../actions";

type ShipmentDetailPageProps = {
  params: Promise<{ shipmentId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-black/15 p-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

export default async function ShipmentDetailPage({ params, searchParams }: ShipmentDetailPageProps) {
  const { shipmentId } = await params;
  const query = (await searchParams) ?? {};
  const accepted = firstParam(query.accepted);
  const updated = firstParam(query.updated);
  const receipt = firstParam(query.receipt);
  const error = firstParam(query.error);

  const supabase = await createClient();
  const context = await getCarrierContext(supabase);

  if (!context.ok) {
    redirect(context.code === "FORBIDDEN" ? "/dashboard" : `/auth?mode=login&next=/dashboard/shipments/${shipmentId}`);
  }

  const detail = await getCarrierShipmentDetail(supabase, context.profile, context.carrier, shipmentId);

  if (!detail) {
    notFound();
  }

  const shipment = detail.shipment;
  const shouldAutoDownloadReceipt = shipment.status === "delivered" && receipt === "1";

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold">{shipment.loadTitle}</h1>
            <StatusBadge status={shipment.status} />
          </div>
          <p className="mt-2 text-[var(--muted)]">{shipment.routeLabel}</p>
        </div>
      </div>

      {accepted ? (
        <div className="rounded-2xl border border-[var(--brand)]/20 bg-[var(--brand)]/10 px-5 py-4 text-sm text-[var(--foreground)]">
          Shipment created and assigned to your carrier.
        </div>
      ) : null}
      {updated ? (
        <div className="rounded-2xl border border-[var(--brand)]/20 bg-[var(--brand)]/10 px-5 py-4 text-sm text-[var(--foreground)]">
          Shipment timeline updated.
        </div>
      ) : null}
      {error ? (
        <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-5 py-4 text-sm text-red-100">
          Unable to update this shipment: {error.replaceAll("_", " ")}.
        </div>
      ) : null}
      {shipment.status === "delivered" ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--brand)]/20 bg-[var(--brand)]/10 px-5 py-4">
          <p className="text-sm text-[var(--foreground)]">Delivery confirmed. Download the receipt with barcode and shipment details.</p>
          <DeliveryReceiptDownload shipmentId={shipment.id} autoDownload={shouldAutoDownloadReceipt} />
        </div>
      ) : null}

      <RealtimeJourneyBoard
        title="Shipment Route Detail"
        description="Track the selected shipment route, progress, and milestone feed from one operational view."
        initialJourneys={[shipment]}
        refreshUrl="/api/carrier/shipments"
        emptyTitle="No shipment route is available yet"
        emptyBody="This shipment will appear on the route board when route geometry resolves."
        roleLabel="carrier"
      />

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="space-y-6">
          <div className="rounded-[28px] border border-[var(--brand)]/10 bg-slate-900/45 p-6">
            <h2 className="text-xl font-bold">Shipment metrics</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Metric label="Agreed Price" value={shipment.agreedPriceUsd != null ? `$${shipment.agreedPriceUsd}` : "TBD"} />
              <Metric label="Transport Mode" value={shipment.transportMode} />
              <Metric label="Distance" value={shipment.distanceKm != null ? `${shipment.distanceKm} km` : "Pending"} />
              <Metric label="CO2" value={shipment.co2Kg != null ? `${shipment.co2Kg} kg` : "Pending"} />
              <Metric
                label="Estimated Delivery"
                value={shipment.estimatedDelivery ? new Date(shipment.estimatedDelivery).toLocaleString() : "TBD"}
              />
              <Metric label="Origin" value={shipment.originAddress} />
              <Metric label="Destination" value={shipment.destinationAddress} />
              <Metric label="Created" value={new Date(shipment.createdAt).toLocaleString()} />
            </div>
          </div>

          <div className="rounded-[28px] border border-[var(--brand)]/10 bg-slate-900/45 p-6">
            <h2 className="text-xl font-bold">Operational timeline</h2>
            <div className="mt-5 space-y-4">
              {shipment.trackingUpdates.map((update) => (
                <div key={`${update.timestamp}-${update.status}`} className="flex gap-4 rounded-2xl border border-white/8 bg-black/10 p-4">
                  <div className="mt-1 h-3 w-3 rounded-full bg-[var(--brand)]" />
                  <div>
                    <p className="font-semibold text-white">{update.label}</p>
                    <p className="mt-1 text-sm text-slate-400">
                      {new Date(update.timestamp).toLocaleString()}
                      {update.location ? ` • ${update.location}` : ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <aside className="rounded-[28px] border border-[var(--brand)]/10 bg-[linear-gradient(180deg,rgba(15,31,15,0.92),rgba(8,14,10,0.92))] p-6">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--brand)]">Status control</p>
          <h2 className="mt-3 text-2xl font-bold text-white">Update dispatch state</h2>
          <p className="mt-2 text-sm text-slate-400">
            Push the next shipment milestone and feed both dashboards with a new tracking event.
          </p>

          {shipment.status === "delivered" ? (
            <div className="mt-6 rounded-2xl border border-white/8 bg-black/10 p-4 text-sm text-slate-300">
              <p>This shipment is already delivered. The dispatch workflow is complete.</p>
              <DeliveryReceiptDownload shipmentId={shipment.id} className="mt-3" />
            </div>
          ) : (
            <form action={updateShipmentStatusAction} className="mt-6 space-y-4">
              <input type="hidden" name="shipmentId" value={shipment.id} />
              <input type="hidden" name="sourcePath" value={`/dashboard/shipments/${shipment.id}`} />
              <label className="block space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Next Status</span>
                <select
                  name="status"
                  defaultValue={shipment.status === "matched" ? "picked_up" : shipment.status === "picked_up" ? "in_transit" : "delivered"}
                  className="w-full rounded-2xl border border-white/10 bg-black/15 px-4 py-3 text-sm text-white"
                >
                  {shipment.status === "matched" ? <option value="picked_up">Picked up</option> : null}
                  <option value="in_transit">In transit</option>
                  <option value="delivered">Delivered</option>
                </select>
              </label>
              <label className="block space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Current Location</span>
                <input
                  type="text"
                  name="location"
                  defaultValue={shipment.destinationAddress}
                  className="w-full rounded-2xl border border-white/10 bg-black/15 px-4 py-3 text-sm text-white"
                />
              </label>
              <label className="block space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Dispatch Note</span>
                <textarea
                  name="note"
                  rows={4}
                  placeholder="Reached hub, customs cleared, proof of delivery uploaded..."
                  className="w-full rounded-2xl border border-white/10 bg-black/15 px-4 py-3 text-sm text-white placeholder:text-slate-500"
                />
              </label>
              <SubmitButton
                idleLabel="Save Shipment Update"
                pendingLabel="Saving..."
                className="w-full rounded-2xl bg-[var(--brand)] px-5 py-3 text-sm font-bold text-[#112111] transition hover:bg-[var(--brand-strong)] disabled:cursor-not-allowed disabled:opacity-70"
              />
            </form>
          )}
        </aside>
      </div>
    </section>
  );
}
