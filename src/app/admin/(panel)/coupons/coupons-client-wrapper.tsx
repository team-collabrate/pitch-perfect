"use client";

import { CouponsClient } from "./coupons-client";

type Strings = {
  couponsTitle: string;
};

export function CouponsClientWrapper({ strings }: { strings: Strings }) {
  return <CouponsClient strings={strings} />;
}
