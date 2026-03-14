import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { SubmitButton } from "@/components/shared/submit-button";
import { getCarrierContext, getCarrierMarketplaceLoadDetail } from "@/lib/carrier/server";
import { createClient } from "@/lib/supabase/server";
import { acceptLoadAction } from "../actions";

type MarketplaceLoadDetailPageProps = {
  params: Promise<{ loadId: string }>;
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

export default async function MarketplaceLoadDetailPage({
  params,
  searchParams,
}: MarketplaceLoadDetailPageProps) {
  const { loadId } = await params;
  const query = (await searchParams) ?? {};
  const error = firstParam(query.error);

  const supabase = await createClient();
  const context = await getCarrierContext(supabase);

  if (!context.ok) {
    redirect(context.code === "FORBIDDEN" ? "/dashboard" : `/auth?mode=login&next=/dashboard/marketplace/${loadId}`);
  }

  const detail = await getCarrierMarketplaceLoadDetail(supabase, context.profile, context.carrier, loadId);

  if (!detail) {
    notFound();
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold">{detail.load.title}</h1>
            <StatusBadge status={detail.load.status} />
            <div className="rounded-full border border-[var(--brand)]/15 bg-[var(--brand)]/8 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--brand)]">
              {detail.load.fitLabel}
            </div>
          </div>
          <p className="mt-2 text-[var(--muted)]">{detail.load.routeLabel}</p>
          <p className="mt-2 text-xs uppercase tracking-[0.16em] text-slate-500">
            {detail.load.freightType ?? "general"} • preferred mode {detail.load.preferredMode} • score {detail.load.matchScore}
          </p>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-5 py-4 text-sm text-red-100">
          Unable to accept this load: {error.replaceAll("_", " ")}.
        </div>
      ) : null}

      {detail.activeShipment ? (
        <div className="rounded-2xl border border-[var(--brand)]/20 bg-[var(--brand)]/10 px-5 py-4 text-sm text-[var(--foreground)]">
          This load is already assigned to your carrier. Continue in the shipment module.
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <section className="rounded-[28px] border border-[var(--brand)]/10 bg-slate-900/45 p-6">
            <h2 className="text-xl font-bold">Load overview</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <Metric label="Budget" value={detail.load.budgetUsd != null ? `$${detail.load.budgetUsd}` : "TBD"} />
              <Metric label="Pickup Date" value={detail.load.pickupDate ?? "TBD"} />
              <Metric label="Delivery Date" value={detail.load.deliveryDate ?? "TBD"} />
              <Metric label="Weight" value={detail.load.weightKg != null ? `${detail.load.weightKg} kg` : "TBD"} />
              <Metric label="Volume" value={detail.load.volumeM3 != null ? `${detail.load.volumeM3} m3` : "TBD"} />
              <Metric
                label="Estimated Distance"
                value={detail.estimatedDistanceKm != null ? `${detail.estimatedDistanceKm} km` : "Pending"}
              />
            </div>
          </section>

          <section className="rounded-[28px] border border-[var(--brand)]/10 bg-slate-900/45 p-6">
            <h2 className="text-xl font-bold">Modal comparison</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Metric
                label="Truck"
                value={
                  detail.modalComparison?.truck_co2 != null
                    ? `${detail.modalComparison.truck_co2} kg • $${detail.modalComparison.truck_cost ?? "-"}`
                    : "Pending"
                }
              />
              <Metric
                label="Rail"
                value={
                  detail.modalComparison?.rail_co2 != null
                    ? `${detail.modalComparison.rail_co2} kg • $${detail.modalComparison.rail_cost ?? "-"}`
                    : "Pending"
                }
              />
              <Metric
                label="Sea"
                value={
                  detail.modalComparison?.sea_co2 != null
                    ? `${detail.modalComparison.sea_co2} kg • $${detail.modalComparison.sea_cost ?? "-"}`
                    : "Pending"
                }
              />
              <Metric
                label="Air"
                value={
                  detail.modalComparison?.air_co2 != null
                    ? `${detail.modalComparison.air_co2} kg • $${detail.modalComparison.air_cost ?? "-"}`
                    : "Pending"
                }
              />
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-[28px] border border-[var(--brand)]/10 bg-[linear-gradient(180deg,rgba(15,31,15,0.92),rgba(8,14,10,0.92))] p-6">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--brand)]">Carrier action</p>
            <h2 className="mt-3 text-2xl font-bold text-white">Convert this opportunity</h2>
            <p className="mt-2 text-sm text-slate-400">
              Submit your agreed shipment price and create the active shipment record for dispatch.
            </p>

            {detail.activeShipment ? (
              <Link
                href={`/dashboard/shipments/${detail.activeShipment.id}`}
                className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-[var(--brand)] px-5 py-3 text-sm font-bold text-[#112111] transition hover:bg-[var(--brand-strong)]"
              >
                Open Assigned Shipment
              </Link>
            ) : (
              <form action={acceptLoadAction} className="mt-6 space-y-4">
                <input type="hidden" name="loadId" value={detail.load.id} />
                <input type="hidden" name="sourcePath" value={`/dashboard/marketplace/${detail.load.id}`} />
                <label className="block space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Agreed Price</span>
                  <input
                    type="number"
                    name="agreedPriceUsd"
                    min="0"
                    step="10"
                    defaultValue={detail.suggestedPriceUsd ?? ""}
                    className="w-full rounded-2xl border border-white/10 bg-black/15 px-4 py-3 text-sm text-white"
                  />
                </label>
                <SubmitButton
                  idleLabel="Accept And Create Shipment"
                  pendingLabel="Creating Shipment..."
                  className="w-full rounded-2xl bg-[var(--brand)] px-5 py-3 text-sm font-bold text-[#112111] transition hover:bg-[var(--brand-strong)] disabled:cursor-not-allowed disabled:opacity-70"
                />
              </form>
            )}
          </section>

          <section className="rounded-[28px] border border-[var(--brand)]/10 bg-slate-900/45 p-6">
            <h3 className="text-lg font-bold">Fit summary</h3>
            <div className="mt-4 space-y-3 text-sm text-slate-300">
              <p>Match score: {detail.load.matchScore} / 100</p>
              <p>Preferred mode supported: {detail.carrier?.serviceModes.includes(detail.load.preferredMode) ? "Yes" : "No"}</p>
              <p>Carrier verified: {detail.carrier?.verified ? "Yes" : "No"}</p>
            </div>
          </section>
        </aside>
      </div>
    </section>
  );
}
