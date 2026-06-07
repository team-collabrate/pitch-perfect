"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Spinner } from "~/components/spinner";
import { api, type RouterOutputs } from "~/trpc/react";
import {
  format,
  parseISO,
  parse,
  isAfter,
  isBefore,
  type Locale,
} from "date-fns";
import { enIN } from "date-fns/locale";
import { formatSlotTime } from "~/lib/utils";
import {
  Phone,
  Plus,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  PencilLine,
  Trash2,
} from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerCloseButton,
} from "~/components/ui/drawer";
import { toast } from "sonner";

type BookingListItem = RouterOutputs["admin"]["bookingsList"][number];
type BookingDetail = RouterOutputs["admin"]["bookingDetails"];
type RescheduleSlot = {
  date: string;
  from: string;
  to: string;
};

type BookingStrings = {
  bookingsTitle: string;
  bookingsDesc: string;
  refreshBookings: string;
  manualBooking: string;
  manualBookings: string;
  createManualBooking: string;
  optionalName: string;
  optionalPhone: string;
  leaveBlank: string;
  current: string;
  past: string;
  errorLoadBookings: string;
  noBookings: string;
  noBookingsFoundFor: string;
  na: string;
  verificationCode: string;
  bookingDetails: string;
  contactInfo: string;
  customer: string;
  alternate: string;
  callCustomer: string;
  callAlternateContact: string;
  email: string;
  slot: string;
  cricket: string;
  football: string;
  payment: string;
  paid: string;
  total: string;
  paymentStatus: string;
  updating: string;
  markFullPaid: string;
  close: string;
  deleteBooking: string;
  rescheduleBooking: string;
  saveBooking: string;
  cancel: string;
  deleteBookingConfirm: string;
  rescheduleDate: string;
  rescheduleFrom: string;
  rescheduleTo: string;
  invalidBookingSlot: string;
  bookingDeleted: string;
  bookingRescheduled: string;
  bookingNotFound: string;
  prevMonth: string;
  nextMonth: string;
  sun: string;
  mon: string;
  tue: string;
  wed: string;
  thu: string;
  fri: string;
  sat: string;
};

function getPaymentLabel(status: string, _strings?: BookingStrings): string {
  switch (status) {
    case "advancePaid":
      return "Advance Paid";
    case "fullPaid":
      return "Full Paid";
    case "advancePending":
      return "Advance Pending";
    case "fullPending":
      return "Full Pending";
    case "paymentFailed":
      return "Payment Failed";
    case "wontCome":
      return "Won't Come";
    case "manual":
      return "Manual";
    default:
      return status;
  }
}

function getPaymentBadgeClass(status: string): string {
  switch (status) {
    case "fullPaid":
    case "advancePaid":
      return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
    case "fullPending":
    case "advancePending":
      return "bg-amber-500/10 text-amber-600 dark:text-amber-400";
    case "paymentFailed":
      return "bg-destructive/10 text-destructive";
    case "wontCome":
      return "bg-muted text-muted-foreground";
    case "manual":
      return "bg-slate-500/10 text-slate-600 dark:text-slate-300";
    default:
      return "bg-primary/10 text-primary";
  }
}

function getDotColor(booking: {
  slot?: { from?: string; to?: string; date?: string } | null;
}): string {
  if (!booking.slot?.date || !booking.slot?.from || !booking.slot?.to) {
    return "bg-gray-400"; // Default color if no slot data
  }

  const now = new Date();
  const slotDate = parseISO(booking.slot.date);
  const slotStart = parse(booking.slot.from, "HH:mm:ss", slotDate);
  const slotEnd = parse(booking.slot.to, "HH:mm:ss", slotDate);

  // Check if booking has ended (current time is after the slot end)
  if (isAfter(now, slotEnd)) {
    return "bg-red-500"; // Ended - red
  }

  // Check if booking is active (current time is within the slot)
  if (isAfter(now, slotStart) && isBefore(now, slotEnd)) {
    return "bg-green-500"; // Active now - green
  }

  // Check if booking is within next hour
  const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
  if (isBefore(slotStart, oneHourFromNow)) {
    return "bg-yellow-500"; // Next active - yellow
  }

  return "bg-gray-400"; // Upcoming - gray
}

const REFETCH_INTERVAL = 2 * 60 * 1000; // 2 minutes

