import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";

/**
 * These queries `include: { video: true }`, so the BIGINT videoId column comes
 * back as `bigint`. The client-side `Comment` interface in types/ui.ts types it
 * as `number`, so it is narrowed here rather than at every call site. See the
 * video router for the reasoning.
 */
const toClientCard = <T extends { video: { videoId: bigint } }>(card: T) => ({
  ...card,
  video: { ...card.video, videoId: Number(card.video.videoId) },
});

export const uiRouter = createTRPCRouter({
  getTopUsers: publicProcedure.query(async ({ ctx }) => {
    const users = await ctx.db.user.findMany({
      orderBy: {
        likes: "desc",
      },
      take: 5,
      select: {
        name: true,
        likes: true,
        image: true,
      },
    });
    return users;
  }),
  getRecentCards: publicProcedure.query(async ({ ctx }) => {
    const top20BySecond = ctx.db.commentCard.findMany({
      where: {
        second: { gt: 0 },
      },
      orderBy: {
        second: "desc",
      },
      take: 20,
      include: {
        video: true,
        card: true,
      },
    });

    const top20ByMinute = ctx.db.commentCard.findMany({
      where: {
        minute: { gt: 0 },
      },
      orderBy: {
        minute: "desc",
      },
      take: 20,
      include: {
        video: true,
        card: true,
      },
    });

    const top20ByDay = ctx.db.commentCard.findMany({
      where: {
        day: { gt: 0 },
      },
      orderBy: {
        day: "desc",
      },
      take: 20,
      include: {
        video: true,
        card: true,
      },
    });

    const top20ByWeek = ctx.db.commentCard.findMany({
      where: {
        week: { gt: 0 },
      },
      orderBy: {
        week: "desc",
      },
      take: 20,
      include: {
        video: true,
        card: true,
      },
    });

    const [
      top20CardsBySecond,
      top20CardsByWeek,
      top20CardsByMinute,
      top20CardsByDay,
    ] = await Promise.all([
      top20BySecond,
      top20ByWeek,
      top20ByMinute,
      top20ByDay,
    ]);

    return {
      top20CardsBySecond: top20CardsBySecond.map(toClientCard),
      top20CardsByWeek: top20CardsByWeek.map(toClientCard),
      top20CardsByMinute: top20CardsByMinute.map(toClientCard),
      top20CardsByDay: top20CardsByDay.map(toClientCard),
    };
  }),
});
