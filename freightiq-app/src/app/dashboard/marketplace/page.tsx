import { redirect } from "next/navigation";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { getCarrierContext, listCarrierMarketplaceLoads } from "@/lib/carrier/server";
import { createClient } from "@/lib/supabase/server";

export default async function MarketplacePage() {
  const supabase = await createClient();
  const context = await getCarrierContext(supabase);

  if (!context.ok) {
    redirect(context.code === "FORBIDDEN" ? "/dashboard" : "/auth?mode=login&next=/dashboard/marketplace");
  }

  const loads = await listCarrierMarketplaceLoads(supabase, context.carrier, 50);

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Load Marketplace</h1>
        <p className="mt-2 text-[var(--muted)]">
          Browse open shipper loads that align with your service modes and current fleet capacity.
        </p>
      </div>

      <div className="space-y-4">
        {loads.length > 0 ? (
          loads.map((load) => (
            <article key={load.id} className="rounded-2xl border border-[var(--brand)]/10 bg-slate-800/40 p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold">{load.title}</h2>
                  <p className="text-sm text-slate-400">{load.routeLabel}</p>
                  <p className="mt-1 text-xs uppercase tracking-wider text-slate-500">
                    {load.freightType ?? "general"} • {load.preferredMode}
                  </p>
                </div>
                <StatusBadge status={load.status} />
              </div>

              <div className="mt-5 grid gap-5 md:grid-cols-4">
                <InfoCard label="Budget" value={load.budgetUsd != null ? `$${load.budgetUsd}` : "TBD"} />
                <InfoCard label="Pickup" value={load.pickupDate ?? "TBD"} />
                <InfoCard label="Delivery" value={load.deliveryDate ?? "TBD"} />
                <InfoCard label="Weight" value={load.weightKg != null ? `${load.weightKg} kg` : "TBD"} />
              </div>
            </article>
          ))
        ) : (
          <div className="rounded-2xl border border-[var(--brand)]/10 bg-slate-800/40 p-10 text-center text-slate-400">
            No open loads match your current carrier profile yet.
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
