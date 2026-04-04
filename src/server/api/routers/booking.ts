import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { db } from "~/server/db";
import { bookings, timeSlots, customers, coupons } from "~/server/db/schema";
import { eq, and, inArray, desc, count as countFn, sql } from "drizzle-orm";
import { sendBookingConfirmation } from "~/server/email";
import { TRPCError } from "@trpc/server";
import {
  createSlotFromConfig,
  validateSlotAgainstConfig,
  isPastTime,
} from "~/lib/slot-utils";
import {
  calculateCouponDiscount,
  createPaymentOrder,
  getPaymentOrder as fetchPaymentOrder,
  failPaymentOrder,
} from "~/server/booking-payments";
import { createPaytmTransaction } from "~/server/paytm";
import { env } from "~/env";
import { randomUUID } from "crypto";

export const bookingRouter = createTRPCRouter({
  // Book slots using phone number and time ranges
  book: publicProcedure
    .input(
      z.object({
        number: z.string().min(1, "Phone number is required"),
        timeSlots: z
          .array(
            z.object({
              date: z
                .string()
                .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
              from: z
                .string()
                .regex(/^\d{2}:\d{2}:\d{2}$/, "Time must be HH:MM:SS"),
              to: z
                .string()
                .regex(/^\d{2}:\d{2}:\d{2}$/, "Time must be HH:MM:SS"),
            }),
          )
          .min(1, "At least one time slot is required"),
        paymentType: z.enum(["full", "advance"], {
          required_error: "Payment type is required",
        }),
        bookingType: z
          .enum(["cricket", "football", "cricket&football"])
          .default("cricket"),
        couponId: z.string().uuid().optional(), // Optional coupon ID
      }),
    )
    .mutation(async ({ input }) => {
      // Step 1: Check if customer exists
      const customer = await db
        .select()
        .from(customers)
        .where(eq(customers.number, input.number));

      if (!customer[0]) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Customer not found. Please register first.",
        });
      }

      // Step 2: Fetch config
      const config = await db.query.configTable.findFirst();
      if (!config?.slots) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Slot configuration not found",
        });
      }

      // Step 3: Process slots in a transaction
      return await db.transaction(async (tx) => {
        const slotsToBook: Array<{
          slotId: number;
          date: string;
          from: string;
          to: string;
          fullAmount: number;
          advanceAmount: number;
        }> = [];

        for (const { date, from, to } of input.timeSlots) {
          // Validate against config
          const isValid = validateSlotAgainstConfig(
            date,
            from,
            to,
            config.slots,
          );
          if (!isValid) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `Slot ${date} ${from}-${to} is not valid according to configuration`,
            });
          }

          // Check if slot exists in DB
          const dbSlot = await tx.query.timeSlots.findFirst({
            where: and(
              eq(timeSlots.date, date),
              eq(timeSlots.from, from),
              eq(timeSlots.to, to),
            ),
          });

          if (dbSlot) {
            // Slot exists - validate it's available
            if (dbSlot.status !== "available") {
              throw new TRPCError({
                code: "CONFLICT",
                message: `Slot ${date} ${from}-${to} is already booked`,
              });
            }

            // Update status to booked
            const [updatedSlot] = await tx
              .update(timeSlots)
              .set({ status: "booked" })
              .where(
                and(
                  eq(timeSlots.id, dbSlot.id),
                  eq(timeSlots.status, "available"), // Double check availability
                ),
              )
              .returning();

            if (!updatedSlot) {
              throw new TRPCError({
                code: "CONFLICT",
                message: `Slot ${date} ${from}-${to} was just booked by someone else`,
              });
            }

            slotsToBook.push({
              slotId: updatedSlot.id,
              date,
              from,
              to,
              fullAmount: updatedSlot.fullAmount ?? 0,
              advanceAmount: updatedSlot.advanceAmount ?? 0,
            });
          } else {
            // Slot doesn't exist - create from config
            const slotData = createSlotFromConfig(date, from, to, config.slots);

            const [newSlot] = await tx
              .insert(timeSlots)
              .values({
                ...slotData,
                status: "booked",
              })
              .onConflictDoUpdate({
                target: [timeSlots.date, timeSlots.from, timeSlots.to],
                set: { status: "booked" },
                where: eq(timeSlots.status, "available"),
              })
              .returning();

            if (newSlot?.status !== "booked") {
              throw new TRPCError({
                code: "CONFLICT",
                message: `Slot ${date} ${from}-${to} was just booked by someone else`,
              });
            }

            slotsToBook.push({
              slotId: newSlot.id,
              date,
              from,
              to,
              fullAmount: slotData.fullAmount,
              advanceAmount: slotData.advanceAmount,
            });
          }
        }

        // Generate 4-digit verification code
        const verificationCode = Math.floor(
          1000 + Math.random() * 9000,
        ).toString();

        // Create bookings
        const bookingInserts = slotsToBook.map((slot) => {
          const totalAmount = slot.fullAmount;
          const amountPaid =
            input.paymentType === "full" ? slot.fullAmount : slot.advanceAmount;
          const status: "advancePaid" | "fullPaid" =
            input.paymentType === "full" ? "fullPaid" : "advancePaid";

          return {
            phoneNumber: input.number,
            timeSlotId: slot.slotId,
            totalAmount,
            amountPaid,
            status,
            verificationCode,
            bookingType: input.bookingType,
            couponId: input.couponId,
          };
        });

        const result = await tx
          .insert(bookings)
          .values(bookingInserts)
          .returning();

        // Increment coupon usage count if a coupon was used
        if (input.couponId) {
          await tx
            .update(coupons)
            .set({
              numberOfUses: sql`${coupons.numberOfUses} + 1`,
            })
            .where(eq(coupons.id, input.couponId));
        }

        // Return bookings with time slot info
        const bookingsWithSlots = await tx
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
          .innerJoin(timeSlots, eq(bookings.timeSlotId, timeSlots.id))
          .where(
            inArray(
              bookings.id,
              result.map((b) => b.id),
            ),
          );

        // Send confirmation email if customer has an email (async, don't block transaction)
        const primaryCustomer = customer[0];
        if (primaryCustomer?.email) {
          const firstBooking = bookingsWithSlots[0];
          if (firstBooking) {
            sendBookingConfirmation(primaryCustomer.email, {
              customerName: primaryCustomer.name ?? "Customer",
              bookingIds: result.map((b) => b.id.toString()),
              timeSlots: bookingsWithSlots.map((b) => ({
                date: b.timeSlot?.date ?? "",
                from: b.timeSlot?.from ?? "",
                to: b.timeSlot?.to ?? "",
              })),
              bookingType: input.bookingType,
              totalAmount: firstBooking.totalAmount,
              amountPaid: firstBooking.amountPaid,
              paymentStatus:
                input.paymentType === "full"
                  ? "Full Payment"
                  : "Advance Payment",
              verificationCode: verificationCode,
            }).catch((err) => console.error("Failed to send email:", err));
          }
        }

        return bookingsWithSlots;
      });
    }),

  // Initiate a Paytm payment and reserve the selected slots
  initiatePayment: publicProcedure
    .input(
      z.object({
        number: z.string().min(1, "Phone number is required"),
        timeSlots: z
          .array(
            z.object({
              date: z
                .string()
                .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
              from: z
                .string()
                .regex(/^\d{2}:\d{2}:\d{2}$/, "Time must be HH:MM:SS"),
              to: z
                .string()
                .regex(/^\d{2}:\d{2}:\d{2}$/, "Time must be HH:MM:SS"),
            }),
          )
          .min(1, "At least one time slot is required"),
        paymentType: z.enum(["full", "advance"], {
          required_error: "Payment type is required",
        }),
        bookingType: z
          .enum(["cricket", "football", "cricket&football"])
          .default("cricket"),
        couponId: z.string().uuid().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const customer = await db
        .select()
        .from(customers)
        .where(eq(customers.number, input.number));

      if (!customer[0]) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Customer not found. Please register first.",
        });
      }

      const config = await db.query.configTable.findFirst();
      if (!config?.slots) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Slot configuration not found",
        });
      }

      if (config.fullPaymentMode && input.paymentType !== "full") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Only full payment is allowed right now",
        });
      }

      let totalBaseAmount = 0;
      for (const { date, from, to } of input.timeSlots) {
        if (!validateSlotAgainstConfig(date, from, to, config.slots)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Slot ${date} ${from}-${to} is not valid according to configuration`,
          });
        }

        if (isPastTime(date, from)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Slot ${date} ${from}-${to} is in the past`,
          });
        }

        const slotData = createSlotFromConfig(date, from, to, config.slots);
        totalBaseAmount +=
          input.paymentType === "full"
            ? slotData.fullAmount
            : slotData.advanceAmount;
      }

      const bookingCount = await db
        .select({ count: countFn(bookings.id) })
        .from(bookings)
        .where(eq(bookings.phoneNumber, input.number));

      const discountData = await calculateCouponDiscount({
        couponId: input.couponId,
        totalAmount: totalBaseAmount,
        bookingCount: bookingCount[0]?.count ?? 0,
      });

      const orderId = `PAYTM_${randomUUID().replace(/-/g, "").slice(0, 18).toUpperCase()}`;
      const reservation = await createPaymentOrder({
        ...input,
        orderId,
        finalAmount: discountData.finalAmount,
        discount: discountData.discount,
      });

      let payment;
      try {
        payment = await createPaytmTransaction({
          orderId,
          amountPaise: discountData.finalAmount,
          customerId: input.number,
          callbackUrl: env.PAYTM_CALLBACK_URL,
        });
      } catch (error) {
        await failPaymentOrder(orderId).catch(() => undefined);
        throw error;
      }

      return {
        ...reservation,
        ...payment,
        discount: discountData.discount,
        amountToPay: discountData.finalAmount,
      };
    }),

  // Fetch payment details after callback so the UI can show a confirmation
  getPaymentOrder: publicProcedure
    .input(
      z.object({
        orderId: z.string().min(1),
      }),
    )
    .query(async ({ input }) => fetchPaymentOrder(input.orderId)),

  // Get bookings by phone number
  getByNumber: publicProcedure
    .input(
      z.object({
        number: z.string().min(1, "Phone number is required"),
      }),
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
        newSlot: z.object({
          date: z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
          from: z
            .string()
            .regex(/^\d{2}:\d{2}:\d{2}$/, "Time must be HH:mm:ss"),
          to: z.string().regex(/^\d{2}:\d{2}:\d{2}$/, "Time must be HH:mm:ss"),
        }),
      }),
    )
    .mutation(async ({ input }) => {
      // Step 1: Check if booking exists and belongs to the phone number
      const booking = await db.query.bookings.findFirst({
        where: and(
          eq(bookings.id, input.bookingId),
          eq(bookings.phoneNumber, input.phoneNumber),
        ),
      });

      if (!booking) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Booking not found or does not belong to this phone number",
        });
      }

      // Step 2: Validate new slot is not in the past
      if (isPastTime(input.newSlot.date, input.newSlot.from)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot reschedule to a past time",
        });
      }

      // Step 3: Fetch config for validation and pricing
      const config = await db.query.configTable.findFirst();
      if (!config?.slots) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Slot configuration not found",
        });
      }

      // Step 4: Validate against config
      const isValid = validateSlotAgainstConfig(
        input.newSlot.date,
        input.newSlot.from,
        input.newSlot.to,
        config.slots,
      );

      if (!isValid) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Selected time slot is not valid according to configuration",
        });
      }

      // Step 5: Check if the new time slot is already booked in DB
      const existingSlot = await db.query.timeSlots.findFirst({
        where: and(
          eq(timeSlots.date, input.newSlot.date),
          eq(timeSlots.from, input.newSlot.from),
          eq(timeSlots.to, input.newSlot.to),
        ),
      });

      if (existingSlot && existingSlot.status !== "available") {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Selected time slot is already booked or unavailable",
        });
      }

      // Step 6: Create or update the new slot in DB
      const slotToUse = createSlotFromConfig(
        input.newSlot.date,
        input.newSlot.from,
        input.newSlot.to,
        config.slots,
      );

      const [upsertedSlot] = await db
        .insert(timeSlots)
        .values({
          ...slotToUse,
          status: "booked",
        })
        .onConflictDoUpdate({
          target: [timeSlots.date, timeSlots.from, timeSlots.to],
          set: { status: "booked" },
        })
        .returning();

      if (!upsertedSlot) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create or update time slot",
        });
      }

      // Step 7: Update the booking to the new time slot
      const oldTimeSlotId = booking.timeSlotId;
      await db
        .update(bookings)
        .set({
          timeSlotId: upsertedSlot.id,
          updatedAt: new Date(),
        })
        .where(eq(bookings.id, input.bookingId));

      // Step 8: Mark old slot as available
      if (oldTimeSlotId) {
        await db
          .update(timeSlots)
          .set({ status: "available" })
          .where(eq(timeSlots.id, oldTimeSlotId));
      }

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

  // Validate coupon code for booking
  validateCoupon: publicProcedure
    .input(
      z.object({
        couponCode: z.string().min(1, "Coupon code is required"),
        bookingCount: z.number().int().min(0).default(0), // Customer's current booking count
        totalAmount: z.number().int().min(1), // Amount in paise
      }),
    )
    .query(async ({ input }) => {
      // Find coupon by code
      const coupon = await db
        .select()
        .from(coupons)
        .where(
          and(
            eq(coupons.code, input.couponCode.toUpperCase()),
            eq(coupons.showCoupon, true),
            eq(coupons.status, "active"),
          ),
        );

      if (!coupon[0]) {
        return {
          isValid: false,
          message: "Coupon not found or inactive",
          discount: 0,
          finalAmount: input.totalAmount,
        };
      }

      const couponData = coupon[0];
      const now = new Date();
      const validFrom = new Date(couponData.validFrom);
      const validTo = new Date(couponData.validTo);

      // Check validity dates
      if (now < validFrom || now > validTo) {
        return {
          isValid: false,
          message: "Coupon expired or not yet valid",
          discount: 0,
          finalAmount: input.totalAmount,
        };
      }

      // Check minimum booking amount
      if (
        couponData.minimumBookingAmount > 0 &&
        input.totalAmount < couponData.minimumBookingAmount
      ) {
        return {
          isValid: false,
          message: `Minimum booking amount ₹${couponData.minimumBookingAmount / 100} required`,
          discount: 0,
          finalAmount: input.totalAmount,
        };
      }

      // Check first N bookings only
      if (
        couponData.firstNBookingsOnly > 0 &&
        couponData.numberOfUses >= couponData.firstNBookingsOnly
      ) {
        return {
          isValid: false,
          message: `Coupon usage limit reached`,
          discount: 0,
          finalAmount: input.totalAmount,
        };
      }

      // Check Nth purchase only
      if (
        couponData.nthPurchaseOnly > 0 &&
        input.bookingCount + 1 !== couponData.nthPurchaseOnly
      ) {
        return {
          isValid: false,
          message: `This coupon is valid only for booking #${couponData.nthPurchaseOnly}`,
          discount: 0,
          finalAmount: input.totalAmount,
        };
      }

      // Check usage limit
      if (
        couponData.usageLimit > 0 &&
        couponData.numberOfUses >= couponData.usageLimit
      ) {
        return {
          isValid: false,
          message: "Coupon usage limit reached",
          discount: 0,
          finalAmount: input.totalAmount,
        };
      }

      // Calculate discount
      let discount = 0;
      if (couponData.flatDiscountAmount > 0) {
        discount = couponData.flatDiscountAmount;
        if (couponData.maxFlatDiscountAmount > 0) {
          discount = Math.min(discount, couponData.maxFlatDiscountAmount);
        }
      }

      const finalAmount = Math.max(0, input.totalAmount - discount);

      return {
        isValid: true,
        couponId: couponData.id,
        message: `Coupon applied! You save ₹${discount / 100}`,
        discount,
        finalAmount,
      };
    }),

  // Get active coupons with eligibility check
  getActiveCoupons: publicProcedure
    .input(
      z.object({
        phoneNumber: z.string().min(1, "Phone number is required"),
        totalAmount: z.number().int().min(1), // Amount in paise
      }),
    )
    .query(async ({ input }) => {
      // Get customer's booking count
      const customerBookingsResult = await db
        .select({ count: countFn(bookings.id) })
        .from(bookings)
        .where(eq(bookings.phoneNumber, input.phoneNumber));

      const customerBookingCount = customerBookingsResult[0]?.count ?? 0;

      // Get all active, visible coupons
      const activeCoupons = await db
        .select()
        .from(coupons)
        .where(and(eq(coupons.showCoupon, true), eq(coupons.status, "active")));

      const now = new Date();

      // Filter and check eligibility for each coupon
      const couponsList = await Promise.all(
        activeCoupons.map(async (coupon) => {
          const validFrom = new Date(coupon.validFrom);
          const validTo = new Date(coupon.validTo);
          const isDateValid = now >= validFrom && now <= validTo;

          // Check minimum booking amount
          const isMinAmountMet =
            coupon.minimumBookingAmount === 0 ||
            input.totalAmount >= coupon.minimumBookingAmount;

          // Check first N bookings limit
          const isFirstNBookingsValid =
            coupon.firstNBookingsOnly === 0 ||
            coupon.numberOfUses < coupon.firstNBookingsOnly;

          // Check Nth purchase only
          const isNthPurchaseValid =
            coupon.nthPurchaseOnly === 0 ||
            customerBookingCount + 1 === coupon.nthPurchaseOnly;

          // Check usage limit
          const isUsageLimitValid =
            coupon.usageLimit === 0 || coupon.numberOfUses < coupon.usageLimit;

          // Calculate discount
          let discount = 0;
          if (coupon.flatDiscountAmount > 0) {
            discount = coupon.flatDiscountAmount;
            if (coupon.maxFlatDiscountAmount > 0) {
              discount = Math.min(discount, coupon.maxFlatDiscountAmount);
            }
          }

          const isEligible =
            isDateValid &&
            isMinAmountMet &&
            isFirstNBookingsValid &&
            isNthPurchaseValid &&
            isUsageLimitValid;

          return {
            id: coupon.id,
            code: coupon.code,
            description: coupon.description,
            discount,
            isEligible,
            reason: !isDateValid
              ? "Coupon expired or not yet valid"
              : !isMinAmountMet
                ? `Minimum ₹${coupon.minimumBookingAmount / 100} required`
                : !isFirstNBookingsValid
                  ? "Usage limit reached"
                  : !isNthPurchaseValid
                    ? `Valid only for booking #${coupon.nthPurchaseOnly}`
                    : !isUsageLimitValid
                      ? "Coupon usage limit reached"
                      : null,
          };
        }),
      );

      // Sort: eligible first, then by discount (highest first)
      return couponsList.sort((a, b) => {
        if (a.isEligible !== b.isEligible) return a.isEligible ? -1 : 1;
        return b.discount - a.discount;
      });
    }),
});
