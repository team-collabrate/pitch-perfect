import { redirect } from "next/navigation";

import { AdminLoginForm } from "~/components/admin/admin-login-form";
import { getDefaultAdminRoute } from "~/lib/admin-nav";
import { getManagerProfile } from "~/server/admin/session";

export default async function AdminLoginPage() {
  const profile = await getManagerProfile();

  if (profile) {
    redirect(getDefaultAdminRoute(profile.manager.role));
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center bg-background px-4 py-12">
      <div className="space-y-10 rounded-3xl border border-border/60 bg-card/60 p-6 shadow-lg shadow-black/5">
        <div className="space-y-2 text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">
            Pitch Perfect
          </p>
          <h1 className="text-3xl font-semibold">Back-office Access</h1>
          <p className="text-sm text-muted-foreground">
            Mobile-first controls built for on-ground managers.
          </p>
        </div>
        <AdminLoginForm />
      </div>
    </div>
  );
}
