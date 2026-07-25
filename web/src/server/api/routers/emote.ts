import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
export const emoteRouter = createTRPCRouter({
  getComments: publicProcedure
    .input(
      z.object({
        videoId: z.number(),
      })
    )
    .query(async ({ ctx, input }) => {
      const channel = await ctx.db.video.findUnique({
        where: {
          //BIGINT column - see the video router for why the input stays a number
          videoId: BigInt(input.videoId),
        },
      });
      if (!channel) return;

      //the emote comes back with the term, so there is no per-term follow-up query
      const topTerms = await ctx.db.term.findMany({
        where: {
          channelId: channel.channelId,
        },
        orderBy: {
          amount: "desc",
        },
        take: 50,
        include: {
          Emote: true,
        },
      });

      return topTerms.flatMap((term) => {
        const emote = term.Emote;
        if (!emote) return [];
        const url = emote.url1 ?? emote.url2 ?? emote.url3;
        if (!url) return [];
        return [
          {
            term: term.term,
            amount: term.amount,
            url,
            emojiId: emote.emojiId,
          },
        ];
      });
    }),
});
