"use client";

import { useState, useCallback } from "react";
import { Clock, AlertCircle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "~/components/ui/drawer";
import { api } from "~/trpc/react";
import { formatSlotRange } from "~/lib/utils";

interface Slot {
  from: string;
  to: string;
  status: "available" | "booked" | "unavailable" | "bookingInProgress";
}

interface SlotsConfig {
  AvailableSlots: Slot[];
  avoidSlots: { from: string; to: string; date: string }[];
  daysInAdvanceToCreateSlots: number;
}

export function SlotManager() {
  const [isOpen, setIsOpen] = useState(false);
  const [slotsConfig, setSlotsConfig] = useState<SlotsConfig | null>(null);
  const [loading, setLoading] = useState(false);

  const { data: config } = api.admin.configGet.useQuery();
  const configUpdateMutation = api.admin.configUpdate.useMutation();

  const handleOpenDrawer = useCallback(() => {
    if (config?.slots) {
      setSlotsConfig(config.slots as SlotsConfig);
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

  const handleSaveSlots = useCallback(async () => {
    if (!slotsConfig) return;

    setLoading(true);
    try {
      await configUpdateMutation.mutateAsync({
        slots: slotsConfig,
      });
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
            <p className="text-sm font-semibold">Manage Slots</p>
            <p className="text-muted-foreground text-xs">
              Toggle time slots on and off
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
            <DrawerTitle>Manage Time Slots</DrawerTitle>
          </DrawerHeader>

          <div className="max-h-[60vh] overflow-y-auto px-4 pb-4">
            {slotsConfig?.AvailableSlots &&
            slotsConfig.AvailableSlots.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {slotsConfig.AvailableSlots.map((slot, index) => (
                  <button
                    key={`${slot.from}-${slot.to}`}
                    onClick={() => handleToggleSlot(index)}
                    className={`rounded-2xl px-4 py-3 text-sm font-medium transition ${
                      slot.status === "unavailable"
                        ? "bg-muted text-muted-foreground line-through"
                        : "bg-primary text-primary-foreground hover:opacity-90"
                    }`}
                  >
                    {formatSlotRange(slot.from, slot.to)}
                  </button>
                ))}
              </div>
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
