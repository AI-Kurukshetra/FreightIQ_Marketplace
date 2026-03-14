import Link from "next/link";
import { redirect } from "next/navigation";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { RealtimeJourneyBoard } from "@/components/maps/realtime-journey-board";
import { SubmitButton } from "@/components/shared/submit-button";
import { getCarrierContext, listCarrierShipments } from "@/lib/carrier/server";
import { createClient } from "@/lib/supabase/server";
import { updateShipmentStatusAction } from "./actions";

type CarrierShipmentsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-black/10 p-4">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

export default async function CarrierShipmentsPage({ searchParams }: CarrierShipmentsPageProps) {
  const params = (await searchParams) ?? {};
  const status = firstParam(params.status) ?? "";
  const search = firstParam(params.search) ?? "";
  const updated = firstParam(params.updated);
  const error = firstParam(params.error);

  const supabase = await createClient();
  const context = await getCarrierContext(supabase);

  if (!context.ok) {
    redirect(context.code === "FORBIDDEN" ? "/dashboard" : "/auth?mode=login&next=/dashboard/shipments");
  }

  const shipments = await listCarrierShipments(supabase, context.carrier?.id ?? null, 50, {
    status,
    search,
  });

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Assigned Shipments</h1>
        <p className="mt-2 text-[var(--muted)]">
          Monitor active jobs, update field status, and keep the live map aligned with the latest dispatch checkpoints.
        </p>
      </div>

      {!context.carrier ? (
        <div className="rounded-2xl border border-amber-300/20 bg-amber-500/10 px-5 py-4 text-sm text-amber-100">
          No carrier profile is configured for this account yet.
          <Link href="/dashboard/settings" className="ml-2 font-semibold text-amber-50 underline underline-offset-4">
            Create Carrier Profile
          </Link>
        </div>
      ) : null}

      {updated ? (
        <div className="rounded-2xl border border-[var(--brand)]/20 bg-[var(--brand)]/10 px-5 py-4 text-sm text-[var(--foreground)]">
          Shipment status updated successfully.
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-5 py-4 text-sm text-red-100">
          Shipment update failed: {error.replaceAll("_", " ")}.
        </div>
      ) : null}

      <form className="grid gap-4 rounded-[28px] border border-[var(--brand)]/10 bg-slate-900/45 p-5 lg:grid-cols-[1fr_220px_220px_auto]">
        <label className="space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Search</span>
          <input
            type="text"
            name="search"
            defaultValue={search}
            placeholder="Load, route, or mode"
            className="w-full rounded-2xl border border-white/10 bg-black/15 px-4 py-3 text-sm text-white placeholder:text-slate-500"
          />
        </label>
        <label className="space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Status</span>
          <select
            name="status"
            defaultValue={status}
            className="w-full rounded-2xl border border-white/10 bg-black/15 px-4 py-3 text-sm text-white"
          >
            <option value="">All statuses</option>
            <option value="matched">Matched</option>
            <option value="picked_up">Picked up</option>
            <option value="in_transit">In transit</option>
            <option value="delivered">Delivered</option>
          </select>
        </label>
        <div className="hidden lg:block" />
        <button
          type="submit"
          className="self-end rounded-2xl bg-[var(--brand)] px-5 py-3 text-sm font-bold text-[#112111] transition hover:bg-[var(--brand-strong)]"
        >
          Filter
        </button>
      </form>

      <RealtimeJourneyBoard
        title="Dispatcher Map"
        description="Follow active carrier jobs on a live map and keep your dispatch team aligned with the freshest route milestones."
        initialJourneys={shipments}
        prioritizeActiveJourneys
        refreshUrl="/api/carrier/shipments"
        emptyTitle="No assigned carrier jobs are available to map"
        emptyBody="When a load is assigned to this carrier, it will appear here with a live route and position marker."
        roleLabel="carrier"
      />

      <div className="space-y-5">
        {shipments.length > 0 ? (
          shipments.map((shipment) => (
            <article key={shipment.id} className="rounded-[28px] border border-[var(--brand)]/10 bg-slate-800/40 p-6">
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

              <div className="mt-5 grid gap-5 md:grid-cols-4">
                <InfoCard label="Agreed Price" value={shipment.agreedPriceUsd != null ? `$${shipment.agreedPriceUsd}` : "TBD"} />
                <InfoCard
                  label="Estimated Delivery"
                  value={shipment.estimatedDelivery ? new Date(shipment.estimatedDelivery).toLocaleString() : "TBD"}
                />
                <InfoCard label="CO2" value={shipment.co2Kg != null ? `${shipment.co2Kg} kg` : "Pending"} />
                <InfoCard label="Last Update" value={shipment.trackingUpdates.at(-1)?.label ?? "Awaiting update"} />
              </div>

              <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                <div>
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

                <div className="rounded-[24px] border border-white/8 bg-black/10 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-400">Dispatch update</h3>
                    <Link href={`/dashboard/shipments/${shipment.id}`} className="text-xs font-bold text-[var(--brand)] hover:underline">
                      Open Detail
                    </Link>
                  </div>
                  {shipment.status === "delivered" ? (
                    <p className="mt-4 text-sm text-slate-400">This shipment is already delivered. Use the detail view for the full proof-of-delivery timeline.</p>
                  ) : (
                    <form action={updateShipmentStatusAction} className="mt-4 space-y-4">
                      <input type="hidden" name="shipmentId" value={shipment.id} />
                      <input type="hidden" name="sourcePath" value="/dashboard/shipments" />
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
                          rows={3}
                          placeholder="Reached checkpoint, unloading, proof of delivery..."
                          className="w-full rounded-2xl border border-white/10 bg-black/15 px-4 py-3 text-sm text-white placeholder:text-slate-500"
                        />
                      </label>
                      <SubmitButton
                        idleLabel="Update Shipment"
                        pendingLabel="Updating..."
                        className="w-full rounded-2xl bg-[var(--brand)] px-5 py-3 text-sm font-bold text-[#112111] transition hover:bg-[var(--brand-strong)] disabled:cursor-not-allowed disabled:opacity-70"
                      />
                    </form>
                  )}
                </div>
              </div>
            </article>
          ))
        ) : (
          <div className="rounded-2xl border border-[var(--brand)]/10 bg-slate-800/40 p-10 text-center text-slate-400">
            {context.carrier ? "No shipments are assigned to this carrier yet." : "Create a carrier profile to start receiving assigned shipments."}
          </div>
        )}
      </div>
    </section>
  );
}
