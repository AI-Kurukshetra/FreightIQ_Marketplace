"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { loginAction, registerAction } from "./actions";

/* ─────────────────────────────────────────────── types */
type AuthMode = "login" | "register";

type AuthCardProps = {
  initialMode: AuthMode;
  nextPath: string;
  error?: string;
  registered?: string;
};

/* ─────────────────────────────────────────────── error map */
const errorMap: Record<string, string> = {
  missing_fields: "Please fill all required fields.",
  invalid_credentials: "Invalid email or password.",
  weak_password: "Password must be at least 8 characters.",
  invalid_role: "Please select a valid account role.",
  signup_failed: "Unable to create account right now. Try again.",
  callback_failed: "Could not complete sign in. Please try again.",
  missing_code: "Missing login token. Please retry sign in.",
};

/* ─────────────────────────────────────────────── role card */
function RoleCard({
  active,
  title,
  subtitle,
  icon,
  name,
  value,
  onChange,
}: {
  active: boolean;
  title: string;
  subtitle: string;
  icon: string;
  name: string;
  value: string;
  onChange: () => void;
}) {
  return (
    <label className="relative cursor-pointer group">
      <input
        checked={active}
        className="peer sr-only"
        name={name}
        onChange={onChange}
        type="radio"
        value={value}
      />
      <div
        className={`flex flex-col gap-2 rounded-lg border p-4 transition-all
          bg-[var(--brand)]/5
          peer-checked:border-[var(--brand)] peer-checked:ring-1 peer-checked:ring-[var(--brand)]
          ${active ? "border-[var(--brand)]" : "border-[var(--brand)]/10 hover:border-[var(--brand)]/40"}`}
      >
        <span className="material-symbols-outlined text-[var(--brand)]">{icon}</span>
        <div className="flex flex-col">
          <span className="text-sm font-bold text-white">{title}</span>
          <span className="text-xs text-[var(--muted)]">{subtitle}</span>
        </div>
      </div>
    </label>
  );
}

