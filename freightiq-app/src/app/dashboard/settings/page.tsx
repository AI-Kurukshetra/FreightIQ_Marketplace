import { redirect } from "next/navigation";
import { SubmitButton } from "@/components/shared/submit-button";
import { getCarrierContext, getCarrierSettingsSnapshot } from "@/lib/carrier/server";
import { createClient } from "@/lib/supabase/server";
import { updateCarrierSettingsAction } from "./actions";

type SettingsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

const SERVICE_MODE_OPTIONS = [
  "truck",
  "ev_truck",
  "van",
  "flatbed",
  "reefer",
  "drayage",
  "rail",
  "intermodal",
  "sea",
  "air",
  "express_air",
];

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const params = (await searchParams) ?? {};
  const saved = firstParam(params.saved);
  const error = firstParam(params.error);

  const supabase = await createClient();
  const context = await getCarrierContext(supabase);

  if (!context.ok) {
    redirect(context.code === "FORBIDDEN" ? "/dashboard" : "/auth?mode=login&next=/dashboard/settings");
  }

  const snapshot = await getCarrierSettingsSnapshot(supabase, context.profile, context.carrier);
  const isCreatingCarrierProfile = !snapshot.carrier;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Carrier Settings</h1>
        <p className="mt-2 max-w-3xl text-[var(--muted)]">
          Manage your dispatch identity, fleet configuration, supported transport modes, and the corridors used for marketplace matching.
        </p>
      </div>

      {saved ? (
        <div className="rounded-2xl border border-[var(--brand)]/20 bg-[var(--brand)]/10 px-5 py-4 text-sm text-[var(--foreground)]">
          Carrier profile updated successfully.
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-5 py-4 text-sm text-red-100">
          Unable to save settings: {error.replaceAll("_", " ")}.
        </div>
      ) : null}

      {isCreatingCarrierProfile ? (
        <div className="rounded-2xl border border-amber-300/20 bg-amber-500/10 px-5 py-4 text-sm text-amber-100">
          No carrier profile exists for this account yet. Complete the form below and submit
          <span className="font-semibold"> Create Carrier Profile</span> to enable marketplace acceptance and assigned shipments.
        </div>
      ) : null}

      <form action={updateCarrierSettingsAction} className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="space-y-6 rounded-[28px] border border-[var(--brand)]/10 bg-slate-900/45 p-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--brand)]">Account</p>
            <h2 className="mt-2 text-2xl font-bold">Carrier identity</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Full Name</span>
              <input
                type="text"
                name="fullName"
                defaultValue={snapshot.profile.fullName ?? ""}
                className="w-full rounded-2xl border border-white/10 bg-black/15 px-4 py-3 text-sm text-white"
              />
            </label>
            <label className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Email</span>
              <input
                type="email"
                value={snapshot.profile.email ?? ""}
                disabled
                className="w-full rounded-2xl border border-white/10 bg-black/10 px-4 py-3 text-sm text-slate-400"
              />
            </label>
            <label className="space-y-2 md:col-span-2">
              <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Company Name</span>
              <input
                type="text"
                name="companyName"
                defaultValue={snapshot.carrier?.companyName ?? snapshot.profile.companyName ?? ""}
                className="w-full rounded-2xl border border-white/10 bg-black/15 px-4 py-3 text-sm text-white"
              />
            </label>
            <label className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Fleet Size</span>
              <input
                type="number"
                min="0"
                name="fleetSize"
                defaultValue={snapshot.carrier?.fleetSize ?? 0}
                className="w-full rounded-2xl border border-white/10 bg-black/15 px-4 py-3 text-sm text-white"
              />
            </label>
            <div className="rounded-2xl border border-white/8 bg-black/10 p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Verification</p>
              <p className="mt-2 text-sm font-semibold text-white">{snapshot.carrier?.verified ? "Verified carrier" : "Pending verification"}</p>
              <p className="mt-2 text-xs text-slate-400">
                Verified carrier profiles appear with higher confidence in shipper matching views.
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-6 rounded-[28px] border border-[var(--brand)]/10 bg-[linear-gradient(180deg,rgba(15,31,15,0.92),rgba(8,14,10,0.92))] p-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--brand)]">Matching</p>
            <h2 className="mt-2 text-2xl font-bold">Service modes and corridors</h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {SERVICE_MODE_OPTIONS.map((mode) => {
              const checked = snapshot.carrier?.serviceModes.includes(mode) ?? mode === "truck";

              return (
                <label
                  key={mode}
                  className="flex items-center gap-3 rounded-2xl border border-white/8 bg-black/10 px-4 py-3 text-sm text-white"
                >
                  <input type="checkbox" name="serviceModes" value={mode} defaultChecked={checked} className="h-4 w-4" />
                  <span className="capitalize">{mode.replaceAll("_", " ")}</span>
                </label>
              );
            })}
          </div>

          <label className="block space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Corridors</span>
            <textarea
              name="corridorsText"
              rows={8}
              defaultValue={snapshot.corridorsText}
              placeholder={`Ahmedabad -> Mumbai\nDelhi -> Jaipur\nChennai -> Bengaluru`}
              className="w-full rounded-2xl border border-white/10 bg-black/15 px-4 py-3 text-sm text-white placeholder:text-slate-500"
            />
          </label>

          <div className="rounded-2xl border border-white/8 bg-black/10 p-4 text-sm text-slate-300">
            Enter one corridor per line in the format <code>Origin -&gt; Destination</code>. Each line is saved as a
            matching corridor.
          </div>

          <SubmitButton
            idleLabel={isCreatingCarrierProfile ? "Create Carrier Profile" : "Save Carrier Settings"}
            pendingLabel={isCreatingCarrierProfile ? "Creating..." : "Saving..."}
            className="w-full rounded-2xl bg-[var(--brand)] px-5 py-3 text-sm font-bold text-[#112111] transition hover:bg-[var(--brand-strong)] disabled:cursor-not-allowed disabled:opacity-70"
          />
        </section>
      </form>
    </div>
  );
}
