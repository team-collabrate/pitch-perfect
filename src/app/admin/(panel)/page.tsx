import { redirect } from "next/navigation";

import { getSession } from "~/server/better-auth/server";

export default async function AdminPanelPage() {
  const session = await getSession();

  if (!session?.user) {
    // Not authenticated, redirect to login
    redirect("/admin/login");
  }

  // Authenticated, redirect to dashboard
  redirect("/admin/dashboard");
}
