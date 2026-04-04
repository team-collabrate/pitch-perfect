"use client";

import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { useLanguage } from "~/lib/language-context";
import allTranslations from "~/lib/translations/all";
import { addDays, format, parseISO } from "date-fns";
import { toPng } from "html-to-image";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "motion/react";
import { Pencil, CalendarX } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { useSearchParams } from "next/navigation";

import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerCloseButton,
} from "~/components/ui/drawer";
import { cn, formatSlotTime } from "~/lib/utils";
import { createBookingRecord, useBookings } from "~/lib/bookings-context";
import { usePhone } from "~/lib/phone-context";
import { Spinner } from "~/components/spinner";
import { api } from "~/trpc/react";

type SlotView = {
  id?: number;
  date: string;
  from: string;
  to: string;
  status: "available" | "booked" | "unavailable";
  fullAmount: number;
  advanceAmount: number;
};

const MAX_SLOTS_PER_DAY = 2 as const;
const toPngImage = toPng as (
  node: HTMLElement,
  options: { cacheBust?: boolean; backgroundColor?: string },
) => Promise<string>;

const MotionButton = motion.create(Button);
const MotionCard = motion.create(Card);

const springy = { type: "spring", stiffness: 260, damping: 20 } as const;

const sanitizePhone = (value: string) => value.replace(/\D/g, "");

const getCustomerContactsSchema = (strings: any) =>
  z
    .object({
      name: z.string().trim().min(1, { message: strings.errorName }),
      number: z.string().refine((value) => sanitizePhone(value).length === 10, {
        message: strings.errorPhone,
      }),
      alternateContactName: z
        .string()
        .trim()
        .min(1, { message: strings.errorAltName }),
      alternateContactNumber: z
        .string()
        .refine((value) => sanitizePhone(value).length === 10, {
          message: strings.errorAltPhone,
        }),
    })
    .superRefine((values, ctx) => {
      const primaryName = values.name.trim().toLowerCase();
      const alternateName = values.alternateContactName.trim().toLowerCase();
      if (primaryName && primaryName === alternateName) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["alternateContactName"],
          message: strings.errorAltNameSame,
        });
      }

      const primaryNumber = sanitizePhone(values.number);
      const alternateNumber = sanitizePhone(values.alternateContactNumber);
      if (
        primaryNumber &&
        alternateNumber &&
        primaryNumber === alternateNumber
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["alternateContactNumber"],
          message: strings.errorAltPhoneSame,
        });
      }
    });

const fireSideCannons = () => {
  const colors = ["#a786ff", "#fd8bbc", "#eca184", "#f8deb1"];
  const end = Date.now() + 1_400;

  const frame = () => {
    if (Date.now() > end) return;
    void confetti({
      particleCount: 2,
      angle: 60,
      spread: 55,
      startVelocity: 60,
      origin: { x: 0, y: 0.5 },
      colors,
    });
    void confetti({
      particleCount: 2,
      angle: 120,
      spread: 55,
      startVelocity: 60,
      origin: { x: 1, y: 0.5 },
      colors,
    });
    requestAnimationFrame(frame);
  };

  frame();
};

function useSlotBoard(selectedDate: string) {
  const { data, isLoading } = api.timeSlot.getAllByDate.useQuery(
    { date: selectedDate },
    { enabled: !!selectedDate, staleTime: 60_000 },
  );

  const slots = useMemo(() => {
    if (!data || data.length === 0) {
      return [];
    }

    return data
      .filter((slot) => slot.status === "available")
      .map(
        (slot) =>
          ({
            id: (slot as { id?: number }).id,
            date: slot.date,
            from: slot.from.slice(0, 5),
            to: slot.to.slice(0, 5),
            status: "available",
            fullAmount: slot.fullAmount,
            advanceAmount: slot.advanceAmount,
          }) satisfies SlotView,
      );
  }, [data]);

  return { slots, isLoading };
}

type CustomerFormState = {
  name: string;
  number: string;
  email: string;
  alternateContactName: string;
  alternateContactNumber: string;
  language: "en" | "ta";
};

const blankCustomer: CustomerFormState = {
  name: "",
  number: "",
  email: "",
  alternateContactName: "",
  alternateContactNumber: "",
  language: "en",
};

type ConfirmationBooking = {
  id: string;
  date: string;
  from: string;
  to: string;
  bookingType: "cricket" | "football" | "cricket&football";
  paymentOption: "advance" | "full";
  amountPaid: number;
  totalAmount: number;
  verificationCode: string;
  bookingCode: string;
  customer: CustomerFormState;
};

