import { type SlotsConfigType, type DayOfWeek } from "~/server/db/schema";

/**
 * Get day of week from ISO date string
 */
export function getDayOfWeek(date: string): DayOfWeek {
  const dayMap: Record<number, DayOfWeek> = {
    0: "sunday",
    1: "monday",
    2: "tuesday",
    3: "wednesday",
    4: "thursday",
    5: "friday",
    6: "saturday",
  };
  const dayIndex = new Date(date).getDay();
  return dayMap[dayIndex]!;
}

/**
 * Generate virtual slots from config for specific dates
 */
export function generateVirtualSlots(
  dates: string[],
  config: SlotsConfigType,
) {
  const virtualSlots = [];

  if (!config) return [];

  for (const date of dates) {
    const dayOfWeek = getDayOfWeek(date);

    // Get day-specific config or fall back to default
    // Also handle potential old format where AvailableSlots is at top level
    const dayConfig =
      config.weeklyOverrides?.[dayOfWeek] ??
      config.default ??
      ((config as any).AvailableSlots ? config : null);

    if (!dayConfig?.AvailableSlots) {
      continue;
    }

    const availableSlots = dayConfig.AvailableSlots;

    for (const slot of availableSlots) {
      // Three-level pricing hierarchy: slot > day > default
      const fullAmount =
        slot.fullAmount ??
        dayConfig.fullAmount ??
        config.default?.fullAmount ??
        800_00;

      const advanceAmount =
        slot.advanceAmount ??
        dayConfig.advanceAmount ??
        config.default?.advanceAmount ??
        100_00;

      virtualSlots.push({
        date,
        from: slot.from,
        to: slot.to,
        status: slot.status,
        fullAmount,
        advanceAmount,
        isVirtual: true,
      });
    }
  }

  return virtualSlots;
}

/**
 * Filter out slots that fall in avoidSlots date ranges
 */
export function filterAvoidSlots<
  T extends { date: string; from: string; to: string },
>(slots: T[], avoidSlots: Array<{ date: string; from: string; to: string }>): T[] {
  return slots.filter((slot) => {
    return !avoidSlots.some(
      (avoid) =>
        avoid.date === slot.date &&
        avoid.from === slot.from &&
        avoid.to === slot.to,
    );
  });
}

/**
 * Merge DB slots with virtual slots (DB takes priority)
 */
export function mergeWithActualSlots<
  T extends { date: string; from: string; to: string },
>(virtualSlots: T[], dbSlots: T[]): T[] {
  const merged = [...dbSlots];
  const dbSlotKeys = new Set(
    dbSlots.map((s) => `${s.date}-${s.from}-${s.to}`),
  );

  for (const vSlot of virtualSlots) {
    const key = `${vSlot.date}-${vSlot.from}-${vSlot.to}`;
    if (!dbSlotKeys.has(key)) {
      merged.push(vSlot);
    }
  }

  return merged;
}

/**
 * Check if time is in the past for today's date
 */
export function isPastTime(date: string, time: string): boolean {
  const now = new Date();
  const slotDateTime = new Date(`${date}T${time}`);
  return slotDateTime < now;
}

/**
 * Validate slot against config availability
 */
export function validateSlotAgainstConfig(
  date: string,
  from: string,
  to: string,
  config: SlotsConfigType,
): boolean {
  const dayOfWeek = getDayOfWeek(date);
  const dayConfig =
    config.weeklyOverrides?.[dayOfWeek] ??
    config.default ??
    ((config as any).AvailableSlots ? config : null);

  if (!dayConfig?.AvailableSlots) return false;

  return dayConfig.AvailableSlots.some(
    (slot) =>
      slot.from === from && slot.to === to && slot.status === "available",
  );
}

/**
 * Create slot data from config template
 */
export function createSlotFromConfig(
  date: string,
  from: string,
  to: string,
  config: SlotsConfigType,
) {
  const dayOfWeek = getDayOfWeek(date);
  const dayConfig =
    config.weeklyOverrides?.[dayOfWeek] ??
    config.default ??
    ((config as any).AvailableSlots ? config : null);

  if (!dayConfig?.AvailableSlots) {
    throw new Error(`No configuration found for ${date}`);
  }

  const templateSlot = dayConfig.AvailableSlots.find(
    (slot) => slot.from === from && slot.to === to,
  );

  if (!templateSlot) {
    throw new Error("Slot not found in config");
  }

  // Three-level pricing: slot > day > default
  return {
    date,
    from,
    to,
    status: "available" as const,
    fullAmount:
      templateSlot.fullAmount ??
      dayConfig.fullAmount ??
      config.default?.fullAmount ??
      800_00,
    advanceAmount:
      templateSlot.advanceAmount ??
      dayConfig.advanceAmount ??
      config.default?.advanceAmount ??
      100_00,
  };
}

/**
 * Validate booking is within advance limit
 */
export function validateAdvanceBookingLimit(
  date: string,
  daysInAdvance: number,
): boolean {
  const bookingDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffTime = bookingDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays <= daysInAdvance && diffDays >= 0;
}
