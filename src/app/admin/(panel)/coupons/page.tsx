"use client";

import allTranslations from "~/lib/translations/all";
import { CouponsClient } from "./coupons-client";

export default function CouponsPage() {
  const strings = allTranslations.admin.en;

  return <CouponsClient strings={{ couponsTitle: strings.couponsTitle }} />;
}
