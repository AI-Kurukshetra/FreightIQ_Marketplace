import Link from "next/link";
import { redirect } from "next/navigation";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { getProfileRole, isCarrierRole } from "@/lib/auth/role-routing";
import {
  type CarrierDashboardData,
  getCarrierContext,
  getCarrierDashboardData,
} from "@/lib/carrier/server";
import { createClient } from "@/lib/supabase/server";
import { getShipperContext, getShipperDashboardData } from "@/lib/shipper/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth?mode=login&next=/dashboard");
  }

  const role = await getProfileRole(supabase, user.id);

  if (isCarrierRole(role)) {
    const context = await getCarrierContext(supabase);

    if (!context.ok) {
      redirect("/auth?mode=login&next=/dashboard");
    }

    const dashboard = await getCarrierDashboardData(supabase, context.profile, context.carrier);
    return <CarrierDashboard dashboard={dashboard} />;
  }

  const context = await getShipperContext(supabase);

  if (!context.ok) {
    redirect("/auth?mode=login&next=/dashboard");
  }

  const dashboard = await getShipperDashboardData(supabase, context.profile);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Shipper Dashboard</h2>
          <p className="mt-1 text-slate-400">
            Welcome back, {dashboard.profile.fullName ?? dashboard.profile.email ?? "Freight User"}.
            Track active loads, shipment health, and carbon performance from one view.
          </p>
        </div>
        <Link
          href="/dashboard/loads/new"
          className="flex items-center gap-2 rounded-xl bg-[var(--brand)] px-6 py-3 font-bold text-[#112111] shadow-lg shadow-[var(--brand)]/20 transition hover:bg-[var(--brand-strong)]"
        >
          <span className="material-symbols-outlined font-bold">add</span>
          Post New Load
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <MetricCard
          icon="inventory_2"
          label="Total Loads"
          value={dashboard.metrics.totalLoads.toString()}
          helper={`${dashboard.metrics.activeLoads} active right now`}
        />
        <MetricCard
          icon="local_shipping"
          label="Active Shipments"
          value={dashboard.metrics.activeShipments.toString()}
          helper={`${dashboard.metrics.deliveredLoads} delivered loads`}
        />
        <MetricCard
          icon="eco"
          label="Tracked CO2"
          value={`${dashboard.metrics.totalCo2Kg} kg`}
          helper={`${dashboard.metrics.totalOffsetKg} kg offset`}
        />
        <MetricCard
          icon="handshake"
          label="Match Rate"
          value={`${dashboard.metrics.averageMatchRate}%`}
          helper="Based on matched shipment records"
        />
      </div>

      <div className="grid gap-8 xl:grid-cols-[1.1fr_1.6fr]">
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[var(--brand)]">auto_awesome</span>
            <h3 className="text-xl font-bold">Recommended Carriers</h3>
          </div>

          {dashboard.recommendations.length > 0 ? (
            dashboard.recommendations.map((recommendation) => (
              <article
                key={`${recommendation.carrierId}-${recommendation.matchedLoadId}`}
                className="rounded-2xl border border-[var(--brand)]/10 bg-slate-800/40 p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-base font-bold">{recommendation.carrierName}</p>
                    <p className="text-sm text-slate-400">{recommendation.routeLabel}</p>
                  </div>
                  <span className="rounded-full bg-[var(--brand)]/10 px-2 py-1 text-xs font-bold text-[var(--brand)]">
                    {recommendation.greenScore}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-300">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Matched Load</p>
                    <p>{recommendation.matchedLoadTitle}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Modes</p>
                    <p className="capitalize">{recommendation.serviceModes.join(", ")}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Carrier Rating</p>
                    <p>{recommendation.rating.toFixed(1)} / 5</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Savings Estimate</p>
                    <p>
                      {recommendation.estimatedSavingsKg != null
                        ? `${recommendation.estimatedSavingsKg} kg CO2`
                        : "Review modal options"}
                    </p>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <EmptyCard
              icon="hub"
              title="No recommendations yet"
              body="Post or reopen loads to get carrier suggestions based on supported transport modes."
            />
          )}
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold">Recent Loads</h3>
            <Link href="/dashboard/loads" className="text-sm font-bold text-[var(--brand)] hover:underline">
              View All
            </Link>
          </div>

          <div className="overflow-hidden rounded-2xl border border-[var(--brand)]/10 bg-slate-800/40">
            <table className="w-full text-left">
              <thead className="border-b border-[var(--brand)]/10 bg-slate-800/60">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                    Load
                  </th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                    Route
                  </th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                    CO2
                  </th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                    Status
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-400">
                    View
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--brand)]/5">
                {dashboard.recentLoads.length > 0 ? (
                  dashboard.recentLoads.map((load) => (
                    <tr key={load.id} className="transition-colors hover:bg-[var(--brand)]/5">
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold">{load.title}</p>
                        <p className="text-xs capitalize text-slate-500">{load.preferredMode}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-300">
                        {load.originAddress} -&gt; {load.destinationAddress}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-300">
                        {load.co2Score != null ? `${load.co2Score} kg` : "Pending"}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={load.status} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/dashboard/loads/${load.id}`}
                          className="text-sm font-bold text-[var(--brand)] hover:underline"
                        >
                          Details
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center text-sm text-slate-400">
                      No loads created yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <section className="rounded-3xl border border-[var(--brand)]/10 bg-gradient-to-br from-[var(--brand)]/10 to-transparent p-8">
          <h4 className="text-xl font-bold">Recent Shipment Progress</h4>
          <div className="mt-5 space-y-4">
            {dashboard.recentShipments.length > 0 ? (
              dashboard.recentShipments.map((shipment) => (
                <div key={shipment.id} className="rounded-2xl border border-white/5 bg-black/10 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-bold">{shipment.loadTitle}</p>
                      <p className="text-sm text-slate-300">{shipment.carrierName}</p>
                      <p className="text-xs text-slate-500">{shipment.routeLabel}</p>
                    </div>
                    <StatusBadge status={shipment.status} />
                  </div>
                  <div className="mt-3 text-xs text-slate-300">
                    {shipment.trackingUpdates.at(-1)?.label ?? "Awaiting next update"}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-300">No shipment records yet.</p>
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-[var(--brand)]/10 bg-slate-800/40 p-8">
          <h4 className="text-xl font-bold">Next Actions</h4>
          <div className="mt-5 space-y-3 text-sm text-slate-300">
            <ActionLink href="/dashboard/loads/new" label="Post a new load" icon="add_box" />
            <ActionLink href="/dashboard/tracking" label="Review active shipments" icon="route" />
            <ActionLink href="/dashboard/sustainability" label="Check CO2 performance" icon="energy_savings_leaf" />
            <ActionLink href="/dashboard/reports" label="Open shipment reports" icon="bar_chart" />
          </div>
        </section>
      </div>
    </div>
  );
}

function CarrierDashboard({ dashboard }: { dashboard: CarrierDashboardData }) {
  const accountLabel = dashboard.profile.fullName ?? dashboard.carrier?.companyName ?? dashboard.profile.email ?? "Carrier";

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Carrier Dashboard</h2>
          <p className="mt-1 text-slate-400">
            Welcome back, {accountLabel}. Review available freight, monitor assigned jobs, and keep delivery status current.
          </p>
        </div>
        <Link
          href="/dashboard/marketplace"
          className="flex items-center gap-2 rounded-xl bg-[var(--brand)] px-6 py-3 font-bold text-[#112111] shadow-lg shadow-[var(--brand)]/20 transition hover:bg-[var(--brand-strong)]"
        >
          <span className="material-symbols-outlined font-bold">travel_explore</span>
          Browse Open Loads
        </Link>
      </div>

      {!dashboard.carrier ? (
        <div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 px-5 py-4 text-sm text-amber-100">
          Your carrier company profile is not configured yet. You can still browse open loads, but assigned shipment data will stay empty until the carrier record is created.
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <MetricCard
          icon="travel_explore"
          label="Open Loads"
          value={dashboard.metrics.availableLoads.toString()}
          helper="Visible opportunities for your fleet"
        />
        <MetricCard
          icon="local_shipping"
          label="Assigned Jobs"
          value={dashboard.metrics.assignedShipments.toString()}
          helper={`${dashboard.metrics.activeShipments} active shipments`}
        />
        <MetricCard
          icon="check_circle"
          label="Delivered"
          value={dashboard.metrics.deliveredShipments.toString()}
          helper="Completed carrier jobs"
        />
        <MetricCard
          icon="warehouse"
          label="Fleet Size"
          value={String(dashboard.carrier?.fleetSize ?? 0)}
          helper={dashboard.carrier?.verified ? "Verified carrier profile" : "Awaiting verification"}
        />
      </div>

      <div className="grid gap-8 xl:grid-cols-[1.05fr_1.35fr]">
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[var(--brand)]">business_center</span>
            <h3 className="text-xl font-bold">Carrier Profile</h3>
          </div>

          <article className="rounded-2xl border border-[var(--brand)]/10 bg-slate-800/40 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-lg font-bold">
                  {dashboard.carrier?.companyName ?? dashboard.profile.companyName ?? "Carrier profile pending"}
                </p>
                <p className="text-sm text-slate-400">
                  {dashboard.carrier
                    ? `${dashboard.carrier.totalDeliveries} total deliveries completed`
                    : "Create a carrier company record to start receiving assignments."}
                </p>
              </div>
              {dashboard.carrier ? (
                <span className="rounded-full bg-[var(--brand)]/10 px-3 py-1 text-xs font-bold text-[var(--brand)]">
                  {dashboard.carrier.verified ? "Verified" : "Pending"}
                </span>
              ) : null}
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <ProfileStat label="Service Modes" value={dashboard.carrier?.serviceModes.join(", ") || "Not configured"} />
              <ProfileStat
                label="Carrier Rating"
                value={dashboard.carrier ? `${dashboard.carrier.rating.toFixed(1)} / 5` : "Pending"}
              />
            </div>
          </article>

          <section className="rounded-2xl border border-[var(--brand)]/10 bg-gradient-to-br from-[var(--brand)]/10 to-transparent p-6">
            <h4 className="text-lg font-bold">Quick Actions</h4>
            <div className="mt-4 space-y-3 text-sm text-slate-300">
              <ActionLink href="/dashboard/marketplace" label="Review open load board" icon="travel_explore" />
              <ActionLink href="/dashboard/shipments" label="Open assigned shipments" icon="route" />
              <ActionLink href="/dashboard/settings" label="Manage account settings" icon="settings" />
            </div>
          </section>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold">Recent Opportunities</h3>
            <Link href="/dashboard/marketplace" className="text-sm font-bold text-[var(--brand)] hover:underline">
              View Board
            </Link>
          </div>

          <div className="space-y-4">
            {dashboard.recentOpportunities.length > 0 ? (
              dashboard.recentOpportunities.map((load) => (
                <article key={load.id} className="rounded-2xl border border-[var(--brand)]/10 bg-slate-800/40 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-base font-bold">{load.title}</p>
                      <p className="text-sm text-slate-400">{load.routeLabel}</p>
                      <p className="mt-1 text-xs uppercase tracking-wider text-slate-500">
                        {load.freightType ?? "general"} • {load.preferredMode}
                      </p>
                    </div>
                    <StatusBadge status={load.status} />
                  </div>
                  <div className="mt-4 grid gap-3 text-sm text-slate-300 sm:grid-cols-3">
                    <Info label="Budget" value={load.budgetUsd != null ? `$${load.budgetUsd}` : "TBD"} />
                    <Info label="Pickup" value={load.pickupDate ?? "TBD"} />
                    <Info label="Weight" value={load.weightKg != null ? `${load.weightKg} kg` : "TBD"} />
                  </div>
                </article>
              ))
            ) : (
              <EmptyCard
                icon="package_2"
                title="No open loads found"
                body="New opportunities will appear here when shippers publish compatible freight."
              />
            )}
          </div>
        </section>
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold">Assigned Shipments</h3>
          <Link href="/dashboard/shipments" className="text-sm font-bold text-[var(--brand)] hover:underline">
            View All
          </Link>
        </div>

        <div className="space-y-4">
          {dashboard.recentShipments.length > 0 ? (
            dashboard.recentShipments.map((shipment) => (
              <article key={shipment.id} className="rounded-2xl border border-[var(--brand)]/10 bg-slate-800/40 p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-base font-bold">{shipment.loadTitle}</p>
                    <p className="text-sm text-slate-400">{shipment.routeLabel}</p>
                    <p className="mt-1 text-xs uppercase tracking-wider text-slate-500">
                      {shipment.transportMode} • {shipment.distanceKm != null ? `${shipment.distanceKm} km` : "Distance pending"}
                    </p>
                  </div>
                  <StatusBadge status={shipment.status} />
                </div>
                <div className="mt-4 grid gap-3 text-sm text-slate-300 sm:grid-cols-3">
                  <Info label="Agreed Price" value={shipment.agreedPriceUsd != null ? `$${shipment.agreedPriceUsd}` : "TBD"} />
                  <Info
                    label="ETA"
                    value={shipment.estimatedDelivery ? new Date(shipment.estimatedDelivery).toLocaleString() : "TBD"}
                  />
                  <Info label="Latest Update" value={shipment.trackingUpdates.at(-1)?.label ?? "Awaiting first update"} />
                </div>
              </article>
            ))
          ) : (
            <EmptyCard
              icon="route"
              title="No assigned shipments yet"
              body="Accepted loads and carrier matches will appear here once they are assigned to your fleet."
            />
          )}
        </div>
      </section>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  helper,
}: {
  icon: string;
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--brand)]/5 bg-slate-800/40 p-6">
      <div className="mb-4 flex items-center justify-between">
        <span className="material-symbols-outlined rounded-lg bg-[var(--brand)]/10 p-2 text-[var(--brand)]">
          {icon}
        </span>
      </div>
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-bold">{value}</p>
      <p className="mt-2 text-xs text-slate-400">{helper}</p>
    </div>
  );
}

function EmptyCard({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-[var(--brand)]/10 bg-slate-800/40 p-8 text-center">
      <span className="material-symbols-outlined mb-3 block text-4xl text-[var(--brand)]/40">{icon}</span>
      <p className="font-bold">{title}</p>
      <p className="mt-2 text-sm text-slate-400">{body}</p>
    </div>
  );
}

function ActionLink({ href, label, icon }: { href: string; label: string; icon: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-2xl border border-[var(--brand)]/10 px-4 py-3 transition hover:border-[var(--brand)]/40 hover:bg-[var(--brand)]/5"
    >
      <span className="material-symbols-outlined text-[var(--brand)]">{icon}</span>
      <span>{label}</span>
    </Link>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-black/10 p-4">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function ProfileStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-black/10 p-4">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-semibold capitalize text-white">{value}</p>
    </div>
  );
}
