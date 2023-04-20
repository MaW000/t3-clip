import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
export const emoteRouter = createTRPCRouter({
  getComments: publicProcedure
    .input(
      z.object({
        videoId: z.number(),
      })
    )
    .query(async ({ ctx, input }) => {
      const channel = await ctx.prisma.video.findUnique({
        where: {
          videoId: input.videoId,
        },
      });
      if (!channel) return;

      const topTerms = await ctx.prisma.term.findMany({
        where: {
          channelId: channel.channelId,
        },
        orderBy: {
          amount: "desc",
        },
        take: 50,
      });
      const topTermsWithEmotes = await Promise.all(
        topTerms.map(async (term) => {
          const termWithEmote = await ctx.prisma.term.findUnique({
            where: {
              emojiId: term.emojiId,
            },
            include: {
              Emote: true,
            },
          });
          return termWithEmote;
        })
      );
      const terms = topTermsWithEmotes;
      const filteredData = terms?.filter((term) => term?.Emote);
      const mappedData = filteredData
        ?.map((term) => {
          if (term === null) return null;
          if (term?.Emote === null) return null;
          if (!term.Emote.url1 || !term.Emote.url2 || !term.Emote.url3)
            return null;
          return {
            term: term.term,
            amount: term.amount,
            url: term.Emote.url1 || term.Emote.url2 || term.Emote.url3,
            emojiId: term.Emote.emojiId,
          };
        })
        .filter((term) => term !== null);

      return mappedData;
    }),
});
