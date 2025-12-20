"use client";
import { useState, useCallback, useMemo } from "react";
import { Clock, AlertCircle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "~/components/ui/drawer";
import { api } from "~/trpc/react";
import { formatSlotRange } from "~/lib/utils";
import { useLanguage } from "~/lib/language-context";
import allTranslations from "~/lib/translations/all";

import {
  type SlotsConfigType,
  type DayOfWeek,
  type DayConfig,
} from "~/server/db/schema";

export function SlotManager() {
  const { language } = useLanguage();
  const strings = useMemo(() => allTranslations.admin[language], [language]);
  const [isOpen, setIsOpen] = useState(false);
  const [slotsConfig, setSlotsConfig] = useState<SlotsConfigType | null>(null);
  const [selectedDay, setSelectedDay] = useState<DayOfWeek | "default">(
    "default",
  );
  const [loading, setLoading] = useState(false);

  const { data: config } = api.admin.configGet.useQuery();
  const configUpdateMutation = api.admin.configUpdate.useMutation();
  const utils = api.useContext();

  const days: { label: string; value: DayOfWeek | "default" }[] = [
    { label: strings.default, value: "default" },
    { label: strings.monShort, value: "monday" },
    { label: strings.tueShort, value: "tuesday" },
    { label: strings.wedShort, value: "wednesday" },
    { label: strings.thuShort, value: "thursday" },
    { label: strings.friShort, value: "friday" },
    { label: strings.satShort, value: "saturday" },
    { label: strings.sunShort, value: "sunday" },
  ];

  const handleOpenDrawer = useCallback(() => {
    if (config?.slots) {
      const clonedSlots = JSON.parse(
        JSON.stringify(config.slots),
      ) as SlotsConfigType;
      setSlotsConfig(clonedSlots);
      setIsOpen(true);
    }
  }, [config]);

  const currentDayConfig = useMemo(() => {
    if (!slotsConfig) return null;
    if (selectedDay === "default") return slotsConfig.default;

    // If day override doesn't exist, we'll show a "Create Override" state or just the default
    return slotsConfig.weeklyOverrides?.[selectedDay] ?? null;
  }, [slotsConfig, selectedDay]);

  const handleToggleSlot = useCallback(
    (index: number) => {
      if (!slotsConfig) return;

      const newConfig = { ...slotsConfig };
      let targetConfig: DayConfig;

      if (selectedDay === "default") {
        targetConfig = { ...newConfig.default };
        newConfig.default = targetConfig;
      } else {
        if (!newConfig.weeklyOverrides) newConfig.weeklyOverrides = {};
        if (!newConfig.weeklyOverrides[selectedDay]) {
          // Initialize with default if it doesn't exist
          newConfig.weeklyOverrides[selectedDay] = JSON.parse(
            JSON.stringify(newConfig.default),
          );
        }
        targetConfig = { ...newConfig.weeklyOverrides[selectedDay]! };
        newConfig.weeklyOverrides[selectedDay] = targetConfig;
      }

      const updatedSlots = [...targetConfig.AvailableSlots];
      const currentStatus = updatedSlots[index]!.status;
      updatedSlots[index]!.status =
        currentStatus === "unavailable" ? "available" : "unavailable";

      targetConfig.AvailableSlots = updatedSlots;
      setSlotsConfig(newConfig);
    },
    [slotsConfig, selectedDay],
  );

  const handlePriceChange = useCallback(
    (
      index: number,
      field: "advanceAmount" | "fullAmount",
      rawValue: string,
    ) => {
      if (!slotsConfig) return;

      const parsed = parseFloat(rawValue);
      const amountInPaise = Number.isNaN(parsed)
        ? 0
        : Math.max(0, Math.round(parsed * 100));

      const newConfig = { ...slotsConfig };
      let targetConfig: DayConfig;

      if (selectedDay === "default") {
        targetConfig = { ...newConfig.default };
        newConfig.default = targetConfig;
      } else {
        if (!newConfig.weeklyOverrides) newConfig.weeklyOverrides = {};
        if (!newConfig.weeklyOverrides[selectedDay]) {
          newConfig.weeklyOverrides[selectedDay] = JSON.parse(
            JSON.stringify(newConfig.default),
          );
        }
        targetConfig = { ...newConfig.weeklyOverrides[selectedDay]! };
        newConfig.weeklyOverrides[selectedDay] = targetConfig;
      }

      const updatedSlots = [...targetConfig.AvailableSlots];
      updatedSlots[index] = {
        ...updatedSlots[index]!,
        [field]: amountInPaise,
      };

      targetConfig.AvailableSlots = updatedSlots;
      setSlotsConfig(newConfig);
    },
    [slotsConfig, selectedDay],
  );

  const handleCopyFromDefault = useCallback(() => {
    if (!slotsConfig || selectedDay === "default") return;

    const newConfig = { ...slotsConfig };
    if (!newConfig.weeklyOverrides) newConfig.weeklyOverrides = {};

    newConfig.weeklyOverrides[selectedDay] = JSON.parse(
      JSON.stringify(newConfig.default),
    );
    setSlotsConfig(newConfig);
    const dayLabel =
      days.find((d) => d.value === selectedDay)?.label ?? selectedDay;
    toast.success(strings.copiedDefaultTo.replace("{day}", dayLabel));
  }, [slotsConfig, selectedDay, strings, days]);

  const handleResetToDefault = useCallback(() => {
    if (!slotsConfig || selectedDay === "default") return;

    const newConfig = { ...slotsConfig };
    if (newConfig.weeklyOverrides) {
      delete newConfig.weeklyOverrides[selectedDay];
    }
    setSlotsConfig(newConfig);
    const dayLabel =
      days.find((d) => d.value === selectedDay)?.label ?? selectedDay;
    toast.success(strings.resetToDefaultSuccess.replace("{day}", dayLabel));
  }, [slotsConfig, selectedDay, strings, days]);

  const handleSaveSlots = useCallback(async () => {
    if (!slotsConfig) return;

    setLoading(true);
    try {
      await configUpdateMutation.mutateAsync({
        slots: slotsConfig as any,
      });
      await utils.admin.configGet.invalidate();
      toast.success(strings.slotsUpdated);
      setIsOpen(false);
    } catch (error) {
      toast.error(strings.slotsUpdateError);
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [slotsConfig, configUpdateMutation, strings]);

  return (
    <>
      <Card className="border-border/60 bg-card/60 rounded-3xl p-4">
        <div className="flex items-center gap-3">
          <Clock className="text-primary h-5 w-5" />
          <div className="flex-1">
            <p className="text-sm font-semibold">{strings.slotManagerTitle}</p>
            <p className="text-muted-foreground text-xs">
              {strings.slotManagerDesc}
            </p>
          </div>
          <Button
            className="rounded-2xl"
            variant="secondary"
            size="sm"
            onClick={handleOpenDrawer}
          >
            {strings.open}
          </Button>
        </div>
      </Card>

      <Drawer open={isOpen} onOpenChange={setIsOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{strings.slotManagerTitle}</DrawerTitle>
          </DrawerHeader>

          {/* Day Selector */}
          <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-4">
            {days.map((day) => (
              <button
                key={day.value}
                onClick={() => setSelectedDay(day.value)}
                className={`rounded-2xl px-4 py-2 text-xs font-semibold whitespace-nowrap transition ${
                  selectedDay === day.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {day.label}
                {day.value !== "default" &&
                  slotsConfig?.weeklyOverrides?.[day.value] && (
                    <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-current" />
                  )}
              </button>
            ))}
          </div>

          <div className="max-h-[50vh] space-y-3 overflow-y-auto px-4 pb-4">
            {selectedDay !== "default" && !currentDayConfig && (
              <div className="border-border/60 flex flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed py-12">
                <div className="space-y-1 text-center">
                  <p className="text-sm font-semibold">
                    {strings.noOverrideFor.replace(
                      "{day}",
                      days.find((d) => d.value === selectedDay)?.label ??
                        selectedDay,
                    )}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {strings.usesDefaultConfig}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-2xl"
                  onClick={handleCopyFromDefault}
                >
                  {strings.createOverride.replace(
                    "{day}",
                    days.find((d) => d.value === selectedDay)?.label ??
                      selectedDay,
                  )}
                </Button>
              </div>
            )}

            {currentDayConfig && (
              <>
                {selectedDay !== "default" && (
                  <div className="flex justify-end gap-2 pb-2">
                    <Button
                      variant="ghost"
                      size="xs"
                      className="h-7 rounded-xl text-[10px]"
                      onClick={handleResetToDefault}
                    >
                      {strings.resetToDefault}
                    </Button>
                  </div>
                )}

                {currentDayConfig.AvailableSlots.map((slot, index) => {
                  const isUnavailable = slot.status === "unavailable";
                  const statusLabel =
                    slot.status === "available"
                      ? strings.available
                      : strings.unavailable;

                  return (
                    <div
                      key={`${slot.from}-${slot.to}-${index}`}
                      className="border-border/60 bg-card/40 rounded-3xl border p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold">
                            {formatSlotRange(slot.from, slot.to)}
                          </p>
                          <p className="text-muted-foreground text-xs uppercase">
                            {statusLabel}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleToggleSlot(index)}
                          className={`rounded-2xl px-4 py-2 text-xs font-semibold transition ${
                            isUnavailable
                              ? "bg-muted text-muted-foreground"
                              : "bg-primary text-primary-foreground"
                          }`}
                        >
                          {isUnavailable
                            ? strings.markAvailable
                            : strings.markUnavailable}
                        </button>
                      </div>
                      <div className="grid gap-3 pt-3 sm:grid-cols-2">
                        <div className="space-y-1">
                          <p className="text-muted-foreground text-[11px] font-semibold uppercase">
                            {strings.advancePrice}
                          </p>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground text-sm">
                              ₹
                            </span>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={
                                (slot.advanceAmount ??
                                  (selectedDay === "default"
                                    ? 0
                                    : (slotsConfig?.default.advanceAmount ??
                                      0))) / 100
                              }
                              onChange={(event) =>
                                handlePriceChange(
                                  index,
                                  "advanceAmount",
                                  event.target.value,
                                )
                              }
                              className="flex-1 rounded-2xl"
                            />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-muted-foreground text-[11px] font-semibold uppercase">
                            {strings.fullPrice}
                          </p>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground text-sm">
                              ₹
                            </span>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={
                                (slot.fullAmount ??
                                  (selectedDay === "default"
                                    ? 0
                                    : (slotsConfig?.default.fullAmount ?? 0))) /
                                100
                              }
                              onChange={(event) =>
                                handlePriceChange(
                                  index,
                                  "fullAmount",
                                  event.target.value,
                                )
                              }
                              className="flex-1 rounded-2xl"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>

          <div className="flex gap-2 border-t px-4 py-4">
            <DrawerClose asChild>
              <Button variant="outline" className="flex-1 rounded-2xl">
                {strings.cancel}
              </Button>
            </DrawerClose>
            <Button
              onClick={handleSaveSlots}
              disabled={loading}
              className="flex-1 rounded-2xl"
            >
              {loading ? strings.saving : strings.save}
            </Button>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
