import { z } from "zod";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";

export const cardRouter = createTRPCRouter({
  getCards: publicProcedure
    .input(
      z.object({
        videoId: z.number(),
      })
    )
    .query(async ({ ctx, input }) => {
      const video = await ctx.prisma.video.findUnique({
        where: {
          videoId: input.videoId,
        },
        select: {
          id: true,
        },
      });
      if (!video) return;
      const cards = await ctx.prisma.card.findMany({
        where: {
          vidId: video.id,
        },
      });
      if (!cards) return;

      return cards;
    })
});
