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

interface Slot {
  from: string;
  to: string;
  status: "available" | "booked" | "unavailable" | "bookingInProgress";
  advanceAmount?: number;
  fullAmount?: number;
}

interface SlotsConfig {
  AvailableSlots: Slot[];
  avoidSlots: { from: string; to: string; date: string }[];
  daysInAdvanceToCreateSlots: number;
}

export function SlotManager() {
  const { language } = useLanguage();
  const strings = useMemo(() => allTranslations.admin[language], [language]);
  const [isOpen, setIsOpen] = useState(false);
  const [slotsConfig, setSlotsConfig] = useState<SlotsConfig | null>(null);
  const [loading, setLoading] = useState(false);

  const { data: config } = api.admin.configGet.useQuery();
  const configUpdateMutation = api.admin.configUpdate.useMutation();
  const utils = api.useContext();

  const handleOpenDrawer = useCallback(() => {
    if (config?.slots) {
      const clonedSlots = JSON.parse(
        JSON.stringify(config.slots),
      ) as SlotsConfig;
      setSlotsConfig(clonedSlots);
      setIsOpen(true);
    }
  }, [config]);

  const handleToggleSlot = useCallback(
    (index: number) => {
      if (!slotsConfig) return;

      const updatedSlots = [...slotsConfig.AvailableSlots];
      const currentStatus = updatedSlots[index]!.status;
      updatedSlots[index]!.status =
        currentStatus === "unavailable" ? "available" : "unavailable";

      setSlotsConfig({
        ...slotsConfig,
        AvailableSlots: updatedSlots,
      });
    },
    [slotsConfig],
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

      const updatedSlots = [...slotsConfig.AvailableSlots];
      updatedSlots[index] = {
        ...updatedSlots[index]!,
        [field]: amountInPaise,
      };

      setSlotsConfig({
        ...slotsConfig,
        AvailableSlots: updatedSlots,
      });
    },
    [slotsConfig],
  );

  const handleSaveSlots = useCallback(async () => {
    if (!slotsConfig) return;

    setLoading(true);
    try {
      await configUpdateMutation.mutateAsync({
        slots: slotsConfig,
      });
      await utils.admin.configGet.invalidate();
      toast.success("Slots updated successfully");
      setIsOpen(false);
    } catch (error) {
      toast.error("Failed to update slots");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [slotsConfig, configUpdateMutation]);

  return (
    <>
      <Card className="border-border/60 bg-card/60 rounded-3xl p-4">
        <div className="flex items-center gap-3">
          <Clock className="text-primary h-5 w-5" />
          <div className="flex-1">
            <p className="text-sm font-semibold">{strings.slotManagerTitle}</p>
            <p className="text-muted-foreground text-xs">
              Toggle slot availability and edit advance/full pricing
            </p>
          </div>
          <Button
            className="rounded-2xl"
            variant="secondary"
            size="sm"
            onClick={handleOpenDrawer}
          >
            Open
          </Button>
        </div>
      </Card>

      <Drawer open={isOpen} onOpenChange={setIsOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{strings.slotManagerTitle}</DrawerTitle>
          </DrawerHeader>

          <div className="max-h-[60vh] space-y-3 overflow-y-auto px-4 pb-4">
            {slotsConfig?.AvailableSlots &&
            slotsConfig.AvailableSlots.length > 0 ? (
              slotsConfig.AvailableSlots.map((slot, index) => {
                const isUnavailable = slot.status === "unavailable";
                const statusLabel =
                  slot.status === "bookingInProgress"
                    ? "Booking in progress"
                    : slot.status === "booked"
                      ? "Booked"
                      : isUnavailable
                        ? "Unavailable"
                        : "Available";

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
                        {isUnavailable ? "Mark available" : "Mark unavailable"}
                      </button>
                    </div>
                    <div className="grid gap-3 pt-3 sm:grid-cols-2">
                      <div className="space-y-1">
                        <p className="text-muted-foreground text-[11px] font-semibold uppercase">
                          Advance price
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground text-sm">
                            ₹
                          </span>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={(slot.advanceAmount ?? 0) / 100}
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
                          Full price
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground text-sm">
                            ₹
                          </span>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={(slot.fullAmount ?? 0) / 100}
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
              })
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 py-8">
                <AlertCircle className="text-muted-foreground h-6 w-6" />
                <p className="text-muted-foreground text-sm">
                  No slots available
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-2 border-t px-4 py-4">
            <DrawerClose asChild>
              <Button variant="outline" className="flex-1 rounded-2xl">
                Cancel
              </Button>
            </DrawerClose>
            <Button
              onClick={handleSaveSlots}
              disabled={loading}
              className="flex-1 rounded-2xl"
            >
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
