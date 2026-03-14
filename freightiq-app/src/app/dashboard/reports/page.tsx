import { redirect } from "next/navigation";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { createClient } from "@/lib/supabase/server";
import { getShipperContext, getShipperReportsData } from "@/lib/shipper/server";

export default async function ReportsPage() {
  const supabase = await createClient();
  const context = await getShipperContext(supabase);

  if (!context.ok) {
    redirect(context.code === "FORBIDDEN" ? "/dashboard" : "/auth?mode=login&next=/dashboard/reports");
  }

  const reports = await getShipperReportsData(supabase, context.profile);

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reports</h1>
        <p className="mt-2 text-[var(--muted)]">Review shipment-level reporting and monthly operational summaries.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-5">
        <Summary label="Monthly Reports" value={reports.summary.totalReports.toString()} />
        <Summary label="Delivered Shipments" value={reports.summary.deliveredShipments.toString()} />
        <Summary label="Active Shipments" value={reports.summary.activeShipments.toString()} />
        <Summary label="Tracked CO2" value={`${reports.summary.totalCo2Kg} kg`} />
        <Summary label="Offsets" value={`${reports.summary.totalOffsetKg} kg`} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1.4fr]">
        <section className="rounded-2xl border border-[var(--brand)]/10 bg-slate-800/40 p-6">
          <h2 className="text-xl font-bold">Monthly Summary</h2>
          <div className="mt-5 space-y-3">
            {reports.monthlyReports.length > 0 ? (
              reports.monthlyReports.map((report) => (
                <div
                  key={report.month}
                  className="rounded-2xl border border-white/5 bg-black/10 px-4 py-3"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-white">{report.month}</p>
                      <p className="text-xs text-slate-500">
                        {report.deliveredShipments} delivered of {report.totalShipments} shipments
                      </p>
                    </div>
                    <div className="text-right text-sm">
                      <p className="text-white">{Math.round(report.totalCo2Kg * 10) / 10} kg CO2</p>
                      <p className="text-[var(--brand)]">{Math.round(report.totalOffsetKg * 10) / 10} kg offset</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400">No monthly summaries available.</p>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-[var(--brand)]/10 bg-slate-800/40 p-6">
          <h2 className="text-xl font-bold">Shipment Reports</h2>
          <div className="mt-5 overflow-hidden rounded-2xl border border-white/5">
            <table className="w-full text-left">
              <thead className="bg-black/10">
                <tr>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Load</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Carrier</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Status</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">CO2</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Mode</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {reports.shipmentReports.length > 0 ? (
                  reports.shipmentReports.map((report) => (
                    <tr key={report.shipmentId}>
                      <td className="px-4 py-3 text-sm text-white">{report.loadTitle}</td>
                      <td className="px-4 py-3 text-sm text-slate-300">{report.carrierName}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={report.status} />
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-300">
                        {report.co2Kg != null ? `${report.co2Kg} kg` : "Pending"}
                      </td>
                      <td className="px-4 py-3 text-sm capitalize text-slate-300">{report.transportMode}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-400">
                      No shipment reports available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </section>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--brand)]/10 bg-slate-800/40 p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-white">{value}</p>
    </div>
  );
}
