"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useMemo } from "react";

import { useLanguage } from "~/lib/language-context";
import allTranslations from "~/lib/translations/all";

function useCurrentTimeAndDate() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000 * 30);
    return () => clearInterval(interval);
  }, []);
  const time = now
    .toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
    .toUpperCase();
  return { time };
}

import { Button } from "~/components/ui/button";
import { LogOut, Loader2 } from "lucide-react";
import { ThemeToggle } from "~/components/theme-toggle";
import { authClient } from "~/server/better-auth/client";
import type { ManagerRole } from "~/lib/admin-nav";
import { AdminProfileDrawer } from "./admin-profile-drawer";

type AdminTopBarProps = {
  user: {
    id: number;
    name: string;
    email: string;
    role: ManagerRole;
  };
};

export function AdminTopBar({ user }: AdminTopBarProps) {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);
  const { language } = useLanguage();
  const strings = useMemo(() => allTranslations.admin[language], [language]);

  const ROLE_LABELS: Record<ManagerRole, string> = {
    admin: strings.roleAdmin,
    superAdmin: strings.roleSuperAdmin,
    staff: strings.roleStaff,
  };

  const { time: currentTime } = useCurrentTimeAndDate();

  const handleLogout = async () => {
    try {
      setSigningOut(true);
      await authClient.signOut();
      router.replace("/admin");
      router.refresh();
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <header className="border-border/60 bg-background/95 sticky top-0 z-50 flex items-center justify-between border-b px-4 py-3 backdrop-blur">
      <div className="flex flex-col">
        <p className="text-muted-foreground bbh-hegarty-regular text-lg leading-tight tracking-[0.1em] uppercase">
          Pitch Perfect
        </p>
        <div className="flex items-center gap-1.5 leading-none">
          <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase">
            {ROLE_LABELS[user.role]}
          </span>
          <span className="text-muted-foreground text-[10px] font-medium">
            {user.name}
          </span>
          <span className="text-muted-foreground/40 text-[10px]">•</span>
          <span className="text-muted-foreground text-[10px] font-medium tabular-nums">
            {currentTime}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <ThemeToggle />
        <div className="bg-border/40 mx-1 h-4 w-[1px]" />
        <AdminProfileDrawer adminId={user.id} adminName={user.name} />
        <Button
          size="sm"
          variant="ghost"
          className="text-muted-foreground hover:text-destructive h-9 w-9 rounded-full p-0 transition-colors"
          onClick={handleLogout}
          disabled={signingOut}
          aria-label={strings.logout}
        >
          {signingOut ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <LogOut className="h-4 w-4" />
          )}
        </Button>
      </div>
    </header>
  );
}
