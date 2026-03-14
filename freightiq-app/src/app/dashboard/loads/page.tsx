import Link from "next/link";
import { redirect } from "next/navigation";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { createClient } from "@/lib/supabase/server";
import { getShipperContext, listShipperLoads, SHIPPER_MODE_OPTIONS } from "@/lib/shipper/server";
import { deleteLoadAction } from "./actions";

function loadErrorMessage(error: string | undefined) {
  if (!error) return null;
  if (error === "locked") return "Only open loads without active shipments can be deleted.";
  if (error === "not_found") return "The requested load was not found.";
  if (error === "invalid_id") return "Invalid load id.";
  if (error === "update_failed") return "Load update failed.";
  if (error === "delete_failed") return "Load delete failed.";
  return "Action failed. Please try again.";
}

export default async function LoadsPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string; updated?: string; deleted?: string; error?: string; q?: string; status?: string; mode?: string }>;
}) {
  const { created, updated, deleted, error, q = "", status = "all", mode = "all" } = await searchParams;
  const supabase = await createClient();
  const context = await getShipperContext(supabase);

  if (!context.ok) {
    redirect(context.code === "FORBIDDEN" ? "/dashboard" : "/auth?mode=login&next=/dashboard/loads");
  }

  const loads = await listShipperLoads(supabase, context.profile.id);
  const query = q.trim().toLowerCase();
  const filteredLoads = loads.filter((load) => {
    const matchesQuery =
      !query ||
      [load.title, load.originAddress, load.destinationAddress, load.freightType ?? "", load.preferredMode]
        .join(" ")
        .toLowerCase()
        .includes(query);
    const matchesStatus = status === "all" || load.status === status;
    const matchesMode = mode === "all" || load.preferredMode === mode;

    return matchesQuery && matchesStatus && matchesMode;
  });
  const activeLoads = loads.filter((load) => ["open", "matched", "in_transit"].includes(load.status)).length;
  const matchedLoads = loads.filter((load) => load.status === "matched").length;
  const averageBudget =
    loads.filter((load) => load.budgetUsd != null).length > 0
      ? Math.round(
          loads.reduce((sum, load) => sum + (load.budgetUsd ?? 0), 0) /
            loads.filter((load) => load.budgetUsd != null).length
        )
      : 0;
  const actionError = loadErrorMessage(error);

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">My Loads</h1>
          <p className="mt-2 text-[var(--muted)]">Manage shipment requests and review route performance.</p>
        </div>
        <Link
          className="flex items-center gap-2 rounded-xl bg-[var(--brand)] px-5 py-2.5 text-sm font-bold text-[#112111] shadow-lg shadow-[var(--brand)]/20 transition hover:bg-[var(--brand-strong)]"
          href="/dashboard/loads/new"
        >
          <span className="material-symbols-outlined text-base">add</span>
          Post New Load
        </Link>
      </div>

      {created === "1" ? (
        <div className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          Load created successfully.
        </div>
      ) : null}
      {updated === "1" ? (
        <div className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          Load updated successfully.
        </div>
      ) : null}
      {deleted === "1" ? (
        <div className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          Load deleted successfully.
        </div>
      ) : null}
      {actionError ? (
        <div className="rounded-lg border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {actionError}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard label="Total Loads" value={loads.length.toString()} helper={`${activeLoads} active`} />
        <SummaryCard label="Matched Loads" value={matchedLoads.toString()} helper="Carrier engagement in progress" />
        <SummaryCard
          label="Average Budget"
          value={averageBudget > 0 ? `$${averageBudget}` : "TBD"}
          helper="Across priced loads"
        />
      </div>

      <form className="grid gap-4 rounded-2xl border border-[var(--brand)]/10 bg-slate-800/40 p-4 md:grid-cols-[1.4fr_0.7fr_0.7fr_auto]">
        <label className="text-sm text-slate-300">
          Search loads
          <input
            className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-black/10 px-4 text-sm text-white placeholder:text-slate-500 focus:border-[var(--brand)]"
            defaultValue={q}
            name="q"
            placeholder="Title, route, freight type"
            type="text"
          />
        </label>

        <label className="text-sm text-slate-300">
          Status
          <select
            className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-black/10 px-4 text-sm text-white focus:border-[var(--brand)]"
            defaultValue={status}
            name="status"
          >
            <option value="all">All statuses</option>
            <option value="open">Open</option>
            <option value="matched">Matched</option>
            <option value="in_transit">In transit</option>
            <option value="delivered">Delivered</option>
          </select>
        </label>

        <label className="text-sm text-slate-300">
          Mode
          <select
            className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-black/10 px-4 text-sm text-white focus:border-[var(--brand)]"
            defaultValue={mode}
            name="mode"
          >
            <option value="all">All modes</option>
            {SHIPPER_MODE_OPTIONS.map((modeOption) => (
              <option key={modeOption} value={modeOption}>
                {modeOption.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-end gap-3">
          <button
            className="h-11 rounded-xl bg-[var(--brand)] px-5 text-sm font-bold text-[#112111] transition hover:bg-[var(--brand-strong)]"
            type="submit"
          >
            Apply
          </button>
          <Link className="text-sm font-semibold text-slate-400 hover:text-white" href="/dashboard/loads">
            Reset
          </Link>
        </div>
      </form>

      <section className="rounded-2xl border border-[var(--brand)]/10 bg-slate-800/40 p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold">More</h2>
          <span className="text-xs uppercase tracking-wider text-slate-500">Quick navigation</span>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <Link
            href="/dashboard/loads/new"
            className="rounded-xl border border-white/10 bg-black/10 px-4 py-3 text-sm font-semibold text-white transition hover:border-[var(--brand)]/40 hover:bg-[var(--brand)]/5"
          >
            Post another load
          </Link>
          <Link
            href="/dashboard/tracking"
            className="rounded-xl border border-white/10 bg-black/10 px-4 py-3 text-sm font-semibold text-white transition hover:border-[var(--brand)]/40 hover:bg-[var(--brand)]/5"
          >
            Check shipment tracking
          </Link>
          <Link
            href="/dashboard/reports"
            className="rounded-xl border border-white/10 bg-black/10 px-4 py-3 text-sm font-semibold text-white transition hover:border-[var(--brand)]/40 hover:bg-[var(--brand)]/5"
          >
            Open reports
          </Link>
        </div>
      </section>

      <div className="overflow-hidden rounded-2xl border border-[var(--brand)]/10 bg-slate-800/40">
        <table className="w-full text-left">
          <thead className="border-b border-[var(--brand)]/10 bg-slate-800/60">
            <tr>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">Load</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">Route</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">Mode</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">Status</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">Budget</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">CO2</th>
              <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--brand)]/5">
            {filteredLoads.length > 0 ? (
              filteredLoads.map((load) => (
                <tr key={load.id} className="transition-colors hover:bg-[var(--brand)]/5">
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-white">{load.title}</p>
                    <p className="text-xs text-slate-500">
                      {load.freightType ?? "general"} {load.weightKg ? `• ${load.weightKg} kg` : ""}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-white">{load.originAddress}</p>
                    <p className="text-xs text-slate-500">to {load.destinationAddress}</p>
                  </td>
                  <td className="px-6 py-4 text-sm capitalize text-slate-300">{load.preferredMode}</td>
                  <td className="px-6 py-4">
                    <StatusBadge status={load.status} />
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-300">
                    {load.budgetUsd != null ? `$${load.budgetUsd}` : "TBD"}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-300">
                    {load.co2Score != null ? `${load.co2Score} kg` : "Pending"}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-4 text-sm">
                      <Link href={`/dashboard/loads/${load.id}`} className="font-bold text-[var(--brand)] hover:underline">
                        Details
                      </Link>
                      <Link href={`/dashboard/loads/${load.id}/edit`} className="font-bold text-sky-300 hover:underline">
                        Edit
                      </Link>
                      <form action={deleteLoadAction}>
                        <input type="hidden" name="loadId" value={load.id} />
                        <input type="hidden" name="sourcePath" value="/dashboard/loads" />
                        <button type="submit" className="font-bold text-red-300 hover:text-red-200">
                          Delete
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-6 py-16 text-center text-sm text-[var(--muted)]">
                  <span className="material-symbols-outlined mb-3 block text-4xl text-[var(--brand)]/30">
                    package_2
                  </span>
                  {loads.length === 0 ? "No loads yet. Create your first load to start matching." : "No loads match the current filters."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function SummaryCard({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <div className="rounded-2xl border border-[var(--brand)]/10 bg-slate-800/40 p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-white">{value}</p>
      <p className="mt-2 text-xs text-slate-400">{helper}</p>
    </div>
  );
}
