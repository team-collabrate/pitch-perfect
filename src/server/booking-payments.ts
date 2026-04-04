import { and, eq, inArray, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

import { db } from "~/server/db";
import { bookings, coupons, customers, timeSlots } from "~/server/db/schema";
import { sendBookingConfirmation } from "~/server/email";
import {
  createSlotFromConfig,
  validateSlotAgainstConfig,
} from "~/lib/slot-utils";

export type BookingType = "cricket" | "football" | "cricket&football";
export type PaymentOption = "advance" | "full";

export type BookingSlotInput = {
  date: string;
  from: string;
  to: string;
};

export type BookingReservationInput = {
  number: string;
  bookingType: BookingType;
  paymentType: PaymentOption;
  timeSlots: BookingSlotInput[];
  couponId?: string | null;
};

export type BookingPaymentOrder = {
  orderId: string;
  customerNumber: string;
  bookingType: BookingType;
  paymentType: PaymentOption;
  couponId?: string | null;
  totalAmount: number;
  discount: number;
  amountToPay: number;
  bookingIds: string[];
  bookings: Array<{
    id: string;
    phoneNumber: string;
    amountPaid: number;
    totalAmount: number;
    status: string;
    verificationCode: string;
    bookingType: BookingType;
    timeSlot: { date: string; from: string; to: string };
  }>;
};

const PENDING_STATUSES = ["advancePending", "fullPending"] as const;

const sanitizeAmount = (value: number) => Math.max(0, Math.round(value));

const allocateAmounts = (baseAmounts: number[], totalAmount: number) => {
  if (baseAmounts.length === 0) return [];

  const baseTotal = baseAmounts.reduce((sum, amount) => sum + amount, 0);
  if (baseTotal <= 0) {
    return baseAmounts.map(() => 0);
  }

  let allocated = 0;
  return baseAmounts.map((amount, index) => {
    if (index === baseAmounts.length - 1) {
      return sanitizeAmount(totalAmount - allocated);
    }

    const share = sanitizeAmount((totalAmount * amount) / baseTotal);
    allocated += share;
    return share;
  });
};

const getBookingSummary = async (orderId: string) => {
  return db
    .select({
      id: bookings.id,
      phoneNumber: bookings.phoneNumber,
      amountPaid: bookings.amountPaid,
      totalAmount: bookings.totalAmount,
      status: bookings.status,
      verificationCode: bookings.verificationCode,
      bookingType: bookings.bookingType,
      timeSlot: {
        date: timeSlots.date,
        from: timeSlots.from,
        to: timeSlots.to,
      },
    })
    .from(bookings)
    .innerJoin(timeSlots, eq(bookings.timeSlotId, timeSlots.id))
    .where(eq(bookings.paymentId, orderId));
};

const releasePaymentOrder = async (orderId: string) => {
  const existing = await db
    .select({
      id: bookings.id,
      timeSlotId: bookings.timeSlotId,
      status: bookings.status,
    })
    .from(bookings)
    .where(eq(bookings.paymentId, orderId));

  if (existing.length === 0) return;

  await db.transaction(async (tx) => {
    await tx
      .update(bookings)
      .set({ status: "paymentFailed", updatedAt: new Date() })
      .where(eq(bookings.paymentId, orderId));

    await tx
      .update(timeSlots)
      .set({ status: "available" })
      .where(
        inArray(
          timeSlots.id,
          existing.map((booking) => booking.timeSlotId),
        ),
      );
  });
};

export async function releaseExpiredPendingBookings() {
  const config = await db.query.configTable.findFirst();
  if (!config) return 0;

  const cutoff = new Date(Date.now() - config.bookingBufferMinutes * 60_000);

  const pending = await db
    .select({
      id: bookings.id,
      timeSlotId: bookings.timeSlotId,
      createdAt: bookings.createdAt,
    })
    .from(bookings)
    .where(
      and(
        inArray(bookings.status, [...PENDING_STATUSES]),
        sql`${bookings.createdAt} <= ${cutoff}`,
      ),
    );

  if (pending.length === 0) return 0;

  await db.transaction(async (tx) => {
    await tx
      .update(bookings)
      .set({ status: "paymentFailed", updatedAt: new Date() })
      .where(
        inArray(
          bookings.id,
          pending.map((booking) => booking.id),
        ),
      );

    await tx
      .update(timeSlots)
      .set({ status: "available" })
      .where(
        inArray(
          timeSlots.id,
          pending.map((booking) => booking.timeSlotId),
        ),
      );
  });

  return pending.length;
}

export async function calculateCouponDiscount(input: {
  couponId?: string | null;
  totalAmount: number;
  bookingCount: number;
}) {
  if (!input.couponId) {
    return { discount: 0, finalAmount: input.totalAmount };
  }

  const coupon = await db.query.coupons.findFirst({
    where: eq(coupons.id, input.couponId),
  });

  if (!coupon || !coupon.showCoupon || coupon.status !== "active") {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Coupon not found or inactive",
    });
  }

  const now = new Date();
  if (now < new Date(coupon.validFrom) || now > new Date(coupon.validTo)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Coupon expired or not yet valid",
    });
  }

  if (
    coupon.minimumBookingAmount > 0 &&
    input.totalAmount < coupon.minimumBookingAmount
  ) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Minimum booking amount ₹${coupon.minimumBookingAmount / 100} required`,
    });
  }

  if (
    coupon.firstNBookingsOnly > 0 &&
    coupon.numberOfUses >= coupon.firstNBookingsOnly
  ) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Coupon usage limit reached",
    });
  }

  if (
    coupon.nthPurchaseOnly > 0 &&
    input.bookingCount + 1 !== coupon.nthPurchaseOnly
  ) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `This coupon is valid only for booking #${coupon.nthPurchaseOnly}`,
    });
  }

  if (coupon.usageLimit > 0 && coupon.numberOfUses >= coupon.usageLimit) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Coupon usage limit reached",
    });
  }

  let discount = 0;
  if (coupon.flatDiscountAmount > 0) {
    discount = coupon.flatDiscountAmount;
    if (coupon.maxFlatDiscountAmount > 0) {
      discount = Math.min(discount, coupon.maxFlatDiscountAmount);
    }
  }

  const finalAmount = Math.max(0, input.totalAmount - discount);
  return { discount, finalAmount };
}

