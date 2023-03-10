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

export const exampleRouter = createTRPCRouter({
  hello: publicProcedure
    .input(z.object({ videoId: z.string() }))
    .query(async ({ input, ctx }) => {
      const commentsSt: VideoCommentEdge[] = [];
      const commentsEd: VideoCommentEdge[] = [];
      let lastSecond = 0.0;
      let lastCommentCursor = "";
      let firstSecond: number;
      const toggle = await ctx.prisma.video.findFirst({ where: { videoId: +input.videoId } })
      if (!toggle) {
        await VideoDataFetch()
        await getCommentsa(firstSecond)
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
          videoId: +input.videoId,
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
        let b = await ctx.prisma.video.create({ data: data })

        if (!time) {
          // handle the case when time is undefined
          throw new Error("Time is undefined");
        }

        const vidLength = convertToSeconds(time);
        // console.log(seconds)
        firstSecond = vidLength
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
          console.log(lastSecond)
          return responseStart
        }

        // async function tailComments(vidLength: number) {
        //   console.log(firstSecond)
        //   const queryVariablesEnd = {
        //     videoID: `${input.videoId}`,
        //     contentOffsetSeconds: vidLength,
        //   };
        //   const responseTail = await fetch("https://gql.twitch.tv/gql", {
        //     method: "POST",
        //     headers: {
        //       "Content-Type": "text/plain",
        //       "Client-ID": "kimne78kx3ncx6brgo4mv6wki5h1ko",
        //     },
        //     body: JSON.stringify([
        //       {
        //         operationName: "VideoCommentsByOffsetOrCursor",
        //         variables: queryVariablesEnd,
        //         extensions: {
        //           persistedQuery: {
        //             version: 1,
        //             sha256Hash:
        //               "b70a3591ff0f4e0313d126c6a1502d79a1c02baebb288227c582044aa76adf6a",
        //           },
        //         },
        //       },
        //     ]),
        //   }).then((res) => res.json() as Promise<TwitchVideoCommentResponse[]>)
        //     .then((res) => res[0]?.data.video.comments.edges)

        //   if (responseTail) {
        //     const firstSecondX =
        //       responseTail[responseTail.length - 1]?.node.contentOffsetSeconds;
        //     console.log(responseTail[responseTail.length - 1]?.node.contentOffsetSeconds)

        //     if (firstSecondX) {

        //       firstSecond = firstSecondX;
        //       await tailComments(firstSecondX)
        //     }
        //   }


        // }

        // await tailComments(vidLength)
        while (true) {
          const headRes = await headComments()
          // const tailRes = await tailComments()
          // console.log(firstSecond)
        }
      }
      // async function getComments() {
      //   console.log('dog')
      //   let axc = 0
      //   while (axc < 3) {

      //     axc++
      //     function headComments() {
      //       const queryVariablesStart = lastCommentCursor
      //         ? { videoID: `${input.videoId}`, cursor: lastCommentCursor }
      //         : { videoID: `${input.videoId}`, contentOffsetSeconds: 0.0 };

      //       console.log(queryVariablesStart)
      //     }
      //     const head = headComments()

      //     const queryVariablesStart = lastCommentCursor
      //       ? { videoID: `${input.videoId}`, cursor: lastCommentCursor }
      //       : { videoID: `${input.videoId}`, contentOffsetSeconds: 0.0 };

      //     const responseStart = await fetch("https://gql.twitch.tv/gql", {
      //       method: "POST",
      //       headers: {
      //         "Content-Type": "text/plain",
      //         "Client-ID": "kimne78kx3ncx6brgo4mv6wki5h1ko",
      //       },
      //       body: JSON.stringify([
      //         {
      //           operationName: "VideoCommentsByOffsetOrCursor",
      //           variables: queryVariablesStart,
      //           extensions: {
      //             persistedQuery: {
      //               version: 1,
      //               sha256Hash:
      //                 "b70a3591ff0f4e0313d126c6a1502d79a1c02baebb288227c582044aa76adf6a",
      //             },
      //           },
      //         },
      //       ]),
      //     });

      //     const resStart =
      //       (await responseStart.json()) as TwitchVideoCommentResponse[];
      //     const commentsStart = resStart[0]?.data.video.comments.edges;
      //     console.log(commentsStart)
      //     if (commentsStart) {
      //       const lastSecondX =
      //         commentsStart[commentsStart.length - 1]?.node.contentOffsetSeconds;
      //       const lastCommentX = commentsStart[commentsStart.length - 1]?.cursor;
      //       if (lastSecondX && lastCommentX) {
      //         lastSecond = lastSecondX;
      //         lastCommentCursor = lastCommentX;
      //       }

      //       commentsSt.push(...commentsStart);
      //     }

      //     const queryVariablesEnd = {
      //       videoID: `${input.videoId}`,
      //       contentOffsetSeconds: firstSecond,
      //     };
      //     const response = await fetch("https://gql.twitch.tv/gql", {
      //       method: "POST",
      //       headers: {
      //         "Content-Type": "text/plain",
      //         "Client-ID": "kimne78kx3ncx6brgo4mv6wki5h1ko",
      //       },
      //       body: JSON.stringify([
      //         {
      //           operationName: "VideoCommentsByOffsetOrCursor",
      //           variables: queryVariablesEnd,
      //           extensions: {
      //             persistedQuery: {
      //               version: 1,
      //               sha256Hash:
      //                 "b70a3591ff0f4e0313d126c6a1502d79a1c02baebb288227c582044aa76adf6a",
      //             },
      //           },
      //         },
      //       ]),
      //     });
      //     const res = (await response.json()) as TwitchVideoCommentResponse[];
      //     const commentsEnd = res[0]?.data.video.comments.edges;
      //     if (commentsEnd) {
      //       const firstSecondX =
      //         commentsEnd[commentsEnd.length - 1]?.node.contentOffsetSeconds;
      //       if (firstSecondX) {
      //         firstSecond = firstSecondX;
      //       }
      //       commentsEd.push(...commentsEnd);
      //     }
      //     hasNextPage = false
      //   }

      //   const mergedComments = commentsSt.concat(commentsEd);

      //   const uniqueComments = mergedComments.reduce(
      //     (result: UniqueCommentsResult, comment) => {
      //       const commentId = comment.node.id;
      //       const isDuplicate = result.duplicateIds.has(commentId);
      //       if (!isDuplicate) {
      //         result.duplicateIds.add(commentId);

      //         let msg = "";

      //         for (let i = 0; i < comment.node.message.fragments?.length; i++) {
      //           const text = comment.node.message.fragments[i]?.text;
      //           msg += text;
      //         }

      //         const formattedComment = {
      //           message: msg,
      //           commenter: comment.node.commenter.displayName,
      //           contentOffsetSeconds: comment.node.contentOffsetSeconds,
      //           videoId: +input.videoId
      //         };
      //         result.comments.push(formattedComment);
      //       }
      //       return result;
      //     },
      //     { comments: [], duplicateIds: new Set<string>() }
      //   ).comments;

      //   const messagesToInsert = uniqueComments.map(msg => ({
      //     message: msg.message,
      //     commenter: msg.commenter,
      //     contentOffsetSeconds: msg.contentOffsetSeconds,
      //     videoId: msg.videoId,
      //   }));

      //   const a = await ctx.prisma.msg.createMany({ data: messagesToInsert })
      //   console.log(a)
      // }
      return {
        greeting: `Hello ${input.videoId}`,
      };
    }),

  getAll: publicProcedure.query(({ ctx }) => {
    return ctx.prisma.example.findMany();
  }),

  deleteAll: publicProcedure.input(z.object({ videoId: z.string() })).mutation(async ({ ctx, input }) => {

    const a = await ctx.prisma.msg.deleteMany({
      where: {
        videoId: +input.videoId
      }
    })
    const b = await ctx.prisma.video.deleteMany({
      where: {
        videoId: +input.videoId
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
