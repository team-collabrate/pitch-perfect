import { ShieldCheck } from "lucide-react";

import { Card } from "~/components/ui/card";
import { InviteAdminDrawer } from "~/components/admin/invite-admin-drawer";
import { requireManager } from "~/server/admin/session";
import { api } from "~/trpc/server";

const roleLabel: Record<string, string> = {
  superAdmin: "Super Admin",
  admin: "Admin",
};

export default async function AdminsPage() {
  await requireManager({ superOnly: true });

  const admins = await api.superAdmin.adminsList();

  return (
    <div className="space-y-6 pb-20">
      <header className="flex items-center gap-3">
        <ShieldCheck className="bg-muted h-10 w-10 rounded-2xl p-2" />
        <div>
          <p className="text-muted-foreground text-xs tracking-wide uppercase">
            Staff access
          </p>
          <h1 className="text-2xl font-semibold">Manage admins</h1>
        </div>
      </header>

      <div className="space-y-4">
        {admins.length > 0 ? (
          admins.map((admin) => (
            <Card
              key={admin.id}
              className="border-border/60 bg-card/60 flex items-center justify-between rounded-3xl px-4 py-3"
            >
              <div>
                <p className="text-lg font-semibold">{admin.user.name}</p>
                <p className="text-muted-foreground text-sm">
                  {admin.user.email}
                </p>
              </div>
              <span className="border-primary/40 text-primary rounded-full border px-3 py-1 text-xs font-semibold">
                {roleLabel[admin.role]}
              </span>
            </Card>
          ))
        ) : (
          <Card className="border-border/60 bg-card/60 rounded-3xl px-4 py-6 text-center">
            <p className="text-muted-foreground text-sm">No admins yet</p>
          </Card>
        )}
      </div>

      <InviteAdminDrawer />
    </div>
  );
}
