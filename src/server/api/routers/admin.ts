import { TRPCError } from "@trpc/server";
import { count, desc, eq, sum } from "drizzle-orm";
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
            }),
        )
        .query(async ({ input }) => {
            return db
                .select({
                    id: bookings.id,
                    phoneNumber: bookings.phoneNumber,
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
                .orderBy(desc(bookings.createdAt))
                .limit(input.limit);
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

    couponsList: managerProcedure.query(async () => {
        return db
            .select({
                id: coupons.id,
                code: coupons.code,
                description: coupons.description,
                usageLimit: coupons.usageLimit,
                numberOfUses: coupons.numberOfUses,
                validFrom: coupons.validFrom,
                validTo: coupons.validTo,
            })
            .from(coupons)
            .orderBy(desc(coupons.createdAt));
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
            }),
        )
        .mutation(async ({ input, ctx }) => {
            const existing = await db.query.configTable.findFirst();

            if (!existing) {
                const [created] = await db
                    .insert(configTable)
                    .values({
                        updatedBy: ctx.manager.id,
                        fullPaymentMode: input.fullPaymentMode ?? false,
                        maintenanceMode: input.maintenanceMode ?? false,
                        maintenanceMessage: input.maintenanceMessage ?? "",
                    })
                    .returning();
                return created;
            }

            const updatePayload: Partial<typeof configTable.$inferInsert> = {
                updatedBy: ctx.manager.id,
            };

            if (input.fullPaymentMode !== undefined) {
                updatePayload.fullPaymentMode = input.fullPaymentMode;
            }
            if (input.maintenanceMode !== undefined) {
                updatePayload.maintenanceMode = input.maintenanceMode;
            }
            if (input.maintenanceMessage !== undefined) {
                updatePayload.maintenanceMessage = input.maintenanceMessage;
            }

            const [updated] = await db
                .update(configTable)
                .set(updatePayload)
                .where(eq(configTable.id, existing.id))
                .returning();

            return updated;
        }),
});

export const superAdminRouter = createTRPCRouter({
    dashboardSummary: superAdminProcedure.query(async () => {
        const [bookingStats] = await db
            .select({
                totalBookings: count(bookings.id),
                totalRevenue: sum(bookings.amountPaid),
            })
            .from(bookings);

        const [slotStats] = await db
            .select({ availableSlots: count(timeSlots.id) })
            .from(timeSlots)
            .where(eq(timeSlots.status, "available"));

        const recentBookings = await db
            .select({
                id: bookings.id,
                phoneNumber: bookings.phoneNumber,
                amountPaid: bookings.amountPaid,
                status: bookings.status,
                createdAt: bookings.createdAt,
                slotFrom: timeSlots.from,
                slotTo: timeSlots.to,
                slotDate: timeSlots.date,
            })
            .from(bookings)
            .leftJoin(timeSlots, eq(bookings.timeSlotId, timeSlots.id))
            .orderBy(desc(bookings.createdAt))
            .limit(10);

        return {
            totals: {
                totalBookings: bookingStats?.totalBookings ?? 0,
                totalRevenue: bookingStats?.totalRevenue ?? 0,
                availableSlots: slotStats?.availableSlots ?? 0,
            },
            recentBookings,
        } as const;
    }),

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
                            password,
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
});
