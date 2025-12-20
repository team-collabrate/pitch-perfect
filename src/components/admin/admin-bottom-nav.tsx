"use client";

import { usePathname, useRouter } from "next/navigation";
import { useMemo, type ComponentType } from "react";
import {
  BarChart3,
  BadgeCheck,
  TicketPercent,
  Users,
  Settings2,
  ShieldCheck,
  Clock,
} from "lucide-react";

import { cn } from "~/lib/utils";
import type { ManagerRole } from "~/lib/admin-nav";
import { useLanguage } from "~/lib/language-context";
import allTranslations from "~/lib/translations/all";

type NavItem = {
  labelKey: keyof typeof allTranslations.admin.en;
  href: string;
  icon: ComponentType<{ className?: string }>;
  roles: ManagerRole[] | "all";
};

const NAV_ITEMS: NavItem[] = [
  {
    labelKey: "dashboardTitle",
    href: "/admin/dashboard",
    icon: BarChart3,
    roles: "all",
  },
  {
    labelKey: "bookingsTitle",
    href: "/admin/bookings",
    icon: BadgeCheck,
    roles: "all",
  },
  {
    labelKey: "couponsTitle",
    href: "/admin/coupons",
    icon: TicketPercent,
    roles: ["superAdmin"],
  },
  {
    labelKey: "usersTitle",
    href: "/admin/users",
    icon: Users,
    roles: "all",
  },
  {
    labelKey: "configTitle",
    href: "/admin/config",
    icon: Settings2,
    roles: "all",
  },
  {
    labelKey: "adminsTitle",
    href: "/admin/admins",
    icon: ShieldCheck,
    roles: ["superAdmin"],
  },
];

export function AdminBottomNav({ role }: { role: ManagerRole }) {
  const pathname = usePathname();
  const router = useRouter();
  const { language } = useLanguage();
  const strings = useMemo(() => allTranslations.admin[language], [language]);

  const filteredItems = NAV_ITEMS.filter((item) =>
    item.roles === "all" ? role !== "staff" : item.roles.includes(role),
  );

  return (
    <nav className="border-border/60 bg-background/90 sticky right-0 bottom-0 left-0 border-t px-2 py-3 backdrop-blur">
      <div className="flex items-center gap-1 text-xs">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/admin/config"
              ? pathname === "/admin/config"
              : (pathname?.startsWith(item.href) ?? false);
          return (
            <button
              key={item.href}
              type="button"
              onClick={() => router.push(item.href)}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 rounded-2xl px-2 py-2",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{strings[item.labelKey]}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
