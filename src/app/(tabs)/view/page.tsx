"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { addDays, format, parseISO } from "date-fns";
import { motion, AnimatePresence } from "motion/react";
import { toPng } from "html-to-image";

import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { cn } from "~/lib/utils";
import {
  useBookings,
  type StoredBooking,
} from "~/lib/bookings-context";

const SLOT_TEMPLATE: Array<[string, string]> = [
  ["06:00", "07:00"],
  ["07:00", "08:00"],
  ["08:00", "09:00"],
  ["17:00", "18:00"],
  ["18:00", "19:00"],
  ["19:00", "20:00"],
  ["20:00", "21:00"],
];

const toPngImage = toPng as (
  node: HTMLElement,
  options: { cacheBust?: boolean; backgroundColor?: string },
) => Promise<string>;

const buildRescheduleSlots = () => {
  const today = new Date();
  return Array.from({ length: 7 }).map((_, index) => {
    const date = format(addDays(today, index), "yyyy-MM-dd");
    return {
      date,
      slots: SLOT_TEMPLATE.map(([from, to]) => ({
        id: `${date}-${from}-${to}`,
        date,
        from,
        to,
      })),
    };
  });
};

const rescheduleSource = buildRescheduleSlots();

const formatDate = (isoDate: string) => format(parseISO(isoDate), "EEE, MMM d");

const MotionCard = motion(Card);
const MotionButton = motion(Button);
const springy = { type: "spring", stiffness: 260, damping: 22 } as const;

function BookingList({
  title,
  bookings,
  accent,
  onOpenTicket,
  onReschedule,
}: {
  title: string;
  bookings: StoredBooking[];
  accent: "primary" | "muted";
  onOpenTicket: (booking: StoredBooking) => void;
  onReschedule?: (booking: StoredBooking) => void;
}) {
  if (bookings.length === 0) {
    return (
      <motion.section
        className="space-y-3"
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.35 }}
      >
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          {title}
        </h2>
        <MotionCard
          className="items-center justify-center gap-2 p-6 text-center text-sm text-muted-foreground"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.35 }}
        >
          <p>No bookings yet.</p>
        </MotionCard>
      </motion.section>
    );
  }

  return (
    <motion.section
      className="space-y-3"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.35 }}
    >
      <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
        {title}
      </h2>
      <div className="space-y-3">
        {bookings.map((booking) => (
          <MotionCard
            key={booking.id}
            className={cn(
              "p-4",
              accent === "muted" && "opacity-70",
            )}
            layout
            initial={{ opacity: 0, translateY: 16 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ duration: 0.3 }}
            whileHover={{ scale: 1.01 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  {booking.bookingType}
                </p>
                <h3 className="text-lg font-semibold">
                  {formatDate(booking.date)} · {booking.from} – {booking.to}
                </h3>
                {booking.rescheduled && (
                  <div className="mt-2">
                    <Badge variant="secondary">Rescheduled</Badge>
                  </div>
                )}
              </div>
              <span
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium",
                  accent === "primary"
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground",
                )}
              >
                ₹{booking.amountPaid}
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
              <span>{booking.customer.name}</span>
              <span className="font-mono">{booking.verificationCode}</span>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <MotionButton
                size="sm"
                className="flex-1 rounded-xl"
                onClick={() => onOpenTicket(booking)}
                whileTap={{ scale: 0.96 }}
                transition={springy}
              >
                View ticket
              </MotionButton>
              {onReschedule && (
                <MotionButton
                  size="sm"
                  variant="outline"
                  className="flex-1 rounded-xl"
                  onClick={() => onReschedule(booking)}
                  whileTap={{ scale: 0.96 }}
                  transition={springy}
                >
                  Reschedule
                </MotionButton>
              )}
            </div>
          </MotionCard>
        ))}
      </div>
    </motion.section>
  );
}

