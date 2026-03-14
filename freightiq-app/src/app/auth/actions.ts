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

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/auth?mode=login");
}
