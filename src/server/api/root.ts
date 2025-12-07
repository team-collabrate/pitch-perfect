import { postRouter } from "~/server/api/routers/post";
import { customerRouter } from "~/server/api/routers/customer";
import { timeSlotRouter } from "~/server/api/routers/timeSlot";
import { bookingRouter } from "~/server/api/routers/booking";
import { adminRouter, superAdminRouter } from "~/server/api/routers/admin";
import { galleryRouter } from "~/server/api/routers/gallery";
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  admin: adminRouter,
  superAdmin: superAdminRouter,
  post: postRouter,
  customer: customerRouter,
  timeSlot: timeSlotRouter,
  booking: bookingRouter,
  gallery: galleryRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
