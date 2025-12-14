import { TRPCError } from "@trpc/server";
import { count, desc, eq, sum, sql, asc, and, or, gte } from "drizzle-orm";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { db } from "~/server/db";
import {
    bookings,
    configTable,
    coupons,
    customers,
    managers,
    timeSlots,
    user,
    account,
    session,
} from "~/server/db/schema";
import { generatePassword } from "~/lib/password-generator";
import { sendAdminInvitationEmail } from "~/server/email";
import { auth } from "~/server/better-auth";

const managerProcedure = protectedProcedure.use(async ({ ctx, next }) => {
    const manager = await db.query.managers.findFirst({
        where: eq(managers.authId, ctx.session.user.id),
    });

    if (!manager || manager.role === "staff") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Manager access required" });
    }

    return next({
        ctx: {
            ...ctx,
            manager,
        },
    });
});

const superAdminProcedure = managerProcedure.use(({ ctx, next }) => {
    if (ctx.manager.role !== "superAdmin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Super admin only" });
    }

    return next();
});

export const adminRouter = createTRPCRouter({
    bookingsList: managerProcedure
        .input(
            z.object({
                limit: z.number().int().min(1).max(50).default(20),
                date: z.string().optional(), // YYYY-MM-DD format
                time: z.string().optional(), // HH:mm format (e.g., "14:30")
            }),
        )
        .query(async ({ input }) => {
            const { limit, date: inputDate, time: inputTime } = input;

            // Get server time if not provided
            const now = new Date();
            const currentDate = inputDate ?? now.toISOString().split('T')[0]!;
            const currentTime = inputTime ?? `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

            // Calculate time with 60-minute buffer (subtract 60 minutes)
            const [hours, minutes] = currentTime.split(':').map(Number);
            const totalMinutes = (hours ?? 0) * 60 + (minutes ?? 0);
            const bufferedMinutes = Math.max(0, totalMinutes - 60);
            const bufferedHours = Math.floor(bufferedMinutes / 60);
            const bufferedMins = bufferedMinutes % 60;
            const bufferedTime = `${String(bufferedHours).padStart(2, '0')}:${String(bufferedMins).padStart(2, '0')}`;

            // Calculate next day
            const currentDateObj = new Date(currentDate);
            currentDateObj.setDate(currentDateObj.getDate() + 1);
            const nextDateStr = currentDateObj.toISOString().split('T')[0]!;

            // Build WHERE conditions
            const conditions = [
                or(
                    // Current day bookings after buffered time
                    and(
                        eq(timeSlots.date, currentDate),
                        gte(timeSlots.from, bufferedTime)
                    ),
                    // All next day bookings
                    eq(timeSlots.date, nextDateStr)
                )
            ];

            const records = await db
                .select({
                    id: bookings.id,
                    phoneNumber: bookings.phoneNumber,
                    name: customers.name,
                    amountPaid: bookings.amountPaid,
                    status: bookings.status,
                    verificationCode: bookings.verificationCode,
                    createdAt: bookings.createdAt,
                    slot: {
                        from: timeSlots.from,
                        to: timeSlots.to,
                        date: timeSlots.date,
                    },
                })
                .from(bookings)
                .leftJoin(timeSlots, eq(bookings.timeSlotId, timeSlots.id))
                .leftJoin(customers, eq(bookings.phoneNumber, customers.number))
                .where(and(...conditions))
                .orderBy(asc(timeSlots.date), asc(timeSlots.from))
                .limit(limit);

            return records;
        }),

    bookingDetails: managerProcedure
        .input(z.object({ bookingId: z.string().uuid() }))
        .query(async ({ input }) => {
            const [record] = await db
                .select({
                    id: bookings.id,
                    phoneNumber: bookings.phoneNumber,
                    name: customers.name,
                    email: customers.email,
                    alternateContactName: customers.alternateContactName,
                    alternateContactNumber: customers.alternateContactNumber,
                    amountPaid: bookings.amountPaid,
                    totalAmount: bookings.totalAmount,
                    status: bookings.status,
                    verificationCode: bookings.verificationCode,
                    bookingType: bookings.bookingType,
                    createdAt: bookings.createdAt,
                    slot: {
                        from: timeSlots.from,
                        to: timeSlots.to,
                        date: timeSlots.date,
                    },
                })
                .from(bookings)
                .leftJoin(timeSlots, eq(bookings.timeSlotId, timeSlots.id))
                .leftJoin(customers, eq(bookings.phoneNumber, customers.number))
                .where(eq(bookings.id, input.bookingId))
                .limit(1);

            if (!record) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Booking not found" });
            }

            return record;
        }),

    verifyBooking: managerProcedure
        .input(z.object({ bookingId: z.string().uuid() }))
        .mutation(async ({ input }) => {
            const [updated] = await db
                .update(bookings)
                .set({ status: "fullPaid" })
                .where(eq(bookings.id, input.bookingId))
                .returning({ id: bookings.id, status: bookings.status });

            if (!updated) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Booking not found" });
            }

            return updated;
        }),

    staffList: managerProcedure.query(async () => {
        return db
            .select({
                id: managers.id,
                role: managers.role,
                createdAt: managers.createdAt,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                },
            })
            .from(managers)
            .innerJoin(user, eq(user.id, managers.authId));
    }),

    customersList: managerProcedure
        .input(z.object({ limit: z.number().int().min(1).max(100).default(50) }).optional())
        .query(async ({ input }) => {
            const limit = input?.limit ?? 50;
            return db
                .select({
                    id: customers.id,
                    name: customers.name,
                    email: customers.email,
                    number: customers.number,
                    languagePreference: customers.languagePreference,
                    tag: customers.tag,
                    createdAt: customers.createdAt,
                })
                .from(customers)
                .orderBy(desc(customers.createdAt))
                .limit(limit);
        }),

    updateCustomerTag: managerProcedure
        .input(
            z.object({
                customerId: z.number().int(),
                tag: z.enum(["star", "regular", "vip", "new"]).optional(),
            }),
        )
        .mutation(async ({ input }) => {
            const [updated] = await db
                .update(customers)
                .set({ tag: input.tag ?? undefined })
                .where(eq(customers.id, input.customerId))
                .returning({ id: customers.id, tag: customers.tag });

            if (!updated) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Customer not found" });
            }

            return updated;
        }),

    customerDetails: managerProcedure
        .input(z.object({ customerId: z.number().int() }))
        .query(async ({ input }) => {
            const customer = await db.query.customers.findFirst({
                where: eq(customers.id, input.customerId),
            });

            if (!customer) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Customer not found" });
            }

            // Get booking history for this customer
            const bookingHistory = await db
                .select({
                    id: bookings.id,
                    status: bookings.status,
                    amountPaid: bookings.amountPaid,
                    totalAmount: bookings.totalAmount,
                    bookingType: bookings.bookingType,
                    createdAt: bookings.createdAt,
                    slot: {
                        from: timeSlots.from,
                        to: timeSlots.to,
                        date: timeSlots.date,
                    },
                })
                .from(bookings)
                .leftJoin(timeSlots, eq(bookings.timeSlotId, timeSlots.id))
                .where(eq(bookings.phoneNumber, customer.number))
                .orderBy(desc(bookings.createdAt))
                .limit(10);

            return {
                ...customer,
                bookings: bookingHistory,
            };
        }),

    configGet: managerProcedure.query(async () => {
        const record = await db.query.configTable.findFirst();
        return record ?? null;
    }),

    configUpdate: managerProcedure
        .input(
            z.object({
                fullPaymentMode: z.boolean().optional(),
                maintenanceMode: z.boolean().optional(),
                maintenanceMessage: z.string().max(200).optional(),
                bookingBufferMinutes: z.number().int().min(0).optional(),
                slots: z.record(z.any()).optional(),
            }),
        )
        .mutation(async ({ input, ctx }) => {
            const existing = await db.query.configTable.findFirst();

            if (!existing) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Config not found",
                });
            }

            const updatePayload: Partial<typeof configTable.$inferInsert> = {
                updatedBy: ctx.manager.id,
                fullPaymentMode: input.fullPaymentMode ?? existing.fullPaymentMode,
                maintenanceMode: input.maintenanceMode ?? existing.maintenanceMode,
                maintenanceMessage: input.maintenanceMessage ?? existing.maintenanceMessage,
                bookingBufferMinutes: input.bookingBufferMinutes ?? existing.bookingBufferMinutes,
                slots: input.slots ?? existing.slots,
            };

            const [updated] = await db
                .update(configTable)
                .set(updatePayload)
                .where(eq(configTable.id, existing.id))
                .returning();

            return updated;
        }),

    getBookingsByDate: managerProcedure
        .input(
            z.object({
                date: z.string(), // YYYY-MM-DD format
            }),
        )
        .query(async ({ input }) => {
            const results = await db
                .select({
                    id: bookings.id,
                    phoneNumber: bookings.phoneNumber,
                    name: customers.name,
                    email: customers.email,
                    alternateContactName: customers.alternateContactName,
                    alternateContactNumber: customers.alternateContactNumber,
                    amountPaid: bookings.amountPaid,
                    totalAmount: bookings.totalAmount,
                    status: bookings.status,
                    verificationCode: bookings.verificationCode,
                    bookingType: bookings.bookingType,
                    createdAt: bookings.createdAt,
                    slot: {
                        from: timeSlots.from,
                        to: timeSlots.to,
                        date: timeSlots.date,
                    },
                })
                .from(bookings)
                .leftJoin(timeSlots, eq(bookings.timeSlotId, timeSlots.id))
                .leftJoin(customers, eq(bookings.phoneNumber, customers.number))
                .where(eq(timeSlots.date, input.date))
                .orderBy(asc(timeSlots.from));

            if (results.length === 0) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: `No bookings found for date ${input.date}`,
                });
            }

            return results;
        }),

    getBookingById: managerProcedure
        .input(z.object({ bookingId: z.string().uuid() }))
        .query(async ({ input }) => {
            const [record] = await db
                .select({
                    id: bookings.id,
                    phoneNumber: bookings.phoneNumber,
                    name: customers.name,
                    email: customers.email,
                    alternateContactName: customers.alternateContactName,
                    alternateContactNumber: customers.alternateContactNumber,
                    amountPaid: bookings.amountPaid,
                    totalAmount: bookings.totalAmount,
                    status: bookings.status,
                    verificationCode: bookings.verificationCode,
                    bookingType: bookings.bookingType,
                    createdAt: bookings.createdAt,
                    slot: {
                        from: timeSlots.from,
                        to: timeSlots.to,
                        date: timeSlots.date,
                    },
                })
                .from(bookings)
                .leftJoin(timeSlots, eq(bookings.timeSlotId, timeSlots.id))
                .leftJoin(customers, eq(bookings.phoneNumber, customers.number))
                .where(eq(bookings.id, input.bookingId))
                .limit(1);

            if (!record) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Booking not found",
                });
            }

            return record;
        }),

    dashboardSummary: managerProcedure.query(async () => {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);

        // Get current month bookings
        const [currentMonthStats] = await db
            .select({
                totalBookings: count(bookings.id),
                totalRevenue: sum(bookings.amountPaid),
            })
            .from(bookings)
            .where(sql`${bookings.createdAt} >= ${startOfMonth.toISOString()}`);

        // Get last month bookings for comparison
        const [lastMonthStats] = await db
            .select({
                totalBookings: count(bookings.id),
                totalRevenue: sum(bookings.amountPaid),
            })
            .from(bookings)
            .where(
                sql`${bookings.createdAt} >= ${startOfLastMonth.toISOString()} AND ${bookings.createdAt} <= ${endOfLastMonth.toISOString()}`
            );

        // Get today's pending amount
        const [todayPending] = await db
            .select({
                pendingAmount: sum(sql<number>`CASE 
                    WHEN ${bookings.status} = 'advancePaid' THEN ${bookings.totalAmount} - ${bookings.amountPaid}
                    WHEN ${bookings.status} = 'advancePending' THEN ${bookings.totalAmount}
                    WHEN ${bookings.status} = 'fullPending' THEN ${bookings.totalAmount}
                    ELSE 0 
                END`),
            })
            .from(bookings)
            .leftJoin(timeSlots, eq(bookings.timeSlotId, timeSlots.id))
            .where(sql`${timeSlots.date} = ${startOfToday.toISOString().split('T')[0]}`);

        // Get yesterday's pending amount
        const [yesterdayPending] = await db
            .select({
                pendingAmount: sum(sql<number>`CASE 
                    WHEN ${bookings.status} = 'advancePaid' THEN ${bookings.totalAmount} - ${bookings.amountPaid}
                    WHEN ${bookings.status} = 'advancePending' THEN ${bookings.totalAmount}
                    WHEN ${bookings.status} = 'fullPending' THEN ${bookings.totalAmount}
                    ELSE 0 
                END`),
            })
            .from(bookings)
            .leftJoin(timeSlots, eq(bookings.timeSlotId, timeSlots.id))
            .where(sql`${timeSlots.date} = ${startOfYesterday.toISOString().split('T')[0]}`);

        // Get upcoming bookings today
        const [todayBookingsCount] = await db
            .select({
                count: count(bookings.id),
            })
            .from(bookings)
            .leftJoin(timeSlots, eq(bookings.timeSlotId, timeSlots.id))
            .where(
                sql`${timeSlots.date} = ${startOfToday.toISOString().split('T')[0]} 
                AND ${timeSlots.from} > ${now.toTimeString().split(' ')[0]}`
            );

        // Get last 7 days revenue for trend
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const last7DaysRevenue = await db
            .select({
                date: sql<string>`DATE(${bookings.createdAt})`,
                revenue: sum(bookings.amountPaid),
            })
            .from(bookings)
            .where(sql`${bookings.createdAt} >= ${sevenDaysAgo.toISOString()}`)
            .groupBy(sql`DATE(${bookings.createdAt})`)
            .orderBy(sql`DATE(${bookings.createdAt})`);

        // Get slot utilization heatmap (last 7 days, 4 time blocks per day)
        const sevenDaysAgoDate = sevenDaysAgo.toISOString().split('T')[0];
        const heatmapData = await db
            .select({
                date: timeSlots.date,
                hour: sql<number>`EXTRACT(HOUR FROM ${timeSlots.from})`,
                bookedCount: count(bookings.id),
            })
            .from(timeSlots)
            .leftJoin(bookings, eq(timeSlots.id, bookings.timeSlotId))
            .where(sql`${timeSlots.date} >= ${sevenDaysAgoDate}`)
            .groupBy(timeSlots.date, sql`EXTRACT(HOUR FROM ${timeSlots.from})`)
            .orderBy(timeSlots.date);

        // Get conversion rates by payment type
        const conversionStats = await db
            .select({
                status: bookings.status,
                count: count(bookings.id),
            })
            .from(bookings)
            .groupBy(bookings.status);

        return {
            metrics: {
                currentMonth: {
                    revenue: Number(currentMonthStats?.totalRevenue ?? 0),
                    bookings: Number(currentMonthStats?.totalBookings ?? 0),
                },
                lastMonth: {
                    revenue: Number(lastMonthStats?.totalRevenue ?? 0),
                    bookings: Number(lastMonthStats?.totalBookings ?? 0),
                },
                today: {
                    pendingAmount: Number(todayPending?.pendingAmount ?? 0),
                    upcomingBookings: Number(todayBookingsCount?.count ?? 0),
                },
                yesterday: {
                    pendingAmount: Number(yesterdayPending?.pendingAmount ?? 0),
                },
            },
            trends: {
                last7Days: last7DaysRevenue.map(d => ({
                    date: d.date,
                    revenue: Number(d.revenue ?? 0),
                })),
            },
            heatmap: heatmapData.map(d => ({
                date: d.date,
                hour: d.hour,
                bookedCount: Number(d.bookedCount ?? 0),
            })),
            conversions: conversionStats.map(s => ({
                status: s.status,
                count: Number(s.count),
            })),
        } as const;
    }),
});

export const superAdminRouter = createTRPCRouter({
    adminsList: superAdminProcedure.query(async () => {
        return db
            .select({
                id: managers.id,
                role: managers.role,
                createdAt: managers.createdAt,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                },
            })
            .from(managers)
            .innerJoin(user, eq(user.id, managers.authId))
            .where(eq(managers.role, "admin"));
    }),

    inviteAdmin: superAdminProcedure
        .input(
            z.object({
                email: z.string().email(),
                name: z.string().min(1),
                role: z.enum(["admin", "superAdmin"]),
            }),
        )
        .mutation(async ({ input }) => {
            try {
                // Check if user already exists
                const existingUser = await db.query.user.findFirst({
                    where: eq(user.email, input.email),
                });

                if (existingUser) {
                    throw new TRPCError({
                        code: "BAD_REQUEST",
                        message: "User with this email already exists",
                    });
                }

                // Generate random password
                const password = generatePassword();

                // Create user using Better Auth API
                const response = await auth.api.signUpEmail({
                    body: {
                        name: input.name,
                        email: input.email,
                        password: password,
                    },
                });

                if (!response?.user?.id) {
                    throw new TRPCError({
                        code: "INTERNAL_SERVER_ERROR",
                        message: "Failed to create user with Better Auth",
                    });
                }

                const newUserId = response.user.id;

                // Create manager record
                const [newManager] = await db
                    .insert(managers)
                    .values({
                        authId: newUserId,
                        role: input.role,
                    })
                    .returning();

                if (!newManager) {
                    throw new TRPCError({
                        code: "INTERNAL_SERVER_ERROR",
                        message: "Failed to create manager record",
                    });
                }

                // Send invitation email (fire and forget)
                void Promise.resolve().then(async () => {
                    try {
                        await sendAdminInvitationEmail(input.email, {
                            adminName: input.name,
                            role: input.role,
                        });
                    } catch {
                        // Silently ignore email errors
                    }
                });

                return {
                    id: newManager.id,
                    email: input.email,
                    name: input.name,
                    role: newManager.role,
                };
            } catch (error) {
                if (error instanceof TRPCError) {
                    throw error;
                }
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Failed to invite admin",
                });
            }
        }),

    removeAdmin: superAdminProcedure
        .input(
            z.object({
                managerId: z.number().int(),
            }),
        )
        .mutation(async ({ input }) => {
            // Find the manager
            const manager = await db.query.managers.findFirst({
                where: eq(managers.id, input.managerId),
            });

            if (!manager) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Manager not found",
                });
            }

            // Prevent removing the current super admin (optional safety check)
            if (manager.role === "superAdmin") {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Cannot remove super admin",
                });
            }

            // Delete manager record
            await db
                .delete(managers)
                .where(eq(managers.id, input.managerId));

            // Optionally delete the associated user account
            // Uncomment if you want to fully remove the user
            // await db.delete(user).where(eq(user.id, manager.authId));

            return { success: true };
        }),


    changeAdminPassword: managerProcedure
        .input(
            z.object({
                currentPassword: z.string(),
                newPassword: z.string().min(8),
            }),
        )
        .mutation(async ({ input, ctx }) => {
            try {
                // Get the account record for this user
                const accountRecord = await db.query.account.findFirst({
                    where: eq(account.userId, ctx.session.user.id),
                });

                if (!accountRecord?.password) {
                    throw new TRPCError({
                        code: "BAD_REQUEST",
                        message: "User has no password set",
                    });
                }

                // For now, store password directly (Better Auth will hash it)
                // In production, implement proper password hashing
                if (accountRecord.password !== input.currentPassword) {
                    throw new TRPCError({
                        code: "UNAUTHORIZED",
                        message: "Current password is incorrect",
                    });
                }

                // Update password in account table
                await db
                    .update(account)
                    .set({
                        password: input.newPassword,
                        updatedAt: new Date(),
                    })
                    .where(eq(account.id, accountRecord.id));

                return { success: true };
            } catch (error) {
                if (error instanceof TRPCError) {
                    throw error;
                }
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Failed to change password",
                });
            }
        }),

    getAdminProfile: superAdminProcedure
        .input(z.object({ managerId: z.number().int() }))
        .query(async ({ input }) => {
            const manager = await db.query.managers.findFirst({
                where: eq(managers.id, input.managerId),
            });

            if (!manager) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Manager not found",
                });
            }

            // Get user info
            const userData = await db.query.user.findFirst({
                where: eq(user.id, manager.authId),
            });

            if (!userData) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "User not found",
                });
            }

            // Get active sessions count
            const [activeSessions] = await db
                .select({ count: count(session.id) })
                .from(session)
                .where(eq(session.userId, manager.authId));

            // Get all sessions for this user
            const userSessions = await db
                .select({
                    id: session.id,
                    createdAt: session.createdAt,
                    expiresAt: session.expiresAt,
                    userAgent: session.userAgent,
                    ipAddress: session.ipAddress,
                })
                .from(session)
                .where(eq(session.userId, manager.authId))
                .orderBy(desc(session.createdAt));

            return {
                id: manager.id,
                name: userData.name,
                email: userData.email,
                role: manager.role,
                createdAt: manager.createdAt,
                activeSessionsCount: activeSessions?.count ?? 0,
                sessions: userSessions,
            };
        }),

    removeAllSessions: superAdminProcedure
        .input(z.object({ managerId: z.number().int() }))
        .mutation(async ({ input }) => {
            const manager = await db.query.managers.findFirst({
                where: eq(managers.id, input.managerId),
            });

            if (!manager) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Manager not found",
                });
            }

            const result = await db
                .delete(session)
                .where(eq(session.userId, manager.authId))
                .returning({ id: session.id });

            return {
                success: true,
                removedCount: result.length,
            };
        }),

    updateAdminName: superAdminProcedure
        .input(
            z.object({
                managerId: z.number().int(),
                name: z.string().min(1).max(255),
            }),
        )
        .mutation(async ({ input }) => {
            const manager = await db.query.managers.findFirst({
                where: eq(managers.id, input.managerId),
            });

            if (!manager) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Manager not found",
                });
            }

            const updated = await db
                .update(user)
                .set({
                    name: input.name,
                })
                .where(eq(user.id, manager.authId))
                .returning({ id: user.id, name: user.name });

            if (!updated || updated.length === 0) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Failed to update admin name",
                });
            }

            return {
                success: true,
                name: updated[0]!.name,
            };
        }),

    couponsList: superAdminProcedure.query(async () => {
        return db
            .select({
                id: coupons.id,
                code: coupons.code,
                description: coupons.description,
                flatDiscountAmount: coupons.flatDiscountAmount,
                maxFlatDiscountAmount: coupons.maxFlatDiscountAmount,
                minimumBookingAmount: coupons.minimumBookingAmount,
                firstNBookingsOnly: coupons.firstNBookingsOnly,
                nthPurchaseOnly: coupons.nthPurchaseOnly,
                usageLimit: coupons.usageLimit,
                numberOfUses: coupons.numberOfUses,
                validFrom: coupons.validFrom,
                validTo: coupons.validTo,
                showCoupon: coupons.showCoupon,
                createdAt: coupons.createdAt,
            })
            .from(coupons)
            .orderBy(desc(coupons.createdAt));
    }),

    couponCreate: superAdminProcedure
        .input(
            z.object({
                code: z.string().min(1).max(50),
                description: z.string().max(200).optional(),

                flatDiscountAmount: z.number().int().min(0).optional(), // in paise
                maxFlatDiscountAmount: z.number().int().min(0).optional(), // in paise

                minimumBookingAmount: z.number().int().min(0).optional(), // in paise
                firstNBookingsOnly: z.number().int().min(0).optional(),
                nthPurchaseOnly: z.number().int().min(0).optional(),

                validFrom: z.string().min(1).optional().default(() => new Date().toISOString().split("T")[0]!), // YYYY-MM-DD, defaults to today
                validTo: z.string().min(1).optional().default(() => {
                    const date = new Date();
                    date.setFullYear(date.getFullYear() + 100); // 100 years from now
                    return date.toISOString().split("T")[0]!;
                }), // YYYY-MM-DD, defaults to 100 years from today

                usageLimit: z.number().int().min(0).optional(), // 0 means unlimited
                showCoupon: z.boolean().optional(),
            }),
        )
        .mutation(async ({ ctx, input }) => {
            // Check if coupon code already exists
            const existing = await db.query.coupons.findFirst({
                where: eq(coupons.code, input.code.toUpperCase()),
            });

            if (existing) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Coupon code already exists",
                });
            }

            const [newCoupon] = await db
                .insert(coupons)
                .values([
                    {
                        code: input.code.toUpperCase(),
                        description: input.description ?? null,

                        flatDiscountAmount: input.flatDiscountAmount ?? 0,
                        maxFlatDiscountAmount: input.maxFlatDiscountAmount ?? 0,

                        minimumBookingAmount: input.minimumBookingAmount ?? 0,
                        firstNBookingsOnly: input.firstNBookingsOnly ?? 0,
                        nthPurchaseOnly: input.nthPurchaseOnly ?? 0,

                        usageLimit: input.usageLimit ?? 0,
                        numberOfUses: 0,
                        validFrom: input.validFrom,
                        validTo: input.validTo,
                        showCoupon: input.showCoupon ?? true,

                        createdBy: ctx.manager.id,
                        updatedBy: ctx.manager.id,
                    },
                ])
                .returning();

            return newCoupon;
        }),

    couponUpdate: superAdminProcedure
        .input(
            z.object({
                couponId: z.string().uuid(),
                description: z.string().max(200).optional(),

                flatDiscountAmount: z.number().int().min(0).optional(),
                maxFlatDiscountAmount: z.number().int().min(0).optional(),
                minimumBookingAmount: z.number().int().min(0).optional(),
                firstNBookingsOnly: z.number().int().min(0).optional(),
                nthPurchaseOnly: z.number().int().min(0).optional(),

                usageLimit: z.number().int().min(0).optional(),
                validFrom: z.string().min(1).optional(),
                validTo: z.string().min(1).optional(),
                showCoupon: z.boolean().optional(),
            }),
        )
        .mutation(async ({ ctx, input }) => {
            const coupon = await db.query.coupons.findFirst({
                where: eq(coupons.id, input.couponId),
            });

            if (!coupon) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Coupon not found",
                });
            }

            const [updated] = await db
                .update(coupons)
                .set({
                    description: input.description ?? coupon.description,

                    flatDiscountAmount: input.flatDiscountAmount ?? coupon.flatDiscountAmount,
                    maxFlatDiscountAmount:
                        input.maxFlatDiscountAmount ?? coupon.maxFlatDiscountAmount,
                    minimumBookingAmount:
                        input.minimumBookingAmount ?? coupon.minimumBookingAmount,
                    firstNBookingsOnly: input.firstNBookingsOnly ?? coupon.firstNBookingsOnly,
                    nthPurchaseOnly: input.nthPurchaseOnly ?? coupon.nthPurchaseOnly,

                    usageLimit: input.usageLimit ?? coupon.usageLimit,
                    validFrom: input.validFrom ?? coupon.validFrom,
                    validTo: input.validTo ?? coupon.validTo,
                    showCoupon: input.showCoupon ?? coupon.showCoupon,
                    updatedBy: ctx.manager.id,
                })
                .where(eq(coupons.id, input.couponId))
                .returning();

            return updated;
        }),

    couponDelete: superAdminProcedure
        .input(z.object({ couponId: z.string().uuid() }))
        .mutation(async ({ input }) => {
            const coupon = await db.query.coupons.findFirst({
                where: eq(coupons.id, input.couponId),
            });

            if (!coupon) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Coupon not found",
                });
            }

            await db.delete(coupons).where(eq(coupons.id, input.couponId));

            return { success: true };
        }),

    couponGetById: superAdminProcedure
        .input(z.object({ couponId: z.string().uuid() }))
        .query(async ({ input }) => {
            const coupon = await db.query.coupons.findFirst({
                where: eq(coupons.id, input.couponId),
            });

            if (!coupon) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Coupon not found",
                });
            }

            return coupon;
        }),

    couponToggleStatus: superAdminProcedure
        .input(
            z.object({
                couponId: z.string().uuid(),
                showCoupon: z.boolean(),
            }),
        )
        .mutation(async ({ input }) => {
            const coupon = await db.query.coupons.findFirst({
                where: eq(coupons.id, input.couponId),
            });

            if (!coupon) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Coupon not found",
                });
            }

            const [updated] = await db
                .update(coupons)
                .set({
                    showCoupon: input.showCoupon,
                })
                .where(eq(coupons.id, input.couponId))
                .returning();

            return updated;
        }),

    couponResetUsage: superAdminProcedure
        .input(z.object({ couponId: z.string().uuid() }))
        .mutation(async ({ input }) => {
            const coupon = await db.query.coupons.findFirst({
                where: eq(coupons.id, input.couponId),
            });

            if (!coupon) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Coupon not found",
                });
            }

            const [updated] = await db
                .update(coupons)
                .set({
                    numberOfUses: 0,
                })
                .where(eq(coupons.id, input.couponId))
                .returning();

            return {
                success: true,
                coupon: updated,
            };
        }),

    couponStats: superAdminProcedure.query(async () => {
        const allCoupons = await db.select().from(coupons);

        const totalCoupons = allCoupons.length;
        const activeCoupons = allCoupons.filter(
            (c) =>
                new Date(c.validFrom) <= new Date() &&
                new Date(c.validTo) >= new Date() &&
                c.showCoupon
        ).length;
        const expiredCoupons = allCoupons.filter((c) => new Date(c.validTo) < new Date())
            .length;
        const totalUsage = allCoupons.reduce((sum, c) => sum + (c.numberOfUses ?? 0), 0);
        const totalCapacity = allCoupons.reduce((sum, c) => sum + (c.usageLimit ?? 0), 0);

        return {
            totalCoupons,
            activeCoupons,
            expiredCoupons,
            totalUsage,
            totalCapacity,
            utilizationRate: totalCapacity > 0 ? Math.round((totalUsage / totalCapacity) * 100) : 0,
        };
    }),
});
