"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import {
  CalendarCheck,
  Coffee,
  GalleryHorizontal,
  Home,
  Phone,
  Ticket,
} from "lucide-react";

import { cn } from "~/lib/utils";
import { useLanguage } from "~/lib/language-context";
import allTranslations from "~/lib/translations/all";

type NavItem = {
  labelKey: keyof typeof allTranslations.nav.en;
  href: string;
  icon: React.ReactNode;
};

const navItems: NavItem[] = [
  { labelKey: "home", href: "/home", icon: <Home className="h-5 w-5" /> },
  {
    labelKey: "view",
    href: "/view",
    icon: <Ticket className="h-5 w-5" />,
  },
  {
    labelKey: "book",
    href: "/book",
    icon: <CalendarCheck className="h-5 w-5" />,
  },
  {
    labelKey: "gallery",
    href: "/gallery",
    icon: <GalleryHorizontal className="h-5 w-5" />,
  },
  {
    labelKey: "contact",
    href: "/contact",
    icon: <Phone className="h-5 w-5" />,
  },
];

export function BottomNav() {
  const pathname = usePathname();
  const { language } = useLanguage();
  const strings = useMemo(() => allTranslations.nav[language], [language]);

  const hideButton =
    pathname.startsWith("/book") || pathname.startsWith("/cafe-menu");

  return (
    <nav className="border-border/60 bg-background/90 fixed right-0 bottom-0 left-0 z-50 border-t backdrop-blur-lg">
      <div className="relative mx-auto flex max-w-md justify-between px-6 py-3 text-xs font-medium tracking-wide uppercase">
        {!hideButton && (
          <div className="absolute -top-16 right-4">
            <Link
              href="/cafe-menu"
              className="bg-primary hover:bg-primary/90 flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-colors"
            >
              <Coffee className="text-primary-foreground h-6 w-6" />
            </Link>
          </div>
        )}

        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 rounded-full px-3 py-2 transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <span
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full border border-transparent transition-colors",
                  isActive && "border-primary bg-primary/10",
                )}
              >
                {item.icon}
              </span>
              {strings[item.labelKey]}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