/* ─────────────────────────────────────────────── password input */
function PasswordInput({
  id,
  name,
  placeholder,
  autoComplete,
  minLength,
}: {
  id: string;
  name: string;
  placeholder: string;
  autoComplete: string;
  minLength?: number;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        autoComplete={autoComplete}
        className="h-11 w-full rounded-lg border border-[var(--brand)]/10 bg-[#112111]/60 px-4 pr-11 text-sm text-white outline-none transition placeholder:text-[#5f7263] focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]/30"
        id={id}
        minLength={minLength}
        name={name}
        placeholder={placeholder}
        required
        type={show ? "text" : "password"}
      />
      <button
        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] transition-colors hover:text-[var(--brand)]"
        onClick={() => setShow((s) => !s)}
        tabIndex={-1}
        type="button"
        aria-label={show ? "Hide password" : "Show password"}
      >
        <span className="material-symbols-outlined text-[18px]">
          {show ? "visibility_off" : "visibility"}
        </span>
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────────── main component */
export function AuthCard({ initialMode, nextPath, error, registered }: AuthCardProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [role, setRole] = useState<"shipper" | "carrier">("shipper");
  const [isPending, startTransition] = useTransition();

  const errorMessage = useMemo(
    () => (error ? (errorMap[error] ?? "Something went wrong.") : ""),
    [error],
  );

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  /* wrap server actions so we can show pending state */
  function handleLogin(formData: FormData) {
    startTransition(() => {
      loginAction(formData);
    });
  }

  function handleRegister(formData: FormData) {
    startTransition(() => {
      registerAction(formData);
    });
  }

  return (
    <div className="rounded-xl border border-[var(--brand)]/10 bg-slate-900/50 p-6 shadow-xl backdrop-blur-sm">

      {/* ── Tab toggle ── */}
      <div className="mb-6 flex h-11 items-center justify-center rounded-lg bg-[var(--brand)]/5 p-1">
        {(["login", "register"] as AuthMode[]).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setMode(tab)}
            className={`flex h-full flex-1 cursor-pointer items-center justify-center overflow-hidden rounded-lg px-2 text-sm font-medium transition-all
              ${mode === tab
                ? "bg-[#112111] text-[var(--brand)] shadow-sm"
                : "text-[var(--muted)] hover:text-white"
              }`}
          >
            {tab === "login" ? "Login" : "Register"}
          </button>
        ))}
      </div>

      {/* ── Alerts ── */}
      {registered === "1" && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-3 py-2.5">
          <span className="material-symbols-outlined mt-0.5 text-base text-emerald-400">check_circle</span>
          <p className="text-sm text-emerald-200">
            Account created! Check your inbox for a verification email, then log in.
          </p>
        </div>
      )}

      {errorMessage && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2.5">
          <span className="material-symbols-outlined mt-0.5 text-base text-red-400">error</span>
          <p className="text-sm text-red-200">{errorMessage}</p>
        </div>
      )}

      {/* ── Role selector ── */}
      <div className="mb-6">
        <h3 className="mb-3 text-sm font-bold text-white">Select your role</h3>
        <div className="grid grid-cols-2 gap-3">
          <RoleCard
            active={role === "shipper"}
            icon="package_2"
            name="role-display"
            onChange={() => setRole("shipper")}
            subtitle="I have freight"
            title="Shipper"
            value="shipper"
          />
          <RoleCard
            active={role === "carrier"}
            icon="local_shipping"
            name="role-display"
            onChange={() => setRole("carrier")}
            subtitle="I have trucks"
            title="Carrier"
            value="carrier"
          />
        </div>
      </div>

      {/* ── Login form ── */}
      {mode === "login" ? (
        <form action={handleLogin} className="flex flex-col gap-4">
          <input name="next" type="hidden" value={nextPath} />

          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-300" htmlFor="email">
              Email Address
            </label>
            <input
              autoComplete="email"
              className="h-11 w-full rounded-lg border border-[var(--brand)]/10 bg-[#112111]/60 px-4 text-sm text-white outline-none transition placeholder:text-[#5f7263] focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]/30"
              id="email"
              name="email"
              placeholder="name@company.com"
              required
              type="email"
            />
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-300" htmlFor="login-password">
                Password
              </label>
              <button
                className="text-xs font-medium text-[var(--brand)] transition-opacity hover:opacity-80"
                type="button"
              >
                Forgot password?
              </button>
            </div>
            <PasswordInput
              autoComplete="current-password"
              id="login-password"
              name="password"
              placeholder="••••••••"
            />
          </div>

          {/* Remember me */}
          <div className="flex items-center gap-2 py-1">
            <input
              className="h-4 w-4 cursor-pointer rounded border border-[var(--brand)]/20 bg-transparent accent-[var(--brand)]"
              id="remember"
              type="checkbox"
            />
            <label className="cursor-pointer text-sm text-[var(--muted)]" htmlFor="remember">
              Keep me logged in
            </label>
          </div>

          {/* Submit */}
          <button
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--brand)] py-3 text-sm font-bold text-[#112111] shadow-lg shadow-[var(--brand)]/20 transition hover:opacity-90 disabled:opacity-60"
            disabled={isPending}
            type="submit"
          >
            {isPending ? (
              <>
                <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>
                Signing in…
              </>
            ) : (
              "Sign In"
            )}
          </button>

          {/* OAuth divider */}
          <div className="relative flex items-center py-1">
            <div className="h-px flex-1 bg-[var(--brand)]/10" />
            <span className="mx-4 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
              or continue with
            </span>
            <div className="h-px flex-1 bg-[var(--brand)]/10" />
          </div>

          {/* OAuth buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              className="flex items-center justify-center gap-2 rounded-lg border border-[var(--brand)]/10 bg-transparent py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--brand)]/5"
              type="button"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt="Google"
                className="h-4 w-4"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuD4ooCQHJRJ7UswRMGVHvfm8bfj7IXKqzB7Ilg689Ja3lIh-F4GQNMO_Iwul8ti6m54lmfSs_xNyNw8-NnsMMgEBU6Eqy4grutnlO9IYwvSDBC6Pl6GVdZcwIlw_Fg7YdKldaa5ccBbHhNRZ13CG-8QH9BVirh4jUtGjphlZLdr9bGo009dSqfWWVzPabrdWBNs1mKJigY77fWAXVVs_sBO66R2wAJiC54zE5wUt9lR30oUBUvg97koFhi7Y0zN9G1PRM39wyttQ6c"
              />
              Google
            </button>
            <button
              className="flex items-center justify-center gap-2 rounded-lg border border-[var(--brand)]/10 bg-transparent py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--brand)]/5"
              type="button"
            >
              <span className="material-symbols-outlined text-lg">corporate_fare</span>
              SSO
            </button>
          </div>
        </form>
      ) : (
        /* ── Register form ── */
        <form action={handleRegister} className="flex flex-col gap-4">
          <input name="role" type="hidden" value={role} />

          {/* Full name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-300" htmlFor="fullName">
              Full Name
            </label>
            <input
              autoComplete="name"
              className="h-11 w-full rounded-lg border border-[var(--brand)]/10 bg-[#112111]/60 px-4 text-sm text-white outline-none transition placeholder:text-[#5f7263] focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]/30"
              id="fullName"
              name="fullName"
              placeholder="Jane Smith"
              required
              type="text"
            />
          </div>

          {/* Company */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-300" htmlFor="companyName">
              Company Name
              <span className="ml-1 text-[var(--muted)]">(optional)</span>
            </label>
            <input
              autoComplete="organization"
              className="h-11 w-full rounded-lg border border-[var(--brand)]/10 bg-[#112111]/60 px-4 text-sm text-white outline-none transition placeholder:text-[#5f7263] focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]/30"
              id="companyName"
              name="companyName"
              placeholder="Acme Logistics"
              type="text"
            />
          </div>

          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-300" htmlFor="reg-email">
              Email Address
            </label>
            <input
              autoComplete="email"
              className="h-11 w-full rounded-lg border border-[var(--brand)]/10 bg-[#112111]/60 px-4 text-sm text-white outline-none transition placeholder:text-[#5f7263] focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]/30"
              id="reg-email"
              name="email"
              placeholder="name@company.com"
              required
              type="email"
            />
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-300" htmlFor="reg-password">
              Password
              <span className="ml-1 text-[var(--muted)]">(min. 8 characters)</span>
            </label>
            <PasswordInput
              autoComplete="new-password"
              id="reg-password"
              minLength={8}
              name="password"
              placeholder="••••••••"
            />
          </div>

          {/* Submit */}
          <button
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--brand)] py-3 text-sm font-bold text-[#112111] shadow-lg shadow-[var(--brand)]/20 transition hover:opacity-90 disabled:opacity-60"
            disabled={isPending}
            type="submit"
          >
            {isPending ? (
              <>
                <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>
                Creating account…
              </>
            ) : (
              "Create Account"
            )}
          </button>
        </form>
      )}

      {/* ── Terms ── */}
      <p className="mt-6 px-4 text-center text-xs text-[var(--muted)]">
        By signing in, you agree to our{" "}
        <a href="#" className="text-[var(--brand)] hover:underline">
          Terms of Service
        </a>{" "}
        and{" "}
        <a href="#" className="text-[var(--brand)] hover:underline">
          Privacy Policy
        </a>
        .
      </p>

      {/* ── Switch mode ── */}
      <div className="mt-4 flex items-center justify-between text-sm">
        <button
          className="text-[var(--brand)] hover:underline"
          onClick={() => setMode(mode === "login" ? "register" : "login")}
          type="button"
        >
          {mode === "login" ? "Need an account? Register" : "Already have an account? Login"}
        </button>
        <Link className="text-[var(--muted)] transition-colors hover:text-[var(--brand)]" href="/">
          ← Back to site
        </Link>
      </div>
    </div>
  );
}
