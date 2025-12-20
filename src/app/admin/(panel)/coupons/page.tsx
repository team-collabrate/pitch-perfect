"use client";

import { useMemo } from "react";
import { useLanguage } from "~/lib/language-context";
import allTranslations from "~/lib/translations/all";
import { CouponsClient } from "./coupons-client";

export default function CouponsPage() {
  const { language } = useLanguage();
  const strings = useMemo(() => allTranslations.admin[language], [language]);

  return <CouponsClient strings={{ couponsTitle: strings.couponsTitle }} />;
}
