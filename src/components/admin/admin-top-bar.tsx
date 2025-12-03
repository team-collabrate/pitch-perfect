"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
function useCurrentTimeAndDate() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000 * 30);
    return () => clearInterval(interval);
  }, []);
  const time = now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  const date = now.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return { time, date };
}

import { Button } from "~/components/ui/button";
import { LogOut, Loader2 } from "lucide-react";
import { ThemeToggle } from "~/components/theme-toggle";
import { authClient } from "~/server/better-auth/client";
import type { ManagerRole } from "~/lib/admin-nav";

type AdminTopBarProps = {
  user: {
    name: string;
    email: string;
    role: ManagerRole;
  };
};

const ROLE_LABELS: Record<ManagerRole, string> = {
  admin: "Admin",
  superAdmin: "Super Admin",
  staff: "Staff",
};

export function AdminTopBar({ user }: AdminTopBarProps) {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  const { time: currentTime, date: currentDate } = useCurrentTimeAndDate();

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
    <header className="border-border/60 bg-background/95 sticky top-0 z-50 flex items-center justify-between border-b px-4 py-4 backdrop-blur">
      <div>
        <p className="text-muted-foreground text-xs tracking-[0.4em] uppercase">
          Pitch Perfect
        </p>
        <p className="text-lg font-semibold">Admin Console</p>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm leading-none font-semibold">{user.name}</p>
          <p className="text-muted-foreground text-xs">
            {ROLE_LABELS[user.role]}
          </p>
        </div>
        <div className="mr-2 flex min-w-[90px] flex-col items-end">
          <span className="text-muted-foreground font-mono text-xs">
            {currentTime}
          </span>
          <span className="text-muted-foreground text-[10px]">
            {currentDate}
          </span>
        </div>
        <ThemeToggle />
        <Button
          size="sm"
          variant="secondary"
          className="rounded-full"
          onClick={handleLogout}
          disabled={signingOut}
          aria-label="Logout"
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
