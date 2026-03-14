import { redirect } from "next/navigation";

export default async function RegisterPage() {
  redirect("/auth?mode=register");
}
