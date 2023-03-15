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
            interface StreamerProfile {
                profile: {
                    headerImage: string;
                    title: string;
                };
                provider: string;
                broadcasterType: string;
                suspended: boolean;
                _id: string;
                providerId: string;
                avatar: string;
                username: string;
                alias: string;
                displayName: string;
                inactive: boolean;
                isPartner: boolean;
            }
            interface Emote {
                _id: string;
                name: string;
                type: string;
                width: number;
                height: number;
                gif: boolean;
                urls: { [key: string]: string };
            }
            interface EmoteData {
                twitchSubEmotes: Emote[];
            }
            const username = 'hasanabi'
            const userData = await fetch(
                `https://api.streamelements.com/kappa/v2/channels/${username}`,
                {
                    method: "GET",
                    headers: {
                        Accept: "application/json",
                        Authorization: `Bearer ${process.env.JWT_TOKEN_STREAM || ""}`,
                        "Content-Type": "application/json",
                    },
                }
            )
                .then((response) => response.json())
                .then((data: StreamerProfile) => {
                    return data;
                })
                .catch((error) => console.error(error));
            if (!userData) return
            const info = userData
            await ctx.prisma.channel.update({
                where: { streamer: info.displayName },
                data: { avatar: info.avatar, seId: info._id, },
            })
            console.log(info._id)
            const termData = await fetch(
                `https://api.streamelements.com/kappa/v2/channels/${info._id}/emotes`,
                {
                    method: "GET",
                    headers: {
                        Accept: "application/json",
                        Authorization: `Bearer ${process.env.JWT_TOKEN_STREAM || ""}`,
                        "Content-Type": "application/json",
                    },
                }
            )
                .then((response) => response.json())
                .then((data: EmoteData) => {
                    return data;
                })
                .catch((error) => console.error(error));
            for (const [emoteType, emotesObj] of Object.entries(termData)) {
                for (const [emoteName, emote] of Object.entries(emotesObj)) {

                    console.log(emote)
                    //   await ctx.prisma.emote.create({
                    //     data: {
                    //       emoteType,
                    //       emoteName,
                    //       emoteId: emote._id,
                    //       emoteType: emote.type,
                    //       emoteWidth: emote.width,
                    //       emoteHeight: emote.height,
                    //       emoteGif: emote.gif,
                    //       emoteUrl1: emote.urls["1"],
                    //       emoteUrl2: emote.urls["2"],
                    //       emoteUrl4: emote.urls["4"],
                    //     },
                    //   });
                }
            }
            return {
                greeting: `Hello ${input.videoId}`,
            };
        }),
    getSecretMessage: protectedProcedure.query(() => {

        return "you can now see this secret message!";
    }),
});
