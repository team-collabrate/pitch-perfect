"use client";

import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { useLanguage } from "~/lib/language-context";
import allTranslations from "~/lib/translations/all";
import { addDays, format, parseISO } from "date-fns";
import { toPng } from "html-to-image";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "motion/react";
import { Pencil } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

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
import { api } from "~/trpc/react";

type SlotView = {
  id: number;
  date: string;
  from: string;
  to: string;
  status: "available" | "booked" | "unavailable";
};

const MAX_SLOTS_PER_DAY = 2 as const;
const toPngImage = toPng as (
  node: HTMLElement,
  options: { cacheBust?: boolean; backgroundColor?: string },
) => Promise<string>;

const createMockSlots = () => {
  const today = new Date();
  const template: Array<[string, string]> = [
    ["06:00", "07:00"],
    ["07:00", "08:00"],
    ["08:00", "09:00"],
    ["17:00", "18:00"],
    ["18:00", "19:00"],
    ["19:00", "20:00"],
    ["20:00", "21:00"],
  ];

  const result: SlotView[] = [];
  let idCounter = 1;
  for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
    const date = format(addDays(today, dayIndex), "yyyy-MM-dd");
    template.forEach(([from, to], slotIndex) => {
      const isUnavailable = (slotIndex + dayIndex) % 6 === 0;
      const isBooked = !isUnavailable && (slotIndex + dayIndex) % 5 === 0;
      result.push({
        id: idCounter++,
        date,
        from,
        to,
        status: isUnavailable
          ? "unavailable"
          : isBooked
            ? "booked"
            : "available",
      });
    });
  }
  return result;
};

const fallbacks = createMockSlots();

const MotionButton = motion(Button);
const MotionCard = motion(Card);

const springy = { type: "spring", stiffness: 260, damping: 20 } as const;

const sanitizePhone = (value: string) => value.replace(/\D/g, "");

const customerContactsSchema = z
  .object({
    name: z.string().trim().min(1, { message: "Enter the main client name" }),
    number: z.string().refine((value) => sanitizePhone(value).length === 10, {
      message: "Primary number must be 10 digits",
    }),
    alternateContactName: z
      .string()
      .trim()
      .min(1, { message: "Enter the alternate contact name" }),
    alternateContactNumber: z
      .string()
      .refine((value) => sanitizePhone(value).length === 10, {
        message: "Alternate number must be 10 digits",
      }),
  })
  .superRefine((values, ctx) => {
    const primaryName = values.name.trim().toLowerCase();
    const alternateName = values.alternateContactName.trim().toLowerCase();
    if (primaryName && primaryName === alternateName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["alternateContactName"],
        message: "Alternate name must differ from the main client",
      });
    }

    const primaryNumber = sanitizePhone(values.number);
    const alternateNumber = sanitizePhone(values.alternateContactNumber);
    if (primaryNumber && alternateNumber && primaryNumber === alternateNumber) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["alternateContactNumber"],
        message: "Alternate number must differ from the main client",
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

