"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { addDays, format, parseISO } from "date-fns";
import { motion, AnimatePresence } from "motion/react";
import { toPng } from "html-to-image";
import { Pencil } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerCloseButton,
} from "~/components/ui/drawer";
import { cn, formatSlotRange } from "~/lib/utils";
import { usePhone } from "~/lib/phone-context";
import { api } from "~/trpc/react";

// Type for bookings from the API
type BookingFromApi = {
  id: string;
  phoneNumber: string;
  timeSlotId: number;
  status:
    | "advancePaid"
    | "fullPaid"
    | "fullPending"
    | "advancePending"
    | "wontCome"
    | "paymentFailed";
  amountPaid: number;
  totalAmount: number;
  verificationCode: string | null;
  bookingType: "cricket" | "football" | null;
  createdAt: Date;
  updatedAt: Date | null;
  timeSlot: {
    id: number | null;
    from: string | null;
    to: string | null;
    date: string | null;
    status: "available" | "booked" | "unavailable" | "bookingInProgress" | null;
  } | null;
};

// Transformed booking type for display
type DisplayBooking = {
  id: string;
  date: string;
  from: string;
  to: string;
  bookingType: "cricket" | "football";
  paymentOption: "advance" | "full";
  amountPaid: number;
  totalAmount: number;
  verificationCode: string;
  bookingCode: string;
  phoneNumber: string;
  rescheduled?: boolean;
};

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

// Transform API booking to display format
function transformBooking(booking: BookingFromApi): DisplayBooking | null {
  if (
    !booking.timeSlot?.date ||
    !booking.timeSlot?.from ||
    !booking.timeSlot?.to
  ) {
    return null;
  }

  return {
    id: booking.id,
    date: booking.timeSlot.date,
    from: booking.timeSlot.from.slice(0, 5),
    to: booking.timeSlot.to.slice(0, 5),
    bookingType: booking.bookingType ?? "cricket",
    paymentOption: booking.status === "fullPaid" ? "full" : "advance",
    amountPaid: booking.amountPaid / 100, // Convert from paise
    totalAmount: booking.totalAmount / 100,
    verificationCode: booking.verificationCode ?? "----",
    bookingCode: `PP-${booking.id.slice(-6).toUpperCase()}`,
    phoneNumber: booking.phoneNumber,
  };
}

// Compute booking status based on slot time
function computeStatus(booking: DisplayBooking): "upcoming" | "past" {
  const slotDate = new Date(`${booking.date}T${booking.to}:00`);
  return slotDate.getTime() >= Date.now() ? "upcoming" : "past";
}

