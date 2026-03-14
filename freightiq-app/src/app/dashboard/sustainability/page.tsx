import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getShipperContext, getShipperSustainabilityData } from "@/lib/shipper/server";

export default async function SustainabilityPage() {
  const supabase = await createClient();
  const context = await getShipperContext(supabase);

  if (!context.ok) {
    redirect(context.code === "FORBIDDEN" ? "/dashboard" : "/auth?mode=login&next=/dashboard/sustainability");
  }

  const sustainability = await getShipperSustainabilityData(supabase, context.profile);

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">CO2 Impact</h1>
        <p className="mt-2 text-[var(--muted)]">Monitor shipment emissions, offsets, and greener transport wins.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Metric label="Tracked CO2" value={`${sustainability.totals.totalCo2Kg} kg`} />
        <Metric label="Offsets Purchased" value={`${sustainability.totals.totalOffsetKg} kg`} />
        <Metric label="Measured Shipments" value={sustainability.totals.shipmentsMeasured.toString()} />
        <Metric label="Savings Vs Truck" value={`${sustainability.totals.baselineSavingsKg} kg`} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1.3fr]">
        <section className="rounded-2xl border border-[var(--brand)]/10 bg-slate-800/40 p-6">
          <h2 className="text-xl font-bold">Modal Split</h2>
          <div className="mt-5 space-y-4">
            {sustainability.modalSplit.length > 0 ? (
              sustainability.modalSplit.map((item) => (
                <div key={item.mode}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="capitalize text-white">{item.mode}</span>
                    <span className="text-slate-400">
                      {item.shipments} shipments • {item.co2Kg} kg
                    </span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-700">
                    <div
                      className="h-full rounded-full bg-[var(--brand)]"
                      style={{
                        width: `${Math.max(12, Math.min(100, item.shipments * 20))}%`,
                      }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400">No CO2 records yet.</p>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-[var(--brand)]/10 bg-slate-800/40 p-6">
          <h2 className="text-xl font-bold">Monthly Footprint</h2>
          <div className="mt-5 space-y-4">
            {sustainability.monthlyFootprint.length > 0 ? (
              sustainability.monthlyFootprint.map((item) => (
                <div
                  key={item.month}
                  className="flex items-center justify-between rounded-2xl border border-white/5 bg-black/10 px-4 py-3"
                >
                  <div>
                    <p className="font-semibold text-white">{item.month}</p>
                    <p className="text-xs text-slate-500">Monthly emissions snapshot</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-white">{Math.round(item.co2Kg * 10) / 10} kg</p>
                    <p className="text-xs text-[var(--brand)]">Offset {Math.round(item.offsetKg * 10) / 10} kg</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400">No monthly data available yet.</p>
            )}
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-[var(--brand)]/10 bg-slate-800/40 p-6">
        <h2 className="text-xl font-bold">Recent Carbon Records</h2>
        <div className="mt-5 overflow-hidden rounded-2xl border border-white/5">
          <table className="w-full text-left">
            <thead className="bg-black/10">
              <tr>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Load</th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Mode</th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">CO2</th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Offset</th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Recorded</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {sustainability.recentRecords.length > 0 ? (
                sustainability.recentRecords.map((record) => (
                  <tr key={record.id}>
                    <td className="px-4 py-3 text-sm text-white">{record.loadTitle}</td>
                    <td className="px-4 py-3 text-sm capitalize text-slate-300">{record.mode}</td>
                    <td className="px-4 py-3 text-sm text-slate-300">{record.co2Kg} kg</td>
                    <td className="px-4 py-3 text-sm text-slate-300">{record.offsetKg} kg</td>
                    <td className="px-4 py-3 text-sm text-slate-400">{new Date(record.recordedAt).toLocaleString()}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-400">
                    No carbon records available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--brand)]/10 bg-slate-800/40 p-6">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-white">{value}</p>
    </div>
  );
}
