"use server";

import { redirect } from "next/navigation";
import { getProfileRole, resolveDashboardPathForRole, safeNextPath } from "@/lib/auth/role-routing";
import { createClient } from "@/lib/supabase/server";

type AuthMode = "login" | "register";

function authRedirect(mode: AuthMode, params: Record<string, string | undefined>) {
  const query = new URLSearchParams({ mode });

  Object.entries(params).forEach(([key, value]) => {
    if (value) query.set(key, value);
  });

  redirect(`/auth?${query.toString()}`);
}

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeNextPath(String(formData.get("next") ?? ""));

  if (!email || !password) {
    authRedirect("login", { error: "missing_fields", next });
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    authRedirect("login", { error: "invalid_credentials", next });
  }

  const role = data.user ? await getProfileRole(supabase, data.user.id) : null;
  redirect(resolveDashboardPathForRole(role, next));
}

export async function registerAction(formData: FormData) {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const companyName = String(formData.get("companyName") ?? "").trim();
  const role = String(formData.get("role") ?? "shipper");
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!fullName || !email || !password) {
    authRedirect("register", { error: "missing_fields" });
  }

  if (password.length < 8) {
    authRedirect("register", { error: "weak_password" });
  }

  if (role !== "shipper" && role !== "carrier") {
    authRedirect("register", { error: "invalid_role" });
  }

  const supabase = await createClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${appUrl}/auth/callback?next=/dashboard`,
      data: {
        full_name: fullName,
        company_name: companyName || null,
        role,
      },
    },
  });

  if (error) {
    authRedirect("register", { error: "signup_failed" });
  }

  if (data.session) {
    redirect(resolveDashboardPathForRole(role, "/dashboard"));
  }

  authRedirect("login", { registered: "1" });
}

export async function forgotPasswordAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();

  if (!email) {
    authRedirect("login", { error: "missing_fields" });
  }

  const supabase = await createClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${appUrl}/auth/callback?next=/auth/reset-password`,
  });

  if (error) {
    authRedirect("login", { error: "reset_email_failed" });
  }

  authRedirect("login", { reset_sent: "1" });
}

export async function updatePasswordAction(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!password || !confirmPassword) {
    redirect("/auth/reset-password?error=missing_fields");
  }

  if (password.length < 8) {
    redirect("/auth/reset-password?error=weak_password");
  }

  if (password !== confirmPassword) {
    redirect("/auth/reset-password?error=password_mismatch");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    authRedirect("login", { error: "recovery_session_missing" });
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    redirect("/auth/reset-password?error=password_update_failed");
  }

  await supabase.auth.signOut();
  authRedirect("login", { password_reset: "1" });
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/auth?mode=login");
}
