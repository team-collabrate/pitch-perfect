"use client";

import { ShieldCheck } from "lucide-react";
import { useMemo } from "react";

import { Card } from "~/components/ui/card";
import { InviteAdminDrawer } from "~/components/admin/invite-admin-drawer";
import { AdminProfileDrawer } from "~/components/admin/admin-profile-drawer";
import { api } from "~/trpc/react";
import { useLanguage } from "~/lib/language-context";
import allTranslations from "~/lib/translations/all";

export default function AdminsPage() {
  const { language } = useLanguage();
  const strings = useMemo(() => allTranslations.admin[language], [language]);

  const { data: admins = [] } = api.superAdmin.adminsList.useQuery();

  const roleLabel: Record<string, string> = {
    superAdmin: strings.roleSuperAdmin,
    admin: strings.roleAdmin,
    staff: strings.roleStaff,
  };

  return (
    <div className="space-y-6 pb-20">
      <header className="flex items-center gap-3">
        <ShieldCheck className="bg-muted h-10 w-10 rounded-2xl p-2" />
        <div>
          <p className="text-muted-foreground text-xs tracking-wide uppercase">
            {strings.staffAccess}
          </p>
          <h1 className="text-2xl font-semibold">{strings.adminsTitle}</h1>
        </div>
      </header>

      <div className="space-y-4">
        {admins.length > 0 ? (
          admins.map((admin) => (
            <Card
              key={admin.id}
              className="border-border/60 bg-card/60 flex-row items-center justify-between rounded-3xl px-4 py-4"
            >
              <div>
                <p className="text-lg font-semibold">{admin.user.name}</p>
                <p className="text-muted-foreground text-sm">
                  {admin.user.email}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="border-primary/40 text-primary rounded-full border px-3 py-1 text-xs font-semibold">
                  {roleLabel[admin.role]}
                </span>
                <AdminProfileDrawer
                  adminId={admin.id}
                  adminName={admin.user.name}
                />
              </div>
            </Card>
          ))
        ) : (
          <Card className="border-border/60 bg-card/60 rounded-3xl px-4 py-6 text-center">
            <p className="text-muted-foreground text-sm">{strings.noAdmins}</p>
          </Card>
        )}
      </div>

      <InviteAdminDrawer />
    </div>
  );
}
