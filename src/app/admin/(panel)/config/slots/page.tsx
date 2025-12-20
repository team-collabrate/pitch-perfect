"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Edit2,
  Save,
  X,
  Trash2,
  ArrowLeft,
} from "lucide-react";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  parseISO,
} from "date-fns";
import { enIN, ta } from "date-fns/locale";
import { toast } from "sonner";

import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Spinner } from "~/components/spinner";
import { api } from "~/trpc/react";
import { cn, formatSlotTime } from "~/lib/utils";
import { useLanguage } from "~/lib/language-context";
import allTranslations from "~/lib/translations/all";

type SlotData = {
  id?: number;
  from: string;
  to: string;
  date: string;
  status: "available" | "unavailable" | "booked" | "bookingInProgress";
  fullAmount: number;
  advanceAmount: number;
};

export default function DailySlotsPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const strings = useMemo(() => allTranslations.admin[language], [language]);
  const locale = useMemo(() => (language === "ta" ? ta : enIN), [language]);

  const [selectedDate, setSelectedDate] = useState<string>(() =>
    format(new Date(), "yyyy-MM-dd"),
  );
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [editingSlotIndex, setEditingSlotIndex] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<{
    fullAmount: number;
    advanceAmount: number;
    status: "available" | "unavailable" | "booked";
  } | null>(null);

  const {
    data: slots = [],
    isLoading,
    refetch,
  } = api.timeSlot.getAllByDate.useQuery(
    { date: selectedDate },
    { enabled: !!selectedDate },
  );

  const createSlotMutation = api.admin.createSlot.useMutation();
  const updateSlotMutation = api.admin.updateSlot.useMutation();
  const deleteSlotMutation = api.admin.deleteSlot.useMutation();

  const handlePrevMonth = () => setCalendarMonth(subMonths(calendarMonth, 1));
  const handleNextMonth = () => setCalendarMonth(addMonths(calendarMonth, 1));

  const days = useMemo(() => {
    const start = startOfMonth(calendarMonth);
    const end = endOfMonth(calendarMonth);
    return eachDayOfInterval({ start, end });
  }, [calendarMonth]);

  const handleStartEdit = (index: number, slot: SlotData) => {
    setEditingSlotIndex(index);
    setEditValues({
      fullAmount: slot.fullAmount / 100,
      advanceAmount: slot.advanceAmount / 100,
      status:
        slot.status === "available"
          ? "available"
          : slot.status === "booked"
            ? "booked"
            : "unavailable",
    });
  };

  const handleCancelEdit = () => {
    setEditingSlotIndex(null);
    setEditValues(null);
  };

  const handleSaveEdit = async (slot: SlotData) => {
    if (!editValues) return;

    try {
      const payload = {
        fullAmount: Math.round(editValues.fullAmount * 100),
        advanceAmount: Math.round(editValues.advanceAmount * 100),
        status: editValues.status,
      };

      if (slot.id) {
        // Update existing DB slot
        await updateSlotMutation.mutateAsync({
          slotId: slot.id,
          ...payload,
        });
      } else {
        // Create new DB slot to override virtual slot
        await createSlotMutation.mutateAsync({
          date: selectedDate,
          from: slot.from.length === 5 ? `${slot.from}:00` : slot.from,
          to: slot.to.length === 5 ? `${slot.to}:00` : slot.to,
          ...payload,
        });
      }

      toast.success(strings.slotUpdated);
      setEditingSlotIndex(null);
      setEditValues(null);
      await refetch();
    } catch (error) {
      toast.error(strings.slotUpdateError);
      console.error(error);
    }
  };

  const handleDeleteOverride = async (slotId: number) => {
    if (!confirm(strings.removeOverrideConfirm)) return;

    try {
      await deleteSlotMutation.mutateAsync({ slotId });
      toast.success(strings.overrideRemoved);
      await refetch();
    } catch (error) {
      toast.error(strings.overrideRemoveError);
      console.error(error);
    }
  };

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
        <div>
          <p className="text-muted-foreground text-xs tracking-wide uppercase">
            {strings.configTitle}
          </p>
          <h1 className="text-2xl font-semibold">
            {strings.dailySlotOverrides}
          </h1>
        </div>
      </header>

      {/* Calendar Picker */}
      <Card className="border-border/60 bg-card/60 rounded-3xl p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold capitalize">
            {format(calendarMonth, "MMMM yyyy", { locale })}
          </h2>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrevMonth}
              className="rounded-xl"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNextMonth}
              className="rounded-xl"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center">
          {[
            strings.sunShort,
            strings.monShort,
            strings.tueShort,
            strings.wedShort,
            strings.thuShort,
            strings.friShort,
            strings.satShort,
          ].map((d) => (
            <div
              key={d}
              className="text-muted-foreground py-2 text-[10px] font-bold uppercase"
            >
              {d}
            </div>
          ))}
          {/* Padding for start of month */}
          {Array.from({ length: startOfMonth(calendarMonth).getDay() }).map(
            (_, i) => (
              <div key={`pad-${i}`} />
            ),
          )}
          {days.map((day) => {
            const dateStr = format(day, "yyyy-MM-dd");
            const isSelected = selectedDate === dateStr;
            const isToday = isSameDay(day, new Date());

            return (
              <button
                key={dateStr}
                onClick={() => setSelectedDate(dateStr)}
                className={cn(
                  "flex h-10 w-full items-center justify-center rounded-xl text-sm transition-all",
                  isSelected
                    ? "bg-primary text-primary-foreground font-bold"
                    : isToday
                      ? "bg-primary/10 text-primary font-semibold"
                      : "hover:bg-muted text-foreground",
                )}
              >
                {format(day, "d")}
              </button>
            );
          })}
        </div>
      </Card>

      {/* Slots List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-muted-foreground text-sm font-semibold tracking-wider uppercase">
            {strings.slotsForDate.replace(
              "{date}",
              format(parseISO(selectedDate), "EEE, MMM d", { locale }),
            )}
          </h3>
          {isLoading && <Spinner />}
        </div>

        {slots.length === 0 && !isLoading && (
          <Card className="border-border/60 bg-card/60 rounded-3xl p-8 text-center">
            <p className="text-muted-foreground text-sm">
              {strings.noSlotsForDate}
            </p>
          </Card>
        )}

        <div className="grid gap-3">
          {(slots as SlotData[]).map((slot, index) => {
            const isEditing = editingSlotIndex === index;
            const isVirtual = !slot.id;

            return (
              <Card
                key={`${slot.from}-${index}`}
                className={cn(
                  "border-border/60 bg-card/60 rounded-3xl p-4 transition-all",
                  isEditing && "ring-primary border-transparent ring-2",
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">
                        {formatSlotTime(slot.from)} – {formatSlotTime(slot.to)}
                      </p>
                      {isVirtual && (
                        <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-[10px] font-bold uppercase">
                          {strings.virtual}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 font-medium uppercase",
                          slot.status === "available"
                            ? "bg-green-500/10 text-green-600"
                            : slot.status === "booked"
                              ? "bg-blue-500/10 text-blue-600"
                              : "bg-red-500/10 text-red-600",
                        )}
                      >
                        {slot.status === "available"
                          ? strings.available
                          : slot.status === "booked"
                            ? strings.booked
                            : strings.unavailable}
                      </span>
                      <span className="text-muted-foreground">
                        {strings.advance}: ₹{slot.advanceAmount / 100}
                      </span>
                      <span className="text-muted-foreground">
                        {strings.full}: ₹{slot.fullAmount / 100}
                      </span>
                    </div>
                  </div>

                  {!isEditing ? (
                    <div className="flex gap-1">
                      {!isVirtual && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-xl text-red-500"
                          onClick={() => handleDeleteOverride(slot.id!)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-xl"
                        onClick={() => handleStartEdit(index, slot)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-xl text-red-500"
                        onClick={handleCancelEdit}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-xl text-green-500"
                        onClick={() => handleSaveEdit(slot)}
                        disabled={
                          createSlotMutation.isPending ||
                          updateSlotMutation.isPending
                        }
                      >
                        <Save className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>

                {isEditing && editValues && (
                  <div className="border-border/40 mt-4 grid gap-4 border-t pt-4 sm:grid-cols-3">
                    <div className="space-y-1.5">
                      <label
                        htmlFor={`status-${index}`}
                        className="text-muted-foreground text-[10px] font-bold uppercase"
                      >
                        {strings.status}
                      </label>
                      <select
                        id={`status-${index}`}
                        title={strings.slotStatus}
                        className="bg-muted ring-primary/20 w-full rounded-xl px-3 py-2 text-sm outline-none focus:ring-2"
                        value={editValues.status}
                        onChange={(e) =>
                          setEditValues({
                            ...editValues,
                            status: e.target.value as
                              | "available"
                              | "unavailable"
                              | "booked",
                          })
                        }
                      >
                        <option value="available">{strings.available}</option>
                        <option value="unavailable">
                          {strings.unavailable}
                        </option>
                        <option value="booked">{strings.bookedManual}</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label
                        htmlFor={`advance-${index}`}
                        className="text-muted-foreground text-[10px] font-bold uppercase"
                      >
                        {strings.advance} (₹)
                      </label>
                      <Input
                        id={`advance-${index}`}
                        type="number"
                        value={editValues.advanceAmount}
                        onChange={(e) =>
                          setEditValues({
                            ...editValues,
                            advanceAmount: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="rounded-xl"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label
                        htmlFor={`full-${index}`}
                        className="text-muted-foreground text-[10px] font-bold uppercase"
                      >
                        {strings.full} (₹)
                      </label>
                      <Input
                        id={`full-${index}`}
                        type="number"
                        value={editValues.fullAmount}
                        onChange={(e) =>
                          setEditValues({
                            ...editValues,
                            fullAmount: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="rounded-xl"
                      />
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
