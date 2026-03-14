import Link from "next/link";
import { redirect } from "next/navigation";
import { updatePasswordAction } from "@/app/auth/actions";
import { createClient } from "@/lib/supabase/server";

const errorMap: Record<string, string> = {
  missing_fields: "Please fill all required fields.",
  weak_password: "Password must be at least 8 characters.",
  password_mismatch: "Passwords do not match.",
  password_update_failed: "Unable to update password right now. Please try again.",
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth?mode=login&error=recovery_session_missing");
  }

  const errorMessage = params.error ? (errorMap[params.error] ?? "Something went wrong.") : "";

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#060e07] px-6 py-12 sm:px-12">
      <div className="w-full max-w-md rounded-xl border border-[var(--brand)]/10 bg-slate-900/50 p-6 shadow-xl backdrop-blur-sm">
        <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--brand)]">
          Password recovery
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-white">Set a new password</h1>
        <p className="mt-2 text-sm text-slate-400">
          Choose a strong password with at least 8 characters.
        </p>

        {errorMessage && (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2.5">
            <span className="material-symbols-outlined mt-0.5 text-base text-red-400">error</span>
            <p className="text-sm text-red-200">{errorMessage}</p>
          </div>
        )}

        <form action={updatePasswordAction} className="mt-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-300" htmlFor="password">
              New password
            </label>
            <input
              autoComplete="new-password"
              className="h-11 w-full rounded-lg border border-[var(--brand)]/10 bg-[#112111]/60 px-4 text-sm text-white outline-none transition placeholder:text-[#5f7263] focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]/30"
              id="password"
              minLength={8}
              name="password"
              placeholder="********"
              required
              type="password"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-300" htmlFor="confirmPassword">
              Confirm password
            </label>
            <input
              autoComplete="new-password"
              className="h-11 w-full rounded-lg border border-[var(--brand)]/10 bg-[#112111]/60 px-4 text-sm text-white outline-none transition placeholder:text-[#5f7263] focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]/30"
              id="confirmPassword"
              minLength={8}
              name="confirmPassword"
              placeholder="********"
              required
              type="password"
            />
          </div>

          <button
            className="mt-1 flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--brand)] py-3 text-sm font-bold text-[#112111] shadow-lg shadow-[var(--brand)]/20 transition hover:opacity-90"
            type="submit"
          >
            Update password
          </button>
        </form>

        <div className="mt-4 text-sm">
          <Link className="text-[var(--brand)] hover:underline" href="/auth?mode=login">
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
