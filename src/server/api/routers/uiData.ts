import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
export const uiRouter = createTRPCRouter({
  getTopUsers: publicProcedure.query(async ({ ctx }) => {
    const users = await ctx.prisma.user.findMany({
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
    const top20BySecond = ctx.prisma.commentCard.findMany({
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

    const top20ByMinute = ctx.prisma.commentCard.findMany({
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

    const top20ByDay = ctx.prisma.commentCard.findMany({
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

    const top20ByWeek = ctx.prisma.commentCard.findMany({
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
      top20CardsBySecond,
      top20CardsByWeek,
      top20CardsByMinute,
      top20CardsByDay,
    };
  }),
});
