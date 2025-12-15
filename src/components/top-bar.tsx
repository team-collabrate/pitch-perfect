"use client";

import { usePathname } from "next/navigation";

import { ThemeToggle } from "~/components/theme-toggle";
import { useLanguage } from "~/lib/language-context";
import { cn } from "~/lib/utils";
import { Button } from "./ui/button";

const languages: Array<"en" | "ta"> = ["en", "ta"];

export function TopBar() {
  const pathname = usePathname();
  const { language, setLanguage } = useLanguage();

  if (pathname?.startsWith("/admin")) {
    return null;
  }

  return (
    <header className="border-border/60 bg-background/95 sticky top-0 z-50 flex items-center justify-between border-b px-4 py-4 backdrop-blur">
      <p className="text-muted-foreground text-xl agdasima-bold tracking-[0.4em] uppercase">
        Pitch Perfect
      </p>
      <div className="flex items-center gap-3">
        <div className="bg-secondary flex items-center gap-1 rounded-full px-1 py-1 text-xs">
          {languages.map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => setLanguage(code)}
              aria-pressed={language === code}
              className={cn(
                "rounded-full px-3 py-1 font-medium transition-colors",
                language === code
                  ? "bg-primary text-primary-foreground"
                  : "hover:text-foreground",
              )}
            >
              {code.toUpperCase()}
            </button>
          ))}
        </div>
        <ThemeToggle />
      </div>
    </header>
  );
}
