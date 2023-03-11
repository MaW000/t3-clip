import type {
  TwitchVideoResponse,
  TwitchVideoCommentResponse,
  VideoCommentEdge,
  UniqueCommentsResult
} from "~/types";
import { z } from "zod";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";
import { pusher } from '~/utils/pusher'

export const exampleRouter = createTRPCRouter({
  getVideo: publicProcedure
    .input(z.object({ videoId: z.number() }))
    .query(async ({ input, ctx }) => {
      let comments: VideoCommentEdge[] = [];
      let vidLength: number
      let lastSecond = 0.0;
      let lastCommentCursor = "";
      let firstSecond: number;

      const toggle = await ctx.prisma.video.findFirst({ where: { videoId: input.videoId }, select: { complete: true } })

      if (!toggle) {
        await VideoDataFetch()
        await getComments()
        return { fetch: `Video has started fetching comments` };

      } else if (!toggle.complete) {
        return { fetch: `video is saving` };
      } else {
        return { saved: `video is saved` };
      }

      async function VideoDataFetch() {
        function convertToSeconds(str: string) {
          const timeArr = str.split(/[hms]/) as [string, string, string]; // use type assertion to tell the compiler that str is a string

          const hours = parseInt(timeArr[0], 10) || 0; // convert hours to number, default to 0
          const minutes = parseInt(timeArr[1], 10) || 0; // convert minutes to number, default to 0
          const seconds = parseInt(timeArr[2], 10) || 0; // convert seconds to number, default to 0

          return hours * 3600 + minutes * 60 + seconds;
        }
        const videoFetch = await fetch(
          `https://api.twitch.tv/helix/videos?id=${input.videoId}`,
          {
            method: "GET",
            headers: {
              Authorization: "Bearer kkme0h063j58yzhtenquyc3k8hd58a",
              "Client-Id": "03ui98fof7c081piwhb3oj6ecelzpn",
            },
          }
        );
        const videoResult = (await videoFetch.json()) as TwitchVideoResponse;
        const data = {
          videoId: input.videoId,
          userName: videoResult.data[0]?.user_name,
          title: videoResult.data[0]?.title,
          thumbnail: videoResult.data[0]?.thumbnail_url,
          duration: videoResult.data[0]?.duration,
          views: videoResult.data[0]?.view_count,
          date: videoResult.data[0]?.created_at,
          description: videoResult.data[0]?.description,
          url: videoResult.data[0]?.url
        }
        const time = videoResult.data[0]?.duration;
        await ctx.prisma.video.create({ data: data })

        if (!time) {
          // handle the case when time is undefined
          throw new Error("Time is undefined");
        }

        const vidLengthS = convertToSeconds(time);
        // console.log(seconds)
        vidLength = vidLengthS
        firstSecond = vidLengthS
        await getComments()
      }

      async function getComments() {
        async function headComments() {
          const queryVariablesStart = lastCommentCursor
            ? { videoID: `${input.videoId}`, cursor: lastCommentCursor }
            : { videoID: `${input.videoId}`, contentOffsetSeconds: 0.0 };

          const responseStart = await fetch("https://gql.twitch.tv/gql", {
            method: "POST",
            headers: {
              "Content-Type": "text/plain",
              "Client-ID": "kimne78kx3ncx6brgo4mv6wki5h1ko",
            },
            body: JSON.stringify([
              {
                operationName: "VideoCommentsByOffsetOrCursor",
                variables: queryVariablesStart,
                extensions: {
                  persistedQuery: {
                    version: 1,
                    sha256Hash:
                      "b70a3591ff0f4e0313d126c6a1502d79a1c02baebb288227c582044aa76adf6a",
                  },
                },
              },
            ]),
          }).then((res) => res.json() as Promise<TwitchVideoCommentResponse[]>)
            .then((res) => res[0]?.data.video.comments.edges)
          if (responseStart) {
            const lastSecondX = responseStart[responseStart.length - 1]?.node.contentOffsetSeconds;
            const lastCommentX = responseStart[responseStart.length - 1]?.cursor;
            if (lastSecondX && lastCommentX) {
              lastSecond = lastSecondX;
              lastCommentCursor = lastCommentX
            }
          }
          return responseStart
        }

        async function tailComments() {

          const queryVariablesEnd = {
            videoID: `${input.videoId}`,
            contentOffsetSeconds: firstSecond,
          };

          const responseTail = await fetch("https://gql.twitch.tv/gql", {
            method: "POST",
            headers: {
              "Content-Type": "text/plain",
              "Client-ID": "kimne78kx3ncx6brgo4mv6wki5h1ko",
            },
            body: JSON.stringify([
              {
                operationName: "VideoCommentsByOffsetOrCursor",
                variables: queryVariablesEnd,
                extensions: {
                  persistedQuery: {
                    version: 1,
                    sha256Hash:
                      "b70a3591ff0f4e0313d126c6a1502d79a1c02baebb288227c582044aa76adf6a",
                  },
                },
              },
            ]),
          }).then((res) => res.json() as Promise<TwitchVideoCommentResponse[]>)
            .then((res) => res[0]?.data.video.comments.edges)

          if (responseTail) {
            const firstSecondX =
              responseTail[0]?.node.contentOffsetSeconds;

            if (firstSecondX) {
              firstSecond = firstSecondX;

            }
          }
          return responseTail
        }

        while (lastSecond < firstSecond) {

          const percent = 100 - ((firstSecond - lastSecond) / vidLength * 100)
          await pusher.trigger(`${input.videoId}`, "update", percent);

          const [startComments, endComments] = await Promise.all([headComments(), tailComments()]);
          if (startComments && endComments) {
            const mergedResults = comments.concat(...startComments, ...endComments)
            comments.push(...mergedResults)
            if (comments.length > 1000) {
              const uniqueComments = comments.reduce(
                (result: UniqueCommentsResult, comment) => {
                  const commentId = comment.node.id;
                  const isDuplicate = result.duplicateIds.has(commentId);

                  if (!isDuplicate) {
                    result.duplicateIds.add(commentId);
                    let msg = "";
                    for (let i = 0; i < comment.node.message.fragments?.length; i++) {
                      const text = comment.node.message.fragments[i]?.text;
                      msg += text;
                    }
                    const formattedComment = {
                      message: msg,
                      commenter: comment.node.commenter?.displayName,
                      contentOffsetSeconds: comment.node.contentOffsetSeconds,
                      videoId: input.videoId
                    };
                    result.comments.push(formattedComment);
                  }
                  return result;
                },
                { comments: [], duplicateIds: new Set<string>() }
              )
              const messagesToInsert = uniqueComments.comments.map(msg => ({
                message: msg.message,
                commenter: msg.commenter,
                contentOffsetSeconds: msg.contentOffsetSeconds,
                videoId: msg.videoId,
              }));

              await ctx.prisma.msg.createMany({
                data: messagesToInsert
              })
              comments = []
            }

          }
        }

        if (comments.length > 0) {
          const uniqueComments = comments.reduce(
            (result: UniqueCommentsResult, comment) => {
              const commentId = comment.node.id;
              const isDuplicate = result.duplicateIds.has(commentId);

              if (!isDuplicate) {
                result.duplicateIds.add(commentId);
                let msg = "";
                for (let i = 0; i < comment.node.message.fragments?.length; i++) {
                  const text = comment.node.message.fragments[i]?.text;
                  msg += text;
                }
                const formattedComment = {
                  message: msg,
                  commenter: comment.node.commenter.displayName,
                  contentOffsetSeconds: comment.node.contentOffsetSeconds,
                  videoId: input.videoId
                };
                result.comments.push(formattedComment);
              }
              return result;
            },
            { comments: [], duplicateIds: new Set<string>() }
          )
          const messagesToInsert = uniqueComments.comments.map(msg => ({
            message: msg.message,
            commenter: msg.commenter,
            contentOffsetSeconds: msg.contentOffsetSeconds,
            videoId: msg.videoId,
          }));

          await ctx.prisma.msg.createMany({
            data: messagesToInsert
          })
          comments = []
        }
        await ctx.prisma.video.update({
          where: {
            videoId: input.videoId
          },
          data: {
            complete: true
          }
        })
      }
    }),

  getAll: publicProcedure.query(({ ctx }) => {
    return ctx.prisma.example.findMany();
  }),

  deleteAll: publicProcedure.input(z.object({ videoId: z.number() })).mutation(async ({ ctx, input }) => {

    await ctx.prisma.msg.deleteMany({
      where: {
        videoId: input.videoId
      }
    })
    await ctx.prisma.video.deleteMany({
      where: {
        videoId: input.videoId
      },
    })


    return {
      greeting: `Hello ${input.videoId}`,
    };
  }),

  getSecretMessage: protectedProcedure.query(() => {
    return "you can now see this secret message!";
  }),
});