function useSlotBoard() {
  const { data } = api.timeSlot.getAllAvailable.useQuery(
    { limit: 24 * 1 },
    { staleTime: 60_000 },
  );

  return useMemo(() => {
    if (!data || data.length === 0) {
      return fallbacks;
    }

    return data.map(
      (slot) =>
        ({
          id: slot.id,
          date: slot.date,
          from: slot.from.slice(0, 5),
          to: slot.to.slice(0, 5),
          status: slot.status === "available" ? "available" : "unavailable",
        }) satisfies SlotView,
    );
  }, [data]);
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
  const strings = useMemo(() => allTranslations.book[language], [language]);
  const slots = useSlotBoard();
  const { addBooking } = useBookings();
  const { phoneNumber: storedPhone, setPhoneNumber: setStoredPhone } =
    usePhone();
  const utils = api.useUtils();

  const [selectedDate, setSelectedDate] = useState<string>("");
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

  // Hydration effect
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Fetch customer data when stored phone exists
  const { data: existingCustomer, isLoading: isLoadingCustomer } =
    api.customer.getByPhoneNumber.useQuery(
      { phoneNumber: storedPhone },
      { enabled: !!storedPhone && isHydrated },
    );

  // Mutations
  const upsertCustomer = api.customer.upsert.useMutation();
  const bookSlots = api.booking.book.useMutation();

  // Calculate total amount for coupon validation
  const totalAmountPaise = selectedSlots.length * 80000; // ₹800 per slot in paise

  // Get active coupons
  const { data: activeCoupons = [] } = api.booking.getActiveCoupons.useQuery(
    {
      phoneNumber: storedPhone,
      totalAmount: totalAmountPaise,
    },
    { enabled: !!storedPhone && totalAmountPaise > 0 && isHydrated },
  );

  // Validate coupon query
  const { data: couponValidation } = api.booking.validateCoupon.useQuery(
    {
      couponCode: couponCode.toUpperCase(),
      bookingCount: 0,
      totalAmount: totalAmountPaise,
    },
    { enabled: couponCode.length > 0 && totalAmountPaise > 0 },
  );

  const confirmationCardRef = useRef<HTMLDivElement | null>(null);
  const primaryConfirmation = confirmation?.[0] ?? null;
  const confirmationTotalPaid =
    confirmation?.reduce((sum, booking) => sum + booking.amountPaid, 0) ?? 0;

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

  const slotsByDate = useMemo(() => {
    return slots.reduce<Record<string, SlotView[]>>((acc, slot) => {
      acc[slot.date] ??= [];
      acc[slot.date]!.push(slot);
      return acc;
    }, {});
  }, [slots]);

  const dates = useMemo(() => {
    return Object.entries(slotsByDate)
      .filter(([, list]) => list.some((slot) => slot.status === "available"))
      .map(([date]) => date)
      .sort()
      .slice(0, 7);
  }, [slotsByDate]);

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
    if (slot.status !== "available" || slot.date !== selectedDate) return;
    setSelectedSlots((prev) => {
      const exists = prev.some((item) => item.id === slot.id);
      if (exists) {
        return prev.filter((item) => item.id !== slot.id);
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

      // Step 2: Book the slots
      const timeSlotIds = selectedSlots.map((slot) => slot.id);
      // Convert Set to string: if both selected, "cricket&football", else the single selection
      const bookingTypeStr =
        bookingType.size === 2
          ? "cricket&football"
          : Array.from(bookingType)[0]!;
      const bookingResult = await bookSlots.mutateAsync({
        number: normalizedNumber,
        timeSlotIds,
        paymentType: paymentOption,
        bookingType: bookingTypeStr,
        couponId: appliedCoupon?.couponId,
      });

      // Step 3: Create confirmation data
      const confirmationData: ConfirmationBooking[] = bookingResult.map(
        (booking) => ({
          id: booking.id,
          date: booking.timeSlot?.date ?? selectedDate,
          from: booking.timeSlot?.from?.slice(0, 5) ?? "",
          to: booking.timeSlot?.to?.slice(0, 5) ?? "",
          bookingType: booking.bookingType ?? bookingType,
          paymentOption,
          amountPaid: booking.amountPaid / 100, // Convert from paise to rupees
          totalAmount: booking.totalAmount / 100,
          verificationCode: booking.verificationCode ?? "",
          bookingCode: `PP-${booking.id.slice(-6).toUpperCase()}`,
          customer,
        }),
      );

      // Also store in local bookings context for offline viewing
      confirmationData.forEach((booking) => {
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
            customer,
          }),
        );
      });

      setConfirmation(confirmationData);
      fireSideCannons();
      setSelectedSlots([]);
      setBookingType(new Set());
      setPaymentOption("");
      setSlotDrawerOpen(false);

      // Invalidate queries to refresh data
      await utils.timeSlot.getAllAvailable.invalidate();
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
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
    >
      <header className="space-y-1">
        <p className="text-muted-foreground text-xs tracking-wide uppercase">
          {strings.subtitle}
        </p>
        <h1 className="text-2xl font-semibold">{strings.title}</h1>
      </header>

      <section className="space-y-4">
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
              Slots
            </h2>
            <p className="text-muted-foreground text-xs">
              {selectedDate
                ? `Pick up to ${MAX_SLOTS_PER_DAY} for ${format(parseISO(selectedDate), "EEE, MMM d")}`
                : "Choose a date to enable slots"}
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
              {selectionCount > 0 ? "Edit slots" : "Choose slots"}
            </Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerCloseButton />
            <DrawerHeader>
              <DrawerTitle>
                {selectedDate
                  ? format(parseISO(selectedDate), "EEEE, MMM d")
                  : "Pick a date above"}
              </DrawerTitle>
              <DrawerDescription>
                Select up to {MAX_SLOTS_PER_DAY} slots for this day.
              </DrawerDescription>
            </DrawerHeader>
            <div className="text-muted-foreground flex items-center justify-between px-6 pb-2 text-xs">
              <span>{selectionCount} selected</span>
              <Button
                variant="ghost"
                size="sm"
                disabled={!selectionCount}
                onClick={clearSelectedSlots}
              >
                Clear all
              </Button>
            </div>
            <div className="grid max-h-72 grid-cols-2 gap-3 overflow-y-auto px-6 pb-4">
              {slotsForSelectedDate.length === 0 ? (
                <p className="text-muted-foreground col-span-2 text-sm">
                  No slots available for this day.
                </p>
              ) : (
                slotsForSelectedDate.map((slot) => {
                  const isSelected = selectedSlots.some(
                    (item) => item.id === slot.id,
                  );
                  const isUnavailable = slot.status !== "available";
                  const isAtLimit =
                    !isSelected && selectionCount >= MAX_SLOTS_PER_DAY;
                  const isDisabled = isUnavailable || isAtLimit;
                  return (
                    <motion.button
                      key={slot.id}
                      type="button"
                      disabled={isDisabled}
                      onClick={() => toggleSlotSelection(slot)}
                      className={cn(
                        "flex flex-col rounded-2xl border px-3 py-3 text-left text-sm transition-all",
                        isUnavailable &&
                          "bg-muted text-muted-foreground cursor-not-allowed",
                        !isUnavailable && "hover:border-primary",
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
                      <span className="text-muted-foreground mt-2 inline-flex items-center gap-2 text-xs">
                        {isUnavailable
                          ? "Unavailable"
                          : isSelected
                            ? "Selected"
                            : isAtLimit
                              ? "Slot limit reached"
                              : "Tap to select"}
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
                Done
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
                No slots selected yet.
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
          Sport {bookingType.size === 2 && "(Cricket & Football)"}
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
                {option}
              </MotionButton>
            );
          })}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
          Payment
        </h2>
        <div className="grid grid-cols-2 gap-2">
          {[
            { key: "advance", label: "₹100 Advance" },
            { key: "full", label: "₹800 Full" },
          ].map((option) => {
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
                {option.label}
              </MotionButton>
            );
          })}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
          Player details
        </h2>
        {!isHydrated ? (
          <div className="flex items-center justify-center py-4">
            <span className="text-muted-foreground text-sm">Loading...</span>
          </div>
        ) : isLoadingCustomer && storedPhone ? (
          <div className="flex items-center justify-center py-4">
            <span className="text-muted-foreground text-sm">
              Loading your details...
            </span>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="number">
                {strings.numberLabel} <span className="text-red-500">*</span>
              </Label>
              <div className="flex gap-2">
                <Input
                  id="number"
                  inputMode="tel"
                  value={customer.number}
                  onChange={(event) =>
                    handleCustomerChange("number", event.target.value)
                  }
                  placeholder={strings.primaryContactPlaceholder}
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
                  Using saved number. Tap edit to change.
                </p>
              )}
              {isHydrated && (!storedPhone || !existingCustomer) && (
                <p className="text-muted-foreground text-xs">
                  Enter your primary contact number
                </p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="name">
                {strings.nameLabel} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={customer.name}
                onChange={(event) =>
                  handleCustomerChange("name", event.target.value)
                }
                placeholder={strings.namePlaceholder}
              />
            </div>
            <section className="space-y-3">
              <h2 className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
                Coupon (optional)
              </h2>
              <div className="space-y-2">
                {/* Available Coupons List */}
                {activeCoupons && activeCoupons.length > 0 && (
                  <div className="space-y-2">
                    {activeCoupons.map((coupon) => (
                      <div
                        key={coupon.id}
                        className={cn(
                          "rounded-2xl border p-3 text-sm cursor-pointer transition",
                          coupon.isEligible
                            ? "bg-green-50 border-green-200 hover:bg-green-100"
                            : "bg-gray-50 border-gray-200 opacity-60",
                        )}
                        onClick={() => {
                          if (coupon.isEligible && !appliedCoupon) {
                            setCouponCode(coupon.code);
                          }
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="font-semibold">
                              {coupon.code}
                              {coupon.isEligible ? (
                                <span className="ml-2 text-green-700">✓</span>
                              ) : (
                                <span className="ml-2 text-gray-500">✗</span>
                              )}
                            </p>
                            {coupon.description && (
                              <p className="text-xs text-muted-foreground">
                                {coupon.description}
                              </p>
                            )}
                            {!coupon.isEligible && coupon.reason && (
                              <p className="text-xs text-red-600 mt-1">
                                {coupon.reason}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-green-700">
                              Save ₹{(coupon.discount / 100).toFixed(0)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Coupon Code Input */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter coupon code"
                    value={couponCode}
                    onChange={(e) => {
                      setCouponCode(e.target.value);
                      setAppliedCoupon(null);
                    }}
                    className="rounded-2xl"
                    disabled={selectedSlots.length === 0}
                  />
                  {couponValidation?.isValid && !appliedCoupon && (
                    <Button
                      type="button"
                      onClick={() => {
                        if (couponValidation.isValid) {
                          setAppliedCoupon({
                            couponId: couponValidation.couponId!,
                            discount: couponValidation.discount,
                            finalAmount: couponValidation.finalAmount,
                          });
                          toast.success(couponValidation.message);
                        }
                      }}
                      className="shrink-0 rounded-2xl"
                    >
                      Apply
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
                      Remove
                    </Button>
                  )}
                </div>

                {/* Applied Coupon Success */}
                {appliedCoupon && (
                  <div className="rounded-2xl border border-green-200 bg-green-50 p-3 text-sm">
                    <p className="font-medium text-green-700">
                      ✓ Coupon Applied: Save ₹
                      {(appliedCoupon.discount / 100).toFixed(2)}
                    </p>
                    <p className="text-xs text-green-600">
                      Pay: ₹{(appliedCoupon.finalAmount / 100).toFixed(2)}
                    </p>
                  </div>
                )}

                {/* Validation Error */}
                {couponValidation &&
                  !couponValidation.isValid &&
                  couponCode && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 p-2 text-xs text-red-700">
                      {couponValidation.message}
                    </div>
                  )}
              </div>
            </section>
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
                {strings.alternateNameLabel}{" "}
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
                placeholder={strings.alternateNamePlaceholder}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="alternateNumber">
                {strings.alternateNumberLabel}{" "}
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
                placeholder={strings.alternateNumberPlaceholder}
              />
            </div>
          </div>
        )}
      </section>

      {(() => {
        const advanceAmount = 10000; // ₹100 in paise per slot
        const fullAmount = 80000; // ₹800 in paise per slot
        const amountPerSlot =
          paymentOption === "advance" ? advanceAmount : fullAmount;
        const displayAmount =
          paymentOption === "advance"
            ? appliedCoupon
              ? Math.ceil(
                  appliedCoupon.finalAmount / selectedSlots.length / 100,
                )
              : 100
            : appliedCoupon
              ? Math.ceil(
                  appliedCoupon.finalAmount / selectedSlots.length / 100,
                )
              : 800;

        return (
          <MotionButton
            disabled={!formReady || isSubmitting}
            className="w-full rounded-2xl py-6 text-base font-semibold tracking-wide uppercase"
            onClick={handleSubmit}
            whileTap={{ scale: formReady && !isSubmitting ? 0.97 : 1 }}
            whileHover={{ scale: formReady && !isSubmitting ? 1.02 : 1 }}
            transition={springy}
          >
            {isSubmitting
              ? strings.processing
              : `Pay ₹${displayAmount * selectedSlots.length}`}
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
            <DrawerTitle>{strings.drawerTitle}</DrawerTitle>
            <DrawerDescription>{strings.drawerDesc}</DrawerDescription>
          </DrawerHeader>
          <div className="px-6 pb-4">
            <div className="space-y-1">
              <Label htmlFor="tempPhone">{strings.numberLabel}</Label>
              <Input
                id="tempPhone"
                inputMode="tel"
                value={tempPhone}
                onChange={(event) => setTempPhone(event.target.value)}
                placeholder={strings.tempPhonePlaceholder}
              />
            </div>
          </div>
          <DrawerFooter>
            <Button
              onClick={handleConfirmPhoneChange}
              disabled={!tempPhone.trim()}
            >
              {strings.drawerConfirm}
            </Button>
            <Button variant="ghost" onClick={() => setPhoneDrawerOpen(false)}>
              {strings.drawerCancel}
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
                  Booking successful
                </p>
                <h3 className="text-lg font-semibold">Pitch Perfect pass</h3>
              </div>
              <div className="space-y-3 px-6 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Date</span>
                  <span>
                    {format(parseISO(primaryConfirmation.date), "EEE, MMM d")}
                  </span>
                </div>
                <div className="space-y-2">
                  <span className="text-muted-foreground">Slots</span>
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
                  <span className="text-muted-foreground">Player</span>
                  <span>{primaryConfirmation.customer.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Sport</span>
                  <span className="capitalize">
                    {primaryConfirmation.bookingType === "cricket&football"
                      ? "Cricket & Football"
                      : primaryConfirmation.bookingType}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Amount paid</span>
                  <span>₹{confirmationTotalPaid}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Payment mode</span>
                  <span className="capitalize">
                    {primaryConfirmation.paymentOption}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    Verification code
                  </span>
                  <span className="font-mono text-lg font-semibold">
                    {primaryConfirmation.verificationCode}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Booking ID</span>
                  <span className="font-mono text-xs">
                    {primaryConfirmation.bookingCode}
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-2 px-6">
                <Button onClick={handleDownload} className="rounded-xl">
                  Download as image
                </Button>
                <Button
                  variant="ghost"
                  className="rounded-xl"
                  onClick={() => setConfirmation(null)}
                >
                  Close
                </Button>
              </div>
            </MotionCard>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
