import type { ReactNode } from "react";

import { AdminTopBar } from "~/components/admin/admin-top-bar";
import { AdminBottomNav } from "~/components/admin/admin-bottom-nav";
import { FooterBranding } from "~/components/footer-branding";
import { requireManager } from "~/server/admin/session";

export default async function AdminPanelLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { session, manager } = await requireManager();

  return (
    <div className="bg-background mx-auto flex min-h-dvh w-full max-w-md flex-col">
      <AdminTopBar
        user={{
          id: manager.id,
          name: session.user.name,
          email: session.user.email,
          role: manager.role,
        }}
      />
      <div className="flex-1 overflow-y-auto px-4 py-6 pb-24">
        {children}
        <FooterBranding className="mt-10 rounded-xl" />
      </div>
      <div className="border-border/60 bg-background/95 fixed bottom-0 left-1/2 w-full max-w-md -translate-x-1/2 border-t backdrop-blur">
        <AdminBottomNav role={manager.role} />
      </div>
    </div>
  );
}
