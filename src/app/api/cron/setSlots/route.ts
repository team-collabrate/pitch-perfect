import { db } from "~/server/db";
import { timeSlots, configTable, type SlotsConfigType } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/dist/server/web/spec-extension/response";
import { env } from "~/env";
import type { NextRequest } from "next/dist/server/web/spec-extension/request";

/**
 * Creates time slots based on config settings
 * Uses available slots from config and filters out avoid slots
 */
export async function GET(req: NextRequest) {

    // Verify authorization
    const authHeader = req.headers.get('Authorization');

    if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
        return NextResponse.json(
            { error: 'Unauthorized' },
            { status: 401 }
        );
    }

    try {
        const now = new Date();

        // Fetch config from database
        const config = await db.query.configTable.findFirst();

        if (!config) {
            return Response.json(
                {
                    success: false,
                    error: "Config not found",
                },
                { status: 404 }
            );
        }

        const slots: typeof timeSlots.$inferInsert[] = [];
        const slotsConfig = config.slots;
        const availableSlots = slotsConfig.AvailableSlots ?? [];
        const avoidSlots = slotsConfig.avoidSlots ?? [];
        const daysInAdvance = slotsConfig.daysInAdvanceToCreateSlots ?? 3;

        // Get today's date in YYYY-MM-DD format
        const todayString = now.toISOString().split("T")[0] ?? "";

        // Filter out avoid slots for today or before today
        const filteredAvoidSlots = avoidSlots.filter(
            (slot) => new Date(slot.date) > new Date(todayString)
        );

        // Update config with cleaned avoid slots if any were removed
        if (filteredAvoidSlots.length < avoidSlots.length) {
            const updatedSlotsConfig = {
                ...slotsConfig,
                avoidSlots: filteredAvoidSlots,
            };

            await db
                .update(configTable)
                .set({ slots: updatedSlotsConfig })
                .where(eq(configTable.id, config.id));
        }

        // Generate slots for configured number of days starting from tomorrow
        for (let dayOffset = 1; dayOffset <= daysInAdvance; dayOffset++) {
            const slotDate = new Date(now);
            slotDate.setDate(slotDate.getDate() + dayOffset);

            // Format date as YYYY-MM-DD
            const dateString = slotDate.toISOString().split("T")[0] ?? "";

            // Get avoid slots for this date
            const dateAvoidSlots = avoidSlots.filter(
                (slot) => slot.date === dateString
            );

            // Generate slots from available slots config
            for (const availableSlot of availableSlots) {
                // Skip if this slot is in avoid slots for this date
                const isAvoided = dateAvoidSlots.some(
                    (avoidSlot) =>
                        avoidSlot.from === availableSlot.from &&
                        avoidSlot.to === availableSlot.to
                );

                if (!isAvoided) {
                    slots.push({
                        from: availableSlot.from,
                        to: availableSlot.to,
                        date: dateString,
                        status: "available" as const,
                    });
                }
            }
        }



        // Insert slots into database
        // Note: Using ON CONFLICT to handle duplicate unique constraints gracefully
        if (slots.length > 0) {
            await db.insert(timeSlots).values(slots).onConflictDoNothing();
        }

        return Response.json(
            {
                success: true,
                message: `Created ${slots.length} time slots for the next ${daysInAdvance} days`,
                slotsCreated: slots.length
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error creating time slots:", error);
        return Response.json(
            {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}
