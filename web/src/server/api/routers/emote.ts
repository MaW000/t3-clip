import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";

/**
 * Real emotes are odd constructions: CamelCase, digits, punctuation, or long
 * run-together combos - "TwitchConHYPE", "StreamerU2026", "bratchat", "<3".
 *
 * Channels also register plain words and slang as emotes ("LOL", "LUL", "WW"),
 * and those belong in the keyword list instead, where "lol"/"lmao"/"haha" fold
 * into one entry. Without this the same term shows up in both lists.
 */
function isPlainWord(term: string) {
  //anything with a digit or punctuation is an emote name, not a word
  if (!/^[a-z]+$/i.test(term)) return false;

  //internal case changes mean a combo name: DinoDance, TwitchConHYPE
  const oneCase =
    term === term.toLowerCase() || term === term.toUpperCase();

  //long single-case runs are run-together combos: bratchat, aishahsofey
  return oneCase && term.length <= 5;
}
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
      //an empty list, not undefined: React Query rejects undefined query data,
      //and this is the normal state for a VOD the worker has not reached yet
      if (!channel) return [];

      //the emote comes back with the term, so there is no per-term follow-up query
      const topTerms = await ctx.db.term.findMany({
        where: {
          channelId: channel.channelId,
        },
        orderBy: {
          amount: "desc",
        },
        //over-fetch, because isPlainWord below drops some of these and the
        //carousel should still end up with a full 50
        take: 150,
        include: {
          Emote: true,
        },
      });

      return topTerms.flatMap((term) => {
        const emote = term.Emote;
        if (!emote) return [];
        if (isPlainWord(term.term)) return [];
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
      }).slice(0, 50);
    }),
});
