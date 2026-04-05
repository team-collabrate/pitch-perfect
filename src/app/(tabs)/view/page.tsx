"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useLanguage } from "~/lib/language-context";
import allTranslations from "~/lib/translations/all";
import { format, parseISO } from "date-fns";
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
  bookingType: "cricket" | "football" | "cricket&football" | null;
  couponId: string | null;
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
  bookingType: "cricket" | "football" | "cricket&football";
  paymentOption: "advance" | "full";
  paymentStatus:
    | "advancePaid"
    | "fullPaid"
    | "fullPending"
    | "advancePending"
    | "wontCome"
    | "paymentFailed";
  amountPaid: number;
  totalAmount: number;
  verificationCode: string;
  bookingCode: string;
  phoneNumber: string;
  rescheduled?: boolean;
  hasCoupon?: boolean;
};

// SLOT_TEMPLATE no longer needed with dynamic API slots

const toPngImage = toPng as (
  node: HTMLElement,
  options: { cacheBust?: boolean; backgroundColor?: string },
) => Promise<string>;

const formatDate = (isoDate: string) => format(parseISO(isoDate), "EEE, MMM d");

const MotionCard = motion.create(Card);
const MotionButton = motion.create(Button);
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
    paymentStatus: booking.status,
    hasCoupon: !!booking.couponId,
    amountPaid: booking.amountPaid / 100, // Convert from paise
    totalAmount: booking.totalAmount / 100,
    verificationCode: booking.verificationCode ?? "----",
    bookingCode: `PP-${booking.id.slice(-6).toUpperCase()}`,
    phoneNumber: booking.phoneNumber,
  };
}

