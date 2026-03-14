import Link from "next/link";
import { redirect } from "next/navigation";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { RealtimeJourneyBoard } from "@/components/maps/realtime-journey-board";
import { SubmitButton } from "@/components/shared/submit-button";
import { getProfileRole, isCarrierRole } from "@/lib/auth/role-routing";
import {
  type CarrierDashboardData,
  getCarrierContext,
  getCarrierDashboardData,
} from "@/lib/carrier/server";
import { createClient } from "@/lib/supabase/server";
import { getShipperContext, getShipperDashboardData } from "@/lib/shipper/server";
import { deleteLoadAction } from "./loads/actions";
import { postCarrierRouteAction, removeCarrierRouteAction } from "./actions";

type CarrierChartDatum = {
  label: string;
  value: number;
  tone: string;
};

type DashboardPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = (await searchParams) ?? {};
  const routePosted = firstParam(params.route_posted);
  const routeRemoved = firstParam(params.route_removed);
  const routeError = firstParam(params.route_error);

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
    return <CarrierDashboard dashboard={dashboard} routePosted={routePosted} routeRemoved={routeRemoved} routeError={routeError} />;
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

      <RealtimeJourneyBoard
        title="Shipment Control Tower"
        description="Follow each assigned load on a live route canvas with continuously refreshed milestones and route progress."
        initialJourneys={dashboard.recentShipments}
        refreshUrl="/api/shipper/shipments"
        emptyTitle="No live shipments to map yet"
        emptyBody="Once a carrier is assigned, this board will geocode both endpoints, draw the route, and keep the shipment position updated."
        roleLabel="shipper"
      />

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
                    Actions
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
                        <div className="flex justify-end gap-4 text-sm">
                          <Link
                            href={`/dashboard/loads/${load.id}`}
                            className="font-bold text-[var(--brand)] hover:underline"
                          >
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

