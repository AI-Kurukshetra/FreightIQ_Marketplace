import Link from "next/link";
import { redirect } from "next/navigation";
import { isCarrierRole } from "@/lib/auth/role-routing";
import { createClient } from "@/lib/supabase/server";
import { signOutAction } from "@/app/auth/actions";
import { DashboardNav } from "@/components/shared/dashboard-nav";

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth?mode=login&next=/dashboard");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .maybeSingle();

  const role = profile?.role ?? "shipper";
  const searchPlaceholder = isCarrierRole(role)
    ? "Search open loads or assigned shipments..."
    : "Search shipments, loads, or carriers...";

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--background)] text-[var(--foreground)]">
      {/* Sidebar */}
      <aside className="flex w-64 shrink-0 flex-col border-r border-[var(--brand)]/10 bg-[var(--surface)]">
        {/* Logo */}
        <div className="flex items-center gap-3 p-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--brand)]">
            <span className="material-symbols-outlined font-bold text-[#112111]">eco</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight">FreightIQ</h1>
        </div>

        {/* Main Nav */}
        <DashboardNav role={role} />

        {/* Upgrade card */}
        <div className="p-4">
          <div className="rounded-2xl border border-[var(--brand)]/20 bg-[var(--brand)]/5 p-4">
            <p className="text-xs font-bold text-[var(--brand)]">PRO PLAN</p>
            <p className="mt-1 text-sm text-slate-300">Upgrade for advanced CO2 analytics.</p>
            <Link
              href="/#pricing"
              className="mt-3 block w-full rounded-lg bg-[var(--brand)] py-2 text-center text-xs font-bold uppercase tracking-wider text-[#112111]"
            >
              Upgrade
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header */}
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-[var(--brand)]/10 bg-[var(--surface-soft)] px-8 backdrop-blur-md">
          {/* Search */}
          <div className="flex flex-1 max-w-xl items-center gap-4">
            <div className="relative w-full">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-xl text-slate-400">
                search
              </span>
              <input
                className="w-full rounded-xl border border-[var(--brand)]/10 bg-[var(--surface)] py-2 pl-10 pr-4 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:ring-2 focus:ring-[var(--brand)]/40"
                placeholder={searchPlaceholder}
                type="text"
              />
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-4">
            {/* Notification bell */}
            <button className="relative p-2 text-[var(--muted)] transition-colors hover:text-[var(--brand)]">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-[var(--surface-soft)] bg-[var(--brand)]" />
            </button>

            <div className="mx-2 h-8 w-px bg-[var(--brand)]/10" />

            {/* User info */}
            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-bold">{profile?.full_name ?? "Freight User"}</p>
                <p className="text-xs text-slate-500 capitalize">{role}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[var(--brand)]/20 bg-[var(--brand)]/10 text-sm font-bold text-[var(--brand)]">
                {(profile?.full_name ?? user.email ?? "U")[0].toUpperCase()}
              </div>
            </div>

            {/* Sign out */}
            <form action={signOutAction}>
              <button
                className="rounded-lg border border-[var(--brand)]/15 px-3 py-1.5 text-xs text-[var(--muted)] transition hover:border-[var(--brand)] hover:text-[var(--brand)]"
                type="submit"
              >
                Sign out
              </button>
            </form>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
