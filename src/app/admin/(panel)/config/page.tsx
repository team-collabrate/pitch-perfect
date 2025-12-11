"use client";

import { Settings2, Image as ImageIcon } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { toast } from "sonner";

import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";
import { SlotManager } from "./slot-manager";

export default function ConfigPage() {
  const { data: config, isLoading } = api.admin.configGet.useQuery();
  const configUpdateMutation = api.admin.configUpdate.useMutation();

  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [fullPaymentMode, setFullPaymentMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState("");
  const [bufferMinutes, setBufferMinutes] = useState(3);
  const [daysInAdvance, setDaysInAdvance] = useState(3);
  const [savingState, setSavingState] = useState<string | null>(null);

  useEffect(() => {
    if (config) {
      setMaintenanceMode(config.maintenanceMode ?? false);
      setFullPaymentMode(config.fullPaymentMode ?? false);
      setMaintenanceMessage(config.maintenanceMessage ?? "");
      setBufferMinutes(config.bookingBufferMinutes ?? 3);
      if (
        config.slots &&
        typeof config.slots === "object" &&
        "daysInAdvanceToCreateSlots" in config.slots
      ) {
        setDaysInAdvance(
          (config.slots as { daysInAdvanceToCreateSlots: number })
            .daysInAdvanceToCreateSlots,
        );
      }
    }
  }, [config]);

  const handleToggle = async (
    field: "maintenanceMode" | "fullPaymentMode",
    value: boolean,
  ) => {
    if (field === "maintenanceMode") {
      setMaintenanceMode(value);
    } else {
      setFullPaymentMode(value);
    }

    setSavingState(field);
    try {
      await configUpdateMutation.mutateAsync({
        [field]: value,
      });
      toast.success("Config updated successfully");
    } catch (error) {
      toast.error("Failed to update config");
      console.error(error);
      if (field === "maintenanceMode") {
        setMaintenanceMode(!value);
      } else {
        setFullPaymentMode(!value);
      }
    } finally {
      setSavingState(null);
    }
  };

  const handleMaintenanceMessageSave = async () => {
    setSavingState("maintenanceMessage");
    try {
      await configUpdateMutation.mutateAsync({
        maintenanceMessage,
      });
      toast.success("Maintenance message updated");
    } catch (error) {
      toast.error("Failed to update message");
      console.error(error);
    } finally {
      setSavingState(null);
    }
  };

  const handleBufferMinutesSave = async () => {
    setSavingState("bufferMinutes");
    try {
      await configUpdateMutation.mutateAsync({
        bookingBufferMinutes: bufferMinutes,
      });
      toast.success("Buffer time updated");
    } catch (error) {
      toast.error("Failed to update buffer time");
      console.error(error);
    } finally {
      setSavingState(null);
    }
  };

  const handleDaysInAdvanceSave = async () => {
    if (!config?.slots || typeof config.slots !== "object") return;

    setSavingState("daysInAdvance");
    try {
      await configUpdateMutation.mutateAsync({
        slots: {
          ...config.slots,
          daysInAdvanceToCreateSlots: daysInAdvance,
        },
      });
      toast.success("Days in advance updated");
    } catch (error) {
      toast.error("Failed to update days in advance");
      console.error(error);
    } finally {
      setSavingState(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Loading config...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      <header className="flex items-center gap-3">
        <Settings2 className="bg-muted h-10 w-10 rounded-2xl p-2" />
        <div>
          <p className="text-muted-foreground text-xs tracking-wide uppercase">
            System config
          </p>
          <h1 className="text-2xl font-semibold">Config</h1>
        </div>
      </header>

      <div className="flex flex-col gap-3">
        {/* Maintenance Mode Toggle */}
        <Card className="border-border/60 bg-card/60 flex flex-row items-center justify-between rounded-3xl px-4 py-3">
          <div>
            <p className="text-sm font-semibold">Maintenance mode</p>
            <p className="text-muted-foreground text-xs">
              Temporarily pause bookings
            </p>
          </div>
          <button
            type="button"
            aria-label="Toggle maintenance mode"
            onClick={() => handleToggle("maintenanceMode", !maintenanceMode)}
            disabled={savingState === "maintenanceMode"}
            className={cn(
              "flex h-8 w-14 items-center rounded-full px-1 transition",
              maintenanceMode ? "bg-primary" : "bg-muted",
            )}
          >
            <span
              className={cn(
                "bg-background h-6 w-6 rounded-full shadow transition",
                maintenanceMode ? "translate-x-6" : "translate-x-0",
              )}
            />
          </button>
        </Card>

        {/* Full Payment Mode Toggle */}
        <Card className="border-border/60 bg-card/60 flex flex-row items-center justify-between rounded-3xl px-4 py-3">
          <div>
            <p className="text-sm font-semibold">Full payment only</p>
            <p className="text-muted-foreground text-xs">Skip advance option</p>
          </div>
          <button
            type="button"
            aria-label="Toggle full payment mode"
            onClick={() => handleToggle("fullPaymentMode", !fullPaymentMode)}
            disabled={savingState === "fullPaymentMode"}
            className={cn(
              "flex h-8 w-14 items-center rounded-full px-1 transition",
              fullPaymentMode ? "bg-primary" : "bg-muted",
            )}
          >
            <span
              className={cn(
                "bg-background h-6 w-6 rounded-full shadow transition",
                fullPaymentMode ? "translate-x-6" : "translate-x-0",
              )}
            />
          </button>
        </Card>

        {/* Maintenance Message */}
        {maintenanceMode && (
          <Card className="border-border/60 bg-card/60 space-y-3 rounded-3xl p-4">
            <div>
              <p className="text-sm font-semibold">Maintenance message</p>
              <p className="text-muted-foreground text-xs">
                Message shown to users during maintenance
              </p>
            </div>
            <textarea
              value={maintenanceMessage}
              onChange={(e) =>
                setMaintenanceMessage(e.target.value.slice(0, 200))
              }
              maxLength={200}
              className="border-border bg-background w-full rounded-2xl border px-4 py-2 text-sm"
              placeholder="Enter maintenance message..."
              rows={3}
            />
            <div className="flex items-center justify-between gap-3">
              <p className="text-muted-foreground text-xs">
                {maintenanceMessage.length}/200
              </p>
              <Button
                size="sm"
                className="rounded-2xl"
                onClick={handleMaintenanceMessageSave}
                disabled={savingState === "maintenanceMessage"}
              >
                {savingState === "maintenanceMessage" ? "Saving..." : "Save"}
              </Button>
            </div>
          </Card>
        )}

        {/* Buffer Minutes */}
        <Card className="border-border/60 bg-card/60 space-y-3 rounded-3xl p-4">
          <div>
            <p className="text-sm font-semibold">Booking buffer time</p>
            <p className="text-muted-foreground text-xs">
              Minutes before payment deadline to open slot again
            </p>
          </div>
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <Input
                type="number"
                min="0"
                value={bufferMinutes}
                onChange={(e) =>
                  setBufferMinutes(Math.max(0, parseInt(e.target.value) || 0))
                }
                className="rounded-2xl"
                placeholder="Minutes"
              />
            </div>
            <Button
              size="sm"
              className="rounded-2xl"
              onClick={handleBufferMinutesSave}
              disabled={savingState === "bufferMinutes"}
            >
              {savingState === "bufferMinutes" ? "Saving..." : "Save"}
            </Button>
          </div>
        </Card>

        {/* Days in Advance */}
        <Card className="border-border/60 bg-card/60 space-y-3 rounded-3xl p-4">
          <div>
            <p className="text-sm font-semibold">Days in advance for slots</p>
            <p className="text-muted-foreground text-xs">
              Number of days in advance to create time slots
            </p>
          </div>
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <Input
                type="number"
                min="1"
                value={daysInAdvance}
                onChange={(e) =>
                  setDaysInAdvance(Math.max(1, parseInt(e.target.value) || 1))
                }
                className="rounded-2xl"
                placeholder="Days"
              />
            </div>
            <Button
              size="sm"
              className="rounded-2xl"
              onClick={handleDaysInAdvanceSave}
              disabled={savingState === "daysInAdvance"}
            >
              {savingState === "daysInAdvance" ? "Saving..." : "Save"}
            </Button>
          </div>
        </Card>
        <SlotManager />
        <Link href="/admin/config/gallery">
          <Card className="border-border/60 bg-card/60 gap-6 rounded-3xl p-4">
            <div className="flex items-center gap-3">
              <ImageIcon className="text-primary h-5 w-5" />
              <div className="flex-1">
                <p className="text-sm font-semibold">Manage Gallery</p>
                <p className="text-muted-foreground text-xs">
                  Edit gallery images and details
                </p>
              </div>
              <Button className="rounded-2xl" variant="secondary" size="sm">
                Open
              </Button>
            </div>
          </Card>
        </Link>

        <Link href="/admin/config/banner">
          <Card className="border-border/60 bg-card/60 rounded-3xl p-4">
            <div className="flex items-center gap-3">
              <ImageIcon className="text-primary h-5 w-5" />
              <div className="flex-1">
                <p className="text-sm font-semibold">Manage Banner</p>
                <p className="text-muted-foreground text-xs">
                  Edit banner images and details
                </p>
              </div>
              <Button className="rounded-2xl" variant="secondary" size="sm">
                Open
              </Button>
            </div>
          </Card>
        </Link>
      </div>
    </div>
  );
}
