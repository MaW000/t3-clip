import type {
  TwitchVideoResponse,
  TwitchVideoCommentResponse,
  UniqueCommentsResult,
  Message,
} from "~/types";
import { z } from "zod";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";
import { pusher } from "~/utils/pusher";

export const exampleRouter = createTRPCRouter({
  getVideo: publicProcedure
    .input(z.object({ videoId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      let comments: Message[] = [];
      let vidLength: number;
      let lastSecond: number;
      // let lastCommentCursor = "";
      let firstSecond: number;
      let midHeadSec: number;
      let midTailSec: number;
      let lastCommentCursor = "";
      let midCommentCursor = "";
      let vidObjId: string;
      const toggle = await ctx.prisma.video.findFirst({
        where: { videoId: input.videoId },
        select: { complete: true },
      });

      if (!toggle) {
        await VideoDataFetch();
        await getComments();
        return { fetch: `Video has started fetching comments` };
      } else if (!toggle.complete) {
        return { fetch: `video is saving` };
      } else {
        return { saved: `video is saved` };
      }

      async function VideoDataFetch() {
        function convertToSeconds(str: string) {

          if (str.length > 6) {
            const timeArr = str.split(/[hms]/) as [string, string, string];


            const hours = parseInt(timeArr[0], 10) || 0;
            const minutes = parseInt(timeArr[1], 10) || 0;
            const seconds = parseInt(timeArr[2], 10) || 0;

            return hours * 3600 + minutes * 60 + seconds
          } else if (str.length > 3) {
            const timeArr = str.split(/[s]/) as [string];

            const seconds = parseInt(timeArr[0], 10) || 0;

            return + seconds
          } else {
            const timeArr = str.split(/[ms]/) as [string, string];
            const minutes = parseInt(timeArr[0], 10) || 0;
            const seconds = parseInt(timeArr[1], 10) || 0;

            return minutes * 60 + seconds
          }

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
          url: videoResult.data[0]?.url,
        };
        const time = videoResult.data[0]?.duration;
        const videoObj = await ctx.prisma.video.create({ data: data });

        if (!time) {
          // handle the case when time is undefined
          throw new Error("Time is undefined");
        }

        const vidLengthS = convertToSeconds(time);
        console.log(vidLengthS, time)
        firstSecond = 0.0
        vidObjId = videoObj.id;
        vidLength = vidLengthS;
        lastSecond = vidLengthS;
        midHeadSec = Math.floor(vidLengthS / 2);
        midTailSec = Math.floor(vidLengthS / 2);
        await getComments();
      }

      async function getComments() {
        //NOTE going forward use cursor going backwards use seconds found out the hard way
        async function headComments() {
          const queryVariables = {
            videoID: `${input.videoId}`,
            contentOffsetSeconds: firstSecond,
          };
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
          })
            .then((res) => res.json() as Promise<TwitchVideoCommentResponse[]>)
            .then((res) => res[0]?.data.video.comments.edges);
          if (responseStart) {
            const lastSecondX =
              responseStart[responseStart.length - 1]?.node
                .contentOffsetSeconds;
            const lastCursor = responseStart[responseStart.length - 1]?.cursor;
            if (lastSecondX && lastCursor) {
              lastCommentCursor = lastCursor;
              firstSecond = lastSecondX;
            }
          }
          return responseStart;
        }

        async function tailComments() {
          const queryVariablesEnd = {
            videoID: `${input.videoId}`,
            contentOffsetSeconds: lastSecond,
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
          })
            .then((res) => res.json() as Promise<TwitchVideoCommentResponse[]>)
            .then((res) => res[0]?.data.video.comments.edges);

          if (responseTail) {
            const firstSecondX = responseTail[0]?.node.contentOffsetSeconds;

            if (firstSecondX) {
              lastSecond = firstSecondX;
            }
          }
          return responseTail;
        }
        async function midHeadComments() {
          const queryVariablesEnd = {
            videoID: `${input.videoId}`,
            contentOffsetSeconds: midHeadSec,
          };
          const queryVariablesStart = midCommentCursor
            ? { videoID: `${input.videoId}`, cursor: lastCommentCursor }
            : { videoID: `${input.videoId}`, contentOffsetSeconds: 0.0 };
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
          })
            .then((res) => res.json() as Promise<TwitchVideoCommentResponse[]>)
            .then((res) => res[0]?.data.video.comments.edges);

          if (responseTail) {
            const firstSecondX = responseTail[0]?.node.contentOffsetSeconds;
            const lastCursor = responseTail[responseTail.length - 1]?.cursor;
            if (firstSecondX) {
              midHeadSec = firstSecondX;
            }
          }
          return responseTail;
        }

        async function midTailComments() {
          const queryVariablesEnd = {
            videoID: `${input.videoId}`,
            contentOffsetSeconds: midTailSec,
          };
          const queryVariablesStart = midCommentCursor
            ? { videoID: `${input.videoId}`, cursor: midCommentCursor }
            : { videoID: `${input.videoId}`, contentOffsetSeconds: midTailSec };
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
          })
            .then((res) => res.json() as Promise<TwitchVideoCommentResponse[]>)
            .then((res) => res[0]?.data.video.comments.edges);
          if (responseStart) {
            const lastSecondX =
              responseStart[responseStart.length - 1]?.node
                .contentOffsetSeconds;
            const lastCursor = responseStart[responseStart.length - 1]?.cursor;
            if (lastSecondX && lastCursor) {
              midCommentCursor = lastCursor;
              midTailSec = lastSecondX;
            }
          }
          return responseStart;
        }
        let percent = 0;
        while (firstSecond < midHeadSec && midTailSec < lastSecond) {
          console.log(firstSecond, midHeadSec, midTailSec, lastSecond);
          // const percent =
          //   100 - (((midHeadSec - firstSecond) * 2) / vidLength) * 100;

          const percenta =
            100 -
            (((midHeadSec - firstSecond) * 2) / Math.floor(vidLength / 2)) *
            100;
          const percentb =
            100 -
            (((lastSecond - midTailSec) * 2) / Math.floor(vidLength / 2)) *
            100;
          if (percenta > percentb) {
            percent = (percentb + 100)
          } else {
            percent = (percenta + 100)
          }
          const [
            startComments,
            midHeadCommentsResult,
            midTailCommentsResult,
            endComments,
          ] = await Promise.all([
            headComments(),
            midHeadComments(),
            midTailComments(),
            tailComments(),
          ]);

          if (
            startComments &&
            endComments &&
            midHeadCommentsResult &&
            midTailCommentsResult
          ) {
            const mergedResults = startComments.concat(
              endComments,
              midTailCommentsResult,
              midHeadCommentsResult
            );
            const uniqueComments = mergedResults.reduce(
              (result: UniqueCommentsResult, comment) => {
                const commentId = comment.node.id;
                const isDuplicate = result.duplicateIds.has(commentId);
                if (!isDuplicate) {
                  result.duplicateIds.add(commentId);
                  let msg = "";
                  for (
                    let i = 0;
                    i < comment.node.message.fragments?.length;
                    i++
                  ) {
                    const text = comment.node.message.fragments[i]?.text;
                    msg += text;
                  }
                  const formattedComment = {
                    message: msg,
                    commenter: comment.node.commenter?.displayName,
                    contentOffsetSeconds: comment.node.contentOffsetSeconds,
                    videoId: input.videoId,
                  };
                  result.comments.push(formattedComment);
                }
                return result;
              },
              { comments: [], duplicateIds: new Set<string>() }
            );
            const messagesToInsert = uniqueComments.comments.map((msg) => ({
              message: msg.message,
              commenter: msg.commenter,
              contentOffsetSeconds: msg.contentOffsetSeconds,

              vidId: vidObjId
            }));
            comments.push(...messagesToInsert);
            if (comments.length > 300) {
              await pusher.trigger(`${input.videoId}`, "update", percent);

              console.log(
                firstSecond,
                lastSecond,
                "saving",
                comments.length,
                comments[0]
              );

              await ctx.prisma.msg.createMany({
                data: comments,
              });
              comments = [];
            }
          }
        }
        while (firstSecond < midHeadSec) {
          console.log(firstSecond, midHeadSec, "head");

          const percent =
            (100 -
              (((midHeadSec - firstSecond) * 2) / Math.floor(vidLength / 2)) *
              100) / 2

          const [midTailCommentsResult, endComments] = await Promise.all([
            headComments(),
            midHeadComments(),
          ]);

          if (endComments && midTailCommentsResult) {
            const mergedResults = midTailCommentsResult.concat(endComments);
            const uniqueComments = mergedResults.reduce(
              (result: UniqueCommentsResult, comment) => {
                const commentId = comment.node.id;
                const isDuplicate = result.duplicateIds.has(commentId);
                if (!isDuplicate) {
                  result.duplicateIds.add(commentId);
                  let msg = "";
                  for (
                    let i = 0;
                    i < comment.node.message.fragments?.length;
                    i++
                  ) {
                    const text = comment.node.message.fragments[i]?.text;
                    msg += text;
                  }
                  const formattedComment = {
                    message: msg,
                    commenter: comment.node.commenter?.displayName,
                    contentOffsetSeconds: comment.node.contentOffsetSeconds,
                    videoId: input.videoId,
                  };
                  result.comments.push(formattedComment);
                }
                return result;
              },
              { comments: [], duplicateIds: new Set<string>() }
            );
            const messagesToInsert = uniqueComments.comments.map((msg) => ({
              message: msg.message,
              commenter: msg.commenter,
              contentOffsetSeconds: msg.contentOffsetSeconds,
              vidId: vidObjId
            }));
            comments.push(...messagesToInsert);
            if (comments.length > 20000) {
              await pusher.trigger(`${input.videoId}`, "update", percent);
              await ctx.prisma.msg.createMany({
                data: comments,
              });
              comments = [];
            }
          }
        }
        while (midTailSec < lastSecond) {
          console.log(midTailSec, lastSecond, "tail");

          const percent =
            100 -
            (((lastSecond - midTailSec) * 2) / Math.floor(vidLength / 2)) * 100;

          const [midTailCommentsResult, endComments] = await Promise.all([
            tailComments(),
            midTailComments(),
          ]);

          if (endComments && midTailCommentsResult) {
            const mergedResults = midTailCommentsResult.concat(endComments);
            const uniqueComments = mergedResults.reduce(
              (result: UniqueCommentsResult, comment) => {
                const commentId = comment.node.id;
                const isDuplicate = result.duplicateIds.has(commentId);
                if (!isDuplicate) {
                  result.duplicateIds.add(commentId);
                  let msg = "";
                  for (
                    let i = 0;
                    i < comment.node.message.fragments?.length;
                    i++
                  ) {
                    const text = comment.node.message.fragments[i]?.text;
                    msg += text;
                  }
                  const formattedComment = {
                    message: msg,
                    commenter: comment.node.commenter?.displayName,
                    contentOffsetSeconds: comment.node.contentOffsetSeconds,
                    videoId: input.videoId,
                  };
                  result.comments.push(formattedComment);
                }
                return result;
              },
              { comments: [], duplicateIds: new Set<string>() }
            );
            const messagesToInsert = uniqueComments.comments.map((msg) => ({
              message: msg.message,
              commenter: msg.commenter,
              contentOffsetSeconds: msg.contentOffsetSeconds,
              vidId: vidObjId
            }));
            comments.push(...messagesToInsert);
            if (comments.length > 20000) {
              await pusher.trigger(`${input.videoId}`, "update", percent);
              await ctx.prisma.msg.createMany({
                data: comments,
              });
              comments = [];
            }
          }
        }
        await pusher.trigger(`${input.videoId}`, "closeVod", true);

        if (comments.length > 0) {
          await ctx.prisma.msg.createMany({
            data: comments,
          });
          await ctx.prisma.video.update({
            where: {
              videoId: input.videoId,
            },
            data: {
              complete: true,
            },
          });
          console.log(
            firstSecond,
            lastSecond,
            "last save",
            comments.length,
            comments[0]
          );
          comments = [];
        }
      }
    }),

  getAll: publicProcedure.query(({ ctx }) => {
    return ctx.prisma.example.findMany();
  }),

  deleteAll: publicProcedure
    .input(z.object({ videoId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const video = await ctx.prisma.video.findUnique({
        where: { videoId: input.videoId },
        select: { id: true },
      });

      const vidId = video?.id;

      if (vidId) {
        await ctx.prisma.msg.deleteMany({
          where: { vidId },
        });

        await ctx.prisma.video.deleteMany({
          where: { id: vidId },
        });
      }
      console.log("delete complete");

      return {
        greeting: `Hello ${input.videoId}`,
      };
    }),

  getSecretMessage: protectedProcedure.query(() => {
    return "you can now see this secret message!";
  }),
});