export async function createPaymentOrder(
  input: BookingReservationInput & {
    orderId: string;
    finalAmount: number;
    discount: number;
  },
) {
  const customer = await db.query.customers.findFirst({
    where: eq(customers.number, input.number),
  });

  if (!customer) {
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

  const normalizedSlots = input.timeSlots.map((slot) => ({
    ...slot,
    from: slot.from,
    to: slot.to,
  }));

  const result = await db.transaction(async (tx) => {
    const slotsToBook: Array<{
      slotId: number;
      date: string;
      from: string;
      to: string;
      fullAmount: number;
      advanceAmount: number;
    }> = [];

    for (const { date, from, to } of normalizedSlots) {
      if (!validateSlotAgainstConfig(date, from, to, config.slots)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Slot ${date} ${from}-${to} is not valid according to configuration`,
        });
      }

      const slotData = createSlotFromConfig(date, from, to, config.slots);

      const existingSlot = await tx.query.timeSlots.findFirst({
        where: and(
          eq(timeSlots.date, date),
          eq(timeSlots.from, from),
          eq(timeSlots.to, to),
        ),
      });

      if (existingSlot) {
        if (existingSlot.status !== "available") {
          throw new TRPCError({
            code: "CONFLICT",
            message: `Slot ${date} ${from}-${to} is already booked`,
          });
        }

        const [updatedSlot] = await tx
          .update(timeSlots)
          .set({ status: "bookingInProgress" })
          .where(
            and(
              eq(timeSlots.id, existingSlot.id),
              eq(timeSlots.status, "available"),
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
          fullAmount: updatedSlot.fullAmount ?? slotData.fullAmount ?? 0,
          advanceAmount:
            updatedSlot.advanceAmount ?? slotData.advanceAmount ?? 0,
        });
      } else {
        const [newSlot] = await tx
          .insert(timeSlots)
          .values({
            ...slotData,
            status: "bookingInProgress",
          })
          .onConflictDoUpdate({
            target: [timeSlots.date, timeSlots.from, timeSlots.to],
            set: { status: "bookingInProgress" },
            where: eq(timeSlots.status, "available"),
          })
          .returning();

        if (newSlot?.status !== "bookingInProgress") {
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
          fullAmount: newSlot.fullAmount ?? slotData.fullAmount ?? 0,
          advanceAmount: newSlot.advanceAmount ?? slotData.advanceAmount ?? 0,
        });
      }
    }

    const baseAmounts = slotsToBook.map((slot) =>
      input.paymentType === "full" ? slot.fullAmount : slot.advanceAmount,
    );
    const allocatedAmounts = allocateAmounts(baseAmounts, input.finalAmount);
    const verificationCode = Math.floor(1000 + Math.random() * 9000).toString();

    const bookingStatus: "advancePending" | "fullPending" =
      input.paymentType === "full" ? "fullPending" : "advancePending";

    const bookingRows = slotsToBook.map((slot, index) => ({
      phoneNumber: input.number,
      timeSlotId: slot.slotId,
      paymentId: input.orderId,
      amountPaid: allocatedAmounts[index] ?? 0,
      totalAmount: slot.fullAmount,
      verificationCode,
      bookingType: input.bookingType,
      couponId: input.couponId ?? undefined,
      status: bookingStatus,
    }));

    const inserted = await tx.insert(bookings).values(bookingRows).returning();

    return { inserted, verificationCode };
  });

  return {
    orderId: input.orderId,
    customerNumber: customer.number,
    bookingType: input.bookingType,
    paymentType: input.paymentType,
    couponId: input.couponId ?? null,
    totalAmount: input.finalAmount,
    discount: input.discount,
    amountToPay: input.finalAmount,
    bookingIds: result.inserted.map((row) => row.id),
    bookings: await getBookingSummary(input.orderId),
  } satisfies BookingPaymentOrder;
}

export async function failPaymentOrder(orderId: string) {
  await releasePaymentOrder(orderId);
}

export async function finalizePaymentOrder(input: {
  orderId: string;
  success: boolean;
  transactionId?: string;
  paymentStatus?: string;
}) {
  const existing = await db
    .select({
      id: bookings.id,
      phoneNumber: bookings.phoneNumber,
      paymentId: bookings.paymentId,
      status: bookings.status,
      amountPaid: bookings.amountPaid,
      totalAmount: bookings.totalAmount,
      bookingType: bookings.bookingType,
      couponId: bookings.couponId,
      timeSlotId: bookings.timeSlotId,
      verificationCode: bookings.verificationCode,
    })
    .from(bookings)
    .where(eq(bookings.paymentId, input.orderId));

  if (existing.length === 0) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Payment order not found",
    });
  }

  const alreadyFinal = existing.every((booking) =>
    ["advancePaid", "fullPaid", "paymentFailed"].includes(booking.status),
  );

  if (alreadyFinal) {
    return {
      orderId: input.orderId,
      success: existing.every((booking) => booking.status !== "paymentFailed"),
    };
  }

  if (!input.success) {
    await releasePaymentOrder(input.orderId);
    return { orderId: input.orderId, success: false };
  }

  await db.transaction(async (tx) => {
    await tx
      .update(bookings)
      .set({
        status:
          existing[0]?.status === "fullPending" ? "fullPaid" : "advancePaid",
        finalPaymentId: input.transactionId,
        updatedAt: new Date(),
      })
      .where(eq(bookings.paymentId, input.orderId));

    await tx
      .update(timeSlots)
      .set({ status: "booked" })
      .where(
        inArray(
          timeSlots.id,
          existing.map((booking) => booking.timeSlotId),
        ),
      );

    const couponId = existing[0]?.couponId;
    if (couponId) {
      await tx
        .update(coupons)
        .set({ numberOfUses: sql`${coupons.numberOfUses} + 1` })
        .where(eq(coupons.id, couponId));
    }
  });

  const customer = await db.query.customers.findFirst({
    where: eq(customers.number, existing[0]!.phoneNumber),
  });

  if (customer?.email) {
    const bookingSummary = await getBookingSummary(input.orderId);
    const firstBooking = bookingSummary[0];

    if (firstBooking) {
      await sendBookingConfirmation(customer.email, {
        customerName: customer.name ?? "Customer",
        bookingIds: bookingSummary.map((booking) => booking.id),
        timeSlots: bookingSummary.map((booking) => booking.timeSlot),
        bookingType: firstBooking.bookingType,
        totalAmount: firstBooking.totalAmount,
        amountPaid: bookingSummary.reduce(
          (sum, booking) => sum + booking.amountPaid,
          0,
        ),
        paymentStatus:
          firstBooking.status === "fullPaid"
            ? "Full Payment"
            : "Advance Payment",
        verificationCode: firstBooking.verificationCode,
      }).catch((error) =>
        console.error("Failed to send payment confirmation email:", error),
      );
    }
  }

  return { orderId: input.orderId, success: true };
}

export async function getPaymentOrder(orderId: string) {
  const rows = await getBookingSummary(orderId);

  if (rows.length === 0) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Payment order not found",
    });
  }

  const customer = await db.query.customers.findFirst({
    where: eq(customers.number, rows[0]!.phoneNumber),
  });

  return {
    orderId,
    phoneNumber: rows[0]!.phoneNumber,
    customer: {
      name: customer?.name ?? "Customer",
      number: customer?.number ?? rows[0]!.phoneNumber,
      email: customer?.email ?? "",
      alternateContactName: customer?.alternateContactName ?? "",
      alternateContactNumber: customer?.alternateContactNumber ?? "",
      language: customer?.languagePreference ?? "en",
    },
    bookingType: rows[0]!.bookingType,
    status: rows[0]!.status,
    verificationCode: rows[0]!.verificationCode,
    totalAmount: rows.reduce((sum, row) => sum + row.totalAmount, 0),
    amountPaid: rows.reduce((sum, row) => sum + row.amountPaid, 0),
    bookings: rows,
  };
}
