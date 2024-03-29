import { z } from "zod";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";
import type {
  VideoResponse,
  TwitchVideo,
  TwitchVideoResponse,
  Channel,
  EmojiData,
  HashtagData,
  EmoteData,
  TermDataInput,
  EmoteCreateManyInput,
  EmoteGroup,
  Emote,
  StreamerProfile,
  Emotes,
} from "~/types/video";
import { pusher } from "~/utils/pusher";

export const videoRouter = createTRPCRouter({
  getVideo: publicProcedure
    .input(z.object({ videoId: z.number() }))
    .query(async ({ input, ctx }) => {
      const toggle = await ctx.prisma.video.findFirst({
        where: { videoId: input.videoId },
        select: { complete: true, streamer: true },
      });
      //if video does not exist we start fetching data but instantly return true to enable progress bar
      if (!toggle) {
        processVideo()
          .then((result) => {
            return result;
          })
          .catch((error) => {
            console.error(error);
          });

        return true;
      } else if (!toggle.complete) {
        //incase it is already being saved by other user send true to enable progress bar
        return true;
      } else {
        return false;
      }

      async function processVideo() {
        try {
          const vidInfo = await grabVideoData();
          if (!vidInfo) return false;
          let chanExists = await checkChanExist(vidInfo);
          if (!chanExists) {
            chanExists = await createChannel(vidInfo);
            const checkIfChannelHasData = await getChannelEmotesUrls(
              chanExists
            );
            if (checkIfChannelHasData) {
              chanExists = checkIfChannelHasData;
              if (chanExists.seId)
                await addEmotesToChannel(chanExists.streamer, chanExists.id);
            } else {
              // await ctx.prisma.video.NO EMOTES
            }
          }
          const videoInfo = await createVideo(vidInfo, chanExists);
          const vidLengthS = convertToSeconds(videoInfo.duration);
          const midSecond = Math.floor(vidLengthS / 2);
          await getComments(0.0, vidLengthS, midSecond, videoInfo.id);
        } catch (error) {
          console.error(error);
          return false;
        }
      }
      async function addEmotesToChannel(
        streamerUsername: string,
        channelObjectId: string
      ) {
        const termData = await fetch(
          `https://api.streamelements.com/kappa/v2/chatstats/${streamerUsername}/stats?limit=10`,
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
          .then((data: EmojiData) => {
            return data;
          })
          .catch((error) => console.error(error));
        if (!termData) return { error: "Invalid Request" };
        function mapEmotes(emotes: EmoteData[], type: string): TermDataInput[] {
          return emotes.map((emote: EmoteData) => ({
            term: emote.emote,
            channelId: channelObjectId,
            amount: emote.amount,
            emojiId: emote.id,
            type,
          }));
        }

        const ffzEmotes = mapEmotes(termData.ffzEmotes, "ffz");
        const twitchEmotes = mapEmotes(termData.twitchEmotes, "twitch");
        const bttvEmotes = mapEmotes(termData.bttvEmotes, "bttv");
        const mergedEmotes = ffzEmotes.concat(twitchEmotes, bttvEmotes);

        await ctx.prisma.term.createMany({
          data: mergedEmotes,
        });
        const termIds = await ctx.prisma.term.findMany({
          where: { channelId: channelObjectId },
          select: { id: true },
        });

        const termIdArray = termIds.map((term) => ({ id: term.id }));
        await ctx.prisma.channel.update({
          where: {
            id: channelObjectId,
          },
          data: {
            terms: {
              set: termIdArray,
            },
          },
        });
      }

      async function grabVideoData() {
        return fetch(`https://api.twitch.tv/helix/videos?id=${input.videoId}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${process.env.TWITCH_TOKEN || " "}`,
            "Client-Id": `${process.env.TWITCH_CLIENT_ID || " "}`,
          },
        })
          .then((response) => response.json())
          .then((videoResult: TwitchVideoResponse) => {
            const vidInfo = videoResult.data[0];
            if (vidInfo !== undefined) {
              return vidInfo;
              // await createChannel(vidInfo);
            }
          })
          .catch((error) => {
            console.error(error);
          });
      }
      async function checkChanExist(vidInfo: TwitchVideo) {
        const channel = await ctx.prisma.channel.findUnique({
          where: { streamer: vidInfo.user_name },
        });
        return channel;
      }
      async function getChannelEmotesUrls(chanExists: Channel) {
        async function addStreamEleIdToChannel(username: string) {
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
              console.log(data);
              return data;
            })
            .catch((error) => console.error(error));
          if (userData) {
            const info = userData;

            const updatedChannel = await ctx.prisma.channel.update({
              where: { streamer: info.displayName },
              data: { avatar: info.avatar, seId: info._id },
            });

            return updatedChannel;
          } else {
            return false;
          }
        }
        async function addEmotesToChannel(streamEleChanId: string) {
          function isEmote(value: Emote | null): value is Emote {
            return value !== null;
          }
          //fetch and filter emotes
          const emoteData = await fetch(
            `https://api.streamelements.com/kappa/v2/channels/${streamEleChanId}/emotes`,
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
            .then((data: Emotes) => {
              const dataValues = Object.values(data);
              const dataFlat: EmoteGroup[] = dataValues.flat() as EmoteGroup[];
              const dataf: (Emote | null)[] = dataFlat.flatMap((emoteGroup) =>
                Object.values(emoteGroup || {})
              );
              const filtered = dataf.filter(isEmote);
              console.log(filtered);
              return filtered;
            })
            .catch((error) => console.error(error));
          if (!emoteData) return;
          const mapEmotes = emoteData.map((info) => {
            return {
              emojiId: info._id,
              name: info.name,
              gif: info.gif,
              type: info.type,
              url1: info.urls["1"],
              url2: info.urls["2"],
              url3: info.urls["4"],
            };
          });
          const existingEmotes = await ctx.prisma.emote.findMany({
            select: {
              emojiId: true,
            },
          });
          const existingEmojiIds = new Set(
            existingEmotes.map((emote) => emote.emojiId)
          );
          const uniqueEmoteData = mapEmotes.filter(
            (emote) => !existingEmojiIds.has(emote.emojiId)
          );
          if (uniqueEmoteData.length > 0) {
            await ctx.prisma.emote.createMany({
              data: uniqueEmoteData as EmoteCreateManyInput[],
            });
          }
        }
        const chanInfo = await addStreamEleIdToChannel(chanExists.streamer);
        if (chanInfo)
          if (chanInfo.seId) await addEmotesToChannel(chanInfo.seId);
          else {
            return false;
          }
        return chanInfo;
      }

      async function createChannel(vidInfo: TwitchVideo) {
        const newStreamer = await ctx.prisma.channel.create({
          data: { streamer: vidInfo.user_name },
        });
        return newStreamer;
      }
      function convertToSeconds(str: string) {
        if (str.length > 6) {
          const timeArr = str.split(/[hms]/) as [string, string, string];
          const hours = parseInt(timeArr[0], 10) || 0;
          const minutes = parseInt(timeArr[1], 10) || 0;
          const seconds = parseInt(timeArr[2], 10) || 0;
          return hours * 3600 + minutes * 60 + seconds;
        } else if (str.length > 3) {
          const timeArr = str.split(/[ms]/) as [string, string];
          const minutes = parseInt(timeArr[0], 10) || 0;
          const seconds = parseInt(timeArr[1], 10) || 0;
          return minutes * 60 + seconds;
        } else {
          const timeArr = str.split(/[s]/) as [string];
          const seconds = parseInt(timeArr[0], 10) || 0;
          return seconds;
        }
      }
      async function createVideo(vidInfo: TwitchVideo, channel: Channel) {
        const data = {
          videoId: input.videoId,
          channelId: channel.id,
          streamer: vidInfo.user_name,
          title: vidInfo.title,
          thumbnail: vidInfo.thumbnail_url,
          duration: vidInfo.duration,
          views: vidInfo.view_count,
          date: vidInfo.created_at,
          description: vidInfo.description,
          language: vidInfo.language,
          url: vidInfo.url,
          createdAt: vidInfo.created_at,
          likes: 0,
        };
        const video = await ctx.prisma.video.create({ data: data });

        await ctx.prisma.channel.update({
          where: { id: channel.id },
          data: { videoIds: { push: video.id } },
        });

        return video;
      }
      async function getComments(
        firstSecond: number,
        vidLength: number,
        midSecond: number,
        vidObjId: string
      ) {
        interface Message {
          message: string;
          commenter: string;
          contentOffsetSeconds: number;
          vidId: string;
          commentId: string;
        }

        //i take in first middle last second to place 4 pointers
        //2 in middle 1 in front and back
        //they converge on each other
        //i calc percent from the diff between them
        let percentTemp = 0;
        let firstCommentCursor: string | null = null;
        let midCommentCursor: string | null = null;
        let midForwardSec = midSecond;
        let midBackwardSec = midSecond;
        let endSecond = vidLength;
        let comments: Message[] = [];
        const seenCommentIds = new Set();
        function calculatePercentage(head: number, tail: number) {
          const percentHead = (head / midSecond) * 100;
          const percentTail = (tail / midSecond) * 100 - 100;
          return Math.min(percentHead, percentTail);
        }

        async function fetchComments(direction: string) {
          //going forward use cursor going backwards use seconds
          //generates the variables for fetch
          function generateQuery() {
            const queryVariablesStart = firstCommentCursor
              ? {
                  videoID: input.videoId.toString(),
                  cursor: firstCommentCursor,
                }
              : {
                  videoID: input.videoId.toString(),
                  contentOffsetSeconds: 0.0,
                };

            const queryVariablesEnd = {
              videoID: input.videoId.toString(),
              contentOffsetSeconds: endSecond,
            };

            const queryVariablesMidEnd = {
              videoID: input.videoId.toString(),
              contentOffsetSeconds: midBackwardSec,
            };

            const queryVariablesMidStart = midCommentCursor
              ? {
                  videoID: input.videoId.toString(),
                  cursor: midCommentCursor,
                }
              : {
                  videoID: input.videoId.toString(),
                  contentOffsetSeconds: midForwardSec,
                };

            let queryVariables;

            switch (direction) {
              case "start":
                queryVariables = queryVariablesStart;
                break;
              case "midBackwards":
                queryVariables = queryVariablesMidEnd;
                break;
              case "midForward":
                queryVariables = queryVariablesMidStart;
                break;
              default:
                queryVariables = queryVariablesEnd;
            }
            return queryVariables;
          }
          const queryVariables = generateQuery();

          const response = await fetch("https://gql.twitch.tv/gql", {
            method: "POST",
            headers: {
              "Content-Type": "text/plain",
              "Client-ID": "kimne78kx3ncx6brgo4mv6wki5h1ko",
            },
            body: JSON.stringify([
              {
                operationName: "VideoCommentsByOffsetOrCursor",
                variables: queryVariables,
                extensions: {
                  persistedQuery: {
                    version: 1,
                    sha256Hash:
                      "b70a3591ff0f4e0313d126c6a1502d79a1c02baebb288227c582044aa76adf6a",
                  },
                },
              },
            ]),
          })
            .then((res) => res.json() as Promise<VideoResponse[]>)
            .then((res) => res[0]?.data.video.comments.edges);
          if (response) {
            switch (direction) {
              case "start":
                const newCursor = response[response.length - 1]?.cursor;
                const firstSecondNew =
                  response[response.length - 1]?.node.contentOffsetSeconds;
                if (newCursor && firstSecondNew) {
                  firstSecond = firstSecondNew;
                  firstCommentCursor = newCursor;
                }
                break;
              case "midBackwards":
                const midSecNew = response[0]?.node.contentOffsetSeconds;
                if (midSecNew) midBackwardSec = midSecNew;
                break;
              case "midForward":
                const midCursorNew = response[response.length - 1]?.cursor;
                const midForwardSecNew =
                  response[response.length - 1]?.node.contentOffsetSeconds;
                if (midCursorNew && midForwardSecNew) {
                  midCommentCursor = midCursorNew;
                  midForwardSec = midForwardSecNew;
                }
                break;
              default:
                const lastSecondNew = response[0]?.node.contentOffsetSeconds;
                if (lastSecondNew) endSecond = lastSecondNew;
            }
            const mapedCommments = response.map((comment) => {
              let msg = "";
              for (let i = 0; i < comment.node.message.fragments?.length; i++) {
                const text = comment.node.message.fragments[i]?.text;
                msg += text;
              }
              return {
                message: msg,
                commentId: comment.node.id,
                commenter: comment.node.commenter?.displayName,
                contentOffsetSeconds: comment.node.contentOffsetSeconds,
                vidId: vidObjId,
              };
            });
            return mapedCommments;
          } else {
            console.error("undefined response");
          }
        }
        while (firstSecond < midBackwardSec || midForwardSec < endSecond) {
          //send a push every variable% && calculates percentage completed
          const sumHead = midSecond - midBackwardSec + firstSecond;
          const sumTail = vidLength - endSecond + midForwardSec;
          const percent = calculatePercentage(sumHead, sumTail);
          const variable = 4;
          if (
            (percent === 0 && percentTemp > 0) ||
            percent > percentTemp + variable
          ) {
            try {
              await pusher.trigger(`${input.videoId}`, "update", percent);
            } catch (err) {
              console.error(err);
            }
            percentTemp = percent;
          }
          //loop thhat fetches comments using 4 pormise all at begining middle and end convering
          async function promiseAllFetches() {
            if (firstSecond < midBackwardSec && midForwardSec < endSecond) {
              const [
                startComments,
                midBackwardComments,
                midForwardComments,
                endComments,
              ] = await Promise.all([
                fetchComments("start"),
                fetchComments("midBackwards"),
                fetchComments("midForward"),
                fetchComments("end"),
              ]);
              if (
                startComments &&
                midBackwardComments &&
                midForwardComments &&
                endComments
              ) {
                comments.push(
                  ...startComments,
                  ...midBackwardComments,
                  ...midForwardComments,
                  ...endComments
                );
              }
            } else if (midForwardSec >= endSecond) {
              const [startComments, midBackwardComments] = await Promise.all([
                fetchComments("start"),
                fetchComments("midBackwards"),
              ]);
              if (startComments && midBackwardComments) {
                comments.push(...startComments, ...midBackwardComments);
              }
            } else if (firstSecond >= midBackwardSec) {
              const [midForwardComments, endComments] = await Promise.all([
                fetchComments("midForward"),
                fetchComments("end"),
              ]);
              if (midForwardComments && endComments) {
                comments.push(...midForwardComments, ...endComments);
              }
            }
          }
          if (comments.length > 2000) {
            await saveFilter();
          }
          await promiseAllFetches();
        }
        //saves comments to db and pushes id to global set for filtering
        async function saveFilter() {
          const uniqueComments: Message[] = [];
          comments.forEach((comment) => {
            if (!seenCommentIds.has(comment.commentId)) {
              uniqueComments.push(comment);
              seenCommentIds.add(comment.commentId);
            }
          });
          if (uniqueComments.length > 0) {
            await ctx.prisma.msg.createMany({
              data: uniqueComments,
            });
          }
          comments = [];
        }

        await pusher.trigger(`${input.videoId}`, "closeVod", true);
        if (comments.length > 0) {
          await saveFilter();
        }

        await ctx.prisma.video.update({
          where: { videoId: +input.videoId },
          data: { complete: true },
        });
      }
    }),
  getFive: publicProcedure.query(async ({ ctx }) => {
    return ctx.prisma.video.findMany({
      select: {
        title: true,
        streamer: true,
        views: true,
        thumbnail: true,
        language: true,
        videoId: true,
        date: true,
        likes: true,
      },
      orderBy: {
        likes: "desc",
      },
      take: 5,
    });
  }),

  getAll: publicProcedure.query(async ({ ctx }) => {
    return ctx.prisma.video.findMany({
      select: {
        title: true,
        streamer: true,
        views: true,
        thumbnail: true,
        language: true,
        videoId: true,
        date: true,
        likes: true,
      },
      orderBy: {
        likes: "desc",
      },
    });
  }),
  deleteAll: publicProcedure
    .input(z.object({ videoId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      // const video = await ctx.prisma.video.findUnique({
      //   where: { videoId: input.videoId },
      //   select: { id: true, channelId: true },
      // });

      await ctx.prisma.msg.deleteMany({});
      await ctx.prisma.hashtag.deleteMany({});

      await ctx.prisma.term.deleteMany({});
      await ctx.prisma.emote.deleteMany({});

      await ctx.prisma.commentCard.deleteMany({});
      await ctx.prisma.card.deleteMany({});
      await ctx.prisma.video.deleteMany({});
      await ctx.prisma.channel.deleteMany({});
      // const vidId = video?.id;

      // if (vidId) {

      //   await ctx.prisma.msg.deleteMany({
      //     where: { vidId: vidId },
      //   });
      //   await ctx.prisma.commentCard.deleteMany({ where: { vidId: video.id } });
      //   await ctx.prisma.card.deleteMany({ where: { vidId: video.id } });
      //   await ctx.prisma.term.deleteMany({ where: { channelId: video.channelId } })
      //   await ctx.prisma.hashtag.deleteMany({ where: { channelId: video.channelId } })
      //   await ctx.prisma.emote.deleteMany({

      //   });
      //   await ctx.prisma.video.deleteMany({
      //     where: { id: vidId },
      //   });
      //   await ctx.prisma.channel.deleteMany({
      //     where: { id: video.channelId },
      //   });

      // }
      console.log("success");
      return {
        greeting: `Hello ${input.videoId}`,
      };
    }),
  fetch: publicProcedure
    .input(z.object({ videoId: z.number() }))
    .mutation(async ({ ctx }) => {
      await ctx.prisma.commentCard.findMany({
        where: {
          cardId: "6411f36b4c068fec0b6fc0af",
          count: {
            gt: 25,
          },
        },
        include: {
          messages: true,
        },
        orderBy: {
          count: "asc",
        },
      });

      return {
        response: "dog",
      };
    }),
  getSecretMessage: protectedProcedure.query(() => {
    return "you can now see this secret message!";
  }),
});
