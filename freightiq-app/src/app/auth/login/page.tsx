import { redirect } from "next/navigation";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const query = new URLSearchParams({ mode: "login" });
  if (next) {
    query.set("next", next);
  }
  redirect(`/auth?${query.toString()}`);
}
