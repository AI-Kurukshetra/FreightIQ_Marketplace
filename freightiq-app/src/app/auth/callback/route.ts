import { NextResponse } from "next/server";
import { getProfileRole, resolveDashboardPathForRole, safeNextPath } from "@/lib/auth/role-routing";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"));

  if (!code) {
    return NextResponse.redirect(`${origin}/auth?mode=login&error=missing_code`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}/auth?mode=login&error=callback_failed`);
  }

  if (next === "/auth/reset-password") {
    return NextResponse.redirect(`${origin}${next}`);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const role = user ? await getProfileRole(supabase, user.id) : null;

  return NextResponse.redirect(`${origin}${resolveDashboardPathForRole(role, next)}`);
}
