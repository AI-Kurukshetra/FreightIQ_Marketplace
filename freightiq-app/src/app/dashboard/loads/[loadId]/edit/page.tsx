import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getShipperContext, getShipperLoadDetail, SHIPPER_MODE_OPTIONS } from "@/lib/shipper/server";
import { updateLoadAction } from "../../actions";

const FREIGHT_TYPE_OPTIONS = [
  "Consumer goods",
  "Food and beverage",
  "Industrial materials",
  "Electronics",
  "Healthcare",
  "Retail replenishment",
];

function parseError(error: string | undefined) {
  if (!error) return null;
  if (error === "missing_fields") return "Please fill all required fields.";
  if (error === "locked") return "Only open loads without active shipments can be edited.";
  if (error === "not_found") return "This load no longer exists.";
  return "Could not update the load right now. Try again.";
}

export default async function EditLoadPage({
  params,
  searchParams,
}: {
  params: Promise<{ loadId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { loadId } = await params;
  const { error } = await searchParams;
  const supabase = await createClient();
  const context = await getShipperContext(supabase);

  if (!context.ok) {
    redirect(context.code === "FORBIDDEN" ? "/dashboard" : `/auth?mode=login&next=/dashboard/loads/${loadId}/edit`);
  }

  const detail = await getShipperLoadDetail(supabase, context.profile, loadId);

  if (!detail) {
    notFound();
  }

  const load = detail.load;
  const errorMessage = parseError(error);

  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Edit Load</h1>
          <p className="mt-2 text-[var(--muted)]">Update load details before assignment.</p>
        </div>
        <div className="flex gap-2">
          <Link className="rounded-lg border border-white/15 px-4 py-2 text-sm text-[var(--muted)] hover:text-white" href={`/dashboard/loads/${load.id}`}>
            View Detail
          </Link>
          <Link className="rounded-lg border border-white/15 px-4 py-2 text-sm text-[var(--muted)] hover:text-white" href="/dashboard/loads">
            Back to loads
          </Link>
        </div>
      </div>

      {errorMessage ? (
        <div className="rounded-lg border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{errorMessage}</div>
      ) : null}

      <form action={updateLoadAction} className="rounded-xl border border-white/10 bg-[#122a14] p-6">
        <input type="hidden" name="loadId" value={load.id} />
        <input type="hidden" name="sourcePath" value={`/dashboard/loads/${load.id}/edit`} />

        <div className="grid gap-5 md:grid-cols-2">
          <label className="block text-sm">
            Title <span className="text-[var(--brand)]">*</span>
            <input
              className="mt-2 h-11 w-full rounded-lg border border-white/10 bg-[#102615]/40 px-4 text-sm text-white placeholder:text-[#5f7263] focus:border-[var(--brand)]"
              name="title"
              defaultValue={load.title}
              required
              type="text"
            />
          </label>

          <label className="block text-sm">
            Preferred mode
            <select
              className="mt-2 h-11 w-full rounded-lg border border-white/10 bg-[#102615]/40 px-4 text-sm text-white focus:border-[var(--brand)]"
              defaultValue={load.preferredMode}
              name="preferredMode"
            >
              {SHIPPER_MODE_OPTIONS.map((mode) => (
                <option key={mode} value={mode}>
                  {mode.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm md:col-span-2">
            Origin address <span className="text-[var(--brand)]">*</span>
            <input
              className="mt-2 h-11 w-full rounded-lg border border-white/10 bg-[#102615]/40 px-4 text-sm text-white placeholder:text-[#5f7263] focus:border-[var(--brand)]"
              name="originAddress"
              defaultValue={load.originAddress}
              required
              type="text"
            />
          </label>

          <label className="block text-sm md:col-span-2">
            Destination address <span className="text-[var(--brand)]">*</span>
            <input
              className="mt-2 h-11 w-full rounded-lg border border-white/10 bg-[#102615]/40 px-4 text-sm text-white placeholder:text-[#5f7263] focus:border-[var(--brand)]"
              name="destinationAddress"
              defaultValue={load.destinationAddress}
              required
              type="text"
            />
          </label>

          <label className="block text-sm">
            Weight (kg)
            <input
              className="mt-2 h-11 w-full rounded-lg border border-white/10 bg-[#102615]/40 px-4 text-sm text-white placeholder:text-[#5f7263] focus:border-[var(--brand)]"
              inputMode="decimal"
              name="weightKg"
              defaultValue={load.weightKg ?? ""}
              type="text"
            />
          </label>

          <label className="block text-sm">
            Volume (m3)
            <input
              className="mt-2 h-11 w-full rounded-lg border border-white/10 bg-[#102615]/40 px-4 text-sm text-white placeholder:text-[#5f7263] focus:border-[var(--brand)]"
              inputMode="decimal"
              name="volumeM3"
              defaultValue={load.volumeM3 ?? ""}
              type="text"
            />
          </label>

          <label className="block text-sm">
            Budget (USD)
            <input
              className="mt-2 h-11 w-full rounded-lg border border-white/10 bg-[#102615]/40 px-4 text-sm text-white placeholder:text-[#5f7263] focus:border-[var(--brand)]"
              inputMode="decimal"
              name="budgetUsd"
              defaultValue={load.budgetUsd ?? ""}
              type="text"
            />
          </label>

          <label className="block text-sm">
            Freight type
            <input
              className="mt-2 h-11 w-full rounded-lg border border-white/10 bg-[#102615]/40 px-4 text-sm text-white placeholder:text-[#5f7263] focus:border-[var(--brand)]"
              list="freight-type-options-edit"
              name="freightType"
              defaultValue={load.freightType ?? ""}
              type="text"
            />
            <datalist id="freight-type-options-edit">
              {FREIGHT_TYPE_OPTIONS.map((option) => (
                <option key={option} value={option} />
              ))}
            </datalist>
          </label>

          <label className="block text-sm">
            Pickup date
            <input
              className="mt-2 h-11 w-full rounded-lg border border-white/10 bg-[#102615]/40 px-4 text-sm text-white focus:border-[var(--brand)]"
              name="pickupDate"
              defaultValue={load.pickupDate ?? ""}
              type="date"
            />
          </label>

          <label className="block text-sm">
            Delivery date
            <input
              className="mt-2 h-11 w-full rounded-lg border border-white/10 bg-[#102615]/40 px-4 text-sm text-white focus:border-[var(--brand)]"
              name="deliveryDate"
              defaultValue={load.deliveryDate ?? ""}
              type="date"
            />
          </label>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <Link className="rounded-lg border border-white/15 px-4 py-2 text-sm text-[var(--muted)] hover:text-white" href={`/dashboard/loads/${load.id}`}>
            Cancel
          </Link>
          <button className="rounded-lg bg-[var(--brand)] px-5 py-2 text-sm font-bold text-[#112111] hover:bg-[var(--brand-strong)]" type="submit">
            Save Changes
          </button>
        </div>
      </form>
    </section>
  );
}
