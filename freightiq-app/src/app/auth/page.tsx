import { redirect } from "next/navigation";
import { getProfileRole, resolveDashboardPathForRole, safeNextPath } from "@/lib/auth/role-routing";
import { createClient } from "@/lib/supabase/server";
import { AuthCard } from "./auth-card";

type AuthMode = "login" | "register";

function normalizeMode(mode: string | undefined): AuthMode {
  return mode === "register" ? "register" : "login";
}

export default async function AuthPage({
  searchParams,
}: {
  searchParams: Promise<{
    mode?: string;
    error?: string;
    registered?: string;
    next?: string;
  }>;
}) {
  const params = await searchParams;
  const mode = normalizeMode(params.mode);
  const nextPath = safeNextPath(params.next);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const role = await getProfileRole(supabase, user.id);
    redirect(resolveDashboardPathForRole(role, nextPath));
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden">
      {/* ── Header ── */}
      <header className="flex items-center justify-between whitespace-nowrap border-b border-[var(--brand)]/10 px-6 py-3 lg:px-10">
        <div className="flex items-center gap-4">
          <div className="text-[var(--brand)]">
            <span className="material-symbols-outlined text-3xl">eco</span>
          </div>
          <h2 className="text-lg font-bold leading-tight tracking-[-0.015em] text-white">
            FreightIQ
          </h2>
        </div>

        <div className="flex flex-1 items-center justify-end gap-8">
          <nav className="hidden items-center gap-9 md:flex">
            <a
              href="/#solutions"
              className="text-sm font-medium text-[var(--muted)] transition-colors hover:text-[var(--brand)]"
            >
              Platform
            </a>
            <a
              href="/#impact"
              className="text-sm font-medium text-[var(--muted)] transition-colors hover:text-[var(--brand)]"
            >
              CO2 Impact
            </a>
          </nav>
          <a
            href="/"
            className="flex h-10 min-w-[100px] cursor-pointer items-center justify-center rounded-lg bg-[var(--brand)] px-4 text-sm font-bold leading-normal tracking-[0.015em] text-[#112111] transition hover:opacity-90"
          >
            Contact Sales
          </a>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="flex flex-1 items-center justify-center p-4 sm:p-6 lg:p-10">
        <div className="flex w-full max-w-[480px] flex-col gap-6">
          {/* Title block */}
          <div className="flex flex-col gap-2 text-center">
            <h1 className="text-3xl font-bold leading-tight tracking-tight text-white">
              {mode === "login" ? "Welcome Back" : "Create Your Account"}
            </h1>
            <p className="text-sm text-[var(--muted)]">
              Join the network of sustainable logistics and reduce your carbon footprint.
            </p>
          </div>

          {/* Auth card */}
          <AuthCard
            error={params.error}
            initialMode={mode}
            nextPath={nextPath}
            registered={params.registered}
          />
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="p-6 text-center">
        <p className="text-sm font-medium text-[var(--muted)]">
          © 2025 FreightIQ Inc. Saving 2.4k tons of CO2 this month.
        </p>
      </footer>
    </div>
  );
}