function getPaymentStatusLabel(
  status: DisplayBooking["paymentStatus"],
  strings: any,
): string {
  switch (status) {
    case "advancePaid":
      return strings.advancePaid;
    case "fullPaid":
      return strings.fullPaid;
    case "fullPending":
      return strings.fullPending;
    case "advancePending":
      return strings.advancePending;
    case "wontCome":
      return strings.wontCome;
    case "paymentFailed":
      return strings.paymentFailed;
  }
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
  const { language } = useLanguage();
  const strings = useMemo(
    () => allTranslations.view[language] as any,
    [language],
  );
  if (bookings.length === 0) {
    return (
      <motion.section
        className="space-y-3"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.35 }}
      >
        <h2 className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
          {title}
        </h2>
        <MotionCard
          className="text-muted-foreground items-center justify-center gap-2 p-6 text-center text-sm"
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.35 }}
        >
          <p>{strings.noBookings}</p>
        </MotionCard>
      </motion.section>
    );
  }

  return (
    <motion.section
      className="space-y-3"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            whileHover={{ scale: 1.01 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-xs tracking-wide uppercase">
                  {booking.bookingType === "cricket"
                    ? strings.cricket
                    : booking.bookingType === "football"
                      ? strings.football
                      : `${strings.cricket} & ${strings.football}`}
                </p>
                <h3 className="text-lg font-semibold">
                  {formatDate(booking.date)} ·{" "}
                  {formatSlotRange(booking.from, booking.to)}
                </h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge variant="secondary">
                    {getPaymentStatusLabel(booking.paymentStatus, strings)}
                  </Badge>
                  {booking.rescheduled && (
                    <Badge variant="secondary">{strings.rescheduled}</Badge>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
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
                {booking.hasCoupon && (
                  <Badge
                    variant="secondary"
                    className="border-green-200 bg-green-50 text-green-700"
                  >
                    ✓ {strings.couponApplied}
                  </Badge>
                )}
              </div>
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
                {strings.viewTicket}
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
                  {strings.reschedule}
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
  const { language } = useLanguage();
  const strings = useMemo(
    () => allTranslations.view[language] as any,
    [language],
  );

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

  // Reschedule mutation
  const rescheduleMutation = api.booking.reschedule.useMutation();

  const [rescheduleTarget, setRescheduleTarget] =
    useState<DisplayBooking | null>(null);
  const [activeTicket, setActiveTicket] = useState<DisplayBooking | null>(null);
  const ticketRef = useRef<HTMLDivElement | null>(null);

  // Fetch available time slots
  const { data: availableSlots } = api.timeSlot.getAllAvailable.useQuery(
    { days: 50 },
    { enabled: !!rescheduleTarget },
  );

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
  const [rescheduleSlot, setRescheduleSlot] = useState<{
    date: string;
    from: string;
    to: string;
  } | null>(null);

  // Process available slots grouped by date
  const availableSlotsByDate = useMemo(() => {
    if (!availableSlots) return [];

    const grouped = availableSlots.reduce(
      (acc, slot) => {
        const date = slot.date;
        acc[date] ??= [];
        acc[date].push({
          date: slot.date,
          from: slot.from,
          to: slot.to,
        });
        return acc;
      },
      {} as Record<string, Array<{ date: string; from: string; to: string }>>,
    );

    return Object.entries(grouped).map(([date, slots]) => ({
      date,
      slots,
    }));
  }, [availableSlots]) as Array<{
    date: string;
    slots: Array<{ date: string; from: string; to: string }>;
  }>;

  const selectedSlot = useMemo(() => {
    if (!rescheduleDate || !rescheduleSlot) return undefined;
    return rescheduleSlot;
  }, [rescheduleSlot]);

  const resetRescheduleState = () => {
    setRescheduleTarget(null);
    setRescheduleDate("");
    setRescheduleSlot(null);
  };

  const handleRescheduleConfirm = async () => {
    if (!rescheduleTarget || !selectedSlot) return;

    try {
      await rescheduleMutation.mutateAsync({
        bookingId: rescheduleTarget.id,
        phoneNumber: storedPhone,
        newSlot: {
          date: selectedSlot.date,
          from: selectedSlot.from,
          to: selectedSlot.to,
        },
      });
      resetRescheduleState();
      // Invalidate the getByNumber query to refetch bookings
      // Invalidate booking cache after successful booking
      // await api.booking.getByNumber.invalidateQueries();
    } catch (error) {
      console.error("Failed to reschedule:", error);
      // TODO: Show error toast
    }
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
          <h1 className="text-2xl font-semibold">{strings.title}</h1>
          <p className="text-muted-foreground text-sm">{strings.enterPhone}</p>
        </div>
        <Card className="w-full max-w-sm space-y-4 p-6">
          <div className="space-y-1">
            <Label htmlFor="phone">{strings.phoneNumber}</Label>
            <Input
              id="phone"
              inputMode="tel"
              value={tempPhone}
              onChange={(event) => setTempPhone(event.target.value)}
              placeholder={strings.phonePlaceholder}
            />
          </div>
          <Button
            className="w-full"
            disabled={!tempPhone.trim()}
            onClick={() => setStoredPhone(tempPhone.trim())}
          >
            {strings.titleAlt}
          </Button>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="space-y-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
    >
      <motion.header
        className="space-y-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35, delay: 0.05 }}
      >
        <p className="text-muted-foreground text-xs tracking-wide uppercase">
          {strings.manageVisits}
        </p>
        <h1 className="text-2xl font-semibold">{strings.titleAlt}</h1>
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
            {strings.loadingBookings}
          </span>
        </div>
      ) : (
        <>
          <BookingList
            title={strings.upcoming}
            bookings={sorted.upcoming}
            accent="primary"
            onOpenTicket={setActiveTicket}
            onReschedule={(booking) => {
              setRescheduleTarget(booking);
              setRescheduleDate(booking.date);
            }}
            customerName={customer?.name ?? undefined}
          />

          <BookingList
            title={strings.past}
            bookings={sorted.past}
            accent="muted"
            onOpenTicket={setActiveTicket}
            customerName={customer?.name ?? undefined}
          />
        </>
      )}

      {/* Phone Number Change Drawer */}
      <Drawer open={phoneDrawerOpen} onOpenChange={setPhoneDrawerOpen}>
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>
            <DrawerTitle>{strings.changePhoneTitle}</DrawerTitle>
            <DrawerDescription>{strings.changePhoneDesc}</DrawerDescription>
          </DrawerHeader>
          <div className="px-6 pb-4">
            <div className="space-y-1">
              <Label htmlFor="tempPhone">{strings.phoneNumber}</Label>
              <Input
                id="tempPhone"
                inputMode="tel"
                value={tempPhone}
                onChange={(event) => setTempPhone(event.target.value)}
                placeholder={strings.phonePlaceholder}
              />
            </div>
          </div>
          <DrawerFooter>
            <Button
              onClick={handleConfirmPhoneChange}
              disabled={!tempPhone.trim()}
            >
              {strings.useThisNumber}
            </Button>
            <Button variant="ghost" onClick={() => setPhoneDrawerOpen(false)}>
              {strings.cancel}
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
                  {strings.ticketTitle}
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
                  <span className="text-muted-foreground">{strings.date}</span>
                  <span>{formatDate(activeTicket.date)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{strings.time}</span>
                  <span>
                    {formatSlotRange(activeTicket.from, activeTicket.to)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    {strings.amount}
                  </span>
                  <span>₹{activeTicket.amountPaid}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{strings.mode}</span>
                  <span className="capitalize">
                    {activeTicket.paymentOption === "full"
                      ? strings.fullPaid
                      : strings.advancePaid}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    {language === "ta" ? "கட்டண நிலை" : "Payment status"}
                  </span>
                  <span className="capitalize">
                    {getPaymentStatusLabel(activeTicket.paymentStatus, strings)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    {strings.verificationCode}
                  </span>
                  <span className="font-mono text-lg font-semibold">
                    {activeTicket.verificationCode}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    {strings.bookingId}
                  </span>
                  <span className="font-mono text-xs">
                    {activeTicket.bookingCode}
                  </span>
                </div>
                <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed px-4 py-3">
                  <span className="text-muted-foreground text-xs tracking-wide uppercase">
                    {strings.scanForDetails}
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
                  {strings.download}
                </MotionButton>
                <MotionButton
                  variant="ghost"
                  className="rounded-xl"
                  onClick={() => setActiveTicket(null)}
                  whileTap={{ scale: 0.97 }}
                  transition={springy}
                >
                  {strings.close}
                </MotionButton>
              </div>
            </MotionCard>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {rescheduleTarget && (
          <Drawer
            open={!!rescheduleTarget}
            onOpenChange={(open) => !open && resetRescheduleState()}
          >
            <DrawerContent className="max-h-[85vh]">
              <DrawerCloseButton />
              <DrawerHeader>
                <DrawerTitle>{strings.rescheduleSlot}</DrawerTitle>
                <DrawerDescription>
                  {strings.moveBookingFor.replace(
                    "{date}",
                    formatDate(rescheduleTarget.date),
                  )}
                </DrawerDescription>
              </DrawerHeader>
              <div className="px-6 pb-4">
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {availableSlotsByDate.map((entry) => {
                    const isActive = rescheduleDate === entry.date;
                    return (
                      <motion.button
                        key={entry.date}
                        onClick={() => {
                          setRescheduleDate(entry.date);
                          setRescheduleSlot(null);
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
                <div className="grid max-h-80 grid-cols-2 gap-3 overflow-y-auto pr-1">
                  {(
                    availableSlotsByDate.find(
                      (entry) => entry.date === rescheduleDate,
                    )?.slots ?? []
                  ).map((slot) => {
                    const isChosen =
                      rescheduleSlot?.date === slot.date &&
                      rescheduleSlot?.from === slot.from &&
                      rescheduleSlot?.to === slot.to;
                    return (
                      <motion.button
                        key={`${slot.date}-${slot.from}-${slot.to}`}
                        onClick={() => setRescheduleSlot(slot)}
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
                          {isChosen ? strings.selected : strings.tapToChoose}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
              <DrawerFooter>
                <Button
                  className="w-full rounded-xl"
                  disabled={!selectedSlot || rescheduleMutation.isPending}
                  onClick={handleRescheduleConfirm}
                >
                  {rescheduleMutation.isPending
                    ? strings.rescheduling
                    : strings.confirmMove}
                </Button>
                <Button variant="ghost" onClick={resetRescheduleState}>
                  {strings.cancel}
                </Button>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
