import { z } from "zod";

import {
  createTRPCRouter,
  publicProcedure,
  managerProcedure,
} from "~/server/api/trpc";
import { db } from "~/server/db";
import { timeSlots } from "~/server/db/schema";
import { eq, and, gte, gt, or, inArray } from "drizzle-orm";
import {
  generateVirtualSlots,
  filterAvoidSlots,
  mergeWithActualSlots,
  isPastTime,
} from "~/lib/slot-utils";

export const timeSlotRouter = createTRPCRouter({
  // 1. Get all available slots across all dates (current and forward)
  // Returns up to `limit` slots ordered by date and time
  getAllAvailable: publicProcedure
    .input(
      z.object({
        days: z.number().min(1).max(31).default(7),
        date: z
          .string()
          .optional()
          .default(() => new Date().toISOString().split("T")[0]!),
      }),
    )
    .query(async ({ input }) => {
      // Step 1: Fetch config
      const config = await db.query.configTable.findFirst();
      if (!config?.slots) {
        throw new Error("Slot configuration not found");
      }

      // Step 2: Generate dates for the next N days
      const dates: string[] = [];
      const startDate = new Date(input.date);
      for (let i = 0; i < input.days; i++) {
        const d = new Date(startDate);
        d.setDate(startDate.getDate() + i);
        dates.push(d.toISOString().split("T")[0]!);
      }

      // Step 3: Generate virtual slots for all dates
      let virtualSlots = generateVirtualSlots(dates, config.slots);

      // Step 4: Filter by avoidSlots
      if (config.slots.avoidSlots && config.slots.avoidSlots.length > 0) {
        virtualSlots = filterAvoidSlots(virtualSlots, config.slots.avoidSlots);
      }

      // Step 5: Query DB for actual slots in this range
      const dbSlots = await db.query.timeSlots.findMany({
        where: and(
          gte(timeSlots.date, dates[0]!),
          inArray(timeSlots.date, dates),
        ),
        orderBy: (timeSlot, { asc }) => [
          asc(timeSlot.date),
          asc(timeSlot.from),
        ],
      });

      // Step 6: Merge virtual + actual
      const mergedSlots = mergeWithActualSlots(
        virtualSlots as any[],
        dbSlots as any[],
      );

      // Step 7: Filter out past times and only return available ones
      const now = new Date();
      const today = now.toISOString().split("T")[0]!;
      const currentTime = now.toTimeString().split(" ")[0]!;

      return mergedSlots.filter((slot) => {
        if (slot.status !== "available") return false;
        if (slot.date < today) return false;
        if (slot.date === today && slot.from <= currentTime) return false;
        return true;
      });
    }),

  // 2. Get all slots for a specific date (current and forward times only)
  // Returns slots grouped by date with only future/current times
  getAllByDate: publicProcedure
    .input(
      z.object({
        date: z.string().default(() => new Date().toISOString().split("T")[0]!), // Default to today (YYYY-MM-DD format)
      }),
    )
    .query(async ({ input }) => {
      // Step 1: Fetch config
      const config = await db.query.configTable.findFirst();
      if (!config?.slots) {
        throw new Error("Slot configuration not found");
      }

      // Step 2: Generate virtual slots from config
      let virtualSlots = generateVirtualSlots([input.date], config.slots);

      // Step 3: Filter by avoidSlots
      if (config.slots.avoidSlots && config.slots.avoidSlots.length > 0) {
        virtualSlots = filterAvoidSlots(virtualSlots, config.slots.avoidSlots);
      }

      // Step 4: Query DB for actual slots
      const dbSlots = await db.query.timeSlots.findMany({
        where: eq(timeSlots.date, input.date),
        orderBy: (timeSlot, { asc }) => [asc(timeSlot.from)],
      });

      // Step 5: Merge virtual + actual (DB takes priority)
      const mergedSlots = mergeWithActualSlots(
        virtualSlots as any[],
        dbSlots as any[],
      );

      // Step 6: Filter out past times if querying current date
      const now = new Date();
      const today = now.toISOString().split("T")[0]!;

      const filteredSlots = mergedSlots.filter((slot) => {
        if (slot.date === today) {
          return !isPastTime(slot.date, slot.from);
        }
        return true;
      });

      return filteredSlots;
    }),

  getSlotConfig: publicProcedure.query(async () => {
    const config = await db.query.configTable.findFirst();
    return config?.slots;
  }),

  upsert: managerProcedure
    .input(
      z.object({
        date: z.string(),
        from: z.string(),
        to: z.string(),
        status: z.enum([
          "available",
          "booked",
          "unavailable",
          "bookingInProgress",
        ]),
        fullAmount: z.number().optional(),
        advanceAmount: z.number().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db
        .insert(timeSlots)
        .values({
          ...input,
          updatedBy: ctx.manager.id,
        })
        .onConflictDoUpdate({
          target: [timeSlots.from, timeSlots.to, timeSlots.date],
          set: {
            status: input.status,
            fullAmount: input.fullAmount,
            advanceAmount: input.advanceAmount,
            updatedBy: ctx.manager.id,
          },
        });
    }),

  deleteOverride: managerProcedure
    .input(
      z.object({
        date: z.string(),
        from: z.string(),
        to: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db
        .delete(timeSlots)
        .where(
          and(
            eq(timeSlots.date, input.date),
            eq(timeSlots.from, input.from),
            eq(timeSlots.to, input.to),
          ),
        );
    }),
});
