"use client";

import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { addDays, format, parseISO } from "date-fns";
import { toPng } from "html-to-image";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "motion/react";

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
import { cn, formatSlotRange } from "~/lib/utils";
import {
  createBookingRecord,
  useBookings,
  type StoredBooking,
} from "~/lib/bookings-context";
import { api } from "~/trpc/react";

type SlotView = {
  id: string;
  date: string;
  from: string;
  to: string;
  status: "available" | "booked" | "unavailable";
};

const TOTAL_AMOUNT = 800;
const ADVANCE_AMOUNT = 100;
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
  for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
    const date = format(addDays(today, dayIndex), "yyyy-MM-dd");
    template.forEach(([from, to], slotIndex) => {
      const isUnavailable = (slotIndex + dayIndex) % 6 === 0;
      const isBooked = !isUnavailable && (slotIndex + dayIndex) % 5 === 0;
      result.push({
        id: `${date}-${from}-${to}`,
        date,
        from,
        to,
        status: isUnavailable ? "unavailable" : isBooked ? "booked" : "available",
      });
    });
  }
  return result;
};

const fallbacks = createMockSlots();

const MotionButton = motion(Button);
const MotionCard = motion(Card);

const springy = { type: "spring", stiffness: 260, damping: 20 } as const;

const fireSideCannons = () => {
  const colors = ["#a786ff", "#fd8bbc", "#eca184", "#f8deb1"];
  const end = Date.now() + 2_800;

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
    { limit: 24 * 7 },
    { staleTime: 60_000 },
  );

  return useMemo(() => {
    if (!data || data.length === 0) {
      return fallbacks;
    }

    return data.map((slot) => ({
      id: `${slot.date}-${slot.from}-${slot.to}`,
      date: slot.date,
      from: slot.from.slice(0, 5),
      to: slot.to.slice(0, 5),
      status: slot.status === "available" ? "available" : "unavailable",
    } satisfies SlotView));
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

export default function BookingPage() {
  const slots = useSlotBoard();
  const { addBooking } = useBookings();

  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedSlots, setSelectedSlots] = useState<SlotView[]>([]);
  const [slotDrawerOpen, setSlotDrawerOpen] = useState(false);
  const [bookingType, setBookingType] = useState<"" | "cricket" | "football">(
    "",
  );
  const [paymentOption, setPaymentOption] = useState<"" | "advance" | "full">(
    "",
  );
  const [customer, setCustomer] = useState<CustomerFormState>(blankCustomer);
  const [confirmation, setConfirmation] = useState<StoredBooking[] | null>(null);

  const confirmationCardRef = useRef<HTMLDivElement | null>(null);
  const primaryConfirmation = confirmation?.[0] ?? null;
  const confirmationTotalPaid =
    confirmation?.reduce((sum, booking) => sum + booking.amountPaid, 0) ?? 0;

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
    setBookingType("");
    setPaymentOption("");
  }, [selectedDate]);

  const handleCustomerChange = (field: keyof CustomerFormState, value: string) => {
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
  const canChoosePayment = canChooseGame && Boolean(bookingType);

  const formReady = Boolean(
    selectedDate &&
      selectionCount > 0 &&
      bookingType &&
      paymentOption &&
      customer.name.trim() &&
      customer.number.trim() &&
      customer.alternateContactName.trim() &&
      customer.alternateContactNumber.trim(),
  );

  const handleSubmit = () => {
    if (!formReady || !bookingType || !paymentOption || selectionCount === 0) {
      return;
    }

    const bookingsToSave = selectedSlots.map((slot) =>
      createBookingRecord({
        slotId: slot.id,
        date: slot.date,
        from: slot.from,
        to: slot.to,
        bookingType,
        paymentOption,
        amountPaid: paymentOption === "full" ? TOTAL_AMOUNT : ADVANCE_AMOUNT,
        totalAmount: TOTAL_AMOUNT,
        verificationCode: Math.floor(1000 + Math.random() * 9000).toString(),
        customer,
      }),
    );

    bookingsToSave.forEach((booking) => addBooking(booking));
    setConfirmation(bookingsToSave);
    fireSideCannons();
    setCustomer(blankCustomer);
    setSelectedSlots([]);
    setBookingType("");
    setPaymentOption("");
    setSlotDrawerOpen(false);
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
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          Turf booking
        </p>
        <h1 className="text-2xl font-semibold">Booking</h1>
      </header>

      <section className="space-y-4">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Pick a date
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
                  "flex min-w-24 flex-col items-center rounded-2xl border px-4 py-3 text-sm transition-all",
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
            <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              Slots
            </h2>
            <p className="text-xs text-muted-foreground">
              {selectedDate
                ? `Pick up to ${MAX_SLOTS_PER_DAY} for ${format(parseISO(selectedDate), "EEE, MMM d")}`
                : "Choose a date to enable slots"}
            </p>
          </div>
          <span className="text-xs text-muted-foreground">
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
            <div className="flex items-center justify-between px-6 pb-2 text-xs text-muted-foreground">
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
                <p className="col-span-2 text-sm text-muted-foreground">
                  No slots available for this day.
                </p>
              ) : (
                slotsForSelectedDate.map((slot) => {
                  const isSelected = selectedSlots.some((item) => item.id === slot.id);
                  const isUnavailable = slot.status !== "available";
                  const isAtLimit = !isSelected && selectionCount >= MAX_SLOTS_PER_DAY;
                  const isDisabled = isUnavailable || isAtLimit;
                  return (
                    <motion.button
                      key={slot.id}
                      type="button"
                      disabled={isDisabled}
                      onClick={() => toggleSlotSelection(slot)}
                      className={cn(
                        "flex flex-col rounded-2xl border px-3 py-3 text-left text-sm transition-all",
                        isUnavailable && "cursor-not-allowed bg-muted text-muted-foreground",
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
                        {formatSlotRange(slot.from, slot.to)}
                      </span>
                      <span className="mt-2 inline-flex items-center gap-2 text-xs text-muted-foreground">
                        {isUnavailable
                          ? "Unavailable"
                          : isSelected
                            ? "Selected"
                            : isAtLimit
                              ? "Slot limit reached"
                              : "Tap to select"}
                        {isSelected && (
                          <span className="h-2 w-2 rounded-full bg-primary" />
                        )}
                      </span>
                    </motion.button>
                  );
                })
              )}
            </div>
            <DrawerFooter>
              <Button onClick={() => setSlotDrawerOpen(false)} disabled={!selectedDate}>
                Done
              </Button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
        <div className="flex flex-wrap gap-2">
          <AnimatePresence mode="popLayout">
            {selectionCount === 0
              ? (
                  <motion.span
                    key="empty-state"
                    className="text-sm text-muted-foreground"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    No slots selected yet.
                  </motion.span>
                )
              : selectedSlots
                  .slice()
                  .sort((a, b) => a.from.localeCompare(b.from))
                  .map((slot) => (
                    <motion.span
                      key={slot.id}
                      className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={springy}
                    >
                      {formatSlotRange(slot.from, slot.to)}
                    </motion.span>
                  ))}
          </AnimatePresence>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Ask
        </h2>
        <div className="grid grid-cols-2 gap-2">
          {["cricket", "football"].map((option) => {
            const isActive = bookingType === option;
            return (
              <MotionButton
                key={option}
                variant={isActive ? "default" : "outline"}
                disabled={!canChooseGame}
                className={cn(
                  "rounded-2xl py-6 text-base capitalize",
                  !isActive && "bg-background",
                )}
                onClick={() => setBookingType(option as "cricket" | "football")}
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
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
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
                onClick={() => setPaymentOption(option.key as "advance" | "full")}
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
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Player details
        </h2>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={customer.name}
              onChange={(event) => handleCustomerChange("name", event.target.value)}
              placeholder="Full name"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="number">Number</Label>
            <Input
              id="number"
              inputMode="tel"
              value={customer.number}
              onChange={(event) => handleCustomerChange("number", event.target.value)}
              placeholder="Primary contact"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="email">Email (optional)</Label>
            <Input
              id="email"
              type="email"
              value={customer.email}
              onChange={(event) => handleCustomerChange("email", event.target.value)}
              placeholder="For booking summary"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="alternateName">Alternate contact name</Label>
            <Input
              id="alternateName"
              value={customer.alternateContactName}
              onChange={(event) =>
                handleCustomerChange("alternateContactName", event.target.value)
              }
              placeholder="Person on standby"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="alternateNumber">Alternate contact number</Label>
            <Input
              id="alternateNumber"
              inputMode="tel"
              value={customer.alternateContactNumber}
              onChange={(event) =>
                handleCustomerChange("alternateContactNumber", event.target.value)
              }
              placeholder="Secondary contact"
            />
          </div>
        </div>
      </section>

      <MotionButton
        disabled={!formReady}
        className="w-full rounded-2xl py-6 text-base font-semibold uppercase tracking-wide"
        onClick={handleSubmit}
        whileTap={{ scale: formReady ? 0.97 : 1 }}
        whileHover={{ scale: formReady ? 1.02 : 1 }}
        transition={springy}
      >
        Pay Now
      </MotionButton>

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
              className="w-full max-w-sm space-y-4 px-0 pb-6 pt-4"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
            <div className="px-6">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
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
                <div className="space-y-1 rounded-2xl border border-dashed border-border/60 bg-muted/50 p-3">
                  {confirmation.map((booking) => (
                    <div
                      key={booking.id}
                      className="flex items-center justify-between text-xs font-semibold"
                    >
                      <span>
                        {formatSlotRange(booking.from, booking.to)}
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
                <span className="text-muted-foreground">Amount paid</span>
                <span>₹{confirmationTotalPaid}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Payment mode</span>
                <span className="capitalize">{primaryConfirmation.paymentOption}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Verification code</span>
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