export default function BookingPage() {
  const { language } = useLanguage();
  const { phoneNumber: storedPhone, setPhoneNumber: setStoredPhone } =
    usePhone();
  const searchParams = useSearchParams();
  const utils = api.useUtils();
  const strings = useMemo(() => allTranslations.book[language], [language]);
  const customerContactsSchema = useMemo(
    () => getCustomerContactsSchema(strings),
    [strings],
  );
  const [selectedDate, setSelectedDate] = useState<string>(() =>
    format(new Date(), "yyyy-MM-dd"),
  );
  const { slots, isLoading: isLoadingSlots } = useSlotBoard(selectedDate);
  const { addBooking } = useBookings();
  const [selectedSlots, setSelectedSlots] = useState<SlotView[]>([]);
  const [slotDrawerOpen, setSlotDrawerOpen] = useState(false);
  const [bookingType, setBookingType] = useState<Set<"cricket" | "football">>(
    new Set(),
  );
  const [paymentOption, setPaymentOption] = useState<"" | "advance" | "full">(
    "",
  );
  const [customer, setCustomer] = useState<CustomerFormState>(blankCustomer);
  const [confirmation, setConfirmation] = useState<
    ConfirmationBooking[] | null
  >(null);
  const primaryConfirmation = confirmation?.[0];
  const confirmationTotalPaid = confirmation?.reduce(
    (sum, b) => sum + b.amountPaid,
    0,
  );
  const confirmationCardRef = useRef<HTMLDivElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [phoneDrawerOpen, setPhoneDrawerOpen] = useState(false);
  const [tempPhone, setTempPhone] = useState("");
  const [isHydrated, setIsHydrated] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    couponId: string;
    discount: number;
    finalAmount: number;
  } | null>(null);
  const restoredPaymentOrderRef = useRef<string | null>(null);

  // Hydration effect
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const paymentStatus = searchParams.get("payment");
  const paymentOrderId = searchParams.get("orderId");

  // Fetch customer data when stored phone exists
  const { data: existingCustomer, isLoading: isLoadingCustomer } =
    api.customer.getByPhoneNumber.useQuery(
      { phoneNumber: storedPhone },
      { enabled: !!storedPhone && isHydrated },
    );

  // Mutations
  const upsertCustomer = api.customer.upsert.useMutation();
  const initiatePayment = api.booking.initiatePayment.useMutation();
  const { data: paymentOrder } = api.booking.getPaymentOrder.useQuery(
    { orderId: paymentOrderId ?? "" },
    { enabled: paymentStatus === "success" && !!paymentOrderId },
  );

  const slotFullAmount = selectedSlots[0]?.fullAmount ?? 80000;
  const slotAdvanceAmount = selectedSlots[0]?.advanceAmount ?? 10000;

  const totalFullPaise = selectedSlots.reduce(
    (sum, slot) => sum + slot.fullAmount,
    0,
  );
  const totalAdvancePaise = selectedSlots.reduce(
    (sum, slot) => sum + slot.advanceAmount,
    0,
  );

  const toRupees = (value: number) => `₹${(value / 100).toFixed(0)}`;

  const hasSelection = selectedSlots.length > 0;
  const advanceLabelPaise = hasSelection
    ? totalAdvancePaise
    : slotAdvanceAmount;
  const fullLabelPaise = hasSelection ? totalFullPaise : slotFullAmount;

  const paymentOptions = useMemo(
    () => [
      { key: "advance", label: `${toRupees(advanceLabelPaise)} Advance` },
      { key: "full", label: `${toRupees(fullLabelPaise)} Full` },
    ],
    [advanceLabelPaise, fullLabelPaise],
  );
  const totalAmountPaise = totalFullPaise;

  const { data: customerBookings = [] } = api.booking.getByNumber.useQuery(
    { number: storedPhone },
    { enabled: !!storedPhone && isHydrated },
  );

  useEffect(() => {
    if (paymentStatus !== "failed") return;
    toast.error(strings.bookingFailed);
  }, [paymentStatus, strings.bookingFailed]);

  useEffect(() => {
    if (paymentStatus !== "success" || !paymentOrder) return;
    if (restoredPaymentOrderRef.current === paymentOrder.orderId) return;
    restoredPaymentOrderRef.current = paymentOrder.orderId;

    const confirmationData: ConfirmationBooking[] = paymentOrder.bookings.map(
      (booking: any) => ({
        id: booking.id,
        date: booking.timeSlot.date,
        from: booking.timeSlot.from.slice(0, 5),
        to: booking.timeSlot.to.slice(0, 5),
        bookingType: booking.bookingType as any,
        paymentOption: booking.status === "fullPaid" ? "full" : "advance",
        amountPaid: booking.amountPaid / 100,
        totalAmount: booking.totalAmount / 100,
        verificationCode: booking.verificationCode,
        bookingCode: `PP-${booking.id.slice(-6).toUpperCase()}`,
        customer: {
          name: paymentOrder.customer.name,
          number: paymentOrder.customer.number,
          email: paymentOrder.customer.email,
          alternateContactName: paymentOrder.customer.alternateContactName,
          alternateContactNumber: paymentOrder.customer.alternateContactNumber,
          language: paymentOrder.customer.language,
        },
      }),
    );

    setConfirmation(confirmationData);
    confirmationData.forEach((booking: ConfirmationBooking) => {
      addBooking(
        createBookingRecord({
          id: booking.id,
          slotId: `${booking.date}-${booking.from}-${booking.to}`,
          date: booking.date,
          from: booking.from,
          to: booking.to,
          bookingType: booking.bookingType,
          paymentOption: booking.paymentOption,
          amountPaid: booking.amountPaid,
          totalAmount: booking.totalAmount,
          verificationCode: booking.verificationCode,
          bookingCode: booking.bookingCode,
          customer: booking.customer,
        }),
      );
    });
    fireSideCannons();
  }, [paymentStatus, paymentOrder, addBooking]);

  const bookingCountForCoupons = customerBookings.length;

  const { data: activeCoupons = [] } = api.booking.getActiveCoupons.useQuery(
    {
      phoneNumber: storedPhone,
      totalAmount: totalAmountPaise,
    },
    { enabled: !!storedPhone && totalAmountPaise > 0 && isHydrated },
  );

  const {
    data: couponValidation,
    refetch: validateCoupon,
    isFetching: isValidatingCoupon,
  } = api.booking.validateCoupon.useQuery(
    {
      couponCode: couponCode.toUpperCase(),
      bookingCount: bookingCountForCoupons,
      totalAmount: totalAmountPaise,
    },
    { enabled: false },
  );

  // Pre-fill customer form when existing customer data is loaded
  useEffect(() => {
    if (existingCustomer) {
      setCustomer({
        name: existingCustomer.name ?? "",
        number: existingCustomer.number,
        email: existingCustomer.email ?? "",
        alternateContactName: existingCustomer.alternateContactName ?? "",
        alternateContactNumber: existingCustomer.alternateContactNumber ?? "",
        language: existingCustomer.languagePreference,
      });
    }
  }, [existingCustomer]);

  // If no stored phone, set customer number to empty to allow input
  useEffect(() => {
    if (!storedPhone && !customer.number) {
      setCustomer((prev) => ({ ...prev, number: "" }));
    }
  }, [storedPhone, customer.number]);

  const { data: slotConfig } = api.timeSlot.getSlotConfig.useQuery();
  const daysToShow = slotConfig?.daysInAdvanceToCouldBook ?? 7;

  const dates = useMemo(() => {
    const today = new Date();
    return Array.from({ length: daysToShow }, (_, i) =>
      format(addDays(today, i), "yyyy-MM-dd"),
    );
  }, [daysToShow]);

  const slotsByDate = useMemo(() => {
    return slots.reduce<Record<string, SlotView[]>>((acc, slot) => {
      acc[slot.date] ??= [];
      acc[slot.date]!.push(slot);
      return acc;
    }, {});
  }, [slots]);

  const slotsForSelectedDate = useMemo(() => {
    return slotsByDate[selectedDate ?? ""] ?? [];
  }, [slotsByDate, selectedDate]);

  const selectionCount = selectedSlots.length;

  useEffect(() => {
    if (!selectedDate && dates.length > 0) {
      setSelectedDate(dates[0]!);
    }
  }, [dates, selectedDate]);

  useEffect(() => {
    setSelectedSlots([]);
    setBookingType(new Set());
    setPaymentOption("");
  }, [selectedDate]);

  const handleCustomerChange = (
    field: keyof CustomerFormState,
    value: string,
  ) => {
    setCustomer((prev) => ({ ...prev, [field]: value }));
  };

  const toggleSlotSelection = (slot: SlotView) => {
    if (slot.date !== selectedDate) return;
    setSelectedSlots((prev) => {
      const exists = prev.some(
        (item) =>
          item.id === slot.id &&
          item.date === slot.date &&
          item.from === slot.from &&
          item.to === slot.to,
      );
      if (exists) {
        return prev.filter(
          (item) =>
            !(
              item.id === slot.id &&
              item.date === slot.date &&
              item.from === slot.from &&
              item.to === slot.to
            ),
        );
      }
      if (prev.length >= MAX_SLOTS_PER_DAY) {
        return prev;
      }
      return [...prev, slot];
    });
  };

  const clearSelectedSlots = () => setSelectedSlots([]);

  const canChooseGame = selectionCount > 0;
  const canChoosePayment = canChooseGame && bookingType.size > 0;

  const formReady = Boolean(
    selectedDate &&
    selectionCount > 0 &&
    bookingType.size > 0 &&
    paymentOption &&
    customer.name.trim() &&
    customer.number.trim() &&
    customer.alternateContactName.trim() &&
    customer.alternateContactNumber.trim(),
  );

  // Handle phone number change
  const handleChangePhone = () => {
    setTempPhone(storedPhone || customer.number);
    setPhoneDrawerOpen(true);
  };

  const handleConfirmPhoneChange = () => {
    const normalized = sanitizePhone(tempPhone);
    if (normalized.length !== 10) {
      toast.error("Phone number must be 10 digits");
      return;
    }
    setStoredPhone(normalized);
    // Set the phone number in customer state so it remains visible
    setCustomer(() => ({ ...blankCustomer, number: normalized }));
    setPhoneDrawerOpen(false);
  };

  const handleApplyCoupon = async () => {
    if (!couponCode || totalAmountPaise <= 0) {
      toast.error("Select slots and enter a coupon code");
      return;
    }

    const { data: result } = await validateCoupon();

    if (result?.isValid) {
      setAppliedCoupon({
        couponId: result.couponId!,
        discount: result.discount,
        finalAmount: result.finalAmount,
      });
      toast.success(result.message);
    } else if (result) {
      toast.error(result.message);
    }
  };

  const handleSubmit = async () => {
    if (
      !formReady ||
      bookingType.size === 0 ||
      !paymentOption ||
      selectionCount === 0
    ) {
      return;
    }

    const validationResult = customerContactsSchema.safeParse({
      name: customer.name,
      number: customer.number,
      alternateContactName: customer.alternateContactName,
      alternateContactNumber: customer.alternateContactNumber,
    });

    if (!validationResult.success) {
      toast.error(
        validationResult.error.errors[0]?.message ??
          "Fix the contact details before continuing",
      );
      return;
    }

    const normalizedNumber = sanitizePhone(customer.number);
    const normalizedAlternateNumber = sanitizePhone(
      customer.alternateContactNumber,
    );

    setIsSubmitting(true);

    try {
      // Step 1: Upsert customer details
      await upsertCustomer.mutateAsync({
        name: customer.name,
        number: normalizedNumber,
        email: customer.email,
        alternateContactName: customer.alternateContactName,
        alternateContactNumber: normalizedAlternateNumber,
        languagePreference: customer.language,
      });

      // Store the phone number for future use
      setStoredPhone(normalizedNumber);

      // Step 2: Reserve the slots and create a Paytm payment session
      const timeSlots = selectedSlots.map((slot) => ({
        date: slot.date,
        from: slot.from + ":00",
        to: slot.to + ":00",
      }));
      // Convert Set to string: if both selected, "cricket&football", else the single selection
      const bookingTypeStr =
        bookingType.size === 2
          ? "cricket&football"
          : Array.from(bookingType)[0]!;
      const paymentSession = await initiatePayment.mutateAsync({
        number: normalizedNumber,
        timeSlots,
        paymentType: paymentOption,
        bookingType: bookingTypeStr,
        couponId: appliedCoupon?.couponId,
      });

      setSelectedSlots([]);
      setBookingType(new Set());
      setPaymentOption("");
      setSlotDrawerOpen(false);

      const form = document.createElement("form");
      form.method = "POST";
      form.action = paymentSession.paymentPageUrl;

      const appendHidden = (name: string, value: string) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = name;
        input.value = value;
        form.appendChild(input);
      };

      appendHidden("mid", paymentSession.mid);
      appendHidden("orderId", paymentSession.orderId);
      appendHidden("txnToken", paymentSession.txnToken);
      appendHidden("callbackUrl", paymentSession.callbackUrl);

      document.body.appendChild(form);
      form.submit();

      // Invalidate queries to refresh data
      await utils.timeSlot.getAllByDate.invalidate({ date: selectedDate });
      await utils.booking.getByNumber.invalidate({ number: customer.number });
    } catch (error) {
      console.error("Booking failed:", error);
      const message =
        error instanceof Error
          ? error.message
          : "Booking failed. Please try again.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderToPng = useCallback(async (node: HTMLElement) => {
    const background =
      getComputedStyle(document.documentElement)
        .getPropertyValue("--background")
        .trim() || "#ffffff";
    return await toPngImage(node, {
      cacheBust: true,
      backgroundColor: background,
    });
  }, []);

  const handleDownload = useCallback(async () => {
    if (!confirmation?.length || !confirmationCardRef.current) return;
    try {
      const url = await renderToPng(confirmationCardRef.current);
      const link = document.createElement("a");
      link.href = url;
      const primary = confirmation[0];
      link.download = `${primary?.bookingCode ?? "booking"}.png`;
      link.click();
    } catch (error: unknown) {
      console.error("Unable to export booking", error);
    }
  }, [confirmation, renderToPng]);

  return (
    <motion.div
      className="space-y-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
    >
      <header className="space-y-1">
        <p className="text-muted-foreground text-xs tracking-wide uppercase">
          {strings.subtitle}
        </p>
        <h1 className="text-2xl font-semibold">{strings.title}</h1>
      </header>

      <section className="space-y-4 overflow-x-hidden">
        <h2 className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
          {strings.pickDate}
        </h2>
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4">
          {dates.map((date) => {
            const isActive = selectedDate === date;
            const formatted = format(parseISO(date), "EEE d MMM");
            const [day, dayNum, month] = formatted.split(" ");
            return (
              <motion.button
                key={date}
                onClick={() => setSelectedDate(date)}
                className={cn(
                  "my-0.5 flex min-w-24 flex-col items-center rounded-2xl border px-4 py-3 text-sm transition-all",
                  isActive
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground",
                )}
                layout
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.03 }}
                transition={springy}
              >
                <span className="font-semibold uppercase">{day}</span>
                <span>
                  {dayNum} {month}
                </span>
              </motion.button>
            );
          })}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
              {strings.slots}
            </h2>
            <p className="text-muted-foreground text-xs">
              {selectedDate
                ? strings.pickUpTo
                    .replace("{max}", MAX_SLOTS_PER_DAY.toString())
                    .replace(
                      "{date}",
                      format(parseISO(selectedDate), "EEE, MMM d"),
                    )
                : strings.chooseDateToEnable}
            </p>
          </div>
          <span className="text-muted-foreground text-xs">
            {selectionCount}/{MAX_SLOTS_PER_DAY}
          </span>
        </div>
        <Drawer open={slotDrawerOpen} onOpenChange={setSlotDrawerOpen}>
          <DrawerTrigger asChild>
            <Button
              variant="outline"
              className="w-full rounded-2xl py-6 text-base"
              disabled={!selectedDate}
            >
              {selectionCount > 0 ? strings.editSlots : strings.chooseSlots}
            </Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerCloseButton />
            <DrawerHeader>
              <DrawerTitle>
                {selectedDate
                  ? format(parseISO(selectedDate), "EEEE, MMM d")
                  : strings.pickDateAbove}
              </DrawerTitle>
              <DrawerDescription>
                {strings.selectUpTo.replace(
                  "{max}",
                  MAX_SLOTS_PER_DAY.toString(),
                )}
              </DrawerDescription>
            </DrawerHeader>
            <div className="text-muted-foreground flex items-center justify-between px-6 pb-2 text-xs">
              <span>
                {selectionCount} {strings.selected}
              </span>
              <Button
                variant="ghost"
                size="sm"
                disabled={!selectionCount}
                onClick={clearSelectedSlots}
              >
                {strings.clearAll}
              </Button>
            </div>
            {selectionCount > 0 && (
              <div className="border-border/60 text-muted-foreground space-y-1 border-b px-6 pb-3 text-xs">
                <div className="flex items-center justify-between text-[11px] tracking-wide uppercase">
                  <span>{strings.advanceTotal}</span>
                  <span className="text-primary font-semibold">
                    {toRupees(totalAdvancePaise)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] tracking-wide uppercase">
                  <span>{strings.fullTotal}</span>
                  <span className="text-primary font-semibold">
                    {toRupees(totalFullPaise)}
                  </span>
                </div>
              </div>
            )}
            <div className="grid max-h-72 grid-cols-2 gap-3 overflow-y-auto px-6 pb-4">
              {isLoadingSlots ? (
                <div className="col-span-2 flex items-center justify-center py-12">
                  <Spinner />
                </div>
              ) : slotsForSelectedDate.length === 0 ? (
                <div className="col-span-2 flex flex-col items-center justify-center py-12 text-center">
                  <div className="bg-muted mb-4 flex h-12 w-12 items-center justify-center rounded-2xl">
                    <CalendarX className="text-muted-foreground h-6 w-6" />
                  </div>
                  <p className="text-muted-foreground text-sm font-medium">
                    {strings.noSlotsAvailable}
                  </p>
                  <p className="text-muted-foreground/60 text-xs">
                    {strings.tryAnotherDate}
                  </p>
                </div>
              ) : (
                slotsForSelectedDate.map((slot) => {
                  const isSelected = selectedSlots.some(
                    (item) =>
                      item.id === slot.id &&
                      item.date === slot.date &&
                      item.from === slot.from &&
                      item.to === slot.to,
                  );
                  const isAtLimit =
                    !isSelected && selectionCount >= MAX_SLOTS_PER_DAY;
                  const isDisabled = isAtLimit;
                  return (
                    <motion.button
                      key={slot.id}
                      type="button"
                      disabled={isDisabled}
                      onClick={() => toggleSlotSelection(slot)}
                      className={cn(
                        "flex flex-col rounded-2xl border px-3 py-3 text-left text-sm transition-all",
                        "hover:border-primary",
                        isSelected &&
                          "border-primary bg-primary/10 text-primary shadow-sm",
                        isAtLimit && !isSelected && "opacity-60",
                      )}
                      layout
                      whileTap={{ scale: isDisabled ? 1 : 0.97 }}
                      transition={springy}
                    >
                      <span className="font-semibold">
                        {formatSlotTime(slot.from)} – {formatSlotTime(slot.to)}
                      </span>
                      <span className="text-muted-foreground mt-1 text-[11px]">
                        {strings.advance} {toRupees(slot.advanceAmount)} •{" "}
                        {strings.full} {toRupees(slot.fullAmount)}
                      </span>
                      <span className="text-muted-foreground mt-2 inline-flex items-center gap-2 text-xs">
                        {isSelected
                          ? strings.selected
                          : isAtLimit
                            ? strings.slotLimitReached
                            : strings.tapToSelect}
                        {isSelected && (
                          <span className="bg-primary h-2 w-2 rounded-full" />
                        )}
                      </span>
                    </motion.button>
                  );
                })
              )}
            </div>
            <DrawerFooter>
              <Button
                onClick={() => setSlotDrawerOpen(false)}
                disabled={!selectedDate}
              >
                {strings.done}
              </Button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
        <div className="flex flex-wrap gap-2">
          <AnimatePresence mode="popLayout">
            {selectionCount === 0 ? (
              <motion.span
                key="empty-state"
                className="text-muted-foreground text-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {strings.noSlotsSelected}
              </motion.span>
            ) : (
              selectedSlots
                .slice()
                .sort((a, b) => a.from.localeCompare(b.from))
                .map((slot) => (
                  <motion.span
                    key={slot.id}
                    className="border-primary/30 bg-primary/10 text-primary rounded-full border px-3 py-1 text-xs font-medium"
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={springy}
                  >
                    {formatSlotTime(slot.from)} – {formatSlotTime(slot.to)}
                  </motion.span>
                ))
            )}
          </AnimatePresence>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
          {strings.sport} {bookingType.size === 2 && strings.cricketAndFootball}
        </h2>
        <div className="grid grid-cols-2 gap-2">
          {["cricket", "football"].map((option) => {
            const isActive = bookingType.has(option as "cricket" | "football");
            return (
              <MotionButton
                key={option}
                variant={isActive ? "default" : "outline"}
                disabled={!canChooseGame}
                className={cn(
                  "rounded-2xl py-6 text-base capitalize",
                  !isActive && "bg-background",
                )}
                onClick={() => {
                  const newSet = new Set(bookingType);
                  if (isActive) {
                    newSet.delete(option as "cricket" | "football");
                  } else {
                    newSet.add(option as "cricket" | "football");
                  }
                  setBookingType(newSet);
                }}
                whileTap={{ scale: canChooseGame ? 0.96 : 1 }}
                whileHover={{ scale: canChooseGame ? 1.02 : 1 }}
                transition={springy}
              >
                {option === "cricket" ? strings.cricket : strings.football}
              </MotionButton>
            );
          })}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
          {strings.paymentOption}
        </h2>
        <div className="grid grid-cols-2 gap-2">
          {paymentOptions.map((option) => {
            const isActive = paymentOption === option.key;
            return (
              <MotionButton
                key={option.key}
                variant={isActive ? "default" : "outline"}
                disabled={!canChoosePayment}
                className={cn(
                  "rounded-2xl py-6 text-base",
                  option.key === "advance" && !isActive && "bg-background",
                )}
                onClick={() =>
                  setPaymentOption(option.key as "advance" | "full")
                }
                whileTap={{ scale: canChoosePayment ? 0.96 : 1 }}
                whileHover={{ scale: canChoosePayment ? 1.02 : 1 }}
                transition={springy}
              >
                {option.key === "advance" ? strings.advance : strings.full}
              </MotionButton>
            );
          })}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
          {strings.playerDetails}
        </h2>
        {!isHydrated ? (
          <div className="flex items-center justify-center py-8">
            <Spinner />
          </div>
        ) : isLoadingCustomer && storedPhone ? (
          <div className="flex flex-col items-center justify-center gap-2 py-8">
            <Spinner />
            <span className="text-muted-foreground text-xs">
              {strings.loadingDetails}
            </span>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="number">
                {strings.phoneNumber} <span className="text-red-500">*</span>
              </Label>
              <div className="flex gap-2">
                <Input
                  id="number"
                  inputMode="tel"
                  value={customer.number}
                  onChange={(event) =>
                    handleCustomerChange("number", event.target.value)
                  }
                  placeholder={strings.phoneNumber}
                  disabled={!!storedPhone && !!existingCustomer}
                  className={storedPhone && existingCustomer ? "bg-muted" : ""}
                />
                {storedPhone && existingCustomer && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleChangePhone}
                    className="shrink-0"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {isHydrated && storedPhone && existingCustomer && (
                <p className="text-muted-foreground text-xs">
                  {strings.usingSavedNumber}
                </p>
              )}
              {isHydrated && (!storedPhone || !existingCustomer) && (
                <p className="text-muted-foreground text-xs">
                  {strings.enterPrimaryNumber}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="name">
                {strings.name} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={customer.name}
                onChange={(event) =>
                  handleCustomerChange("name", event.target.value)
                }
                placeholder={strings.name}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="email">{strings.emailLabel}</Label>
              <Input
                id="email"
                type="email"
                value={customer.email}
                onChange={(event) =>
                  handleCustomerChange("email", event.target.value)
                }
                placeholder=""
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="alternateName">
                {strings.alternateContactName}{" "}
                <span className="text-red-500">*</span>
              </Label>
              <Input
                id="alternateName"
                value={customer.alternateContactName}
                onChange={(event) =>
                  handleCustomerChange(
                    "alternateContactName",
                    event.target.value,
                  )
                }
                placeholder={strings.alternateContactName}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="alternateNumber">
                {strings.alternateContactNumber}{" "}
                <span className="text-red-500">*</span>
              </Label>
              <Input
                id="alternateNumber"
                inputMode="tel"
                value={customer.alternateContactNumber}
                onChange={(event) =>
                  handleCustomerChange(
                    "alternateContactNumber",
                    event.target.value,
                  )
                }
                placeholder={strings.alternateContactNumber}
              />
            </div>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
          {strings.coupon}
        </h2>
        <div className="space-y-2">
          {/* Horizontal Scrollable Coupons */}
          {activeCoupons && activeCoupons.length > 0 && (
            <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
              {activeCoupons.map((coupon) => (
                <motion.button
                  key={coupon.id}
                  onClick={() => {
                    if (coupon.isEligible && !appliedCoupon) {
                      setCouponCode(coupon.code);
                    }
                  }}
                  disabled={!coupon.isEligible || !!appliedCoupon}
                  className={cn(
                    "flex min-w-[90px] flex-col items-center justify-center rounded-2xl border px-3 py-2 text-xs transition",
                    coupon.isEligible && !appliedCoupon
                      ? "border-primary/60 bg-primary/10 text-primary hover:bg-primary/20 dark:border-primary/50 dark:bg-primary/20 dark:text-primary cursor-pointer"
                      : "border-border bg-muted/70 text-muted-foreground dark:bg-muted/60 dark:text-muted-foreground cursor-not-allowed opacity-60",
                  )}
                  whileTap={{
                    scale: coupon.isEligible && !appliedCoupon ? 0.95 : 1,
                  }}
                  whileHover={{
                    scale: coupon.isEligible && !appliedCoupon ? 1.03 : 1,
                  }}
                  transition={springy}
                >
                  <p className="font-semibold">{coupon.code}</p>
                  <p className="text-primary dark:text-primary font-bold">
                    -{(coupon.discount / 100).toFixed(0)}
                  </p>
                </motion.button>
              ))}
            </div>
          )}

          {/* Coupon Code Input */}
          <div className="flex gap-2">
            <Input
              placeholder={strings.enterCouponCode}
              value={couponCode}
              onChange={(e) => {
                setCouponCode(e.target.value);
                setAppliedCoupon(null);
              }}
              className="rounded-2xl"
              disabled={selectedSlots.length === 0}
            />
            {!appliedCoupon && (
              <Button
                type="button"
                onClick={handleApplyCoupon}
                disabled={isValidatingCoupon || selectedSlots.length === 0}
                className="shrink-0 rounded-2xl"
              >
                {isValidatingCoupon ? (
                  <Spinner className="h-4 w-4" />
                ) : (
                  strings.apply
                )}
              </Button>
            )}
            {appliedCoupon && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setAppliedCoupon(null);
                  setCouponCode("");
                }}
                className="shrink-0 rounded-2xl"
              >
                {strings.remove}
              </Button>
            )}
          </div>

          {/* Applied Coupon Success */}
          {appliedCoupon && (
            <div className="dark:border-primary/60 dark:bg-primary/10 dark:text-primary rounded-2xl border border-green-200 bg-green-50 p-3 text-sm">
              <p className="dark:text-primary font-medium text-green-700">
                {strings.couponAppliedSave.replace(
                  "{amount}",
                  (appliedCoupon.discount / 100).toFixed(2),
                )}
              </p>
              <p className="dark:text-primary/80 text-xs text-green-600">
                {strings.payAmount.replace(
                  "{amount}",
                  (appliedCoupon.finalAmount / 100).toFixed(2),
                )}
              </p>
            </div>
          )}

          {/* Validation Error */}
          {couponValidation && !couponValidation.isValid && couponCode && (
            <div className="dark:border-destructive/60 dark:bg-destructive/10 dark:text-destructive rounded-2xl border border-red-200 bg-red-50 p-2 text-xs text-red-700">
              {couponValidation.message}
            </div>
          )}
        </div>
      </section>

      {(() => {
        const totalPaymentPaise =
          paymentOption === "advance" ? totalAdvancePaise : totalFullPaise;
        const amountToPay = appliedCoupon
          ? appliedCoupon.finalAmount
          : totalPaymentPaise;
        return (
          <MotionButton
            disabled={!formReady || isSubmitting}
            className="w-full rounded-2xl py-6 text-base font-semibold tracking-wide uppercase"
            onClick={handleSubmit}
            whileTap={{ scale: formReady && !isSubmitting ? 0.97 : 1 }}
            whileHover={{ scale: formReady && !isSubmitting ? 1.02 : 1 }}
            transition={springy}
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <Spinner className="h-4 w-4 border-white" />
                <span>{strings.loading}</span>
              </div>
            ) : (
              strings.pay.replace("{amount}", toRupees(amountToPay))
            )}
          </MotionButton>
        );
      })()}

      <div className="h-2" />

      <div className="h-2" />
      {/* Phone Number Change Drawer */}
      <Drawer open={phoneDrawerOpen} onOpenChange={setPhoneDrawerOpen}>
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>
            <DrawerTitle>{strings.phoneDrawerTitle}</DrawerTitle>
            <DrawerDescription>{strings.phoneDrawerDesc}</DrawerDescription>
          </DrawerHeader>
          <div className="px-6 pb-4">
            <div className="space-y-1">
              <Label htmlFor="tempPhone">{strings.phoneNumber}</Label>
              <Input
                id="tempPhone"
                inputMode="tel"
                value={tempPhone}
                onChange={(event) => setTempPhone(event.target.value)}
                placeholder={strings.phoneNumber}
              />
            </div>
          </div>
          <DrawerFooter>
            <Button
              onClick={handleConfirmPhoneChange}
              disabled={!tempPhone.trim()}
            >
              {strings.confirm}
            </Button>
            <Button variant="ghost" onClick={() => setPhoneDrawerOpen(false)}>
              {strings.cancel}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <AnimatePresence>
        {confirmation && primaryConfirmation && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <MotionCard
              ref={confirmationCardRef}
              className="w-full max-w-sm space-y-4 px-0 pt-4 pb-6"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              <div className="px-6">
                <p className="text-muted-foreground text-xs tracking-wide uppercase">
                  {strings.bookingSuccessful}
                </p>
                <h3 className="text-lg font-semibold">
                  {strings.pitchPerfectPass}
                </h3>
              </div>
              <div className="space-y-3 px-6 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{strings.date}</span>
                  <span>
                    {format(parseISO(primaryConfirmation.date), "EEE, MMM d")}
                  </span>
                </div>
                <div className="space-y-2">
                  <span className="text-muted-foreground">{strings.slots}</span>
                  <div className="border-border/60 bg-muted/50 space-y-1 rounded-2xl border border-dashed p-3">
                    {confirmation.map((booking) => (
                      <div
                        key={booking.id}
                        className="flex items-center justify-between text-xs font-semibold"
                      >
                        <span>
                          {formatSlotTime(booking.from)} –{" "}
                          {formatSlotTime(booking.to)}
                        </span>
                        <span className="text-muted-foreground">
                          #{booking.bookingCode.slice(-4)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    {strings.player}
                  </span>
                  <span>{primaryConfirmation.customer.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{strings.sport}</span>
                  <span className="capitalize">
                    {primaryConfirmation.bookingType === "cricket&football"
                      ? strings.cricket + " & " + strings.football
                      : primaryConfirmation.bookingType === "cricket"
                        ? strings.cricket
                        : strings.football}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    {strings.amountPaid}
                  </span>
                  <span>₹{confirmationTotalPaid}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    {strings.paymentMode}
                  </span>
                  <span className="capitalize">
                    {primaryConfirmation.paymentOption === "advance"
                      ? strings.advance
                      : strings.full}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    {strings.verificationCode}
                  </span>
                  <span className="font-mono text-lg font-semibold">
                    {primaryConfirmation.verificationCode}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    {strings.bookingCode}
                  </span>
                  <span className="font-mono text-xs">
                    {primaryConfirmation.bookingCode}
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-2 px-6">
                <Button onClick={handleDownload} className="rounded-xl">
                  {strings.downloadAsImage}
                </Button>
                <Button
                  variant="ghost"
                  className="rounded-xl"
                  onClick={() => setConfirmation(null)}
                >
                  {strings.close}
                </Button>
              </div>
            </MotionCard>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
