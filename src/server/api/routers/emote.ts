import { z } from "zod";
import {
    createTRPCRouter,
    publicProcedure,
    protectedProcedure,
} from "~/server/api/trpc";
interface Emote {
    _id: string;
    name: string;
    type: string;
    width: number;
    height: number;
    gif: boolean;
    urls: {
        [key: string]: {
            "1": string;
            "2": string;
            "4": string;
        };
    };
}
interface EmoteGroup {
    [key: string]: Emote | null;
}
interface Emotes {
    bttvChannelEmotes: Array<EmoteGroup>;
    bttvGlobalEmotes: Array<EmoteGroup>;
    ffzChannelEmotes: Array<EmoteGroup>;
    ffzGlobalEmotes: Array<EmoteGroup>;
    twitchGlobalEmotes: Array<EmoteGroup>;
    sevenTvEmotes: Array<EmoteGroup>;
    sevenTVGlobalEmotes: Array<EmoteGroup>;
}

export const emoteRouter = createTRPCRouter({
    getComments: publicProcedure
        .input(
            z.object({
                videoId: z.number(),
                keyword: z.string(),
                interval: z.number(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const topTerms = await ctx.prisma.term.findMany({
                where: {
                    channelId: "64132b9b5a76a82ca3c2bf60"
                },
                orderBy: {
                    amount: 'desc'
                },
                take: 10
            })
            return {
                greeting: "hello",
            };
        }),
});