export default function BookingsPage() {
  const [selectedTab, setSelectedTab] = useState<"current" | "past">("current");
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(
    null,
  );
  const [isRefetching, setIsRefetching] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<
    string | null
  >(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [selectedRescheduleSlot, setSelectedRescheduleSlot] =
    useState<RescheduleSlot | null>(null);
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [isManualOpen, setIsManualOpen] = useState(false);
  const [manualDate, setManualDate] = useState("");
  const [manualSlot, setManualSlot] = useState<RescheduleSlot | null>(null);
  const [manualName, setManualName] = useState<string | null>(null);
  const [manualPhone, setManualPhone] = useState<string | null>(null);
  const strings: BookingStrings = useMemo(
    () => ({
      bookingsTitle: "Bookings",
      bookingsDesc: "Manage booking records",
      refreshBookings: "Refresh bookings",
      manualBooking: "Manual Booking",
      manualBookings: "Manual bookings",
      createManualBooking: "Create manual booking",
      optionalName: "Name (optional)",
      optionalPhone: "Phone number (optional)",
      leaveBlank: "Leave blank if not available",
      current: "Current",
      past: "Past",
      errorLoadBookings: "Failed to load bookings",
      noBookings: "No bookings found",
      noBookingsFoundFor: "No bookings found for {date}",
      na: "N/A",
      verificationCode: "Verification Code",
      bookingDetails: "Booking Details",
      contactInfo: "Contact Info",
      customer: "Customer",
      alternate: "Alternate Contact",
      callCustomer: "Call customer",
      callAlternateContact: "Call alternate contact",
      email: "Email",
      slot: "Slot",
      cricket: "Cricket",
      football: "Football",
      payment: "Payment",
      paid: "Paid",
      total: "Total",
      paymentStatus: "Payment Status",
      updating: "Updating...",
      markFullPaid: "Mark Full Paid",
      close: "Close",
      deleteBooking: "Delete Booking",
      rescheduleBooking: "Reschedule Booking",
      saveBooking: "Save Changes",
      cancel: "Cancel",
      deleteBookingConfirm: "Delete this booking? This cannot be undone.",
      rescheduleDate: "Date",
      rescheduleFrom: "From",
      rescheduleTo: "To",
      invalidBookingSlot: "Please enter a valid date and time",
      bookingDeleted: "Booking deleted",
      bookingRescheduled: "Booking rescheduled",
      bookingNotFound: "Booking not found",
      prevMonth: "Previous month",
      nextMonth: "Next month",
      sun: "Sun",
      mon: "Mon",
      tue: "Tue",
      wed: "Wed",
      thu: "Thu",
      fri: "Fri",
      sat: "Sat",
    }),
    [],
  );
  const locale = enIN;

  const now = new Date();
  const currentDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  // Current bookings query
  const {
    data: currentBookings = [],
    isLoading: isCurrentLoading,
    error: currentError,
    refetch: refetchCurrent,
  } = api.admin.bookingsList.useQuery(
    {
      limit: 50,
      date: currentDate,
      time: currentTime,
    },
    {
      enabled: selectedTab === "current",
    },
  );

  // Past bookings by date query
  const { data: pastBookings = [], isLoading: isPastLoading } =
    api.admin.getBookingsByDate.useQuery(
      { date: selectedCalendarDate ?? currentDate },
      {
        enabled: selectedTab === "past" && Boolean(selectedCalendarDate),
      },
    );

  // Auto-refetch current bookings every 2 minutes
  useEffect(() => {
    if (selectedTab !== "current") return;

    const interval = setInterval(() => {
      void refetchCurrent();
    }, REFETCH_INTERVAL);

    return () => clearInterval(interval);
  }, [refetchCurrent, selectedTab]);

  const handleManualRefresh = async () => {
    setIsRefetching(true);
    if (selectedTab === "current") {
      await refetchCurrent();
    }
    setIsRefetching(false);
  };

  const utils = api.useContext();
  const bookingDetailsQuery = api.admin.bookingDetails.useQuery(
    { bookingId: selectedBookingId ?? "" },
    {
      enabled: Boolean(selectedBookingId),
      refetchOnWindowFocus: false,
    },
  );
  const { data: availableSlots } = api.timeSlot.getAllAvailable.useQuery(
    { days: 31 },
    {
      enabled: isRescheduleOpen || isManualOpen,
    },
  );

  const availableSlotsByDate = useMemo(() => {
    if (!availableSlots) return [];

    const sourceSlots = availableSlots as RescheduleSlot[];
    const grouped = sourceSlots.reduce<Record<string, RescheduleSlot[]>>(
      (acc, slot) => {
        acc[slot.date] ??= [];
        acc[slot.date]!.push({
          date: slot.date,
          from: slot.from,
          to: slot.to,
        });
        return acc;
      },
      {},
    );

    return Object.entries(grouped).map(([date, slots]) => ({
      date,
      slots,
    }));
  }, [availableSlots]) as Array<{
    date: string;
    slots: RescheduleSlot[];
  }>;

  const availableSlotsForSelectedDate = useMemo(() => {
    return (
      availableSlotsByDate.find((entry) => entry.date === rescheduleDate)
        ?.slots ?? []
    );
  }, [availableSlotsByDate, rescheduleDate]);

  const availableManualSlotsForSelectedDate = useMemo(() => {
    return (
      availableSlotsByDate.find((entry) => entry.date === manualDate)?.slots ??
      []
    );
  }, [availableSlotsByDate, manualDate]);

  const verifyBooking = api.admin.verifyBooking.useMutation({
    onSuccess: async () => {
      await Promise.allSettled([
        utils.admin.bookingsList.invalidate(),
        selectedBookingId
          ? utils.admin.bookingDetails.invalidate({
              bookingId: selectedBookingId,
            })
          : Promise.resolve(),
      ]);
    },
  });

  const deleteBooking = api.admin.deleteBooking.useMutation({
    onSuccess: async () => {
      await Promise.allSettled([
        utils.admin.bookingsList.invalidate(),
        utils.admin.getBookingsByDate.invalidate(),
        selectedBookingId
          ? utils.admin.bookingDetails.invalidate({
              bookingId: selectedBookingId,
            })
          : Promise.resolve(),
      ]);
      setSelectedBookingId(null);
      toast(strings.bookingDeleted);
    },
  });

  const rescheduleBooking = api.admin.rescheduleBooking.useMutation({
    onSuccess: async () => {
      await Promise.allSettled([
        utils.admin.bookingsList.invalidate(),
        utils.admin.getBookingsByDate.invalidate(),
        selectedBookingId
          ? utils.admin.bookingDetails.invalidate({
              bookingId: selectedBookingId,
            })
          : Promise.resolve(),
      ]);
      toast(strings.bookingRescheduled);
    },
  });

  const createManualBooking = api.admin.createManualBooking.useMutation({
    onSuccess: async () => {
      await Promise.allSettled([
        utils.admin.bookingsList.invalidate(),
        utils.admin.getBookingsByDate.invalidate(),
      ]);
      toast(strings.createManualBooking);
      closeManualBookingDrawer();
    },
  });

  const activeBooking: BookingDetail | BookingListItem | null = useMemo(() => {
    if (bookingDetailsQuery.data) return bookingDetailsQuery.data;
    if (!selectedBookingId) return null;

    if (selectedTab === "current") {
      return currentBookings.find((b) => b.id === selectedBookingId) ?? null;
    } else {
      return pastBookings.find((b) => b.id === selectedBookingId) ?? null;
    }
  }, [
    bookingDetailsQuery.data,
    currentBookings,
    pastBookings,
    selectedBookingId,
    selectedTab,
  ]);

  const bookingEmail = (activeBooking as BookingDetail | null)?.email ?? null;
  const bookingType =
    (activeBooking as BookingDetail | null)?.bookingType ?? null;
  const bookingTotalAmount = (activeBooking as BookingDetail | null)
    ?.totalAmount;
  const bookingAlternateName =
    (activeBooking as BookingDetail | null)?.alternateContactName ?? null;
  const bookingAlternateNumber =
    (activeBooking as BookingDetail | null)?.alternateContactNumber ?? null;

  const displayBookings =
    selectedTab === "current" ? currentBookings : pastBookings;
  const isLoading =
    selectedTab === "current" ? isCurrentLoading : isPastLoading;
  const error = selectedTab === "current" ? currentError : null;

  const openBooking = (bookingId: string) => {
    setSelectedBookingId(bookingId);
    setRescheduleDate("");
    setSelectedRescheduleSlot(null);
    setIsRescheduleOpen(false);
    setIsManualOpen(false);
  };

  const openRescheduleDrawer = () => {
    if (!activeBooking) return;

    setRescheduleDate("");
    setSelectedRescheduleSlot(null);
    setIsRescheduleOpen(true);
  };

  const closeRescheduleDrawer = () => {
    setIsRescheduleOpen(false);
    setRescheduleDate("");
    setSelectedRescheduleSlot(null);
  };

  const openManualBookingDrawer = () => {
    setSelectedBookingId(null);
    setIsRescheduleOpen(false);
    setManualDate("");
    setManualSlot(null);
    setManualName(null);
    setManualPhone(null);
    setIsManualOpen(true);
  };

  const closeManualBookingDrawer = () => {
    setIsManualOpen(false);
    setManualDate("");
    setManualSlot(null);
    setManualName(null);
    setManualPhone(null);
  };

  const handleReschedule = () => {
    if (
      !selectedBookingId ||
      !selectedRescheduleSlot?.date ||
      !selectedRescheduleSlot?.from ||
      !selectedRescheduleSlot?.to
    ) {
      toast(strings.invalidBookingSlot);
      return;
    }

    rescheduleBooking.mutate({
      bookingId: selectedBookingId,
      date: selectedRescheduleSlot.date,
      from: selectedRescheduleSlot.from,
      to: selectedRescheduleSlot.to,
    });
    closeRescheduleDrawer();
  };

  const handleManualBooking = () => {
    if (!manualSlot?.date || !manualSlot?.from || !manualSlot?.to) {
      toast(strings.invalidBookingSlot);
      return;
    }

    createManualBooking.mutate({
      date: manualSlot.date,
      from: manualSlot.from,
      to: manualSlot.to,
      name: manualName?.trim() || undefined,
      number: manualPhone?.trim() || undefined,
    });
  };

  useEffect(() => {
    if (!isRescheduleOpen || availableSlotsByDate.length === 0) return;

    const activeDate = activeBooking?.slot?.date;
    const hasValidSelection = availableSlotsByDate.some(
      (entry) => entry.date === rescheduleDate,
    );

    if (!hasValidSelection) {
      const nextDate =
        (activeDate &&
        availableSlotsByDate.some((entry) => entry.date === activeDate)
          ? activeDate
          : availableSlotsByDate[0]?.date) ?? "";

      if (nextDate) {
        setRescheduleDate(nextDate);
      }
      setSelectedRescheduleSlot(null);
    }
  }, [
    activeBooking?.slot?.date,
    availableSlotsByDate,
    isRescheduleOpen,
    rescheduleDate,
  ]);

  useEffect(() => {
    if (!isManualOpen || availableSlotsByDate.length === 0) return;

    const nextDate = availableSlotsByDate.some(
      (entry) => entry.date === manualDate,
    )
      ? manualDate
      : (availableSlotsByDate[0]?.date ?? "");

    if (nextDate && nextDate !== manualDate) {
      setManualDate(nextDate);
      setManualSlot(null);
    } else if (!manualDate) {
      setManualDate(nextDate);
      setManualSlot(null);
    }
  }, [availableSlotsByDate, isManualOpen, manualDate]);

  return (
    <div className="space-y-6 pb-20">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-muted-foreground text-xs tracking-wide uppercase">
            {strings.bookingsTitle}
          </p>
          <h1 className="text-2xl font-semibold">{strings.bookingsTitle}</h1>
          <p className="text-muted-foreground text-sm">
            {strings.bookingsDesc}
          </p>
        </div>
        <div className="mt-1 flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-10 w-10 rounded-full p-0"
            aria-label={strings.manualBooking}
            onClick={openManualBookingDrawer}
          >
            <Plus className="h-4 w-4" />
          </Button>
          {selectedTab === "current" && (
            <button
              onClick={handleManualRefresh}
              disabled={isRefetching}
              aria-label={strings.refreshBookings}
              className="bg-muted hover:bg-muted/80 flex h-10 w-10 items-center justify-center rounded-full transition-all disabled:opacity-50"
            >
              <RotateCw
                className={`h-4 w-4 transition-transform ${
                  isRefetching ? "animate-spin" : ""
                }`}
              />
            </button>
          )}
        </div>
      </header>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => {
            setSelectedTab("current");
            setSelectedBookingId(null);
          }}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            selectedTab === "current"
              ? "text-primary border-primary border-b-2"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {strings.current}
        </button>
        <button
          onClick={() => {
            setSelectedTab("past");
            setSelectedCalendarDate(null);
            setSelectedBookingId(null);
          }}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            selectedTab === "past"
              ? "text-primary border-primary border-b-2"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {strings.past}
        </button>
      </div>

      {/* Current Tab */}
      {selectedTab === "current" && (
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner />
            </div>
          ) : error ? (
            <Card className="border-border/60 bg-destructive/10 text-destructive rounded-3xl p-4 text-center text-sm">
              {strings.errorLoadBookings}
            </Card>
          ) : displayBookings.length === 0 ? (
            <Card className="border-border/60 bg-card/60 text-muted-foreground rounded-3xl p-6 text-center text-sm">
              {strings.noBookings}
            </Card>
          ) : (
            <div className="space-y-3">
              {(() => {
                let lastDate: string | null = null;
                return displayBookings.map((booking, index) => {
                  const bookingCode = `PP-${booking.id.slice(-6).toUpperCase()}`;
                  const slotTime =
                    booking.slot?.from && booking.slot?.to
                      ? `${formatSlotTime(booking.slot.from)} – ${formatSlotTime(booking.slot.to)}`
                      : strings.na;
                  const isLastItem = index === displayBookings.length - 1;
                  const dateStr: string | undefined = booking.slot?.date;
                  let showDate = false;
                  if (dateStr && dateStr !== lastDate) {
                    showDate = true;
                    lastDate = dateStr;
                  }
                  return (
                    <div key={booking.id} className="relative">
                      {showDate && dateStr && (
                        <div className="mt-6 mb-2 flex items-center gap-2">
                          <span className="text-primary/80 text-xs font-semibold">
                            {format(parseISO(dateStr), "EEE, MMM d, yyyy", {
                              locale,
                            })}
                          </span>
                          <div className="border-border/40 flex-1 border-t" />
                        </div>
                      )}
                      {!isLastItem && (
                        <div className="bg-border/50 absolute top-12 left-5 h-6 w-0.5"></div>
                      )}
                      <div className="flex gap-4">
                        <div className="relative flex flex-col items-center pt-1">
                          <div
                            className={`${getDotColor(booking)} h-3 w-3 rounded-full`}
                          ></div>
                        </div>
                        <Card
                          onClick={() => openBooking(booking.id)}
                          className="border-border/60 bg-card/60 hover:bg-card/80 mb-2 flex-1 cursor-pointer rounded-3xl p-4 transition-all hover:shadow-md"
                        >
                          <div className="space-y-3">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="text-muted-foreground text-xs tracking-widest uppercase">
                                  {bookingCode}
                                </p>
                                {booking.name && (
                                  <p className="text-lg font-semibold">
                                    {booking.name}
                                  </p>
                                )}
                                <p className="text-muted-foreground text-sm">
                                  {booking.phoneNumber}
                                </p>
                              </div>
                              <div className="flex flex-col items-end gap-1">
                                <span
                                  className={`${getPaymentBadgeClass(booking.status)} rounded-full px-3 py-1 text-xs font-semibold`}
                                >
                                  {getPaymentLabel(booking.status, strings)}
                                </span>
                                {booking.status === "advancePaid" && (
                                  <span className="bg-muted text-muted-foreground inline-flex rounded-full px-3 py-1 text-xs font-medium">
                                    Rs {Math.round(booking.amountPaid / 100)}
                                  </span>
                                )}
                              </div>
                            </div>
                            <p className="text-muted-foreground text-sm">
                              {slotTime}
                            </p>
                            <div className="bg-muted/50 mt-3 rounded-2xl p-3">
                              <p className="text-muted-foreground text-xs tracking-wide uppercase">
                                {strings.verificationCode}
                              </p>
                              <p className="mt-1 font-mono text-sm font-semibold">
                                {booking.verificationCode}
                              </p>
                            </div>
                          </div>
                        </Card>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          )}
        </div>
      )}

      {/* Past Tab with Calendar */}
      {selectedTab === "past" && (
        <div className="space-y-4">
          {/* Calendar */}
          <Card className="border-border/60 bg-card/60 rounded-3xl p-6">
            <CalendarPicker
              selectedDate={selectedCalendarDate}
              onDateSelect={setSelectedCalendarDate}
              calendarMonth={calendarMonth}
              onMonthChange={setCalendarMonth}
              strings={strings}
              locale={locale}
            />
          </Card>

          {/* Bookings for selected date */}
          {selectedCalendarDate && (
            <div className="space-y-4">
              {isPastLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Spinner />
                </div>
              ) : displayBookings.length === 0 ? (
                <Card className="border-border/60 bg-card/60 text-muted-foreground rounded-3xl p-6 text-center text-sm">
                  {strings.noBookingsFoundFor.replace(
                    "{date}",
                    format(parseISO(selectedCalendarDate), "MMM d, yyyy", {
                      locale,
                    }),
                  )}
                </Card>
              ) : (
                <div className="space-y-3">
                  {(() => {
                    return displayBookings.map((booking) => {
                      const bookingCode = `PP-${booking.id.slice(-6).toUpperCase()}`;
                      const slotTime =
                        booking.slot?.from && booking.slot?.to
                          ? `${formatSlotTime(booking.slot.from)} – ${formatSlotTime(booking.slot.to)}`
                          : strings.na;
                      return (
                        <div key={booking.id}>
                          <div className="flex gap-4">
                            <div className="relative flex flex-col items-center pt-1">
                              <div
                                className={`${getDotColor(booking)} h-3 w-3 rounded-full`}
                              ></div>
                            </div>
                            <Card
                              onClick={() => openBooking(booking.id)}
                              className="border-border/60 bg-card/60 hover:bg-card/80 mb-2 flex-1 cursor-pointer rounded-3xl p-4 transition-all hover:shadow-md"
                            >
                              <div className="space-y-3">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <p className="text-muted-foreground text-xs tracking-widest uppercase">
                                      {bookingCode}
                                    </p>
                                    {booking.name && (
                                      <p className="text-lg font-semibold">
                                        {booking.name}
                                      </p>
                                    )}
                                    <p className="text-muted-foreground text-sm">
                                      {booking.phoneNumber}
                                    </p>
                                  </div>
                                  <div className="flex flex-col items-end gap-1">
                                    <span
                                      className={`${getPaymentBadgeClass(booking.status)} rounded-full px-3 py-1 text-xs font-semibold`}
                                    >
                                      {getPaymentLabel(booking.status, strings)}
                                    </span>
                                    {booking.status === "advancePaid" && (
                                      <span className="bg-muted text-muted-foreground inline-flex rounded-full px-3 py-1 text-xs font-medium">
                                        Rs{" "}
                                        {Math.round(booking.amountPaid / 100)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <p className="text-muted-foreground text-sm">
                                  {slotTime}
                                </p>
                                <div className="bg-muted/50 mt-3 rounded-2xl p-3">
                                  <p className="text-muted-foreground text-xs tracking-wide uppercase">
                                    {strings.verificationCode}
                                  </p>
                                  <p className="mt-1 font-mono text-sm font-semibold">
                                    {booking.verificationCode}
                                  </p>
                                </div>
                              </div>
                            </Card>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Booking Details Drawer */}
      <Drawer
        open={Boolean(selectedBookingId)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedBookingId(null);
            setIsRescheduleOpen(false);
          }
        }}
      >
        <DrawerContent>
          <DrawerCloseButton />
          <div className="space-y-6 px-6 pt-4 pb-8">
            {bookingDetailsQuery.isLoading && (
              <div className="flex items-center justify-center py-12">
                <Spinner />
              </div>
            )}

            {!bookingDetailsQuery.isLoading && !activeBooking && (
              <Card className="border-border/60 bg-destructive/10 text-destructive rounded-3xl p-4 text-center text-sm">
                {strings.bookingNotFound}
              </Card>
            )}

            {!bookingDetailsQuery.isLoading && activeBooking && (
              <>
                <DrawerHeader className="px-0 pt-0 text-left">
                  <DrawerTitle>{strings.bookingDetails}</DrawerTitle>
                  <DrawerDescription>
                    {`PP-${activeBooking.id.slice(-6).toUpperCase()}`}
                  </DrawerDescription>
                </DrawerHeader>

                {/* Verification Code - Prominent */}
                <div className="bg-primary/10 flex flex-col items-center justify-center rounded-3xl py-6">
                  <p className="text-muted-foreground text-xs font-medium tracking-widest uppercase">
                    {strings.verificationCode}
                  </p>
                  <p className="text-primary mt-1 font-mono text-3xl font-bold tracking-wider">
                    {activeBooking.verificationCode}
                  </p>
                </div>

                <div className="grid gap-6">
                  {/* Customer & Alternate Contact */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold">
                      {strings.contactInfo}
                    </h3>
                    <div className="bg-muted/30 divide-border/40 border-border/40 divide-y rounded-2xl border">
                      {/* Primary Contact */}
                      <div className="flex items-center justify-between p-4">
                        <div>
                          <p className="text-muted-foreground text-xs tracking-wide uppercase">
                            {strings.customer}
                          </p>
                          <p className="font-medium">{activeBooking.name}</p>
                          <p className="text-muted-foreground text-sm">
                            {activeBooking.phoneNumber}
                          </p>
                        </div>
                        <a
                          href={
                            activeBooking.phoneNumber
                              ? `tel:${activeBooking.phoneNumber}`
                              : undefined
                          }
                          aria-label={strings.callCustomer}
                          className="bg-background border-border/60 hover:bg-muted flex h-10 w-10 items-center justify-center rounded-full border transition-colors"
                        >
                          <Phone className="h-4 w-4" />
                        </a>
                      </div>
                      {/* Alternate Contact */}
                      {bookingAlternateName && bookingAlternateNumber && (
                        <div className="flex items-center justify-between p-4">
                          <div>
                            <p className="text-muted-foreground text-xs tracking-wide uppercase">
                              {strings.alternate}
                            </p>
                            <p className="font-medium">
                              {bookingAlternateName}
                            </p>
                            <p className="text-muted-foreground text-sm">
                              {bookingAlternateNumber}
                            </p>
                          </div>
                          <a
                            href={`tel:${bookingAlternateNumber}`}
                            aria-label={strings.callAlternateContact}
                            className="bg-background border-border/60 hover:bg-muted flex h-10 w-10 items-center justify-center rounded-full border transition-colors"
                          >
                            <Phone className="h-4 w-4" />
                          </a>
                        </div>
                      )}{" "}
                      {/* Email if exists */}
                      {bookingEmail && (
                        <div className="p-4">
                          <p className="text-muted-foreground text-xs tracking-wide uppercase">
                            {strings.email}
                          </p>
                          <p className="text-sm font-medium">{bookingEmail}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Booking Details Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Time & Date */}
                    <div className="bg-muted/30 border-border/40 space-y-1 rounded-2xl border p-4">
                      <p className="text-muted-foreground text-xs tracking-wide uppercase">
                        {strings.slot}
                      </p>
                      {activeBooking.slot?.date && (
                        <p className="font-medium">
                          {format(
                            parseISO(activeBooking.slot.date),
                            "MMM d, yyyy",
                            { locale },
                          )}
                        </p>
                      )}
                      {activeBooking.slot?.from && activeBooking.slot?.to && (
                        <p className="text-muted-foreground text-sm">
                          {formatSlotTime(activeBooking.slot.from)} –{" "}
                          {formatSlotTime(activeBooking.slot.to)}
                        </p>
                      )}
                      {bookingType && (
                        <span className="bg-background text-foreground border-border/40 mt-2 inline-block rounded-md border px-2 py-0.5 text-[10px] font-medium tracking-wider uppercase">
                          {bookingType === "cricket"
                            ? strings.cricket
                            : bookingType === "football"
                              ? strings.football
                              : bookingType}
                        </span>
                      )}
                    </div>

                    {/* Payment */}
                    <div className="bg-muted/30 border-border/40 space-y-1 rounded-2xl border p-4">
                      <p className="text-muted-foreground text-xs tracking-wide uppercase">
                        {strings.payment}
                      </p>
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-block h-2 w-2 rounded-full ${
                            activeBooking.status === "fullPaid"
                              ? "bg-green-500"
                              : "bg-yellow-500"
                          }`}
                        />
                        <p className="font-medium capitalize">
                          {getPaymentLabel(activeBooking.status, strings)}
                        </p>
                      </div>
                      <div className="mt-1 space-y-0.5">
                        {activeBooking.status !== "paymentFailed" &&
                          typeof activeBooking.amountPaid === "number" && (
                            <p className="text-sm">
                              {strings.paid}: ₹
                              {(activeBooking.amountPaid / 100).toLocaleString(
                                "en-IN",
                              )}
                            </p>
                          )}
                        {typeof bookingTotalAmount === "number" && (
                          <p className="text-muted-foreground text-xs">
                            {strings.total}: ₹
                            {(bookingTotalAmount / 100).toLocaleString("en-IN")}
                          </p>
                        )}
                      </div>
                      <div className="pt-2">
                        <p className="text-muted-foreground text-xs tracking-wide uppercase">
                          {strings.paymentStatus}
                        </p>
                        <span
                          className={`${getPaymentBadgeClass(activeBooking.status)} mt-1 inline-flex rounded-full px-3 py-1 text-xs font-semibold`}
                        >
                          {getPaymentLabel(activeBooking.status, strings)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <DrawerFooter className="px-0 pt-2">
                  <div className="grid w-full gap-3">
                    <button
                      onClick={() =>
                        activeBooking?.id &&
                        verifyBooking.mutate({ bookingId: activeBooking.id })
                      }
                      disabled={verifyBooking.isPending || !activeBooking?.id}
                      className="bg-primary text-primary-foreground w-full rounded-2xl px-4 py-3 text-sm font-medium transition hover:opacity-90 disabled:opacity-60"
                    >
                      {verifyBooking.isPending
                        ? strings.updating
                        : strings.markFullPaid}
                    </button>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={openRescheduleDrawer}
                        disabled={!activeBooking || rescheduleBooking.isPending}
                        className="bg-muted text-foreground flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium transition hover:opacity-90 disabled:opacity-60"
                      >
                        <PencilLine className="h-4 w-4" />
                        {strings.rescheduleBooking}
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(strings.deleteBookingConfirm)) {
                            deleteBooking.mutate({
                              bookingId: activeBooking.id,
                            });
                          }
                        }}
                        disabled={deleteBooking.isPending}
                        className="bg-destructive text-destructive-foreground flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium transition hover:opacity-90 disabled:opacity-60"
                      >
                        <Trash2 className="h-4 w-4" />
                        {deleteBooking.isPending
                          ? strings.updating
                          : strings.deleteBooking}
                      </button>
                    </div>
                    <button
                      onClick={() => setSelectedBookingId(null)}
                      className="bg-muted text-foreground w-full rounded-2xl px-4 py-3 text-sm font-medium transition hover:opacity-90"
                    >
                      {strings.close}
                    </button>
                  </div>
                </DrawerFooter>
              </>
            )}
          </div>
        </DrawerContent>
      </Drawer>

      <Drawer
        open={isRescheduleOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeRescheduleDrawer();
          }
        }}
      >
        <DrawerContent className="max-h-[85vh]">
          <DrawerCloseButton />
          <DrawerHeader>
            <DrawerTitle>{strings.rescheduleBooking}</DrawerTitle>
            <DrawerDescription>
              {activeBooking
                ? `PP-${activeBooking.id.slice(-6).toUpperCase()}`
                : strings.rescheduleBooking}
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-6 pb-4">
            <div className="mb-4 flex gap-2 overflow-x-auto pb-2">
              {availableSlotsByDate.map((entry) => {
                const isActive = rescheduleDate === entry.date;
                return (
                  <button
                    key={entry.date}
                    onClick={() => {
                      setRescheduleDate(entry.date);
                      setSelectedRescheduleSlot(null);
                    }}
                    className={`flex min-w-24 flex-col items-center rounded-2xl border px-4 py-3 text-sm transition ${
                      isActive
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground"
                    }`}
                  >
                    <span className="font-semibold uppercase">
                      {format(parseISO(entry.date), "EEE")}
                    </span>
                    <span>{format(parseISO(entry.date), "MMM d")}</span>
                  </button>
                );
              })}
            </div>

            <div className="grid max-h-80 grid-cols-2 gap-3 overflow-y-auto pr-1">
              {availableSlotsForSelectedDate.length > 0 ? (
                availableSlotsForSelectedDate.map((slot) => {
                  const isChosen =
                    selectedRescheduleSlot?.date === slot.date &&
                    selectedRescheduleSlot?.from === slot.from &&
                    selectedRescheduleSlot?.to === slot.to;

                  return (
                    <button
                      key={`${slot.date}-${slot.from}-${slot.to}`}
                      onClick={() => setSelectedRescheduleSlot(slot)}
                      className={`flex flex-col rounded-2xl border px-3 py-3 text-left text-sm transition ${
                        isChosen
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground"
                      }`}
                    >
                      <span className="font-semibold">
                        {formatSlotTime(slot.from)} - {formatSlotTime(slot.to)}
                      </span>
                      <span className="text-muted-foreground mt-1 text-xs">
                        {isChosen ? "Selected" : "Tap to choose"}
                      </span>
                    </button>
                  );
                })
              ) : (
                <Card className="border-border/60 bg-card/60 text-muted-foreground col-span-2 rounded-3xl p-4 text-center text-sm">
                  No free slots for this day
                </Card>
              )}
            </div>
          </div>
          <DrawerFooter>
            <Button
              type="button"
              className="w-full rounded-xl"
              disabled={!selectedRescheduleSlot || rescheduleBooking.isPending}
              onClick={handleReschedule}
            >
              {rescheduleBooking.isPending
                ? strings.updating
                : strings.saveBooking}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={closeRescheduleDrawer}
            >
              {strings.cancel}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <Drawer
        open={isManualOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeManualBookingDrawer();
          }
        }}
      >
        <DrawerContent className="max-h-[85vh]">
          <DrawerCloseButton />
          <DrawerHeader>
            <DrawerTitle>{strings.createManualBooking}</DrawerTitle>
            <DrawerDescription>{strings.leaveBlank}</DrawerDescription>
          </DrawerHeader>
          <div className="space-y-4 px-6 pb-4">
            <div className="mb-2 flex gap-2 overflow-x-auto pb-2">
              {availableSlotsByDate.map((entry) => {
                const isActive = manualDate === entry.date;
                return (
                  <button
                    key={entry.date}
                    onClick={() => {
                      setManualDate(entry.date);
                      setManualSlot(null);
                    }}
                    className={`flex min-w-24 flex-col items-center rounded-2xl border px-4 py-3 text-sm transition ${
                      isActive
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground"
                    }`}
                  >
                    <span className="font-semibold uppercase">
                      {format(parseISO(entry.date), "EEE")}
                    </span>
                    <span>{format(parseISO(entry.date), "MMM d")}</span>
                  </button>
                );
              })}
            </div>

            <div className="grid max-h-72 grid-cols-2 gap-3 overflow-y-auto pr-1">
              {availableManualSlotsForSelectedDate.length > 0 ? (
                availableManualSlotsForSelectedDate.map((slot) => {
                  const isChosen =
                    manualSlot?.date === slot.date &&
                    manualSlot?.from === slot.from &&
                    manualSlot?.to === slot.to;

                  return (
                    <button
                      key={`${slot.date}-${slot.from}-${slot.to}`}
                      onClick={() => setManualSlot(slot)}
                      className={`flex flex-col rounded-2xl border px-3 py-3 text-left text-sm transition ${
                        isChosen
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground"
                      }`}
                    >
                      <span className="font-semibold">
                        {formatSlotTime(slot.from)} - {formatSlotTime(slot.to)}
                      </span>
                      <span className="text-muted-foreground mt-1 text-xs">
                        {isChosen ? "Selected" : "Tap to choose"}
                      </span>
                    </button>
                  );
                })
              ) : (
                <Card className="border-border/60 bg-card/60 text-muted-foreground col-span-2 rounded-3xl p-4 text-center text-sm">
                  No free slots for this day
                </Card>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="manual-name">{strings.optionalName}</Label>
              <Input
                id="manual-name"
                value={manualName ?? ""}
                onChange={(event) =>
                  setManualName(
                    event.target.value.trim() ? event.target.value : null,
                  )
                }
                placeholder={strings.optionalName}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="manual-phone">{strings.optionalPhone}</Label>
              <Input
                id="manual-phone"
                inputMode="tel"
                value={manualPhone ?? ""}
                onChange={(event) =>
                  setManualPhone(
                    event.target.value.trim() ? event.target.value : null,
                  )
                }
                placeholder={strings.optionalPhone}
              />
            </div>
          </div>
          <DrawerFooter>
            <Button
              type="button"
              className="w-full rounded-xl"
              disabled={!manualSlot || createManualBooking.isPending}
              onClick={handleManualBooking}
            >
              {createManualBooking.isPending
                ? strings.updating
                : strings.createManualBooking}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={closeManualBookingDrawer}
            >
              {strings.cancel}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}

// Calendar Picker Component
function CalendarPicker({
  selectedDate,
  onDateSelect,
  calendarMonth,
  onMonthChange,
  strings,
  locale,
}: {
  selectedDate: string | null;
  onDateSelect: (date: string) => void;
  calendarMonth: Date;
  onMonthChange: (date: Date) => void;
  strings: BookingStrings;
  locale: Locale;
}) {
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const daysInMonth = getDaysInMonth(calendarMonth);
  const firstDay = getFirstDayOfMonth(calendarMonth);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDay }, (_, i) => i);

  const handlePrevMonth = () => {
    onMonthChange(
      new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1),
    );
  };

  const handleNextMonth = () => {
    onMonthChange(
      new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1),
    );
  };

  const handleDateClick = (day: number) => {
    const date = new Date(
      calendarMonth.getFullYear(),
      calendarMonth.getMonth(),
      day,
    );
    const dateStr = `${date.getFullYear()}-${String(
      date.getMonth() + 1,
    ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    onDateSelect(dateStr);
  };

  const isDateSelected = (day: number) => {
    if (!selectedDate) return false;
    const selectedParts = selectedDate.split("-");
    return (
      parseInt(selectedParts[0] ?? "") === calendarMonth.getFullYear() &&
      parseInt(selectedParts[1] ?? "") === calendarMonth.getMonth() + 1 &&
      parseInt(selectedParts[2] ?? "") === day
    );
  };

  return (
    <div className="space-y-4">
      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={handlePrevMonth}
          aria-label={strings.prevMonth}
          className="bg-muted hover:bg-muted/80 flex h-9 w-9 items-center justify-center rounded-lg transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <h3 className="text-sm font-semibold">
          {format(calendarMonth, "MMMM yyyy", { locale })}
        </h3>
        <button
          onClick={handleNextMonth}
          aria-label={strings.nextMonth}
          className="bg-muted hover:bg-muted/80 flex h-9 w-9 items-center justify-center rounded-lg transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 gap-2">
        {[
          strings.sun,
          strings.mon,
          strings.tue,
          strings.wed,
          strings.thu,
          strings.fri,
          strings.sat,
        ].map((day) => (
          <div
            key={day}
            className="text-muted-foreground py-2 text-center text-xs font-medium"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-2">
        {emptyDays.map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {days.map((day) => (
          <button
            key={day}
            onClick={() => handleDateClick(day)}
            className={`h-9 rounded-lg text-sm font-medium transition-colors ${
              isDateSelected(day)
                ? "bg-primary text-primary-foreground"
                : "bg-muted hover:bg-muted/80 text-foreground"
            }`}
          >
            {day}
          </button>
        ))}
      </div>
    </div>
  );
}
