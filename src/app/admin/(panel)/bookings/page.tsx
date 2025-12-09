"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "~/components/ui/card";
import { Spinner } from "~/components/spinner";
import { api, type RouterOutputs } from "~/trpc/react";
import { format, parseISO, parse, isAfter, isBefore } from "date-fns";
import { formatSlotTime } from "~/lib/utils";
import { Phone, RotateCw, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerCloseButton,
} from "~/components/ui/drawer";

type BookingListItem = RouterOutputs["admin"]["bookingsList"][number];
type BookingDetail = RouterOutputs["admin"]["bookingDetails"];

function getPaymentLabel(status: string): string {
  if (status === "fullPaid") return "Full";
  if (status === "advance") return "Advance";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function getDotColor(booking: {
  slot?: { from?: string; to?: string; date?: string } | null;
}): string {
  if (!booking.slot?.date || !booking.slot?.from || !booking.slot?.to) {
    return "bg-primary"; // Default color if no slot data
  }

  const now = new Date();
  const slotDate = parseISO(booking.slot.date);
  const slotStart = parse(booking.slot.from, "HH:mm:ss", slotDate);
  const slotEnd = parse(booking.slot.to, "HH:mm:ss", slotDate);

  // Check if booking is active (current time is within the slot)
  if (isAfter(now, slotStart) && isBefore(now, slotEnd)) {
    return "bg-green-500"; // Active - green
  }

  // Check if booking is within next hour
  const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
  if (!isAfter(now, slotStart) && isBefore(slotStart, oneHourFromNow)) {
    return "bg-yellow-500"; // Next hour - yellow
  }

  return "bg-primary"; // Default color
}

const REFETCH_INTERVAL = 2 * 60 * 1000; // 2 minutes

export default function BookingsPage() {
  const [selectedTab, setSelectedTab] = useState<"current" | "past">("current");
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(
    null,
  );
  const [isRefetching, setIsRefetching] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null);

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
    }
  );

  // Past bookings by date query
  const {
    data: pastBookings = [],
    isLoading: isPastLoading,
  } = api.admin.getBookingsByDate.useQuery(
    { date: selectedCalendarDate ?? currentDate },
    {
      enabled: selectedTab === "past" && Boolean(selectedCalendarDate),
    }
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

  const activeBooking: BookingDetail | BookingListItem | null = useMemo(() => {
    if (bookingDetailsQuery.data) return bookingDetailsQuery.data;
    if (!selectedBookingId) return null;
    
    if (selectedTab === "current") {
      return currentBookings.find((b) => b.id === selectedBookingId) ?? null;
    } else {
      return pastBookings.find((b) => b.id === selectedBookingId) ?? null;
    }
  }, [bookingDetailsQuery.data, currentBookings, pastBookings, selectedBookingId, selectedTab]);

  const bookingEmail = (activeBooking as BookingDetail | null)?.email ?? null;
  const bookingType = (activeBooking as BookingDetail | null)?.bookingType ?? null;
  const bookingTotalAmount = (activeBooking as BookingDetail | null)?.totalAmount;
  const bookingAlternateName = (activeBooking as BookingDetail | null)?.alternateContactName ?? null;
  const bookingAlternateNumber = (activeBooking as BookingDetail | null)?.alternateContactNumber ?? null;

  const displayBookings = selectedTab === "current" ? currentBookings : pastBookings;
  const isLoading = selectedTab === "current" ? isCurrentLoading : isPastLoading;
  const error = selectedTab === "current" ? currentError : null;

  return (
    <div className="space-y-6 pb-20">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-muted-foreground text-xs tracking-wide uppercase">
            View bookings
          </p>
          <h1 className="text-2xl font-semibold">Bookings Timeline</h1>
          <p className="text-muted-foreground text-sm">
            Share verification codes with players as they arrive.
          </p>
        </div>
        {selectedTab === "current" && (
          <button
            onClick={handleManualRefresh}
            disabled={isRefetching}
            aria-label="Refresh bookings"
            className="bg-muted hover:bg-muted/80 mt-1 flex h-10 w-10 items-center justify-center rounded-full transition-all disabled:opacity-50"
          >
            <RotateCw
              className={`h-4 w-4 transition-transform ${
                isRefetching ? "animate-spin" : ""
              }`}
            />
          </button>
        )}
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
              ? "text-primary border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Current
        </button>
        <button
          onClick={() => {
            setSelectedTab("past");
            setSelectedCalendarDate(null);
            setSelectedBookingId(null);
          }}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            selectedTab === "past"
              ? "text-primary border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Past
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
              Failed to load bookings. Please try again.
            </Card>
          ) : displayBookings.length === 0 ? (
            <Card className="border-border/60 bg-card/60 text-muted-foreground rounded-3xl p-6 text-center text-sm">
              No bookings yet.
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
                      : "N/A";
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
                            {format(parseISO(dateStr), "EEE, MMM d, yyyy")}
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
                          onClick={() => setSelectedBookingId(booking.id)}
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
                              <span className="bg-primary/10 text-primary rounded-full px-3 py-1 text-xs font-semibold">
                                {getPaymentLabel(booking.status)}
                              </span>
                            </div>
                            <p className="text-muted-foreground text-sm">
                              {slotTime}
                            </p>
                            <div className="bg-muted/50 mt-3 rounded-2xl p-3">
                              <p className="text-muted-foreground text-xs tracking-wide uppercase">
                                Verification Code
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
                  No bookings found for {format(parseISO(selectedCalendarDate), "MMM d, yyyy")}.
                </Card>
              ) : (
                <div className="space-y-3">
                  {(() => {
                    return displayBookings.map((booking) => {
                      const bookingCode = `PP-${booking.id.slice(-6).toUpperCase()}`;
                      const slotTime =
                        booking.slot?.from && booking.slot?.to
                          ? `${formatSlotTime(booking.slot.from)} – ${formatSlotTime(booking.slot.to)}`
                          : "N/A";
                      return (
                        <div key={booking.id}>
                          <div className="flex gap-4">
                            <div className="relative flex flex-col items-center pt-1">
                              <div className="bg-primary h-3 w-3 rounded-full"></div>
                            </div>
                            <Card
                              onClick={() => setSelectedBookingId(booking.id)}
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
                                  <span className="bg-primary/10 text-primary rounded-full px-3 py-1 text-xs font-semibold">
                                    {getPaymentLabel(booking.status)}
                                  </span>
                                </div>
                                <p className="text-muted-foreground text-sm">
                                  {slotTime}
                                </p>
                                <div className="bg-muted/50 mt-3 rounded-2xl p-3">
                                  <p className="text-muted-foreground text-xs tracking-wide uppercase">
                                    Verification Code
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
            <p className="text-sm font-semibold">Auto reminders</p>
            <p className="text-muted-foreground text-xs">
              Players get an SMS reminder 30 minutes before each slot.
            </p>
          </div>
        </div>
      </Card> */}

      {/* Booking Details Drawer */}
      <Drawer
        open={Boolean(selectedBookingId)}
        onOpenChange={(open) => !open && setSelectedBookingId(null)}
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
                Booking not found.
              </Card>
            )}

            {!bookingDetailsQuery.isLoading && activeBooking && (
              <>
                <DrawerHeader className="px-0 pt-0 text-left">
                  <DrawerTitle>Booking Details</DrawerTitle>
                  <DrawerDescription>
                    {`PP-${activeBooking.id.slice(-6).toUpperCase()}`}
                  </DrawerDescription>
                </DrawerHeader>

                {/* Verification Code - Prominent */}
                <div className="bg-primary/10 flex flex-col items-center justify-center rounded-3xl py-6">
                  <p className="text-muted-foreground text-xs font-medium tracking-widest uppercase">
                    Verification Code
                  </p>
                  <p className="text-primary mt-1 font-mono text-3xl font-bold tracking-wider">
                    {activeBooking.verificationCode}
                  </p>
                </div>

                <div className="grid gap-6">
                  {/* Customer & Alternate Contact */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold">Contact Info</h3>
                    <div className="bg-muted/30 divide-border/40 border-border/40 divide-y rounded-2xl border">
                      {/* Primary Contact */}
                      <div className="flex items-center justify-between p-4">
                        <div>
                          <p className="text-muted-foreground text-xs tracking-wide uppercase">
                            Customer
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
                          aria-label="Call customer"
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
                              Alternate
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
                            aria-label="Call alternate contact"
                            className="bg-background border-border/60 hover:bg-muted flex h-10 w-10 items-center justify-center rounded-full border transition-colors"
                          >
                            <Phone className="h-4 w-4" />
                          </a>
                        </div>
                      )}

                      {/* Email if exists */}
                      {bookingEmail && (
                        <div className="p-4">
                          <p className="text-muted-foreground text-xs tracking-wide uppercase">
                            Email
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
                        Slot
                      </p>
                      {activeBooking.slot?.date && (
                        <p className="font-medium">
                          {format(
                            parseISO(activeBooking.slot.date),
                            "MMM d, yyyy",
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
                          {bookingType}
                        </span>
                      )}
                    </div>

                    {/* Payment */}
                    <div className="bg-muted/30 border-border/40 space-y-1 rounded-2xl border p-4">
                      <p className="text-muted-foreground text-xs tracking-wide uppercase">
                        Payment
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
                          {getPaymentLabel(activeBooking.status)}
                        </p>
                      </div>
                      <div className="mt-1 space-y-0.5">
                        {typeof activeBooking.amountPaid === "number" && (
                          <p className="text-sm">
                            Paid: ₹
                            {(activeBooking.amountPaid / 100).toLocaleString(
                              "en-IN",
                            )}
                          </p>
                        )}
                        {typeof bookingTotalAmount === "number" && (
                          <p className="text-muted-foreground text-xs">
                            Total: ₹
                            {(bookingTotalAmount / 100).toLocaleString("en-IN")}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <DrawerFooter className="px-0 pt-2">
                  <div className="grid w-full grid-cols-2 gap-3">
                    <button
                      onClick={() =>
                        activeBooking?.id &&
                        verifyBooking.mutate({ bookingId: activeBooking.id })
                      }
                      disabled={verifyBooking.isPending || !activeBooking?.id}
                      className="bg-primary text-primary-foreground w-full rounded-2xl px-4 py-3 text-sm font-medium transition hover:opacity-90 disabled:opacity-60"
                    >
                      {verifyBooking.isPending
                        ? "Updating..."
                        : "Mark Full Paid"}
                    </button>
                    <button
                      onClick={() => setSelectedBookingId(null)}
                      className="bg-muted text-foreground w-full rounded-2xl px-4 py-3 text-sm font-medium transition hover:opacity-90"
                    >
                      Close
                    </button>
                  </div>
                </DrawerFooter>
              </>
            )}
          </div>
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
}: {
  selectedDate: string | null;
  onDateSelect: (date: string) => void;
  calendarMonth: Date;
  onMonthChange: (date: Date) => void;
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
      new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1)
    );
  };

  const handleNextMonth = () => {
    onMonthChange(
      new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1)
    );
  };

  const handleDateClick = (day: number) => {
    const date = new Date(
      calendarMonth.getFullYear(),
      calendarMonth.getMonth(),
      day
    );
    const dateStr = `${date.getFullYear()}-${String(
      date.getMonth() + 1
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
          className="bg-muted hover:bg-muted/80 flex h-9 w-9 items-center justify-center rounded-lg transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <h3 className="text-sm font-semibold">
          {format(calendarMonth, "MMMM yyyy")}
        </h3>
        <button
          onClick={handleNextMonth}
          className="bg-muted hover:bg-muted/80 flex h-9 w-9 items-center justify-center rounded-lg transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 gap-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div
            key={day}
            className="text-muted-foreground text-center text-xs font-medium py-2"
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
