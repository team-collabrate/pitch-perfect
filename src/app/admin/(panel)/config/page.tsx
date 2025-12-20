"use client";

import {
  Settings2,
  Image as ImageIcon,
  Clock,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";

import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "~/components/ui/dialog";
import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";
import { SlotManager } from "./slot-manager";
import { useLanguage } from "~/lib/language-context";
import allTranslations from "~/lib/translations/all";

export default function ConfigPage() {
  const { data: config, isLoading } = api.admin.configGet.useQuery();
  const configUpdateMutation = api.admin.configUpdate.useMutation();

  const { language } = useLanguage();
  const strings = useMemo(() => allTranslations.admin[language], [language]);

  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [fullPaymentMode, setFullPaymentMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState("");
  const [bufferMinutes, setBufferMinutes] = useState(3);
  const [daysInAdvance, setDaysInAdvance] = useState(3);
  const [daysToBook, setDaysToBook] = useState(3);
  const [savingState, setSavingState] = useState<string | null>(null);
  const [maintenanceWarningOpen, setMaintenanceWarningOpen] = useState(false);
  const [pendingMaintenanceValue, setPendingMaintenanceValue] = useState(false);

  useEffect(() => {
    if (config) {
      setMaintenanceMode(config.maintenanceMode ?? false);
      setFullPaymentMode(config.fullPaymentMode ?? false);
      setMaintenanceMessage(config.maintenanceMessage ?? "");
      setBufferMinutes(config.bookingBufferMinutes ?? 3);
      if (config.slots && typeof config.slots === "object") {
        const slots = config.slots as any;
        if ("daysInAdvanceToCreateSlots" in slots) {
          setDaysInAdvance(slots.daysInAdvanceToCreateSlots);
        }
        if ("daysInAdvanceToCouldBook" in slots) {
          setDaysToBook(slots.daysInAdvanceToCouldBook);
        }
      }
    }
  }, [config]);

  const handleToggle = async (
    field: "maintenanceMode" | "fullPaymentMode",
    value: boolean,
  ) => {
    // Show warning dialog when turning ON maintenance mode
    if (field === "maintenanceMode" && value === true) {
      setPendingMaintenanceValue(value);
      setMaintenanceWarningOpen(true);
      return;
    }

    // Proceed with toggle for other cases
    performToggle(field, value);
  };

  const performToggle = async (
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
      toast.success(strings.configUpdated);
    } catch (error) {
      toast.error(strings.configUpdateError);
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

  const handleConfirmMaintenance = () => {
    setMaintenanceWarningOpen(false);
    performToggle("maintenanceMode", pendingMaintenanceValue);
  };

  const handleMaintenanceMessageSave = async () => {
    setSavingState("maintenanceMessage");
    try {
      await configUpdateMutation.mutateAsync({
        maintenanceMessage,
      });
      toast.success(strings.maintenanceMessageUpdated);
    } catch (error) {
      toast.error(strings.maintenanceMessageError);
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
      toast.success(strings.bufferTimeUpdated);
    } catch (error) {
      toast.error(strings.bufferTimeError);
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
      toast.success(strings.daysInAdvanceUpdated);
    } catch (error) {
      toast.error(strings.daysInAdvanceError);
      console.error(error);
    } finally {
      setSavingState(null);
    }
  };

  const handleDaysToBookSave = async () => {
    if (!config?.slots || typeof config.slots !== "object") return;

    setSavingState("daysToBook");
    try {
      await configUpdateMutation.mutateAsync({
        slots: {
          ...config.slots,
          daysInAdvanceToCouldBook: daysToBook,
        },
      });
      toast.success(strings.bookingWindowUpdated);
    } catch (error) {
      toast.error(strings.bookingWindowError);
      console.error(error);
    } finally {
      setSavingState(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">{strings.loadingConfig}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      <header className="flex items-center gap-3">
        <Settings2 className="bg-muted h-10 w-10 rounded-2xl p-2" />
        <div>
          <p className="text-muted-foreground text-xs tracking-wide uppercase">
            {strings.configTitle}
          </p>
          <h1 className="text-2xl font-semibold">{strings.configTitle}</h1>
        </div>
      </header>

      <div className="flex flex-col gap-3">
        {/* Daily Slot Overrides */}
        <Link href="/admin/config/slots">
          <Card className="border-border/60 bg-card/60 hover:bg-card/80 flex flex-row items-center justify-between rounded-3xl px-4 py-3 transition-colors">
            <div className="flex items-center gap-3">
              <Clock className="text-primary h-5 w-5" />
              <div>
                <p className="text-sm font-semibold">
                  {strings.dailySlotOverrides}
                </p>
                <p className="text-muted-foreground text-xs">
                  {strings.dailySlotOverridesDesc}
                </p>
              </div>
            </div>
            <ChevronRight className="text-muted-foreground h-5 w-5" />
          </Card>
        </Link>

        {/* Maintenance Mode Toggle */}
        <Card className="border-border/60 bg-card/60 flex flex-row items-center justify-between rounded-3xl px-4 py-3">
          <div>
            <p className="text-sm font-semibold">{strings.maintenanceMode}</p>
            <p className="text-muted-foreground text-xs">
              {strings.maintenanceModeDesc}
            </p>
          </div>
          <button
            type="button"
            aria-label={strings.toggleMaintenance}
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
            <p className="text-sm font-semibold">{strings.fullPaymentOnly}</p>
            <p className="text-muted-foreground text-xs">
              {strings.fullPaymentOnlyDesc}
            </p>
          </div>
          <button
            type="button"
            aria-label={strings.toggleFullPayment}
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
              <p className="text-sm font-semibold">
                {strings.maintenanceMessage}
              </p>
              <p className="text-muted-foreground text-xs">
                {strings.maintenanceMessageDesc}
              </p>
            </div>
            <textarea
              value={maintenanceMessage}
              onChange={(e) =>
                setMaintenanceMessage(e.target.value.slice(0, 200))
              }
              maxLength={200}
              className="border-border bg-background w-full rounded-2xl border px-4 py-2 text-sm"
              placeholder={strings.maintenanceMessagePlaceholder}
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
                {savingState === "maintenanceMessage"
                  ? strings.saving
                  : strings.save}
              </Button>
            </div>
          </Card>
        )}

        {/* Buffer Minutes */}
        <Card className="border-border/60 bg-card/60 space-y-3 rounded-3xl p-4">
          <div>
            <p className="text-sm font-semibold">{strings.bookingBufferTime}</p>
            <p className="text-muted-foreground text-xs">
              {strings.bookingBufferTimeDesc}
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
                placeholder={strings.minutes}
              />
            </div>
            <Button
              size="sm"
              className="rounded-2xl"
              onClick={handleBufferMinutesSave}
              disabled={savingState === "bufferMinutes"}
            >
              {savingState === "bufferMinutes" ? strings.saving : strings.save}
            </Button>
          </div>
        </Card>

        {/* Days to Book */}
        <Card className="border-border/60 bg-card/60 space-y-3 rounded-3xl p-4">
          <div>
            <p className="text-sm font-semibold">{strings.bookingWindow}</p>
            <p className="text-muted-foreground text-xs">
              {strings.bookingWindowDesc}
            </p>
          </div>
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <Input
                type="number"
                min="1"
                value={daysToBook}
                onChange={(e) =>
                  setDaysToBook(Math.max(1, parseInt(e.target.value) || 1))
                }
                className="rounded-2xl"
                placeholder={strings.days}
              />
            </div>
            <Button
              size="sm"
              className="rounded-2xl"
              onClick={handleDaysToBookSave}
              disabled={savingState === "daysToBook"}
            >
              {savingState === "daysToBook" ? strings.saving : strings.save}
            </Button>
          </div>
        </Card>

        {/* Days in Advance */}
        <Card className="border-border/60 bg-card/60 space-y-3 rounded-3xl p-4">
          <div>
            <p className="text-sm font-semibold">
              {strings.daysInAdvanceSlots}
            </p>
            <p className="text-muted-foreground text-xs">
              {strings.daysInAdvanceSlotsDesc}
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
                placeholder={strings.days}
              />
            </div>
            <Button
              size="sm"
              className="rounded-2xl"
              onClick={handleDaysInAdvanceSave}
              disabled={savingState === "daysInAdvance"}
            >
              {savingState === "daysInAdvance" ? strings.saving : strings.save}
            </Button>
          </div>
        </Card>
        <SlotManager />
        <Link href="/admin/config/gallery">
          <Card className="border-border/60 bg-card/60 gap-6 rounded-3xl p-4">
            <div className="flex items-center gap-3">
              <ImageIcon className="text-primary h-5 w-5" />
              <div className="flex-1">
                <p className="text-sm font-semibold">{strings.galleryTitle}</p>
                <p className="text-muted-foreground text-xs">
                  {strings.editGalleryDesc}
                </p>
              </div>
              <Button className="rounded-2xl" variant="secondary" size="sm">
                {strings.open}
              </Button>
            </div>
          </Card>
        </Link>

        <Link href="/admin/config/banner">
          <Card className="border-border/60 bg-card/60 rounded-3xl p-4">
            <div className="flex items-center gap-3">
              <ImageIcon className="text-primary h-5 w-5" />
              <div className="flex-1">
                <p className="text-sm font-semibold">{strings.bannerTitle}</p>
                <p className="text-muted-foreground text-xs">
                  {strings.editBannerDesc}
                </p>
              </div>
              <Button className="rounded-2xl" variant="secondary" size="sm">
                {strings.open}
              </Button>
            </div>
          </Card>
        </Link>
      </div>

      {/* Maintenance Mode Warning Dialog */}
      <Dialog
        open={maintenanceWarningOpen}
        onOpenChange={setMaintenanceWarningOpen}
      >
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle>{strings.enableMaintenanceTitle}</DialogTitle>
            <DialogDescription>
              {strings.enableMaintenanceDesc}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4">
            {maintenanceMessage && (
              <>
                <p className="text-sm font-semibold">{strings.usersWillSee}</p>
                <p className="bg-muted rounded-lg p-3 text-sm">
                  {maintenanceMessage}
                </p>
              </>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setMaintenanceWarningOpen(false)}
              className="rounded-2xl"
            >
              {strings.cancel}
            </Button>
            <Button onClick={handleConfirmMaintenance} className="rounded-2xl">
              {strings.enableMaintenanceCTA}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