function CarrierDashboard({
  dashboard,
  routePosted,
  routeRemoved,
  routeError,
}: {
  dashboard: CarrierDashboardData;
  routePosted?: string;
  routeRemoved?: string;
  routeError?: string;
}) {
  const accountLabel = dashboard.profile.fullName ?? dashboard.carrier?.companyName ?? dashboard.profile.email ?? "Carrier";
  const routeErrorMessage =
    routeError === "validation_error"
      ? "Origin and destination are required to post a route."
      : routeError === "conflict"
        ? "This route is already posted in your corridor list."
        : routeError === "not_found"
          ? "This posted route could not be found."
        : routeError
          ? "Route action failed. Try again."
          : null;
  const shipmentStatusData = getCarrierStatusData(dashboard.recentShipments);
  const modeMixData = getCarrierModeData(dashboard.recentShipments);
  const revenueTrendData = getCarrierRevenueTrend(dashboard.recentShipments);
  const avgRevenue =
    dashboard.recentShipments.length > 0
      ? Math.round(
          dashboard.recentShipments.reduce((sum, shipment) => sum + (shipment.agreedPriceUsd ?? 0), 0) /
            dashboard.recentShipments.length
        )
      : 0;
  const avgDistance =
    dashboard.recentShipments.length > 0
      ? Math.round(
          dashboard.recentShipments.reduce((sum, shipment) => sum + (shipment.distanceKm ?? 0), 0) /
            dashboard.recentShipments.length
        )
      : 0;
  const avgCo2PerShipment =
    dashboard.recentShipments.length > 0
      ? Math.round(
          dashboard.recentShipments.reduce((sum, shipment) => sum + (shipment.co2Kg ?? 0), 0) /
            dashboard.recentShipments.length
        )
      : 0;
  const dispatchReadiness =
    dashboard.metrics.assignedShipments > 0
      ? Math.round((dashboard.metrics.activeShipments / dashboard.metrics.assignedShipments) * 100)
      : 0;

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
          href={dashboard.carrier ? "/dashboard/marketplace" : "/dashboard/settings"}
          className="flex items-center gap-2 rounded-xl bg-[var(--brand)] px-6 py-3 font-bold text-[#112111] shadow-lg shadow-[var(--brand)]/20 transition hover:bg-[var(--brand-strong)]"
        >
          <span className="material-symbols-outlined font-bold">travel_explore</span>
          {dashboard.carrier ? "Browse Open Loads" : "Create Carrier Profile"}
        </Link>
      </div>

      {!dashboard.carrier ? (
        <div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 px-5 py-4 text-sm text-amber-100">
          <p>
            Your carrier company profile is not configured yet. Create it to accept loads and activate shipment tracking.
          </p>
          <Link href="/dashboard/settings" className="mt-3 inline-flex font-semibold text-amber-50 underline underline-offset-4">
            Open Carrier Settings
          </Link>
        </div>
      ) : null}

      {routePosted ? (
        <div className="rounded-2xl border border-[var(--brand)]/20 bg-[var(--brand)]/10 px-5 py-4 text-sm text-[var(--foreground)]">
          Route posted successfully. Marketplace matching will use this corridor in carrier fit scoring.
        </div>
      ) : null}
      {routeRemoved ? (
        <div className="rounded-2xl border border-[var(--brand)]/20 bg-[var(--brand)]/10 px-5 py-4 text-sm text-[var(--foreground)]">
          Route removed successfully.
        </div>
      ) : null}

      {routeErrorMessage ? (
        <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-5 py-4 text-sm text-red-100">
          {routeErrorMessage}
        </div>
      ) : null}

      <section className="rounded-2xl border border-[var(--brand)]/10 bg-slate-900/45 p-6">
        <div className="flex items-center justify-between gap-3">
          <h4 className="text-lg font-bold">Route Posting</h4>
          <span className="rounded-full bg-[var(--brand)]/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--brand)]">
            {dashboard.carrier?.coverageCorridors.length ?? 0} posted
          </span>
        </div>
        <p className="mt-2 text-sm text-slate-400">
          Post your operating corridors so load matching can prioritize lanes your fleet actively serves.
        </p>

        {dashboard.carrier ? (
          <form action={postCarrierRouteAction} className="mt-4 grid gap-4 md:grid-cols-[1fr_1fr_180px_auto]">
            <input type="hidden" name="sourcePath" value="/dashboard" />
            <label className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Origin</span>
              <input
                type="text"
                name="origin"
                required
                placeholder="Ahmedabad"
                className="w-full rounded-2xl border border-white/10 bg-black/15 px-4 py-3 text-sm text-white placeholder:text-slate-500"
              />
            </label>
            <label className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Destination</span>
              <input
                type="text"
                name="destination"
                required
                placeholder="Mumbai"
                className="w-full rounded-2xl border border-white/10 bg-black/15 px-4 py-3 text-sm text-white placeholder:text-slate-500"
              />
            </label>
            <label className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Radius (km)</span>
              <input
                type="number"
                name="radiusKm"
                min="10"
                step="5"
                defaultValue={120}
                className="w-full rounded-2xl border border-white/10 bg-black/15 px-4 py-3 text-sm text-white"
              />
            </label>
            <div className="self-end">
              <SubmitButton
                idleLabel="Post Route"
                pendingLabel="Posting..."
                className="w-full rounded-2xl bg-[var(--brand)] px-5 py-3 text-sm font-bold text-[#112111] transition hover:bg-[var(--brand-strong)] disabled:cursor-not-allowed disabled:opacity-70"
              />
            </div>
          </form>
        ) : (
          <p className="mt-4 text-sm text-slate-400">Create a carrier profile first to post routes.</p>
        )}

        <div className="mt-5 space-y-2">
          {dashboard.carrier && dashboard.carrier.coverageCorridors.length > 0 ? (
            dashboard.carrier.coverageCorridors.map((corridor) => (
              <div
                key={`${corridor.origin}-${corridor.destination}`}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/8 bg-black/10 px-4 py-3 text-sm text-slate-300"
              >
                <div>
                  {corridor.origin} -&gt; {corridor.destination}
                  <span className="ml-2 text-xs text-slate-500">({corridor.radiusKm ?? 120} km)</span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <Link href="/dashboard/marketplace" className="font-semibold text-[var(--brand)] hover:underline">
                    View Loads
                  </Link>
                  <form action={removeCarrierRouteAction}>
                    <input type="hidden" name="sourcePath" value="/dashboard" />
                    <input type="hidden" name="origin" value={corridor.origin} />
                    <input type="hidden" name="destination" value={corridor.destination} />
                    <button type="submit" className="font-semibold text-red-300 hover:text-red-200">
                      Remove
                    </button>
                  </form>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-400">No corridors posted yet.</p>
          )}
        </div>
      </section>

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

      <RealtimeJourneyBoard
        title="Fleet Route Visibility"
        description="Track assigned freight on an interactive network map and keep dispatch aligned with the latest shipment status."
        initialJourneys={dashboard.recentShipments}
        prioritizeActiveJourneys
        refreshUrl="/api/carrier/shipments"
        emptyTitle="No assigned shipment is on the map yet"
        emptyBody="As soon as your carrier account is matched to a load, the dashboard will draw the route and animate the current shipment position."
        roleLabel="carrier"
      />

      <div className="grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-[28px] border border-[var(--brand)]/10 bg-[linear-gradient(180deg,rgba(15,31,15,0.92),rgba(8,14,10,0.92))] p-6 shadow-[0_30px_80px_rgba(3,10,4,0.35)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--brand)]">Carrier Analytics</p>
              <h3 className="mt-2 text-2xl font-bold text-white">Operational health snapshot</h3>
              <p className="mt-2 max-w-2xl text-sm text-slate-400">
                Monitor shipment momentum, mode concentration, and billing velocity from the latest carrier jobs.
              </p>
            </div>
            <div className="rounded-full border border-[var(--brand)]/15 bg-[var(--brand)]/8 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--brand)]">
              Last {dashboard.recentShipments.length || 0} shipments
            </div>
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            <AnalyticsCard
              title="Shipment Status Mix"
              caption="Distribution of current carrier workload by shipment state."
            >
              <StackedBarChart data={shipmentStatusData} emptyLabel="No assigned shipments yet." />
            </AnalyticsCard>

            <AnalyticsCard title="Mode Mix" caption="What your current assigned jobs look like by transport mode.">
              <DistributionChart data={modeMixData} emptyLabel="Transport mode analytics will appear here." />
            </AnalyticsCard>

            <AnalyticsCard
              title="Revenue Trend"
              caption="Agreed shipment value across the most recent jobs in your board."
              className="lg:col-span-2"
            >
              <RevenueBars data={revenueTrendData} />
            </AnalyticsCard>

            <AnalyticsCard
              title="Dispatch Insights"
              caption="A compact operational summary for your dispatch lead."
              className="lg:col-span-2"
            >
              <div className="grid gap-3 lg:grid-cols-2">
                <Info label="Dispatch Readiness" value={`${dispatchReadiness}%`} />
                <Info label="Average Revenue" value={avgRevenue > 0 ? `$${avgRevenue}` : "TBD"} />
                <Info label="Average Distance" value={avgDistance > 0 ? `${avgDistance} km` : "Pending"} />
                <Info label="Average CO2" value={avgCo2PerShipment > 0 ? `${avgCo2PerShipment} kg` : "Pending"} />
              </div>
            </AnalyticsCard>
          </div>
        </section>

        <section className="rounded-[28px] border border-[var(--brand)]/10 bg-slate-900/45 p-6 shadow-[0_24px_70px_rgba(3,10,4,0.28)]">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--brand)]/10 text-[var(--brand)]">
              <span className="material-symbols-outlined">insights</span>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--brand)]">Performance Signals</p>
              <h3 className="text-xl font-bold text-white">Dispatch guidance</h3>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <SignalCard
              title="Open board pressure"
              value={dashboard.metrics.availableLoads.toString()}
              body="Loads currently visible to your carrier team that match your operating modes."
              icon="travel_explore"
            />
            <SignalCard
              title="Active movement"
              value={dashboard.metrics.activeShipments.toString()}
              body="Shipments currently in matched, picked up, or in-transit states."
              icon="route"
            />
            <SignalCard
              title="Delivery confidence"
              value={dashboard.carrier ? `${dashboard.carrier.rating.toFixed(1)} / 5` : "Pending"}
              body="Carrier rating signal combined with verified fleet status for marketplace trust."
              icon="verified"
            />
          </div>
        </section>
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
              <ActionLink
                href="/dashboard/settings"
                label={dashboard.carrier ? "Manage account settings" : "Create carrier profile"}
                icon="settings"
              />
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

