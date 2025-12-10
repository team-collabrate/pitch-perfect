import { z } from "zod";

import {
    createTRPCRouter,
    publicProcedure,
} from "~/server/api/trpc";
import { db } from "~/server/db";
import { bookings, timeSlots, customers } from "~/server/db/schema";
import { eq, and, inArray, desc } from "drizzle-orm";
import { sendBookingConfirmation } from "~/server/email";

export const bookingRouter = createTRPCRouter({
    // Book slots using phone number and time slot IDs
    book: publicProcedure
        .input(
            z.object({
                number: z.string().min(1, "Phone number is required"),
                timeSlotIds: z.array(z.number()).min(1, "At least one time slot is required"),
                paymentType: z.enum(["full", "advance"], {
                    required_error: "Payment type is required",
                }),
                bookingType: z.enum(["cricket", "football", "cricket&football"]).default("cricket"),
            })
        )
        .mutation(async ({ input }) => {
            // Check if customer exists
            const customer = await db
                .select()
                .from(customers)
                .where(eq(customers.number, input.number));

            if (!customer[0]) {
                throw new Error("Customer not found. Please register your details first.");
            }

            // Check if all time slots are available
            const slots = await db
                .select()
                .from(timeSlots)
                .where(
                    and(
                        inArray(timeSlots.id, input.timeSlotIds),
                        eq(timeSlots.status, "available")
                    )
                );

            if (slots.length !== input.timeSlotIds.length) {
                console.log("Some time slots are not available", {
                    requested: input.timeSlotIds,
                    available: slots.map(slot => slot.id),
                });
                throw new Error("Some time slots are not available");
            }

            // Determine amounts based on payment type
            const totalAmount = 80000; // ₹800 in paise
            const amountPaid = input.paymentType === "full" ? 80000 : 10000; // Full: ₹800, Advance: ₹100
            const status: "advancePaid" | "fullPaid" = input.paymentType === "full" ? "fullPaid" : "advancePaid";

            // Generate 4-digit verification code
            const verificationCode = Math.floor(1000 + Math.random() * 9000).toString();

            // Create bookings
            const bookingInserts = input.timeSlotIds.map(timeSlotId => ({
                phoneNumber: input.number,
                timeSlotId,
                totalAmount,
                amountPaid,
                status,
                verificationCode,
                bookingType: input.bookingType,
            }));

            const result = await db
                .insert(bookings)
                .values(bookingInserts)
                .returning();

            // Update time slots to booked
            await db
                .update(timeSlots)
                .set({ status: "booked" })
                .where(inArray(timeSlots.id, input.timeSlotIds));

            // Return bookings with time slot info
            const bookingsWithSlots = await db
                .select({
                    id: bookings.id,
                    phoneNumber: bookings.phoneNumber,
                    timeSlotId: bookings.timeSlotId,
                    status: bookings.status,
                    amountPaid: bookings.amountPaid,
                    totalAmount: bookings.totalAmount,
                    verificationCode: bookings.verificationCode,
                    bookingType: bookings.bookingType,
                    createdAt: bookings.createdAt,
                    timeSlot: {
                        id: timeSlots.id,
                        from: timeSlots.from,
                        to: timeSlots.to,
                        date: timeSlots.date,
                    },
                })
                .from(bookings)
                .leftJoin(timeSlots, eq(bookings.timeSlotId, timeSlots.id))
                .where(inArray(bookings.id, result.map(b => b.id)));

            // Send confirmation email if customer has an email
            if (customer[0].email) {
                try {
                    await sendBookingConfirmation(customer[0].email, {
                        customerName: customer[0].name ?? "Customer",
                        bookingIds: result.map(b => b.id.toString()),
                        timeSlots: bookingsWithSlots.map(b => ({
                            date: b.timeSlot?.date ?? "",
                            from: b.timeSlot?.from ?? "",
                            to: b.timeSlot?.to ?? "",
                        })),
                        bookingType: input.bookingType,
                        totalAmount: totalAmount,
                        amountPaid: amountPaid,
                        paymentStatus: input.paymentType === "full" ? "Full Payment" : "Advance Payment",
                        verificationCode: verificationCode,
                    });
                } catch (emailError) {
                    // Log email error but don't fail the booking
                    console.error("Failed to send booking confirmation email:", emailError);
                }
            }

            return bookingsWithSlots;
        }),

    // Get bookings by phone number
    getByNumber: publicProcedure
        .input(
            z.object({
                number: z.string().min(1, "Phone number is required"),
            })
        )
        .query(async ({ input }) => {
            const result = await db
                .select({
                    id: bookings.id,
                    phoneNumber: bookings.phoneNumber,
                    timeSlotId: bookings.timeSlotId,
                    status: bookings.status,
                    amountPaid: bookings.amountPaid,
                    totalAmount: bookings.totalAmount,
                    verificationCode: bookings.verificationCode,
                    bookingType: bookings.bookingType,
                    createdAt: bookings.createdAt,
                    updatedAt: bookings.updatedAt,
                    timeSlot: {
                        id: timeSlots.id,
                        from: timeSlots.from,
                        to: timeSlots.to,
                        date: timeSlots.date,
                        status: timeSlots.status,
                    },
                })
                .from(bookings)
                .leftJoin(timeSlots, eq(bookings.timeSlotId, timeSlots.id))
                .where(eq(bookings.phoneNumber, input.number))
                .orderBy(desc(bookings.createdAt));

            return result;
        }),

    // Reschedule a booking to a new time slot
    reschedule: publicProcedure
        .input(
            z.object({
                bookingId: z.string().uuid("Invalid booking ID"),
                phoneNumber: z.string().min(1, "Phone number is required"),
                newTimeSlotId: z.number().int().positive("Invalid time slot ID"),
            })
        )
        .mutation(async ({ input }) => {
            // Check if booking exists and belongs to the phone number
            const booking = await db
                .select()
                .from(bookings)
                .where(
                    and(
                        eq(bookings.id, input.bookingId),
                        eq(bookings.phoneNumber, input.phoneNumber)
                    )
                );

            if (!booking[0]) {
                throw new Error("Booking not found or does not belong to this phone number");
            }

            // Check if the new time slot is available
            const newSlot = await db
                .select()
                .from(timeSlots)
                .where(
                    and(
                        eq(timeSlots.id, input.newTimeSlotId),
                        eq(timeSlots.status, "available")
                    )
                );

            if (!newSlot[0]) {
                throw new Error("Selected time slot is not available");
            }

            // Get the old time slot ID
            const oldTimeSlotId = booking[0].timeSlotId;

            // Update the booking to the new time slot
            await db
                .update(bookings)
                .set({
                    timeSlotId: input.newTimeSlotId,
                    updatedAt: new Date(),
                })
                .where(eq(bookings.id, input.bookingId));

            // Mark old slot as available
            await db
                .update(timeSlots)
                .set({ status: "available" })
                .where(eq(timeSlots.id, oldTimeSlotId));

            // Mark new slot as booked
            await db
                .update(timeSlots)
                .set({ status: "booked" })
                .where(eq(timeSlots.id, input.newTimeSlotId));

            // Return the updated booking with time slot info
            const updatedBooking = await db
                .select({
                    id: bookings.id,
                    phoneNumber: bookings.phoneNumber,
                    timeSlotId: bookings.timeSlotId,
                    status: bookings.status,
                    amountPaid: bookings.amountPaid,
                    totalAmount: bookings.totalAmount,
                    verificationCode: bookings.verificationCode,
                    bookingType: bookings.bookingType,
                    createdAt: bookings.createdAt,
                    updatedAt: bookings.updatedAt,
                    timeSlot: {
                        id: timeSlots.id,
                        from: timeSlots.from,
                        to: timeSlots.to,
                        date: timeSlots.date,
                        status: timeSlots.status,
                    },
                })
                .from(bookings)
                .leftJoin(timeSlots, eq(bookings.timeSlotId, timeSlots.id))
                .where(eq(bookings.id, input.bookingId));

            return updatedBooking[0];
        }),
});