import { z } from "zod";
import {
    createTRPCRouter,
    publicProcedure,
    protectedProcedure,
} from "~/server/api/trpc";

export const commentRouter = createTRPCRouter({
    getComments: publicProcedure
        .input(
            z.object({
                videoId: z.number(),
                keyword: z.string(),
                interval: z.number(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            if (!input.videoId) return;
            const videoId = await ctx.prisma.video.findUnique({
                where: { videoId: input.videoId },
                select: { id: true },
            });
            if (!videoId) return;

            const messagesByOffsetSeconds: Comment[] = [];
            type Comment = {
                id: string;
                message: string;
                commenter: string;
                contentOffsetSeconds: number;
                timestamp: string;
                vidId: string;
            };

            let done = false;
            let skip = 0;
            const pageSize = 1000;
            let b = [];
            while (!done) {
                const messages = await ctx.prisma.msg.findMany({
                    where: {
                        vidId: videoId.id,
                    },
                    orderBy: {
                        contentOffsetSeconds: "asc",
                    },
                    skip,
                    take: pageSize,
                });

                const uniqueContentOffsetSeconds = new Set(
                    messages.filter((m) => m.message.toLowerCase().includes(input.keyword)).map((m) => m.contentOffsetSeconds)
                );
                const x = messages.filter((m) => m.message.includes(input.keyword))
                // console.log(uniqueContentOffsetSeconds, input.keyword)
                for (const contentOffsetSeconds of uniqueContentOffsetSeconds) {
                    const mapComm = messages.filter((m) => m.contentOffsetSeconds === contentOffsetSeconds && m.message.toLowerCase().includes(input.keyword))
                    console.log(mapComm)
                    let a = {
                        keyword: input.keyword,
                        timeStamp: contentOffsetSeconds.toString(),
                        vidId: videoId.id,
                        contentOffsetSeconds: contentOffsetSeconds,
                        msgIds: messages
                            .filter(
                                (m) => m.contentOffsetSeconds === contentOffsetSeconds && m.message.toLowerCase().includes(input.keyword)
                            )
                            .map((m) => [m.id, m.message, m.contentOffsetSeconds, m.commenter]),
                    }

                    // if (!existingCard) {
                    //     const card = await ctx.prisma.commentCard.create({
                    //         data: {
                    //             keyword: input.keyword,
                    //             timeStamp: contentOffsetSeconds.toString(),
                    //             vidId: videoId.id,
                    //             contentOffsetSeconds: contentOffsetSeconds,
                    //             msgIds: messages
                    //                 .filter(
                    //                     (m) => m.contentOffsetSeconds === contentOffsetSeconds && m.message.toLowerCase().includes(input.keyword)
                    //                 )
                    //                 .map((m) => m.id),
                    //         },
                    //     });

                    // }

                }
                if (messages.length < pageSize) {
                    done = true;
                } else {
                    skip += pageSize;
                }
            }

            return {
                greeting: `Hello ${input.videoId}`,
            };
        }),
    fetch: publicProcedure
        .input(z.object({ videoId: z.number() }))
        .mutation(async ({ ctx, input }) => {
            const groupedMessages = await ctx.prisma.msg.groupBy({
                by: ["contentOffsetSeconds"],
            });

            return {
                greeting: `Hello ${input.videoId}`,
            };
        }),
    getSecretMessage: protectedProcedure.query(() => {
        // Group messages by contentOffsetSeconds
        // messages.forEach((msg) => {
        //     function timeCalc(sec: number): string {
        //         const minutes = Math.floor(sec / 60);
        //         const extraSec = sec % 60;
        //         const extraMinutes = minutes % 60;
        //         const hours = Math.floor(minutes / 60);
        //         let seconds = '';
        //         let minutesStr = '';

        //         if (extraSec < 10) {
        //             seconds = `0${extraSec}`;
        //         } else {
        //             seconds = extraSec.toString();
        //         }

        //         if (extraMinutes < 10) {
        //             minutesStr = `0${extraMinutes}`;
        //         } else {
        //             minutesStr = extraMinutes.toString();
        //         }

        //         return `${hours}h:${minutesStr}m:${seconds}s`;
        //     }
        //     const segment = Math.floor(
        //         msg.contentOffsetSeconds / input.interval
        //     );
        //     const segmentBegin = segment * input.interval;
        //     const segmentEnd = (segment + 1) * input.interval;
        //     const timestampCalc = timeCalc(segmentBegin) + " : " + timeCalc(segmentEnd);
        //     if (timestampCalc !== timestamp && msg.message.includes(input.keyword)) {

        //         msgs.push(msg)
        //         commentCard.push(timestampCalc)
        //     }
        //     console.log(commentCard, msgs);

        // });

        // Check if we've fetched all messages
        return "you can now see this secret message!";
    }),
});
