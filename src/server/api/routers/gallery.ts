import { TRPCError } from "@trpc/server";
import { eq, asc, inArray } from "drizzle-orm";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure, publicProcedure } from "~/server/api/trpc";
import { db } from "~/server/db";
import { gallery, managers } from "~/server/db/schema";
import { CloudinaryService } from "~/server/cloudinary";

const managerProcedure = protectedProcedure.use(async ({ ctx, next }) => {
    const manager = await db.query.managers.findFirst({
        where: eq(managers.authId, ctx.session.user.id),
    });

    if (!manager) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Manager access required" });
    }

    return next({
        ctx: {
            ...ctx,
            manager,
        },
    });
});

export const galleryRouter = createTRPCRouter({
    // Get all active gallery items
    getAll: publicProcedure.query(async () => {
        const items = await db.query.gallery.findMany({
            where: eq(gallery.status, "approved"),
            orderBy: [asc(gallery.displayOrder)],
            with: {
                manager: {
                    columns: {
                        id: true,
                    },
                },
            },
        });

        return items.map((item) => ({
            id: item.id,
            title: item.title,
            description: item.description,
            altText: item.altText,
            mediaType: item.mediaType,
            cloudinaryUrl: item.cloudinaryUrl,
            thumbnailUrl: item.thumbnailUrl,
            displayOrder: item.displayOrder,
            credits: item.credits,
        }));
    }),

    // Get all gallery items (admin - including all statuses)
    getAllAdmin: managerProcedure.query(async () => {
        const items = await db.query.gallery.findMany({
            orderBy: [asc(gallery.displayOrder)],
            with: {
                manager: {
                    columns: {
                        id: true,
                    },
                },
            },
        });

        return items;
    }),

    // Get single gallery item
    getById: publicProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
        const item = await db.query.gallery.findFirst({
            where: eq(gallery.id, input.id),
        });

        if (!item) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Gallery item not found" });
        }

        return item;
    }),

    // Create gallery item
    create: managerProcedure
        .input(
            z.object({
                title: z.string().min(1).max(200),
                description: z.string().optional(),
                altText: z.string().max(256).optional(),
                mediaType: z.enum(["image", "video"]),
                cloudinaryPublicId: z.string(),
                cloudinaryUrl: z.string().url(),
                thumbnailUrl: z.string().url().optional(),
                displayOrder: z.number().int().min(0).default(0),
                status: z.enum(["approved", "inactive", "discarded"]).default("approved"),
                credits: z.string().max(200).optional(),
                phoneNumber: z.string().max(20).optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const newItem = await db
                .insert(gallery)
                .values({
                    title: input.title,
                    description: input.description,
                    altText: input.altText,
                    mediaType: input.mediaType,
                    cloudinaryPublicId: input.cloudinaryPublicId,
                    cloudinaryUrl: input.cloudinaryUrl,
                    thumbnailUrl: input.thumbnailUrl,
                    displayOrder: input.displayOrder,
                    status: input.status,
                    credits: input.credits,
                    phoneNumber: input.phoneNumber,
                    uploadedBy: ctx.manager.id,
                })
                .returning();

            return newItem[0];
        }),

    // Update gallery item
    update: managerProcedure
        .input(
            z.object({
                id: z.number(),
                title: z.string().min(1).max(200).optional(),
                description: z.string().optional(),
                altText: z.string().max(256).optional(),
                displayOrder: z.number().int().min(0).optional(),
                status: z.enum(["approved", "inactive", "discarded"]).optional(),
                credits: z.string().max(200).optional(),
                phoneNumber: z.string().max(20).optional(),
            })
        )
        .mutation(async ({ input }) => {
            const updateData: Record<string, unknown> = {
                updatedAt: new Date(),
            };

            if (input.title !== undefined) updateData.title = input.title;
            if (input.description !== undefined) updateData.description = input.description;
            if (input.altText !== undefined) updateData.altText = input.altText;
            if (input.displayOrder !== undefined) updateData.displayOrder = input.displayOrder;
            if (input.status !== undefined) updateData.status = input.status;
            if (input.credits !== undefined) updateData.credits = input.credits;
            if (input.phoneNumber !== undefined) updateData.phoneNumber = input.phoneNumber;

            const updated = await db
                .update(gallery)
                .set(updateData)
                .where(eq(gallery.id, input.id))
                .returning();

            if (!updated.length) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Gallery item not found" });
            }

            return updated[0];
        }),

    // Delete gallery item
    delete: managerProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input }) => {
            const item = await db.query.gallery.findFirst({
                where: eq(gallery.id, input.id),
            });

            if (!item) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Gallery item not found" });
            }

            // Delete from Cloudinary
            try {
                await CloudinaryService.deleteResource(item.cloudinaryPublicId, item.mediaType);
            } catch (error) {
                console.error("Error deleting from Cloudinary:", error);
                // Continue with database deletion even if Cloudinary deletion fails
            }

            // Delete from database
            await db.delete(gallery).where(eq(gallery.id, input.id));

            return { success: true };
        }),

    // Reorder gallery items
    reorder: managerProcedure
        .input(
            z.object({
                items: z.array(
                    z.object({
                        id: z.number(),
                        displayOrder: z.number().int().min(0),
                    })
                ),
            })
        )
        .mutation(async ({ input }) => {
            await Promise.all(
                input.items.map((item) =>
                    db
                        .update(gallery)
                        .set({ displayOrder: item.displayOrder, updatedAt: new Date() })
                        .where(eq(gallery.id, item.id))
                )
            );

            return { success: true };
        }),

    // Bulk toggle active status (for backward compatibility)
    toggleActive: managerProcedure
        .input(
            z.object({
                ids: z.array(z.number()),
                isActive: z.boolean(),
            })
        )
        .mutation(async ({ input }) => {
            const newStatus = input.isActive ? "approved" : "inactive";
            await db
                .update(gallery)
                .set({ status: newStatus as "approved" | "inactive" | "discarded", updatedAt: new Date() })
                .where(inArray(gallery.id, input.ids));

            return { success: true };
        }),
});
