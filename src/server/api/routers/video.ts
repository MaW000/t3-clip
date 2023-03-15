import { z } from "zod";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";
import { pusher } from "~/utils/pusher";

export const videoRouter = createTRPCRouter({
  getVideo: publicProcedure
    .input(z.object({ videoId: z.number() }))
    .mutation(async ({ input, ctx }) => {

      const toggle = await ctx.prisma.video.findFirst({
        where: { videoId: input.videoId },
        select: { complete: true },
      });
      //if video does not exist we start fetching data but instantly return video is fetching to update ui.
      if (!toggle) {
        console.log('a')
        VideoDataFetch();

        return { fetch: `Video has started fetching comments` };
      } else if (!toggle.complete) {
        return { fetch: `video is saving` };
      } else {
        return { saved: `video is saved` };
      }

      function VideoDataFetch() {
        interface TwitchVideo {
          id: string;
          user_id: string;
          stream_id: string;
          user_name: string;
          title: string;
          description: string;
          created_at: string;
          published_at: string;
          url: string;
          thumbnail_url: string;
          viewable: string;
          view_count: number;
          language: string;
          type: string;
          duration: string;
          muted_segments: null;
        }
        interface TwitchVideoResponse {
          data: TwitchVideo[];
          pagination: {
            cursor: string;
          };
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
        console.log('dog')
        async function processVideo(vidInfo: TwitchVideo) {
          const channelAndVideoSave = async () => {
            interface Channel {
              id: string;
              streamer: string;
            }
            let channel: Channel | null = null;

            channel = await ctx.prisma.channel.findUnique({
              where: { streamer: vidInfo.user_name },
            });

            if (!channel) {
              const newStreamer = await ctx.prisma.channel.create({
                data: { streamer: vidInfo.user_name },
              });
              channel = newStreamer;
              await getChannelTerms(channel.streamer, channel.id);
            }
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
            };
            const video = await ctx.prisma.video.create({ data: data });

            const updatedChannel = await ctx.prisma.channel.update({
              where: { id: channel.id },
              data: { videoIds: { push: video.id } },
            });
            console.log(updatedChannel)
            return video;
          };

          const videoObj = await channelAndVideoSave();
          const vidLengthS = convertToSeconds(vidInfo.duration);
          const midSecond = Math.floor(vidLengthS / 2);
          await getComments(0.0, vidLengthS, midSecond, videoObj.id);
        }

        fetch(`https://api.twitch.tv/helix/videos?id=${input.videoId}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${process.env.TWITCH_TOKEN || " "}`,
            "Client-Id": `${process.env.TWITCH_CLIENT_ID || " "}`,
          },
        })
          .then((response) => response.json())
          .then(async (videoResult: TwitchVideoResponse) => {
            const vidInfo = videoResult.data[0];
            if (vidInfo !== undefined) {
              await processVideo(vidInfo);
            }
          })
          .catch((error) => {
            console.error(error);
          });
      }



      async function getChannelTerms(username: string, channelObjectId: string) {
        interface EmojiData {
          channel: string;
          totalMessages: number;
          chatters: [];
          hashtags: [];
          commands: [];
          bttvEmotes: [];
          ffzEmotes: [];
          twitchEmotes: [];
        }
        interface HashtagData {
          hashtag: string;
          amount: number;
        }
        interface EmoteData {
          id: string;
          emote: string;
          amount: number;
        }
        console.log(username)
        const termData = await fetch(
          `https://api.streamelements.com/kappa/v2/chatstats/${username}/stats?limit=10`,
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
        console.log(termData)
        if (!termData) return { error: `Invalid Request` };
        const emote: EmoteData[] = termData.bttvEmotes.concat(
          termData.ffzEmotes,
          termData.twitchEmotes
        );
        const bttvEmotes = termData.bttvEmotes.map((emote: EmoteData) => {
          return {
            term: emote.emote,
            channelId: channelObjectId,
            amount: emote.amount,
            emojiId: emote.id,
            type: 'bttvEmotes'
          }
        });
        const hashtags = termData.hashtags
          .filter((hashtag: HashtagData) => hashtag.hashtag.length > 0)
          .map((hashtag: HashtagData) => ({
            hashtag: hashtag.hashtag,
            channelId: channelObjectId,
            amount: hashtag.amount,
          }));
        const terms = emote
          .filter((term: EmoteData) => term.emote.length > 0)
          .map((term: EmoteData) => {
            console.log(term)
            return {
              term: term.emote,
              channelId: channelObjectId,
              amount: term.amount,
              emojiId: term.id,
            }
          });

        await ctx.prisma.hashtag.createMany({ data: hashtags });
        await ctx.prisma.term.createMany({
          data: terms,
        })

        const termIds = await ctx.prisma.term.findMany({ where: { channelId: channelObjectId }, select: { id: true } })

        const termIdArray = termIds.map((term) => ({ id: term.id }));
        const hashtagIds = await ctx.prisma.hashtag.findMany({ where: { channelId: channelObjectId }, select: { id: true } })
        const hashtagIdArray = hashtagIds.map((hashtag) => ({ id: hashtag.id }));


        await ctx.prisma.channel.update({
          where: {
            id: channelObjectId
          },
          data: {
            hashtags: {
              set: hashtagIdArray
            },
            terms: {
              set: termIdArray
            }
          }
        });

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
        //NOTE going forward use cursor going backwards use seconds found out the hard way
        let p = 0;
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
          interface VideoResponse {
            data: {
              video: {
                id: string;
                creator: {
                  id: string;
                  channel: {
                    id: string;
                    __typename: string;
                  };
                  __typename: string;
                };
                comments: {
                  edges: {
                    cursor: string;
                    node: {
                      id: string;
                      commenter: {
                        id: string;
                        login: string;
                        displayName: string;
                        __typename: string;
                      };
                      contentOffsetSeconds: number;
                      createdAt: string;
                      message: {
                        fragments: [
                          {
                            emote: string;
                            text: string;
                            __typename: string;
                          }
                        ];
                        userBadges: [
                          {
                            id: string;
                            setID: string;
                            version: string;
                            __typename: string;
                          }
                        ];
                        userColor: string;
                        __typename: string;
                      };
                      __typename: string;
                    };
                    __typename: string;
                  }[];
                  pageInfo: {
                    hasNextPage: boolean;
                    hasPreviousPage: boolean;
                    __typename: string;
                  };
                  __typename: string;
                };
                __typename: string;
              };
            };
            extensions: {
              durationMilliseconds: number;
              operationName: string;
              requestID: string;
            };
          }

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
              ? { videoID: input.videoId.toString(), cursor: midCommentCursor }
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
          const sumHead = midSecond - midBackwardSec + firstSecond;
          const sumTail = vidLength - endSecond + midForwardSec;
          const percent = calculatePercentage(sumHead, sumTail);
          //send a push every 5%
          console.log(percent)
          if (percent >= p + 1) {
            console.log(percent)
            await pusher.trigger(`${input.videoId}`, "update", percent);
            p = percent;
          }

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
            await saveFilter(vidObjId);
          }
          await promiseAllFetches();
        }

        async function saveFilter(vidObjId: string) {
          const uniqueComments: Message[] = [];

          comments.forEach((comment) => {
            if (!seenCommentIds.has(comment.commentId)) {
              uniqueComments.push(comment);
              seenCommentIds.add(comment.commentId);
            }
          });


          await ctx.prisma.msg.createMany({
            data: uniqueComments,
          });
          comments = [];
        }

        await pusher.trigger(`${input.videoId}`, "closeVod", true);
        if (comments.length > 0) {
          await saveFilter(vidObjId);
        }
        await ctx.prisma.video.update({
          where: { videoId: input.videoId },
          data: { complete: true },
        })
        console.log('saving complete')
      }

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
      },
    });
  }),

  deleteAll: publicProcedure
    .input(z.object({ videoId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const video = await ctx.prisma.video.findUnique({
        where: { videoId: input.videoId },
        select: { id: true, channelId: true },
      });


      const vidId = video?.id;

      if (vidId) {
        await ctx.prisma.msg.deleteMany({
          where: { vidId: vidId },
        });
        await ctx.prisma.commentCard.deleteMany({ where: { vidId: video.id } });
        await ctx.prisma.card.deleteMany({ where: { vidId: video.id } });
        await ctx.prisma.term.deleteMany({ where: { channelId: video.channelId } })
        await ctx.prisma.hashtag.deleteMany({ where: { channelId: video.channelId } })

        await ctx.prisma.video.deleteMany({
          where: { id: vidId },
        });
        await ctx.prisma.channel.deleteMany({
          where: { id: video.channelId },
        });
        console.log("delete complete");
      }

      return {
        greeting: `Hello ${input.videoId}`,
      };
    }),
  fetch: publicProcedure
    .input(z.object({ videoId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      console.log(input)
      console.log("fetching");
      const commentCards = await ctx.prisma.commentCard.findMany({
        where: {
          cardId: "6411f36b4c068fec0b6fc0af",
          count: {
            gt: 25
          }
        },
        include: {
          messages: true
        },
        orderBy: {
          count: "asc"
        },
      })
      console.log(commentCards[0]?.messages)
      return {
        response: 'dog',
      };
    }),
  getSecretMessage: protectedProcedure.query(() => {
    return "you can now see this secret message!";
  }),
});
