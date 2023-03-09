import { z } from "zod";

import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";
interface TwitchVideoCommentResponse {
  data: {
    video: []
  },
  extensions: {
    durationMilliseconds: number;
    operationName: string;
    requestID: string;
  };
}

interface TwitchVideoResponse {
  data: {
    id: string;
    user_id: string;
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
  }[];
  pagination: {
    cursor: string;
  };
}

type TwitchVideoDuration = `${string}h${string}m${string}s`;

export const exampleRouter = createTRPCRouter({
  hello: publicProcedure
    .input(z.object({ videoId: z.string() }))
    .query(async ({ input, ctx }) => {
      const commentsSt: [] = [];
      const commentsEd: [] = [];
      let lastSecond= 0.0;
      let firstSecond: number;
      let lastCommentCursor: string;
      let hasNextPage = true;      
      
      const data = await fetch(`https://api.twitch.tv/helix/videos?id=1742358351`, {
        method: "GET",
        headers: {
          Authorization: "Bearer kkme0h063j58yzhtenquyc3k8hd58a",
          "Client-Id": "03ui98fof7c081piwhb3oj6ecelzpn",
        },
      })
      const resa = await data.json() as TwitchVideoResponse[];
      console.log(resa)
      const time = resa.data.video.duration;
      console.log(time)
      function convertToSeconds(str: string) {
        const timeArr = str.split(/[hms]/); // split the string by "h", "m", "s"
        const hours = parseInt(timeArr[0], 10) || 0; // convert hours to number, default to 0
        const minutes = parseInt(timeArr[1], 10) || 0; // convert minutes to number, default to 0
        const seconds = parseInt(timeArr[2], 10) || 0; // convert seconds to number, default to 0
      
        return hours * 3600 + minutes * 60 + seconds;
      }
    
      firstSecond = convertToSeconds(time)
      
      while(lastSecond < firstSecond ) {
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
        const resStart = await responseStart.json() as TwitchVideoCommentResponse[];
        const commentsStart = resStart[0]?.data.video.comments.edges
        lastSecond = commentsStart[commentsStart.length - 1].node.contentOffsetSeconds;
        lastCommentCursor = commentsStart[commentsStart.length-1].cursor
        commentsSt.push(commentsStart)
        const queryVariablesEnd =  { videoID: `${input.videoId}`, contentOffsetSeconds: firstSecond };
        const response = await fetch("https://gql.twitch.tv/gql", {
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
      });
      const res = await response.json() as TwitchVideoCommentResponse[];
      const commentsEnd = res[0]?.data.video.comments.edges
      commentsEd.push(commentsEnd)
     firstSecond = res[0]?.data.video.comments.edges[0].node.contentOffsetSeconds
      console.log( firstSecond, lastSecond )
     
      // lastCommentCursor = comments[0].cursor
      hasNextPage = resStart[0]?.data.video.comments.pageInfo.hasNextPage
      
      
      }


      const mergedComments = commentsSt.concat(commentsEd);
   
      // const uniqueComments = mergedComments.reduce((result, comment) => {
      //   const commentId = comment.node.id;
      //   const isDuplicate = result.duplicateIds.has(commentId);
      //   if (!isDuplicate) {
      //     result.duplicateIds.add(commentId);
      //     result.comments.push(comment);
      //   }
      //   return result;
      // }, { comments: [], duplicateIds: new Set() }).comments;
      // console.log(uniqueComments)
      return {
        greeting: `Hello ${input.videoId}`,
      };
    }),

  getAll: publicProcedure.query(({ ctx }) => {
    return ctx.prisma.example.findMany();
  }),

  getSecretMessage: protectedProcedure.query(() => {
    return "you can now see this secret message!";
  }),
});
