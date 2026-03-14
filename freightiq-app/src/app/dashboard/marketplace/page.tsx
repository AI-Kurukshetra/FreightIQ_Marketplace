import Link from "next/link";
import { redirect } from "next/navigation";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { SubmitButton } from "@/components/shared/submit-button";
import { getCarrierContext, listCarrierMarketplaceLoads } from "@/lib/carrier/server";
import { createClient } from "@/lib/supabase/server";
import { acceptLoadAction } from "./actions";

type MarketplacePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function AlertBanner({ tone, message }: { tone: "success" | "error"; message: string }) {
  return (
    <div
      className={`rounded-2xl border px-5 py-4 text-sm ${
        tone === "success"
          ? "border-[var(--brand)]/20 bg-[var(--brand)]/10 text-[var(--foreground)]"
          : "border-red-400/20 bg-red-500/10 text-red-100"
      }`}
    >
      {message}
    </div>
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

export default async function MarketplacePage({ searchParams }: MarketplacePageProps) {
  const params = (await searchParams) ?? {};
  const search = firstParam(params.search) ?? "";
  const mode = firstParam(params.mode) ?? "";
  const freightType = firstParam(params.freightType) ?? "";
  const pickupWindow = firstParam(params.pickupWindow) ?? "";
  const minBudgetRaw = firstParam(params.minBudget) ?? "";
  const minBudget = minBudgetRaw ? Number(minBudgetRaw) : null;
  const saved = firstParam(params.accepted);
  const error = firstParam(params.error);

  const supabase = await createClient();
  const context = await getCarrierContext(supabase);

  if (!context.ok) {
    redirect(context.code === "FORBIDDEN" ? "/dashboard" : "/auth?mode=login&next=/dashboard/marketplace");
  }

  const loads = await listCarrierMarketplaceLoads(supabase, context.carrier, 50, {
    search,
    mode,
    freightType,
    pickupWindow,
    minBudget,
  });

  const serviceModes = context.carrier?.serviceModes ?? [];
  const freightTypes = Array.from(new Set(loads.map((load) => load.freightType).filter(Boolean))).sort();

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Load Marketplace</h1>
          <p className="mt-2 max-w-3xl text-[var(--muted)]">
            Browse open shipper loads, filter by mode and urgency, and convert strong-fit opportunities into active shipments.
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--brand)]/10 bg-slate-800/40 px-5 py-4 text-sm text-slate-300">
          {context.carrier
            ? `${context.carrier.companyName} is configured for ${context.carrier.serviceModes.join(", ")}`
            : "Create your carrier profile in settings to unlock mode-based matching."}
        </div>
      </div>

      {saved ? <AlertBanner tone="success" message="Load accepted successfully." /> : null}
      {error ? <AlertBanner tone="error" message={`Unable to accept the load: ${error.replaceAll("_", " ")}.`} /> : null}
      {!context.carrier ? (
        <div className="rounded-2xl border border-amber-300/20 bg-amber-500/10 px-5 py-4 text-sm text-amber-100">
          You must create a carrier profile before accepting any load.
          <Link href="/dashboard/settings" className="ml-2 font-semibold text-amber-50 underline underline-offset-4">
            Create Carrier Profile
          </Link>
        </div>
      ) : null}

      <form className="grid gap-4 rounded-[28px] border border-[var(--brand)]/10 bg-slate-900/45 p-5 lg:grid-cols-5">
        <label className="space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Search</span>
          <input
            type="text"
            name="search"
            defaultValue={search}
            placeholder="Route, city, freight type"
            className="w-full rounded-2xl border border-white/10 bg-black/15 px-4 py-3 text-sm text-white placeholder:text-slate-500"
          />
        </label>
        <label className="space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Mode</span>
          <select
            name="mode"
            defaultValue={mode}
            className="w-full rounded-2xl border border-white/10 bg-black/15 px-4 py-3 text-sm text-white"
          >
            <option value="">All supported modes</option>
            {serviceModes.map((serviceMode) => (
              <option key={serviceMode} value={serviceMode}>
                {serviceMode}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Freight Type</span>
          <select
            name="freightType"
            defaultValue={freightType}
            className="w-full rounded-2xl border border-white/10 bg-black/15 px-4 py-3 text-sm text-white"
          >
            <option value="">All freight types</option>
            {freightTypes.map((item) => (
              <option key={item} value={item ?? ""}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Pickup Window</span>
          <select
            name="pickupWindow"
            defaultValue={pickupWindow}
            className="w-full rounded-2xl border border-white/10 bg-black/15 px-4 py-3 text-sm text-white"
          >
            <option value="">Any pickup date</option>
            <option value="today">Today</option>
            <option value="week">Next 7 days</option>
          </select>
        </label>
        <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
          <label className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Min Budget</span>
            <input
              type="number"
              name="minBudget"
              min="0"
              step="10"
              defaultValue={minBudgetRaw}
              placeholder="0"
              className="w-full rounded-2xl border border-white/10 bg-black/15 px-4 py-3 text-sm text-white placeholder:text-slate-500"
            />
          </label>
          <button
            type="submit"
            className="self-end rounded-2xl bg-[var(--brand)] px-5 py-3 text-sm font-bold text-[#112111] transition hover:bg-[var(--brand-strong)]"
          >
            Apply
          </button>
        </div>
      </form>

      <div className="space-y-4">
        {loads.length > 0 ? (
          loads.map((load) => (
            <article key={load.id} className="rounded-[28px] border border-[var(--brand)]/10 bg-slate-800/40 p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-xl font-bold">{load.title}</h2>
                    <div className="rounded-full border border-[var(--brand)]/15 bg-[var(--brand)]/8 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--brand)]">
                      {load.fitLabel}
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-slate-400">{load.routeLabel}</p>
                  <p className="mt-2 text-xs uppercase tracking-wider text-slate-500">
                    {load.freightType ?? "general"} • {load.preferredMode} • match score {load.matchScore}
                  </p>
                </div>
                <StatusBadge status={load.status} />
              </div>

              <div className="mt-5 grid gap-5 md:grid-cols-5">
                <InfoCard label="Budget" value={load.budgetUsd != null ? `$${load.budgetUsd}` : "TBD"} />
                <InfoCard label="Pickup" value={load.pickupDate ?? "TBD"} />
                <InfoCard label="Delivery" value={load.deliveryDate ?? "TBD"} />
                <InfoCard label="Weight" value={load.weightKg != null ? `${load.weightKg} kg` : "TBD"} />
                <InfoCard label="CO2" value={load.co2Score != null ? `${load.co2Score} kg` : "Pending"} />
              </div>

              <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="text-sm text-slate-400">
                  Strong-fit lanes should be accepted quickly before another verified carrier claims the shipment.
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href={`/dashboard/marketplace/${load.id}`}
                    className="rounded-2xl border border-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:border-[var(--brand)]/30 hover:bg-[var(--brand)]/5"
                  >
                    View Details
                  </Link>
                  {context.carrier ? (
                    <form action={acceptLoadAction} className="flex flex-wrap gap-3">
                      <input type="hidden" name="loadId" value={load.id} />
                      <input type="hidden" name="sourcePath" value="/dashboard/marketplace" />
                      <input
                        type="number"
                        name="agreedPriceUsd"
                        min="0"
                        step="10"
                        defaultValue={load.budgetUsd != null ? Math.round(load.budgetUsd * 0.97) : ""}
                        className="w-36 rounded-2xl border border-white/10 bg-black/15 px-4 py-3 text-sm text-white"
                      />
                      <SubmitButton
                        idleLabel="Accept Load"
                        pendingLabel="Accepting..."
                        className="rounded-2xl bg-[var(--brand)] px-5 py-3 text-sm font-bold text-[#112111] transition hover:bg-[var(--brand-strong)] disabled:cursor-not-allowed disabled:opacity-70"
                      />
                    </form>
                  ) : (
                    <Link
                      href="/dashboard/settings"
                      className="rounded-2xl bg-[var(--brand)] px-5 py-3 text-sm font-bold text-[#112111] transition hover:bg-[var(--brand-strong)]"
                    >
                      Create Carrier Profile
                    </Link>
                  )}
                </div>
              </div>
            </article>
          ))
        ) : (
          <div className="rounded-2xl border border-[var(--brand)]/10 bg-slate-800/40 p-10 text-center text-slate-400">
            No open loads match your current carrier profile and active filters.
          </div>
        )}
      </div>
    </section>
  );
}
