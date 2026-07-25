import { cardRouter } from "@/server/api/routers/cards";
import { commentRouter } from "@/server/api/routers/comment";
import { emoteRouter } from "@/server/api/routers/emote";
import { uiRouter } from "@/server/api/routers/uiData";
import { videoRouter } from "@/server/api/routers/video";
import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  video: videoRouter,
  comment: commentRouter,
  emote: emoteRouter,
  card: cardRouter,
  ui: uiRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.video.getFive();
 */
export const createCaller = createCallerFactory(appRouter);
