"use client";

import * as React from "react";
import {
  Pencil,
  PlusCircle,
  RotateCcw,
  TicketPercent,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import {
  Drawer,
  DrawerClose,
  DrawerCloseButton,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "~/components/ui/drawer";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Spinner } from "~/components/spinner";
import { Toggle } from "~/components/ui/toggle";
import { api } from "~/trpc/react";

type Strings = {
  couponsTitle: string;
};

type Coupon = {
  id: string;
  code: string;
  description: string | null;
  flatDiscountAmount: number;
  maxFlatDiscountAmount: number;
  minimumBookingAmount: number;
  firstNBookingsOnly: number;
  nthPurchaseOnly: number;
  usageLimit: number;
  numberOfUses: number;
  validFrom: string;
  validTo: string;
  showCoupon: boolean;
  createdAt: Date;
};

function formatRupeesFromPaise(paise: number) {
  const rupees = paise / 100;
  return rupees.toLocaleString("en-IN", { style: "currency", currency: "INR" });
}

function getCouponStatus(
  coupon: Pick<Coupon, "validFrom" | "validTo" | "showCoupon">,
) {
  const now = new Date();
  const from = new Date(coupon.validFrom);
  const to = new Date(coupon.validTo);

  if (to < now) return "Expired";
  if (from > now) return "Scheduled";
  return coupon.showCoupon ? "Active" : "Paused";
}

type CouponDraft = {
  couponId?: string;
  code: string;
  description: string;
  flatDiscountAmount: string;
  maxFlatDiscountAmount: string;
  minimumBookingAmount: string;
  firstNBookingsOnly: string;
  nthPurchaseOnly: string;
  usageLimit: string;
  validFrom: string;
  validTo: string;
  useMinBookingAmount?: boolean;
  useFirstNBookings?: boolean;
  useNthPurchase?: boolean;
  useValidFrom?: boolean;
  useValidTo?: boolean;
  useUsageLimit?: boolean;
};

function getEmptyDraft(): CouponDraft {
  const today = new Date().toISOString().split("T")[0] ?? "";
  return {
    code: "",
    description: "",
    flatDiscountAmount: "0",
    maxFlatDiscountAmount: "0",
    minimumBookingAmount: "0",
    firstNBookingsOnly: "0",
    nthPurchaseOnly: "0",
    usageLimit: "0",
    validFrom: today,
    validTo: "",
    useMinBookingAmount: false,
    useFirstNBookings: false,
    useNthPurchase: false,
    useValidFrom: true,
    useValidTo: true,
    useUsageLimit: false,
  };
}

export function CouponsClient({ strings }: { strings: Strings }) {
  const utils = api.useUtils();

  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [draft, setDraft] = React.useState<CouponDraft>(getEmptyDraft());

  const couponsQuery = api.superAdmin.couponsList.useQuery();

  const createMutation = api.superAdmin.couponCreate.useMutation({
    onSuccess: async () => {
      toast.success("Coupon created");
      setDrawerOpen(false);
      setDraft(getEmptyDraft());
      await utils.superAdmin.couponsList.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = api.superAdmin.couponUpdate.useMutation({
    onSuccess: async () => {
      toast.success("Coupon updated");
      setDrawerOpen(false);
      setDraft(getEmptyDraft());
      await utils.superAdmin.couponsList.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = api.superAdmin.couponDelete.useMutation({
    onSuccess: async () => {
      toast.success("Coupon deleted");
      await utils.superAdmin.couponsList.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const toggleMutation = api.superAdmin.couponToggleStatus.useMutation({
    onSuccess: async () => {
      toast.success("Updated");
      await utils.superAdmin.couponsList.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const resetMutation = api.superAdmin.couponResetUsage.useMutation({
    onSuccess: async () => {
      toast.success("Usage reset");
      await utils.superAdmin.couponsList.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  function openCreate() {
    setDraft(getEmptyDraft());
    setDrawerOpen(true);
  }

  function openEdit(coupon: Coupon) {
    setDraft({
      couponId: coupon.id,
      code: coupon.code,
      description: coupon.description ?? "",
      flatDiscountAmount: String(coupon.flatDiscountAmount ?? 0),
      maxFlatDiscountAmount: String(coupon.maxFlatDiscountAmount ?? 0),
      minimumBookingAmount: String(coupon.minimumBookingAmount ?? 0),
      firstNBookingsOnly: String(coupon.firstNBookingsOnly ?? 0),
      nthPurchaseOnly: String(coupon.nthPurchaseOnly ?? 0),
      usageLimit: String(coupon.usageLimit ?? 0),
      validFrom: coupon.validFrom,
      validTo: coupon.validTo,
      useMinBookingAmount: (coupon.minimumBookingAmount ?? 0) > 0,
      useFirstNBookings: (coupon.firstNBookingsOnly ?? 0) > 0,
      useNthPurchase: (coupon.nthPurchaseOnly ?? 0) > 0,
      useValidFrom: !!coupon.validFrom,
      useValidTo: !!coupon.validTo,
      useUsageLimit: (coupon.usageLimit ?? 0) > 0,
    });
    setDrawerOpen(true);
  }

  async function submitDraft() {
    if (!draft.code.trim()) {
      toast.error("Code is required");
      return;
    }
    if (draft.useValidFrom && !draft.validFrom) {
      toast.error("Valid from date is required");
      return;
    }
    if (draft.useValidTo && !draft.validTo) {
      toast.error("Valid to date is required");
      return;
    }

    const payload = {
      code: draft.code.trim().toUpperCase(),
      description: draft.description.trim()
        ? draft.description.trim()
        : undefined,
      flatDiscountAmount: Number(draft.flatDiscountAmount || 0),
      maxFlatDiscountAmount: Number(draft.maxFlatDiscountAmount || 0),
      minimumBookingAmount: draft.useMinBookingAmount
        ? Number(draft.minimumBookingAmount || 0)
        : 0,
      firstNBookingsOnly: draft.useFirstNBookings
        ? Number(draft.firstNBookingsOnly || 0)
        : 0,
      nthPurchaseOnly: draft.useNthPurchase
        ? Number(draft.nthPurchaseOnly || 0)
        : 0,
      usageLimit: draft.useUsageLimit ? Number(draft.usageLimit || 0) : 0,
      validFrom: draft.useValidFrom ? draft.validFrom : "",
      validTo: draft.useValidTo ? draft.validTo : "",
    };

    if (draft.couponId) {
      await updateMutation.mutateAsync({
        couponId: draft.couponId,
        ...payload,
      });
    } else {
      await createMutation.mutateAsync(payload);
    }
  }

  async function onDelete(coupon: Coupon) {
    const ok = window.confirm(`Delete coupon ${coupon.code}?`);
    if (!ok) return;
    await deleteMutation.mutateAsync({ couponId: coupon.id });
  }

  async function onToggle(coupon: Coupon) {
    await toggleMutation.mutateAsync({
      couponId: coupon.id,
      showCoupon: !coupon.showCoupon,
    });
  }

  async function onResetUsage(coupon: Coupon) {
    const ok = window.confirm(`Reset usage for ${coupon.code}?`);
    if (!ok) return;
    await resetMutation.mutateAsync({ couponId: coupon.id });
  }

  const isBusy =
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending ||
    toggleMutation.isPending ||
    resetMutation.isPending;

  return (
    <div className="space-y-6 pb-20">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground text-xs tracking-wide uppercase">
            {strings.couponsTitle}
          </p>
          <h1 className="text-2xl font-semibold">{strings.couponsTitle}</h1>
        </div>

        <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
          <DrawerTrigger asChild>
            <Button className="rounded-full" size="sm" onClick={openCreate}>
              <PlusCircle className="mr-1 h-4 w-4" /> New
            </Button>
          </DrawerTrigger>

          <DrawerContent>
            <DrawerCloseButton />
            <DrawerHeader>
              <DrawerTitle>
                {draft.couponId ? "Edit coupon" : "New coupon"}
              </DrawerTitle>
            </DrawerHeader>

            <div className="flex-1 overflow-auto px-6 pt-2 pb-4">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="code">Code</Label>
                  <Input
                    id="code"
                    value={draft.code}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, code: e.target.value }))
                    }
                    placeholder="WELCOME10"
                    disabled={!!draft.couponId}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={draft.description}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, description: e.target.value }))
                    }
                    placeholder="Short description"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="flatDiscountAmount">
                      Flat discount (₹)
                    </Label>
                    <Input
                      id="flatDiscountAmount"
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      value={(Number(draft.flatDiscountAmount) / 100).toFixed(
                        2,
                      )}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          flatDiscountAmount: String(
                            Math.round(parseFloat(e.target.value || "0") * 100),
                          ),
                        }))
                      }
                      placeholder="0.00"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="maxFlatDiscountAmount">
                      Max discount (₹)
                    </Label>
                    <Input
                      id="maxFlatDiscountAmount"
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      value={(
                        Number(draft.maxFlatDiscountAmount) / 100
                      ).toFixed(2)}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          maxFlatDiscountAmount: String(
                            Math.round(parseFloat(e.target.value || "0") * 100),
                          ),
                        }))
                      }
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Toggle
                    pressed={draft.useUsageLimit}
                    onPressedChange={(pressed) =>
                      setDraft((d) => ({
                        ...d,
                        useUsageLimit: pressed,
                        usageLimit: pressed ? d.usageLimit : "0",
                      }))
                    }
                    className="h-8 w-8 p-0"
                  >
                    ✓
                  </Toggle>
                  <Label htmlFor="usageLimit" className="flex-1">
                    Usage limit
                  </Label>
                  <Input
                    id="usageLimit"
                    type="number"
                    inputMode="numeric"
                    value={draft.usageLimit}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, usageLimit: e.target.value }))
                    }
                    disabled={!draft.useUsageLimit}
                    className="w-24"
                    placeholder="0"
                  />
                </div>

                <div className="space-y-3 border-t pt-4">
                  <div className="flex items-center gap-3">
                    <Toggle
                      pressed={draft.useMinBookingAmount}
                      onPressedChange={(pressed) =>
                        setDraft((d) => ({
                          ...d,
                          useMinBookingAmount: pressed,
                          minimumBookingAmount: pressed
                            ? d.minimumBookingAmount
                            : "0",
                        }))
                      }
                      className="h-8 w-8 p-0"
                    >
                      ✓
                    </Toggle>
                    <Label htmlFor="minimumBookingAmount" className="flex-1">
                      Min booking (₹)
                    </Label>
                    <Input
                      id="minimumBookingAmount"
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      value={(Number(draft.minimumBookingAmount) / 100).toFixed(
                        2,
                      )}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          minimumBookingAmount: String(
                            Math.round(parseFloat(e.target.value || "0") * 100),
                          ),
                        }))
                      }
                      disabled={!draft.useMinBookingAmount}
                      className="w-24"
                      placeholder="0.00"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <Toggle
                      pressed={draft.useFirstNBookings}
                      onPressedChange={(pressed) =>
                        setDraft((d) => ({
                          ...d,
                          useFirstNBookings: pressed,
                          firstNBookingsOnly: pressed
                            ? d.firstNBookingsOnly
                            : "0",
                        }))
                      }
                      className="h-8 w-8 p-0"
                    >
                      ✓
                    </Toggle>
                    <Label htmlFor="firstNBookingsOnly" className="flex-1">
                      First N bookings only
                    </Label>
                    <Input
                      id="firstNBookingsOnly"
                      type="number"
                      inputMode="numeric"
                      value={draft.firstNBookingsOnly}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          firstNBookingsOnly: e.target.value,
                        }))
                      }
                      disabled={!draft.useFirstNBookings}
                      className="w-24"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <Toggle
                      pressed={draft.useNthPurchase}
                      onPressedChange={(pressed) =>
                        setDraft((d) => ({
                          ...d,
                          useNthPurchase: pressed,
                          nthPurchaseOnly: pressed ? d.nthPurchaseOnly : "0",
                        }))
                      }
                      className="h-8 w-8 p-0"
                    >
                      ✓
                    </Toggle>
                    <Label htmlFor="nthPurchaseOnly" className="flex-1">
                      Nth purchase only
                    </Label>
                    <Input
                      id="nthPurchaseOnly"
                      type="number"
                      inputMode="numeric"
                      value={draft.nthPurchaseOnly}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          nthPurchaseOnly: e.target.value,
                        }))
                      }
                      disabled={!draft.useNthPurchase}
                      className="w-24"
                    />
                  </div>
                </div>

                <div className="space-y-3 border-t pt-4">
                  <div className="flex items-center gap-3">
                    <Toggle
                      pressed={draft.useValidFrom}
                      onPressedChange={(pressed) =>
                        setDraft((d) => ({
                          ...d,
                          useValidFrom: pressed,
                          validFrom: pressed ? d.validFrom : "",
                        }))
                      }
                      className="h-8 w-8 p-0"
                    >
                      ✓
                    </Toggle>
                    <Label htmlFor="validFrom" className="flex-1">
                      Valid from
                    </Label>
                    <Input
                      id="validFrom"
                      type="date"
                      value={draft.validFrom}
                      onChange={(e) =>
                        setDraft((d) => ({ ...d, validFrom: e.target.value }))
                      }
                      disabled={!draft.useValidFrom}
                      className="w-40"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <Toggle
                      pressed={draft.useValidTo}
                      onPressedChange={(pressed) =>
                        setDraft((d) => ({
                          ...d,
                          useValidTo: pressed,
                          validTo: pressed ? d.validTo : "",
                        }))
                      }
                      className="h-8 w-8 p-0"
                    >
                      ✓
                    </Toggle>
                    <Label htmlFor="validTo" className="flex-1">
                      Valid to (max time)
                    </Label>
                    <Input
                      id="validTo"
                      type="date"
                      value={draft.validTo}
                      onChange={(e) =>
                        setDraft((d) => ({ ...d, validTo: e.target.value }))
                      }
                      disabled={!draft.useValidTo}
                      className="w-40"
                    />
                  </div>
                </div>
              </div>
            </div>

            <DrawerFooter>
              <Button onClick={submitDraft} disabled={isBusy}>
                {isBusy ? "Saving…" : "Save"}
              </Button>
              <DrawerClose asChild>
                <Button variant="outline" disabled={isBusy}>
                  Cancel
                </Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </header>

      {couponsQuery.isLoading ? (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      ) : couponsQuery.error ? (
        <Card className="border-border/60 bg-card/60 rounded-3xl px-4 py-4">
          <p className="text-sm">
            Failed to load coupons: {couponsQuery.error.message}
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {(couponsQuery.data as Coupon[]).map((coupon) => {
            const status = getCouponStatus(coupon);
            const usageText =
              coupon.usageLimit && coupon.usageLimit > 0
                ? `${coupon.numberOfUses} / ${coupon.usageLimit}`
                : `${coupon.numberOfUses} / ∞`;

            return (
              <Card
                key={coupon.id}
                className="border-border/60 bg-card/60 rounded-3xl px-4 py-4"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-muted-foreground text-xs tracking-widest uppercase">
                      {coupon.code}
                    </p>
                    <p className="truncate text-lg font-semibold">
                      {coupon.description ?? "—"}
                    </p>
                    <p className="text-muted-foreground mt-1 text-xs">
                      Discount:{" "}
                      {formatRupeesFromPaise(coupon.flatDiscountAmount)} (max{" "}
                      {formatRupeesFromPaise(coupon.maxFlatDiscountAmount)})
                    </p>
                  </div>
                  <Badge variant="secondary" className="shrink-0 rounded-full">
                    {status}
                  </Badge>
                </div>

                <div className="mt-4 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Usage</span>
                  <span className="font-semibold">{usageText}</span>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => openEdit(coupon)}
                    disabled={isBusy}
                  >
                    <Pencil className="h-4 w-4" /> Edit
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onToggle(coupon)}
                    disabled={isBusy}
                  >
                    {coupon.showCoupon ? "Pause" : "Activate"}
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onResetUsage(coupon)}
                    disabled={isBusy}
                  >
                    <RotateCcw className="h-4 w-4" /> Reset usage
                  </Button>

                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => onDelete(coupon)}
                    disabled={isBusy}
                  >
                    <Trash2 className="h-4 w-4" /> Delete
                  </Button>
                </div>
              </Card>
            );
          })}

          <Card className="border-border/60 bg-card/60 rounded-3xl p-4">
            <div className="flex items-center gap-3">
              <TicketPercent className="bg-muted h-10 w-10 rounded-2xl p-2" />
              <div>
                <p className="text-sm font-semibold">Smart rules</p>
                <p className="text-muted-foreground text-xs">
                  Configure weekday/weekend pricing without touching code.
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