function BookingList({
  title,
  bookings,
  accent,
  onOpenTicket,
  onReschedule,
  customerName,
}: {
  title: string;
  bookings: DisplayBooking[];
  accent: "primary" | "muted";
  onOpenTicket: (booking: DisplayBooking) => void;
  onReschedule?: (booking: DisplayBooking) => void;
  customerName?: string;
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
        <h2 className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
          {title}
        </h2>
        <MotionCard
          className="text-muted-foreground items-center justify-center gap-2 p-6 text-center text-sm"
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
      <h2 className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
        {title}
      </h2>
      <div className="space-y-3">
        {bookings.map((booking) => (
          <MotionCard
            key={booking.id}
            className={cn("p-4", accent === "muted" && "opacity-70")}
            layout
            initial={{ opacity: 0, translateY: 16 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ duration: 0.3 }}
            whileHover={{ scale: 1.01 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-xs tracking-wide uppercase">
                  {booking.bookingType}
                </p>
                <h3 className="text-lg font-semibold">
                  {formatDate(booking.date)} ·{" "}
                  {formatSlotRange(booking.from, booking.to)}
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
            <div className="text-muted-foreground mt-3 flex items-center justify-between text-xs">
              <span>{customerName ?? booking.phoneNumber}</span>
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
  const { phoneNumber: storedPhone, setPhoneNumber: setStoredPhone } =
    usePhone();
  const [phoneDrawerOpen, setPhoneDrawerOpen] = useState(false);
  const [tempPhone, setTempPhone] = useState("");

  // Fetch customer data
  const { data: customer } = api.customer.getByPhoneNumber.useQuery(
    { phoneNumber: storedPhone },
    { enabled: !!storedPhone },
  );

  // Fetch bookings from backend
  const { data: apiBookings, isLoading } = api.booking.getByNumber.useQuery(
    { number: storedPhone },
    { enabled: !!storedPhone },
  );

  const [activeTicket, setActiveTicket] = useState<DisplayBooking | null>(null);
  const [rescheduleTarget, setRescheduleTarget] =
    useState<DisplayBooking | null>(null);
  const ticketRef = useRef<HTMLDivElement | null>(null);

  const ticketQrValue = useMemo(() => {
    if (!activeTicket) return "";
    const name = customer?.name ?? activeTicket.phoneNumber;

    return [
      `Booking:${activeTicket.bookingCode}`,
      `Name:${name}`,
      `Phone:${activeTicket.phoneNumber}`,
      `Date:${formatDate(activeTicket.date)}`,
      `Time:${formatSlotRange(activeTicket.from, activeTicket.to)}`,
      `Type:${activeTicket.bookingType}`,
      `Payment:${activeTicket.paymentOption}`,
      `Paid:₹${activeTicket.amountPaid}/${activeTicket.totalAmount}`,
      `Verification:${activeTicket.verificationCode}`,
    ].join(" | ");
  }, [activeTicket, customer]);

  // Transform and sort bookings
  const sorted = useMemo(() => {
    const upcoming: DisplayBooking[] = [];
    const past: DisplayBooking[] = [];

    if (!apiBookings) return { upcoming, past };

    apiBookings.forEach((booking) => {
      const transformed = transformBooking(booking as BookingFromApi);
      if (!transformed) return;

      if (computeStatus(transformed) === "upcoming") {
        upcoming.push(transformed);
      } else {
        past.push(transformed);
      }
    });

    upcoming.sort((a, b) =>
      `${a.date}T${a.from}`.localeCompare(`${b.date}T${b.from}`),
    );
    past.sort((a, b) =>
      `${b.date}T${b.from}`.localeCompare(`${a.date}T${a.from}`),
    );

    return { upcoming, past };
  }, [apiBookings]);

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
        skipFonts: true,
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
    // TODO: Implement backend reschedule mutation
    console.log("Reschedule:", rescheduleTarget.id, "to", selectedSlot);
    resetRescheduleState();
  };

  // Handle phone number change
  const handleChangePhone = () => {
    setTempPhone(storedPhone);
    setPhoneDrawerOpen(true);
  };

  const handleConfirmPhoneChange = () => {
    if (tempPhone.trim()) {
      setStoredPhone(tempPhone.trim());
      setPhoneDrawerOpen(false);
    }
  };

  // Show phone input if no stored phone
  if (!storedPhone) {
    return (
      <motion.div
        className="flex flex-col items-center justify-center space-y-6 py-12"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
      >
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold">View Your Bookings</h1>
          <p className="text-muted-foreground text-sm">
            Enter your phone number to see your bookings
          </p>
        </div>
        <Card className="w-full max-w-sm space-y-4 p-6">
          <div className="space-y-1">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              inputMode="tel"
              value={tempPhone}
              onChange={(event) => setTempPhone(event.target.value)}
              placeholder="Enter your phone number"
            />
          </div>
          <Button
            className="w-full"
            disabled={!tempPhone.trim()}
            onClick={() => setStoredPhone(tempPhone.trim())}
          >
            View Bookings
          </Button>
        </Card>
      </motion.div>
    );
  }

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
        <p className="text-muted-foreground text-xs tracking-wide uppercase">
          Manage visits
        </p>
        <h1 className="text-2xl font-semibold">Your bookings</h1>
        <div className="flex items-center gap-2 pt-2">
          <div className="">
            <span className="text-muted-foreground text-xs font-medium">
              {customer?.name ? (
                <>
                  <span className="text-foreground font-semibold">
                    {customer.name}
                  </span>
                  <span className="mx-1">•</span>
                  <span className="font-mono">{storedPhone}</span>
                </>
              ) : (
                <span className="font-mono">{storedPhone}</span>
              )}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleChangePhone}
          >
            <Pencil className="h-3 w-3" />
          </Button>
        </div>
      </motion.header>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <span className="text-muted-foreground text-sm">
            Loading your bookings...
          </span>
        </div>
      ) : (
        <>
          <BookingList
            title="Upcoming"
            bookings={sorted.upcoming}
            accent="primary"
            onOpenTicket={setActiveTicket}
            onReschedule={(booking) => {
              setRescheduleTarget(booking);
              setRescheduleDate(booking.date);
            }}
            customerName={customer?.name}
          />

          <BookingList
            title="Past"
            bookings={sorted.past}
            accent="muted"
            onOpenTicket={setActiveTicket}
            customerName={customer?.name}
          />
        </>
      )}

      {/* Phone Number Change Drawer */}
      <Drawer open={phoneDrawerOpen} onOpenChange={setPhoneDrawerOpen}>
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>
            <DrawerTitle>Change Phone Number</DrawerTitle>
            <DrawerDescription>
              Enter a different phone number to view its bookings
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-6 pb-4">
            <div className="space-y-1">
              <Label htmlFor="tempPhone">Phone Number</Label>
              <Input
                id="tempPhone"
                inputMode="tel"
                value={tempPhone}
                onChange={(event) => setTempPhone(event.target.value)}
                placeholder="Enter phone number"
              />
            </div>
          </div>
          <DrawerFooter>
            <Button
              onClick={handleConfirmPhoneChange}
              disabled={!tempPhone.trim()}
            >
              Use This Number
            </Button>
            <Button variant="ghost" onClick={() => setPhoneDrawerOpen(false)}>
              Cancel
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

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
              className="w-full max-w-sm space-y-4 px-0 pt-4 pb-6"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              <div className="px-6">
                <p className="text-muted-foreground text-xs tracking-wide uppercase">
                  Pitch Perfect ticket
                </p>
                <h3 className="text-lg font-semibold">
                  {customer?.name ?? activeTicket.phoneNumber}
                </h3>
                <p className="text-muted-foreground text-xs">
                  {activeTicket.phoneNumber}
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
                    {formatSlotRange(activeTicket.from, activeTicket.to)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Amount</span>
                  <span>₹{activeTicket.amountPaid}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Mode</span>
                  <span className="capitalize">
                    {activeTicket.paymentOption}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    Verification code
                  </span>
                  <span className="font-mono text-lg font-semibold">
                    {activeTicket.verificationCode}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Booking ID</span>
                  <span className="font-mono text-xs">
                    {activeTicket.bookingCode}
                  </span>
                </div>
                <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed px-4 py-3">
                  <span className="text-muted-foreground text-xs tracking-wide uppercase">
                    Scan for booking details
                  </span>
                  <QRCodeSVG
                    value={ticketQrValue}
                    size={192}
                    bgColor="#ffffff"
                    fgColor="#000000"
                    marginSize={2}
                  />
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
                <p className="text-muted-foreground text-sm">
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
                {(
                  rescheduleSource.find(
                    (entry) => entry.date === rescheduleDate,
                  )?.slots ?? []
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
                        {formatSlotRange(slot.from, slot.to)}
                      </span>
                      <span className="text-muted-foreground mt-1 text-xs">
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
