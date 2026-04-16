"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import { ArrowUpRight, Coffee } from "lucide-react";

import { Card } from "~/components/ui/card";
import { useLanguage } from "~/lib/language-context";
import allTranslations from "~/lib/translations/all";

export function CafeBanner() {
  const { language } = useLanguage();
  const homeStrings = useMemo(() => allTranslations.home[language], [language]);

  return (
    <Link href="/cafe-menu" className="block">
      <motion.div
        className="mt-3 h-full"
        whileHover={{ y: -4 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        <Card className="group border-border/60 shadow-primary/5 relative h-46 overflow-hidden rounded-2xl border p-4 py-12 shadow-lg transition-all duration-300">
          <Image
            src="/cafe-background.jpg"
            alt={homeStrings.cafeMenu}
            fill
            className="h-32 object-cover transition-opacity duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/45 to-black/15" />
          <div className="relative z-10 flex h-full items-end gap-3">
            {/* <span className="bg-background/70 text-foreground/80 group-hover:text-primary border-border/40 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border backdrop-blur-sm transition-colors">
              <Coffee className="h-5 w-5" aria-hidden="true" />
            </span> */}
            <div className="flex-1">
              <p className="text-base font-semibold text-white">
                {homeStrings.cafeMenu}
              </p>
              <p className="text-xs text-white/80">
                {homeStrings.cafeMenuDesc}
              </p>
              <p className="mt-2 inline-flex rounded-full border border-white/20 bg-white/10 px-2 py-1 text-[11px] font-medium text-white/90 backdrop-blur-sm">
                {homeStrings.cafeMenuTap}
              </p>
            </div>
            <ArrowUpRight
              className="mt-auto h-4 w-4 text-white/80 transition-colors group-hover:text-white"
              aria-hidden="true"
            />
          </div>
        </Card>
      </motion.div>
    </Link>
  );
}