export default function ViewPage() {
  const { bookings, getStatus, rescheduleBooking } = useBookings();
  const [activeTicket, setActiveTicket] = useState<StoredBooking | null>(null);
  const [rescheduleTarget, setRescheduleTarget] = useState<StoredBooking | null>(
    null,
  );
  const ticketRef = useRef<HTMLDivElement | null>(null);

  const sorted = useMemo(() => {
    const upcoming: StoredBooking[] = [];
    const past: StoredBooking[] = [];

    bookings.forEach((booking) => {
      if (getStatus(booking) === "upcoming") {
        upcoming.push(booking);
      } else {
        past.push(booking);
      }
    });

    upcoming.sort((a, b) =>
      `${a.date}T${a.from}`.localeCompare(`${b.date}T${b.from}`),
    );
    past.sort((a, b) =>
      `${b.date}T${b.from}`.localeCompare(`${a.date}T${a.from}`),
    );

    return { upcoming, past };
  }, [bookings, getStatus]);

  const background = useMemo(() => {
    if (typeof window === "undefined") {
      return "#ffffff";
    }
    return (
      getComputedStyle(document.documentElement)
        .getPropertyValue("--background")
        .trim() || "#ffffff"
    );
  }, []);

  const handleTicketDownload = useCallback(async () => {
    if (!activeTicket || !ticketRef.current) return;
    try {
      const url = await toPngImage(ticketRef.current, {
        cacheBust: true,
        backgroundColor: background,
      });
      const link = document.createElement("a");
      link.href = url;
      link.download = `${activeTicket.bookingCode}.png`;
      link.click();
    } catch (error: unknown) {
      console.error("Unable to export ticket", error);
    }
  }, [activeTicket, background]);

  const [rescheduleDate, setRescheduleDate] = useState<string>("");
  const [rescheduleSlotId, setRescheduleSlotId] = useState<string>("");

  const selectedSlot = useMemo(() => {
    if (!rescheduleDate || !rescheduleSlotId) return undefined;
    return rescheduleSource
      .find((entry) => entry.date === rescheduleDate)
      ?.slots.find((slot) => slot.id === rescheduleSlotId);
  }, [rescheduleDate, rescheduleSlotId]);

  const resetRescheduleState = () => {
    setRescheduleTarget(null);
    setRescheduleDate("");
    setRescheduleSlotId("");
  };

  const handleRescheduleConfirm = () => {
    if (!rescheduleTarget || !selectedSlot) return;
    rescheduleBooking(rescheduleTarget.id, {
      date: selectedSlot.date,
      from: selectedSlot.from,
      to: selectedSlot.to,
      slotId: selectedSlot.id,
    });
    resetRescheduleState();
  };

  return (
    <motion.div
      className="space-y-8 pb-6"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
    >
      <motion.header
        className="space-y-1"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05 }}
      >
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          Manage visits
        </p>
        <h1 className="text-2xl font-semibold">Your bookings</h1>
      </motion.header>

      <BookingList
        title="Upcoming"
        bookings={sorted.upcoming}
        accent="primary"
        onOpenTicket={setActiveTicket}
        onReschedule={(booking) => {
          setRescheduleTarget(booking);
          setRescheduleDate(booking.date);
        }}
      />

      <BookingList
        title="Past"
        bookings={sorted.past}
        accent="muted"
        onOpenTicket={setActiveTicket}
      />

      <AnimatePresence>
        {activeTicket && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <MotionCard
              ref={ticketRef}
              className="w-full max-w-sm space-y-4 px-0 pb-6 pt-4"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              <div className="px-6">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Pitch Perfect ticket
                </p>
                <h3 className="text-lg font-semibold">{activeTicket.customer.name}</h3>
                <p className="text-xs text-muted-foreground">
                  {activeTicket.customer.number}
                </p>
              </div>
              <div className="space-y-3 px-6 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Date</span>
                  <span>{formatDate(activeTicket.date)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Time</span>
                  <span>
                    {activeTicket.from} – {activeTicket.to}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Amount</span>
                  <span>₹{activeTicket.amountPaid}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Mode</span>
                  <span className="capitalize">{activeTicket.paymentOption}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Verification code</span>
                  <span className="font-mono text-lg font-semibold">
                    {activeTicket.verificationCode}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Booking ID</span>
                  <span className="font-mono text-xs">{activeTicket.bookingCode}</span>
                </div>
              </div>
              <div className="flex flex-col gap-2 px-6">
                <MotionButton
                  onClick={handleTicketDownload}
                  className="rounded-xl"
                  whileTap={{ scale: 0.97 }}
                  transition={springy}
                >
                  Download ticket
                </MotionButton>
                <MotionButton
                  variant="ghost"
                  className="rounded-xl"
                  onClick={() => setActiveTicket(null)}
                  whileTap={{ scale: 0.97 }}
                  transition={springy}
                >
                  Close
                </MotionButton>
              </div>
            </MotionCard>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {rescheduleTarget && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <MotionCard
              className="w-full max-w-md space-y-4 p-6"
              initial={{ opacity: 0, translateY: 50 }}
              animate={{ opacity: 1, translateY: 0 }}
              exit={{ opacity: 0, translateY: 50 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <div>
                <h3 className="text-lg font-semibold">Reschedule slot</h3>
                <p className="text-sm text-muted-foreground">
                  Move booking for {formatDate(rescheduleTarget.date)}
                </p>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {rescheduleSource.map((entry) => {
                  const isActive = rescheduleDate === entry.date;
                  return (
                    <motion.button
                      key={entry.date}
                      onClick={() => {
                        setRescheduleDate(entry.date);
                        setRescheduleSlotId("");
                      }}
                      className={cn(
                        "flex min-w-24 flex-col items-center rounded-2xl border px-4 py-3 text-sm transition",
                        isActive
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground",
                      )}
                      whileTap={{ scale: 0.94 }}
                      transition={springy}
                    >
                      <span className="font-semibold uppercase">
                        {format(parseISO(entry.date), "EEE")}
                      </span>
                      <span>{format(parseISO(entry.date), "MMM d")}</span>
                    </motion.button>
                  );
                })}
              </div>
              <div className="grid grid-cols-2 gap-3">
                {(rescheduleSource.find((entry) => entry.date === rescheduleDate)
                  ?.slots ?? []
                ).map((slot) => {
                  const isChosen = rescheduleSlotId === slot.id;
                  return (
                    <motion.button
                      key={slot.id}
                      onClick={() => setRescheduleSlotId(slot.id)}
                      className={cn(
                        "flex flex-col rounded-2xl border px-3 py-3 text-left text-sm transition",
                        isChosen
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground",
                      )}
                      whileTap={{ scale: 0.96 }}
                      transition={springy}
                    >
                      <span className="font-semibold">
                        {slot.from} – {slot.to}
                      </span>
                      <span className="mt-1 text-xs text-muted-foreground">
                        {isChosen ? "Selected" : "Tap to choose"}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
              <div className="flex items-center gap-3">
                <MotionButton
                  className="flex-1 rounded-xl"
                  disabled={!selectedSlot}
                  onClick={handleRescheduleConfirm}
                  whileTap={{ scale: selectedSlot ? 0.97 : 1 }}
                  transition={springy}
                >
                  Confirm move
                </MotionButton>
                <MotionButton
                  variant="ghost"
                  className="rounded-xl"
                  onClick={resetRescheduleState}
                  whileTap={{ scale: 0.97 }}
                  transition={springy}
                >
                  Cancel
                </MotionButton>
              </div>
            </MotionCard>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