function getCarrierStatusData(shipments: CarrierDashboardData["recentShipments"]): CarrierChartDatum[] {
  const counts = new Map<string, number>();

  for (const shipment of shipments) {
    counts.set(shipment.status, (counts.get(shipment.status) ?? 0) + 1);
  }

  return [
    { label: "Matched", value: counts.get("matched") ?? 0, tone: "from-[#68f768] to-[#22c55e]" },
    { label: "Picked Up", value: counts.get("picked_up") ?? 0, tone: "from-[#7dd3fc] to-[#38bdf8]" },
    { label: "In Transit", value: counts.get("in_transit") ?? 0, tone: "from-[#facc15] to-[#fb923c]" },
    { label: "Delivered", value: counts.get("delivered") ?? 0, tone: "from-[#c084fc] to-[#8b5cf6]" },
  ].filter((item) => item.value > 0);
}

function getCarrierModeData(shipments: CarrierDashboardData["recentShipments"]): CarrierChartDatum[] {
  const counts = new Map<string, number>();

  for (const shipment of shipments) {
    const mode = shipment.transportMode || "truck";
    counts.set(mode, (counts.get(mode) ?? 0) + 1);
  }

  return [
    { label: "Truck", value: counts.get("truck") ?? 0, tone: "from-[#19e619] to-[#6bf16b]" },
    { label: "Rail", value: counts.get("rail") ?? 0, tone: "from-[#60a5fa] to-[#2563eb]" },
    { label: "Sea", value: counts.get("sea") ?? 0, tone: "from-[#34d399] to-[#059669]" },
    { label: "Air", value: counts.get("air") ?? 0, tone: "from-[#f59e0b] to-[#ef4444]" },
  ].filter((item) => item.value > 0);
}

