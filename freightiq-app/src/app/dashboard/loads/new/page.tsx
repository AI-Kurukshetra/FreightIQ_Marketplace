import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getShipperContext } from "@/lib/shipper/server";
import { createLoadAction } from "../actions";

export default async function NewLoadPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const context = await getShipperContext(supabase);

  if (!context.ok) {
    redirect(context.code === "FORBIDDEN" ? "/dashboard" : "/auth?mode=login&next=/dashboard/loads/new");
  }

  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Post a Load</h1>
          <p className="mt-2 text-[var(--muted)]">Create a new shipment posting for carriers to match.</p>
        </div>
        <Link className="rounded-lg border border-white/15 px-4 py-2 text-sm text-[var(--muted)] hover:text-white" href="/dashboard/loads">
          Back to loads
        </Link>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error === "missing_fields" ? "Please fill the required fields." : "Could not create the load. Try again."}
        </div>
      ) : null}

      <form action={createLoadAction} className="rounded-xl border border-white/10 bg-[#122a14] p-6">
        <div className="grid gap-5 md:grid-cols-2">
          <label className="block text-sm">
            Title <span className="text-[var(--brand)]">*</span>
            <input
              className="mt-2 h-11 w-full rounded-lg border border-white/10 bg-[#102615]/40 px-4 text-sm text-white placeholder:text-[#5f7263] focus:border-[var(--brand)]"
              name="title"
              placeholder="e.g., 12 pallets of electronics"
              required
              type="text"
            />
          </label>

          <label className="block text-sm">
            Preferred mode
            <select
              className="mt-2 h-11 w-full rounded-lg border border-white/10 bg-[#102615]/40 px-4 text-sm text-white focus:border-[var(--brand)]"
              defaultValue="truck"
              name="preferredMode"
            >
              <option value="truck">Truck</option>
              <option value="rail">Rail</option>
              <option value="sea">Sea</option>
              <option value="air">Air</option>
            </select>
          </label>

          <label className="block text-sm md:col-span-2">
            Origin address <span className="text-[var(--brand)]">*</span>
            <input
              className="mt-2 h-11 w-full rounded-lg border border-white/10 bg-[#102615]/40 px-4 text-sm text-white placeholder:text-[#5f7263] focus:border-[var(--brand)]"
              name="originAddress"
              placeholder="City, State / Warehouse address"
              required
              type="text"
            />
          </label>

          <label className="block text-sm md:col-span-2">
            Destination address <span className="text-[var(--brand)]">*</span>
            <input
              className="mt-2 h-11 w-full rounded-lg border border-white/10 bg-[#102615]/40 px-4 text-sm text-white placeholder:text-[#5f7263] focus:border-[var(--brand)]"
              name="destinationAddress"
              placeholder="City, State / DC address"
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
              placeholder="e.g., 9000"
              type="text"
            />
          </label>

          <label className="block text-sm">
            Budget (USD)
            <input
              className="mt-2 h-11 w-full rounded-lg border border-white/10 bg-[#102615]/40 px-4 text-sm text-white placeholder:text-[#5f7263] focus:border-[var(--brand)]"
              inputMode="decimal"
              name="budgetUsd"
              placeholder="e.g., 1200"
              type="text"
            />
          </label>

          <label className="block text-sm">
            Pickup date
            <input
              className="mt-2 h-11 w-full rounded-lg border border-white/10 bg-[#102615]/40 px-4 text-sm text-white focus:border-[var(--brand)]"
              name="pickupDate"
              type="date"
            />
          </label>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <Link className="rounded-lg border border-white/15 px-4 py-2 text-sm text-[var(--muted)] hover:text-white" href="/dashboard/loads">
            Cancel
          </Link>
          <button className="rounded-lg bg-[var(--brand)] px-5 py-2 text-sm font-bold text-[#112111] hover:bg-[var(--brand-strong)]" type="submit">
            Create Load
          </button>
        </div>
      </form>
    </section>
  );
}
