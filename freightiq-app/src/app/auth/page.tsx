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
    reset_sent?: string;
    password_reset?: string;
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
    <div className="flex min-h-screen">
      {/* ── Left brand panel ── */}
      <div className="relative hidden lg:flex lg:w-1/2 flex-col justify-between overflow-hidden bg-[linear-gradient(160deg,#071109_0%,#0c1a0e_50%,#102415_100%)] p-12">
        {/* Radial glows */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(25,230,25,0.18),transparent_45%),radial-gradient(circle_at_80%_80%,rgba(108,255,178,0.10),transparent_40%)]" />
        {/* Grid texture */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:48px_48px]" />
        {/* Dot pattern */}
        <div
          className="pointer-events-none absolute inset-0 opacity-15"
          style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.6) 0.5px, transparent 0.5px)", backgroundSize: "24px 24px" }}
        />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--brand)]/25 bg-[var(--brand)]/10 text-[var(--brand)] shadow-[0_0_24px_rgba(25,230,25,0.2)]">
            <span className="material-symbols-outlined text-2xl">local_shipping</span>
          </div>
          <span className="text-2xl font-bold tracking-tight text-white">FreightIQ</span>
        </div>

        {/* Main content */}
        <div className="relative z-10 max-w-lg">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--brand)]/30 bg-[var(--brand)]/10 px-4 py-1.5 text-sm font-medium text-[var(--brand)]">
            <span className="material-symbols-outlined text-base">eco</span>
            Intelligent Carbon Tracking
          </div>

          <h1 className="text-5xl font-bold leading-tight tracking-tight text-white">
            Redefining Logistics through{" "}
            <span className="text-[var(--brand)]">Sustainability.</span>
          </h1>

          <p className="mt-6 text-lg leading-relaxed text-slate-300">
            &ldquo;Transitioning to green shipping isn&rsquo;t just a corporate
            responsibility—it&rsquo;s the future of global commerce efficiency.&rdquo;
          </p>

          <div className="mt-8 flex items-center gap-4">
            <div className="flex -space-x-2">
              {["bg-emerald-500", "bg-teal-500", "bg-green-600"].map((color, i) => (
                <div
                  key={i}
                  className={`h-8 w-8 rounded-full ring-2 ring-[#071109] ${color} flex items-center justify-center text-xs font-bold text-white`}
                >
                  {["J", "M", "A"][i]}
                </div>
              ))}
            </div>
            <span className="text-sm font-medium text-slate-400">
              Trusted by 5,000+ carriers worldwide
            </span>
          </div>
        </div>

        {/* Bottom stats */}
        <div className="relative z-10 grid grid-cols-2 gap-8 border-t border-white/10 pt-8">
          <div>
            <p className="text-3xl font-bold text-white">42%</p>
            <p className="mt-1 text-sm text-slate-400">Avg. Carbon Reduction</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-white">2.4M</p>
            <p className="mt-1 text-sm text-slate-400">Shipments Tracked</p>
          </div>
        </div>
      </div>

      {/* ── Right auth panel ── */}
      <div className="flex w-full items-center justify-center bg-[#060e07] px-6 py-12 sm:px-12 lg:w-1/2 lg:px-16">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--brand)]/25 bg-[var(--brand)]/10 text-[var(--brand)]">
              <span className="material-symbols-outlined text-xl">local_shipping</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-white">FreightIQ</span>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--brand)]">
              {mode === "login" ? "Secure access" : "Workspace enrollment"}
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-white">
              {mode === "login" ? "Welcome back" : "Create your account"}
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              {mode === "login"
                ? "Log in to manage your shipments and carbon metrics."
                : "Start your free trial and join 5,000+ carriers."}
            </p>
          </div>

          <AuthCard
            error={params.error}
            initialMode={mode}
            nextPath={nextPath}
            passwordReset={params.password_reset}
            registered={params.registered}
            resetSent={params.reset_sent}
          />
        </div>
      </div>
    </div>
  );
}