function getCarrierRevenueTrend(shipments: CarrierDashboardData["recentShipments"]) {
  return [...shipments]
    .reverse()
    .slice(-6)
    .map((shipment, index) => ({
      label: `Job ${index + 1}`,
      value: Math.round(shipment.agreedPriceUsd ?? 0),
      status: shipment.status,
    }));
}

function AnalyticsCard({
  title,
  caption,
  children,
  className,
}: {
  title: string;
  caption: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <article className={`rounded-[24px] border border-white/8 bg-white/[0.03] p-5 ${className ?? ""}`}>
      <div className="mb-4">
        <p className="text-lg font-bold text-white">{title}</p>
        <p className="mt-1 text-sm text-slate-400">{caption}</p>
      </div>
      {children}
    </article>
  );
}

function StackedBarChart({ data, emptyLabel }: { data: CarrierChartDatum[]; emptyLabel: string }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  if (total === 0) {
    return <p className="text-sm text-slate-400">{emptyLabel}</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex h-4 overflow-hidden rounded-full bg-white/8">
        {data.map((item) => (
          <div
            key={item.label}
            className={`h-full bg-gradient-to-r ${item.tone}`}
            style={{ width: `${(item.value / total) * 100}%` }}
          />
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {data.map((item) => (
          <div key={item.label} className="rounded-2xl border border-white/8 bg-black/15 p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-semibold text-white">{item.label}</span>
              <span className="text-sm font-bold text-[var(--brand)]">{item.value}</span>
            </div>
            <p className="mt-2 text-xs text-slate-400">{Math.round((item.value / total) * 100)}% of tracked jobs</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function DistributionChart({ data, emptyLabel }: { data: CarrierChartDatum[]; emptyLabel: string }) {
  const maxValue = Math.max(...data.map((item) => item.value), 0);

  if (maxValue === 0) {
    return <p className="text-sm text-slate-400">{emptyLabel}</p>;
  }

  return (
    <div className="space-y-4">
      {data.map((item) => (
        <div key={item.label} className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-white">{item.label}</span>
            <span className="text-slate-400">{item.value} jobs</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-white/8">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${item.tone}`}
              style={{ width: `${(item.value / maxValue) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function RevenueBars({
  data,
}: {
  data: Array<{ label: string; value: number; status: string }>;
}) {
  const maxValue = Math.max(...data.map((item) => item.value), 0);

  if (maxValue === 0) {
    return <p className="text-sm text-slate-400">Revenue bars will populate once agreed pricing exists on shipments.</p>;
  }

  return (
    <div className="overflow-x-auto pb-1">
      <div className="flex min-w-[520px] items-end gap-2.5 pr-1">
        {data.map((item) => (
          <div key={`${item.label}-${item.status}`} className="flex w-[78px] shrink-0 flex-col items-center gap-2.5">
            <div className="whitespace-nowrap text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
              ${item.value}
            </div>
            <div className="flex h-44 w-full items-end rounded-[20px] border border-white/8 bg-black/15 p-2">
              <div
                className="w-full rounded-[14px] bg-[linear-gradient(180deg,rgba(25,230,25,0.95),rgba(12,88,18,0.95))]"
                style={{ height: `${Math.max((item.value / maxValue) * 100, 12)}%` }}
              />
            </div>
            <div className="text-center">
              <p className="text-xs font-semibold text-white">{item.label}</p>
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">{item.status.replaceAll("_", " ")}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SignalCard({
  title,
  value,
  body,
  icon,
}: {
  title: string;
  value: string;
  body: string;
  icon: string;
}) {
  return (
    <article className="rounded-[24px] border border-white/8 bg-white/[0.03] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-white">{title}</p>
          <p className="mt-2 text-3xl font-bold text-[var(--brand)]">{value}</p>
        </div>
        <span className="material-symbols-outlined rounded-2xl bg-[var(--brand)]/10 p-3 text-[var(--brand)]">
          {icon}
        </span>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-slate-400">{body}</p>
    </article>
  );
}
