import { createTRPCRouter } from "~/server/api/trpc";
import { videoRouter } from "~/server/api/routers/video";
import { commentRouter } from "~/server/api/routers/comment";
/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  video: videoRouter,
  comment: commentRouter
});

// export type definition of API
export type AppRouter = typeof appRouter;
