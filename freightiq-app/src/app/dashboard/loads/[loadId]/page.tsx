import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { createClient } from "@/lib/supabase/server";
import { getShipperContext, getShipperLoadDetail } from "@/lib/shipper/server";

export default async function LoadDetailPage({
  params,
}: {
  params: Promise<{ loadId: string }>;
}) {
  const { loadId } = await params;
  const supabase = await createClient();
  const context = await getShipperContext(supabase);

  if (!context.ok) {
    redirect(context.code === "FORBIDDEN" ? "/dashboard" : "/auth?mode=login&next=/dashboard/loads");
  }

  const detail = await getShipperLoadDetail(supabase, context.profile, loadId);

  if (!detail) {
    notFound();
  }

  return (
    <section className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--brand)]">Load Detail</p>
          <h1 className="mt-2 text-3xl font-bold">{detail.load.title}</h1>
          <p className="mt-2 text-slate-400">
            {detail.load.originAddress} -&gt; {detail.load.destinationAddress}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={detail.load.status} />
          <Link href="/dashboard/loads" className="rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-300 hover:text-white">
            Back to loads
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Info label="Preferred Mode" value={detail.load.preferredMode} />
        <Info label="Weight" value={detail.load.weightKg != null ? `${detail.load.weightKg} kg` : "TBD"} />
        <Info label="Budget" value={detail.load.budgetUsd != null ? `$${detail.load.budgetUsd}` : "TBD"} />
        <Info label="CO2 Score" value={detail.load.co2Score != null ? `${detail.load.co2Score} kg` : "Pending"} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1.2fr]">
        <section className="rounded-2xl border border-[var(--brand)]/10 bg-slate-800/40 p-6">
          <h2 className="text-xl font-bold">Load Information</h2>
          <div className="mt-5 space-y-4 text-sm text-slate-300">
            <DetailRow label="Freight Type" value={detail.load.freightType ?? "General freight"} />
            <DetailRow label="Pickup Date" value={detail.load.pickupDate ?? "Not scheduled"} />
            <DetailRow label="Delivery Date" value={detail.load.deliveryDate ?? "Not scheduled"} />
            <DetailRow label="Volume" value={detail.load.volumeM3 != null ? `${detail.load.volumeM3} m3` : "TBD"} />
            <DetailRow label="Created" value={new Date(detail.load.createdAt).toLocaleString()} />
          </div>
        </section>

        <section className="rounded-2xl border border-[var(--brand)]/10 bg-slate-800/40 p-6">
          <h2 className="text-xl font-bold">Modal Comparison</h2>
          {detail.modalComparison ? (
            <div className="mt-5 overflow-hidden rounded-2xl border border-white/5">
              <table className="w-full text-left">
                <thead className="bg-black/10">
                  <tr>
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Mode</th>
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">CO2</th>
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Cost</th>
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Transit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {[
                    ["Truck", detail.modalComparison.truck_co2, detail.modalComparison.truck_cost, detail.modalComparison.truck_days],
                    ["Rail", detail.modalComparison.rail_co2, detail.modalComparison.rail_cost, detail.modalComparison.rail_days],
                    ["Sea", detail.modalComparison.sea_co2, detail.modalComparison.sea_cost, detail.modalComparison.sea_days],
                    ["Air", detail.modalComparison.air_co2, detail.modalComparison.air_cost, detail.modalComparison.air_days],
                  ].map(([mode, co2, cost, days]) => (
                    <tr key={String(mode)}>
                      <td className="px-4 py-3 text-sm font-semibold text-white">{mode}</td>
                      <td className="px-4 py-3 text-sm text-slate-300">{co2 != null ? `${co2} kg` : "TBD"}</td>
                      <td className="px-4 py-3 text-sm text-slate-300">{cost != null ? `$${cost}` : "TBD"}</td>
                      <td className="px-4 py-3 text-sm text-slate-300">{days != null ? `${days} days` : "TBD"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-5 text-sm text-slate-400">Modal comparison is not available for this load yet.</p>
          )}
        </section>
      </div>

      <section className="rounded-2xl border border-[var(--brand)]/10 bg-slate-800/40 p-6">
        <h2 className="text-xl font-bold">Shipment Assignment</h2>
        {detail.shipment ? (
          <div className="mt-5 grid gap-4 md:grid-cols-4">
            <Info label="Carrier" value={detail.shipment.carrierName} />
            <Info label="Transport" value={detail.shipment.transportMode} />
            <Info label="Agreed Price" value={detail.shipment.agreedPriceUsd != null ? `$${detail.shipment.agreedPriceUsd}` : "TBD"} />
            <Info label="Status" value={detail.shipment.status.replaceAll("_", " ")} />
          </div>
        ) : (
          <p className="mt-5 text-sm text-slate-400">No shipment has been assigned to this load yet.</p>
        )}
      </section>
    </section>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--brand)]/10 bg-slate-800/40 p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-lg font-bold text-white capitalize">{value}</p>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/5 pb-3 last:border-b-0 last:pb-0">
      <span className="text-slate-500">{label}</span>
      <span className="text-right text-white">{value}</span>
    </div>
  );
}
