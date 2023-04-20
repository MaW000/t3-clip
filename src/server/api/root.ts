import { createTRPCRouter } from "~/server/api/trpc";
import { videoRouter } from "~/server/api/routers/video";
import { commentRouter } from "~/server/api/routers/comment";
import { emoteRouter } from "~/server/api/routers/emote";
import { cardRouter } from "./routers/cards";
import { uiRouter } from "./routers/uiData";
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
