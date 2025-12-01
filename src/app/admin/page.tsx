import { redirect } from "next/navigation";
import { getSession } from "~/server/better-auth/server";

export default async function AdminPage() {
  const session = await getSession();

  // If authenticated, redirect to dashboard
  if (session?.user) {
    redirect("/admin/dashboard");
  }

  // If not authenticated, redirect to login
  redirect("/admin/login");
}
