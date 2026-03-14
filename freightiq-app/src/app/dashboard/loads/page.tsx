import Link from "next/link";
import { redirect } from "next/navigation";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { createClient } from "@/lib/supabase/server";
import { getShipperContext, listShipperLoads } from "@/lib/shipper/server";

export default async function LoadsPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string }>;
}) {
  const { created } = await searchParams;
  const supabase = await createClient();
  const context = await getShipperContext(supabase);

  if (!context.ok) {
    redirect(context.code === "FORBIDDEN" ? "/dashboard" : "/auth?mode=login&next=/dashboard/loads");
  }

  const loads = await listShipperLoads(supabase, context.profile.id, 50);

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
              <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-400">View</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--brand)]/5">
            {loads.length > 0 ? (
              loads.map((load) => (
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
                    <Link href={`/dashboard/loads/${load.id}`} className="text-sm font-bold text-[var(--brand)] hover:underline">
                      Details
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-6 py-16 text-center text-sm text-[var(--muted)]">
                  <span className="material-symbols-outlined mb-3 block text-4xl text-[var(--brand)]/30">
                    package_2
                  </span>
                  No loads yet. Create your first load to start matching.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
