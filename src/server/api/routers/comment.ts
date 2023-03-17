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

export const commentRouter = createTRPCRouter({
    getComments: publicProcedure
        .input(z.object({ videoId: z.number(), keyword: z.string(), interval: z.number(), }))
        .mutation(async ({ ctx, input }) => {
            console.log('cat')
            if (!input.videoId) return;

            const videoId = await ctx.prisma.video.findUnique({
                where: { videoId: input.videoId },
                select: { id: true },
            });
            if (!videoId) return;
            const cardCurr = await ctx.prisma.card.findFirst({
                where: { vidId: videoId.id, keyword: input.keyword, interval: input.interval },
            })

            if (cardCurr) return




            console.log("fetching messages");
            const video = await ctx.prisma.video.findUnique({
                where: { id: "6411e354a2d610e58a34a28d" },
                include: {
                    comments: {
                        where: {
                            message: {
                                contains: "lul",
                                mode: "insensitive"
                            }
                        },
                        orderBy: {
                            contentOffsetSeconds: "asc"
                        },
                    },
                },
            });

            const messages = video?.comments;
            interface CommentCardCreate {
                timestamp: string;
                vidId: string;
                cardId: string;
                contentOffsetSeconds: number;
                msgIds: string[];
            }
            const newCard = await ctx.prisma.card.create({
                data: {
                    vidId: videoId.id,
                    keyword: input.keyword,
                    interval: input.interval,
                }
            })
            const cardId = newCard.id
            const card: CommentCardCreate[] = [] as CommentCardCreate[];
            if (!messages) return
            for (const message of messages) {

                function timeCalc(sec: number) {
                    const minutes = Math.floor(sec / 60);
                    let extraSec: string | number = sec % 60;
                    let extraMinutes: string | number = minutes % 60;
                    const hours = Math.floor(minutes / 60);
                    if (extraSec < 10) {
                        extraSec = "0" + `${extraSec}`;
                    }
                    if (extraMinutes < 10) {
                        extraMinutes = "0" + `${extraMinutes}`;
                    }
                    return `${hours}h:${extraMinutes}m:${extraSec}s`;
                }
                const x = Math.floor(
                    message.contentOffsetSeconds / input.interval
                );
                const begin = x * input.interval;
                const end = (x + 1) * input.interval;
                const timeMark = timeCalc(begin) + " : " + timeCalc(end);

                if (card[card.length - 1]?.timestamp === undefined || card[card.length - 1]?.timestamp !== timeMark) {

                    const newCard = {
                        timestamp: timeMark,
                        vidId: videoId.id,
                        cardId: cardId,
                        contentOffsetSeconds: message.contentOffsetSeconds,
                        msgIds: [message.id],
                    }
                    card.push(newCard)
                } else if (card[card.length - 1]?.timestamp === timeMark) {

                    card[card.length - 1]?.msgIds.push(message.id)
                } else {
                    console.log('its not working', card[card.length - 1]?.timestamp, timeMark)
                }




            }

            const updatedCards = card.map((c) => {
                return {
                    ...c,
                    count: c.msgIds.length,
                };
            }).filter(c => c.count > 1)
            const cards = await ctx.prisma.commentCard.createMany({ data: updatedCards })
            console.log('fished')
            return {
                greeting: `Hello ${input.videoId}`,
            };
        }),
    fetch: publicProcedure
        .input(z.object({ videoId: z.number() }))
        .mutation(async ({ ctx, input }) => {
            // const terms = await ctx.prisma.term.findMany({
            //     where: {
            //         term: "KEKW"
            //     },
            //     include: {
            //         Emote: true
            //     }
            // })
            // console.log(terms)
            const topTerms = await ctx.prisma.term.findMany({
                where: {
                    channelId: "64132b9b5a76a82ca3c2bf60"
                },
                include: {
                    Emote: true
                },
                orderBy: {
                    amount: 'desc'
                },
                take: 10
            })
            console.log(topTerms[3])
            return topTerms
        }),
    getSecretMessage: protectedProcedure.query(() => {

        return "you can now see this secret message!";
    }),
});
