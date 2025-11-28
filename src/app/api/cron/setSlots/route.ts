import { db } from "~/server/db";
import { timeSlots } from "~/server/db/schema";
import { eq } from "drizzle-orm";

/**
 * Creates 24 one-hour time slots for 3 days in advance
 * Each day has slots from 00:00 to 23:00
 */
export async function GET() {
    try {
        const now = new Date();
        const slots = [];

        // Generate slots for 3 days starting from tomorrow
        for (let dayOffset = 1; dayOffset <= 3; dayOffset++) {
            const slotDate = new Date(now);
            slotDate.setDate(slotDate.getDate() + dayOffset);

            // Format date as YYYY-MM-DD
            const dateString = slotDate.toISOString().split("T")[0] ?? "";

            // Generate 24 hourly slots for this day
            for (let hour = 0; hour < 24; hour++) {
                const from = `${String(hour).padStart(2, "0")}:00:00`;
                const to = `${String(hour + 1).padStart(2, "0")}:00:00`;

                slots.push({
                    from,
                    to,
                    date: dateString,
                    status: "available" as const,
                });
            }
        }

        // Insert slots into database
        // Note: Using ON CONFLICT to handle duplicate unique constraints gracefully
        await db.insert(timeSlots).values(slots).onConflictDoNothing();

        return Response.json(
            {
                success: true,
                message: `Created ${slots.length} time slots for the next 3 days`,
                slotsCreated: slots.length,
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
