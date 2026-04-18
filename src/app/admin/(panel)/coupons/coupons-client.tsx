"use client";

import * as React from "react";
import { Pencil, PlusCircle, Trash2, Ticket, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

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
import { api } from "~/trpc/react";
import { cn } from "~/lib/utils";
import { format, parseISO } from "date-fns";
import { enIN, ta } from "date-fns/locale";
import { useLanguage } from "~/lib/language-context";
import allTranslations from "~/lib/translations/all";

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
  status: "active" | "inactive" | "achieved";
  createdAt: Date;
};

function formatRupeesFromPaise(paise: number) {
  const rupees = paise / 100;
  return rupees.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });
}

function getCouponStatus(
  coupon: Pick<Coupon, "validFrom" | "validTo" | "showCoupon" | "status">,
  strings: any,
) {
  if (coupon.status === "achieved") return strings.achieved;

  const now = new Date();
  const from = new Date(coupon.validFrom);
  const to = coupon.validTo ? new Date(coupon.validTo) : null;

  if (to && to < now) return strings.expired;
  if (from > now) return strings.scheduled;
  return coupon.status === "active" ? strings.active : strings.inactive;
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

export function CouponsClient({ strings: _strings }: { strings: Strings }) {
  const { language } = useLanguage();
  const strings = React.useMemo(
    () => allTranslations.admin[language],
    [language],
  );
  const locale = language === "ta" ? ta : enIN;
  const utils = api.useUtils();
  const router = useRouter();

  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [draft, setDraft] = React.useState<CouponDraft>(getEmptyDraft());

  const couponsQuery = api.superAdmin.couponsList.useQuery();

  const createMutation = api.superAdmin.couponCreate.useMutation({
    onSuccess: async () => {
      toast.success(strings.couponCreated);
      setDrawerOpen(false);
      setDraft(getEmptyDraft());
      await utils.superAdmin.couponsList.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = api.superAdmin.couponUpdate.useMutation({
    onSuccess: async () => {
      toast.success(strings.couponUpdated);
      setDrawerOpen(false);
      setDraft(getEmptyDraft());
      await utils.superAdmin.couponsList.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const archiveMutation = api.superAdmin.couponArchive.useMutation({
    onMutate: async (variables) => {
      await utils.superAdmin.couponsList.cancel();
      const previousCoupons = utils.superAdmin.couponsList.getData();
      utils.superAdmin.couponsList.setData(undefined, (old) => {
        if (!old) return old;
        return old.filter((c) => c.id !== variables.couponId);
      });
      return { previousCoupons };
    },
    onError: (err, variables, context) => {
      if (context?.previousCoupons) {
        utils.superAdmin.couponsList.setData(
          undefined,
          context.previousCoupons,
        );
      }
      toast.error(err.message);
    },
    onSettled: async () => {
      await utils.superAdmin.couponsList.invalidate();
    },
  });

  const toggleMutation = api.superAdmin.couponToggle.useMutation({
    onMutate: async (variables) => {
      await utils.superAdmin.couponsList.cancel();
      const previousCoupons = utils.superAdmin.couponsList.getData();
      utils.superAdmin.couponsList.setData(undefined, (old) => {
        if (!old) return old;
        return old.map((c) => {
          if (c.id !== variables.couponId) return c;
          if (variables.field === "showCoupon") {
            return { ...c, showCoupon: !c.showCoupon };
          }
          if (variables.field === "status") {
            return {
              ...c,
              status: c.status === "active" ? "inactive" : "active",
            };
          }
          return c;
        });
      });
      return { previousCoupons };
    },
    onError: (err, variables, context) => {
      if (context?.previousCoupons) {
        utils.superAdmin.couponsList.setData(
          undefined,
          context.previousCoupons,
        );
      }
      toast.error(err.message);
    },
    onSettled: async () => {
      await utils.superAdmin.couponsList.invalidate();
    },
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
      toast.error(strings.codeRequired);
      return;
    }
    if (draft.useValidFrom && !draft.validFrom) {
      toast.error(strings.validFromRequired);
      return;
    }
    if (draft.useValidTo && !draft.validTo) {
      toast.error(strings.validToRequired);
      return;
    }
    if (!draft.flatDiscountAmount || Number(draft.flatDiscountAmount) <= 0) {
      toast.error(strings.amountMustBePositive);
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

  async function onArchive(coupon: Coupon) {
    const ok = window.confirm(
      strings.archiveCouponConfirm.replace("{code}", coupon.code),
    );
    if (!ok) return;
    await archiveMutation.mutateAsync({ couponId: coupon.id });
  }

  async function onToggleShow(coupon: Coupon) {
    await toggleMutation.mutateAsync({
      couponId: coupon.id,
      field: "showCoupon",
    });
  }

  async function onToggleStatus(coupon: Coupon) {
    await toggleMutation.mutateAsync({
      couponId: coupon.id,
      field: "status",
    });
  }

  const isBusy =
    createMutation.isPending ||
    updateMutation.isPending ||
    archiveMutation.isPending ||
    toggleMutation.isPending;

  return (
    <div className="space-y-6 pb-20">
      <header className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="bg-muted rounded-2xl"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <p className="text-muted-foreground text-xs tracking-wide uppercase">
            {strings.couponsTitle}
          </p>
          <h1 className="text-2xl font-semibold">{strings.manageCoupons}</h1>
        </div>

        <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
          <DrawerTrigger asChild>
            <Button className="rounded-2xl" onClick={openCreate}>
              <PlusCircle className="mr-2 h-4 w-4" /> {strings.newCoupon}
            </Button>
          </DrawerTrigger>

          <DrawerContent>
            <DrawerCloseButton />
            <DrawerHeader>
              <DrawerTitle>
                {draft.couponId ? strings.editCoupon : strings.newCoupon}
              </DrawerTitle>
            </DrawerHeader>

            <div className="flex-1 overflow-auto px-6 pt-2 pb-4">
              <div className="grid gap-6">
                <div className="grid gap-2">
                  <Label
                    htmlFor="code"
                    className="text-muted-foreground text-xs font-bold tracking-wider uppercase"
                  >
                    {strings.couponCode}
                  </Label>
                  <Input
                    id="code"
                    value={draft.code}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, code: e.target.value }))
                    }
                    placeholder={strings.couponPlaceholder}
                    disabled={!!draft.couponId}
                    className="rounded-xl"
                  />
                </div>

                <div className="grid gap-2">
                  <Label
                    htmlFor="description"
                    className="text-muted-foreground text-xs font-bold tracking-wider uppercase"
                  >
                    {strings.description}
                  </Label>
                  <Input
                    id="description"
                    value={draft.description}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, description: e.target.value }))
                    }
                    placeholder={strings.couponDescPlaceholder}
                    className="rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label
                      htmlFor="flatDiscountAmount"
                      className="text-muted-foreground text-xs font-bold tracking-wider uppercase"
                    >
                      {strings.discountLabel}
                    </Label>
                    <Input
                      id="flatDiscountAmount"
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      value={
                        draft.flatDiscountAmount
                          ? (Number(draft.flatDiscountAmount) / 100).toFixed(2)
                          : ""
                      }
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          flatDiscountAmount: String(
                            e.target.value === ""
                              ? ""
                              : Math.round(
                                  parseFloat(e.target.value || "0") * 100,
                                ),
                          ),
                        }))
                      }
                      className="rounded-xl"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label
                      htmlFor="maxFlatDiscountAmount"
                      className="text-muted-foreground text-xs font-bold tracking-wider uppercase"
                    >
                      {strings.maxCap}
                    </Label>
                    <Input
                      id="maxFlatDiscountAmount"
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      value={
                        draft.maxFlatDiscountAmount
                          ? (Number(draft.maxFlatDiscountAmount) / 100).toFixed(
                              2,
                            )
                          : ""
                      }
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          maxFlatDiscountAmount: String(
                            e.target.value === ""
                              ? ""
                              : Math.round(
                                  parseFloat(e.target.value || "0") * 100,
                                ),
                          ),
                        }))
                      }
                      className="rounded-xl"
                    />
                  </div>
                </div>

                <div className="bg-muted/30 space-y-4 rounded-2xl p-4">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="usageLimit"
                      className="text-sm font-semibold"
                    >
                      {strings.usageLimit}
                    </Label>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          setDraft((d) => ({
                            ...d,
                            useUsageLimit: !d.useUsageLimit,
                          }))
                        }
                        className={cn(
                          "flex h-6 w-11 items-center rounded-full px-1 transition",
                          draft.useUsageLimit
                            ? "bg-primary"
                            : "bg-muted-foreground/30",
                        )}
                      >
                        <span
                          className={cn(
                            "h-4 w-4 rounded-full bg-white transition",
                            draft.useUsageLimit
                              ? "translate-x-5"
                              : "translate-x-0",
                          )}
                        />
                      </button>
                      <Input
                        id="usageLimit"
                        type="number"
                        value={draft.usageLimit || ""}
                        onChange={(e) =>
                          setDraft((d) => ({
                            ...d,
                            usageLimit: e.target.value,
                          }))
                        }
                        disabled={!draft.useUsageLimit}
                        className="h-8 w-20 rounded-lg text-center"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="minimumBookingAmount"
                      className="text-sm font-semibold"
                    >
                      {strings.minBooking}
                    </Label>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          setDraft((d) => ({
                            ...d,
                            useMinBookingAmount: !d.useMinBookingAmount,
                          }))
                        }
                        className={cn(
                          "flex h-6 w-11 items-center rounded-full px-1 transition",
                          draft.useMinBookingAmount
                            ? "bg-primary"
                            : "bg-muted-foreground/30",
                        )}
                      >
                        <span
                          className={cn(
                            "h-4 w-4 rounded-full bg-white transition",
                            draft.useMinBookingAmount
                              ? "translate-x-5"
                              : "translate-x-0",
                          )}
                        />
                      </button>
                      <Input
                        id="minimumBookingAmount"
                        type="number"
                        value={
                          draft.minimumBookingAmount
                            ? (
                                Number(draft.minimumBookingAmount) / 100
                              ).toFixed(2)
                            : ""
                        }
                        onChange={(e) =>
                          setDraft((d) => ({
                            ...d,
                            minimumBookingAmount: String(
                              e.target.value === ""
                                ? ""
                                : Math.round(
                                    parseFloat(e.target.value || "0") * 100,
                                  ),
                            ),
                          }))
                        }
                        disabled={!draft.useMinBookingAmount}
                        className="h-8 w-20 rounded-lg text-center"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label
                      htmlFor="validFrom"
                      className="text-muted-foreground text-xs font-bold tracking-wider uppercase"
                    >
                      {strings.validFrom}
                    </Label>
                    <Input
                      id="validFrom"
                      type="date"
                      value={draft.validFrom}
                      onChange={(e) =>
                        setDraft((d) => ({ ...d, validFrom: e.target.value }))
                      }
                      className="rounded-xl"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label
                      htmlFor="validTo"
                      className="text-muted-foreground text-xs font-bold tracking-wider uppercase"
                    >
                      {strings.validTo}
                    </Label>
                    <Input
                      id="validTo"
                      type="date"
                      value={draft.validTo}
                      onChange={(e) =>
                        setDraft((d) => ({ ...d, validTo: e.target.value }))
                      }
                      className="rounded-xl"
                    />
                  </div>
                </div>
              </div>
            </div>

            <DrawerFooter className="flex flex-row gap-3">
              <Button
                onClick={submitDraft}
                disabled={isBusy}
                className="flex-1 rounded-2xl py-6"
              >
                {isBusy ? <Spinner className="mr-2 h-4 w-4" /> : null}
                {draft.couponId ? strings.updateCoupon : strings.createCoupon}
              </Button>
              <DrawerClose asChild>
                <Button
                  variant="outline"
                  disabled={isBusy}
                  className="flex-1 rounded-2xl py-6"
                >
                  {strings.cancel}
                </Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </header>

      {couponsQuery.isLoading ? (
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      ) : couponsQuery.error ? (
        <Card className="border-border/60 bg-card/60 rounded-3xl p-8 text-center">
          <p className="text-destructive text-sm font-medium">
            {strings.errorLoadBookings}: {couponsQuery.error.message}
          </p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {couponsQuery.data?.length === 0 ? (
            <Card className="border-border/60 bg-card/60 rounded-3xl p-12 text-center">
              <Ticket className="text-muted-foreground/20 mx-auto mb-4 h-12 w-12" />
              <p className="text-muted-foreground font-medium">
                {strings.noCouponsFound}
              </p>
              <p className="text-muted-foreground/60 text-sm">
                {strings.createFirstCoupon}
              </p>
            </Card>
          ) : (
            (couponsQuery.data as Coupon[]).map((coupon) => {
              const status = getCouponStatus(coupon, strings);
              const isExpired = status === strings.expired;
              const isInactive = coupon.status === "inactive";

              return (
                <Card
                  key={coupon.id}
                  className={cn(
                    "border-border/60 bg-card/60 overflow-hidden rounded-3xl transition-all",
                    (isExpired || isInactive) && "opacity-75 grayscale-[0.5]",
                  )}
                >
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-mono text-lg font-bold tracking-tighter uppercase">
                            {coupon.code}
                          </h3>
                          <Badge
                            variant="secondary"
                            className={cn(
                              "rounded-full px-2 py-0 text-[10px] font-bold tracking-wider uppercase",
                              status === strings.active
                                ? "bg-green-500/10 text-green-600"
                                : status === strings.scheduled
                                  ? "bg-blue-500/10 text-blue-600"
                                  : "bg-red-500/10 text-red-600",
                            )}
                          >
                            {status}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground mt-1 text-sm font-medium">
                          {coupon.description || strings.noDescription}
                        </p>
                      </div>

                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 rounded-xl"
                          onClick={() => openEdit(coupon)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:bg-destructive/10 h-9 w-9 rounded-xl"
                          onClick={() => onArchive(coupon)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="border-border/40 mt-4 grid grid-cols-2 gap-4 border-t pt-4">
                      <div>
                        <p className="text-muted-foreground text-[10px] font-bold tracking-widest uppercase">
                          {strings.discount}
                        </p>
                        <p className="text-primary text-lg font-bold">
                          {formatRupeesFromPaise(coupon.flatDiscountAmount)}
                        </p>
                        <p className="text-muted-foreground text-[10px]">
                          {strings.maxCap}:{" "}
                          {formatRupeesFromPaise(coupon.maxFlatDiscountAmount)}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-[10px] font-bold tracking-widest uppercase">
                          {strings.usage}
                        </p>
                        <p className="text-lg font-bold">
                          {coupon.numberOfUses}{" "}
                          <span className="text-muted-foreground text-sm font-normal">
                            / {coupon.usageLimit || "∞"}
                          </span>
                        </p>
                        <p className="text-muted-foreground text-[10px]">
                          {strings.minBooking}:{" "}
                          {formatRupeesFromPaise(coupon.minimumBookingAmount)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-muted/30 flex items-center justify-between px-5 py-3">
                    <div className="flex gap-4">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onToggleShow(coupon)}
                          className={cn(
                            "flex h-5 w-9 items-center rounded-full px-0.5 transition",
                            coupon.showCoupon
                              ? "bg-primary"
                              : "bg-muted-foreground/30",
                          )}
                        >
                          <span
                            className={cn(
                              "h-4 w-4 rounded-full bg-white transition",
                              coupon.showCoupon
                                ? "translate-x-4"
                                : "translate-x-0",
                            )}
                          />
                        </button>
                        <span className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">
                          {strings.show}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onToggleStatus(coupon)}
                          disabled={coupon.status === "achieved"}
                          className={cn(
                            "flex h-5 w-9 items-center rounded-full px-0.5 transition",
                            coupon.status === "active"
                              ? "bg-primary"
                              : "bg-muted-foreground/30",
                            coupon.status === "achieved" &&
                              "cursor-not-allowed opacity-50",
                          )}
                        >
                          <span
                            className={cn(
                              "h-4 w-4 rounded-full bg-white transition",
                              coupon.status === "active"
                                ? "translate-x-4"
                                : "translate-x-0",
                            )}
                          />
                        </button>
                        <span className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">
                          {strings.active}
                        </span>
                      </div>
                    </div>

                    <div className="text-muted-foreground text-[10px] font-medium">
                      {coupon.validTo
                        ? strings.until.replace(
                            "{date}",
                            format(parseISO(coupon.validTo), "MMM d, yyyy", {
                              locale,
                            }),
                          )
                        : strings.noExpiry}
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
