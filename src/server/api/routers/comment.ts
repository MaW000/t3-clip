import { z } from "zod";
import {
    createTRPCRouter,
    publicProcedure,
    protectedProcedure,
} from "~/server/api/trpc";


export const commentRouter = createTRPCRouter({
    getComments: publicProcedure
        .input(z.object({ videoId: z.number(), keyword: z.string(), interval: z.number().default(30), }))
        .mutation(async ({ ctx, input }) => {

            function escapeSpecialChars(keyword: string) {
                return keyword.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
            }
            if (!input.videoId) return;

            const videoId = await ctx.prisma.video.findUnique({
                where: { videoId: input.videoId },
                select: { id: true, channelId: true },
            });
            if (!videoId) return;

            const cardCurr = await ctx.prisma.card.findFirst({
                where: { vidId: videoId.id, keyword: input.keyword, interval: input.interval },
            })

            const emoteDb = await ctx.prisma.term.findFirst({
                where: { term: input.keyword },
                include: {
                    Emote: true

                }
            })

            if (cardCurr || !emoteDb) return




            const keyword = escapeSpecialChars(input.keyword)
            const video = await ctx.prisma.video.findUnique({
                where: { id: videoId.id },
                include: {
                    comments: {
                        where: {
                            message: {
                                contains: keyword,

                            }
                        },
                        orderBy: {
                            contentOffsetSeconds: "asc"
                        },
                    },
                },
            });



            if (video?.comments.length === 0) {
                // const updatedCarda = await ctx.prisma.term.delete({
                //     where: {
                //         id: emoteDb.id,
                //     },
                // })

                return { message: "No comments found" }
            }
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
                    likes: 0
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
                }



            }

            let updatedCards = card.map((c) => {

                return {
                    ...c,
                    count: c.msgIds.length,
                    likes: 0
                };
            }).filter(c => c.count > 1)

            if (updatedCards.length === 0) {
                updatedCards = card.map((c) => {

                    return {
                        ...c,
                        count: c.msgIds.length,
                        likes: 0
                    };
                })

            }
            await ctx.prisma.commentCard.createMany({ data: updatedCards })
            const avgCount = await ctx.prisma.commentCard.aggregate({
                where: {

                    cardId: cardId
                },
                _avg: { count: true },
                _sum: { count: true },
                _min: { count: true },
                _max: { count: true },
            });
            if (!avgCount) return
            if (!avgCount._sum.count || !emoteDb.Emote?.url2 || !avgCount._avg.count || !avgCount._min.count || !avgCount._max.count) return

            const a = {
                sum: avgCount._sum.count,
                avg: Math.round(avgCount._avg.count),
                min: avgCount._min.count,
                max: avgCount._max.count,
                url: emoteDb.Emote.url1
            }

            await ctx.prisma.card.update({
                data: a,
                where: {
                    id: cardId,
                },
            });
            // const updatedCarda = await ctx.prisma.term.delete({
            //     where: {
            //         id: emoteDb.id,
            //     },
            // });
            const finalCard = await ctx.prisma.card.findFirst({
                where: { id: cardId },
            })


            return finalCard
        }),
    fetch: publicProcedure
        .input(z.object({ videoId: z.number() }))
        .mutation(async ({ ctx, }) => {

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
            const avgCount = await ctx.prisma.commentCard.aggregate({
                where: {

                    cardId: "6414571af94778d39826d427"
                },
                _avg: { count: true },
                _sum: { count: true },
                _min: { count: true },
                _max: { count: true },
            });
            if (!avgCount) return
            if (!avgCount._sum.count || !avgCount._avg.count || !avgCount._min.count || !avgCount._max.count) return
            return topTerms
        }),
    getSecretMessage: protectedProcedure.query(() => {

        return "you can now see this secret message!";
    }),
});
