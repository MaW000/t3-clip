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

export const newVideoRouter = createTRPCRouter({
  getVideo: publicProcedure
    .input(z.object({ videoId: z.number() }))
    .query(async ({ input, ctx }) => {
      function grabVideoData() {
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
              return vidInfo;
              // await createChannel(vidInfo);
            }
          })
          .catch((error) => {
            console.error(error);
          });
      }
      async function createChannel(vidInfo: TwitchVideo) {
        //1 if channel exists we do not get channel terms.
        //2 have to check if exists before we create video data so that we can link streamer to video
        async function checkChanExist() {
          const channel = await ctx.prisma.channel.findUnique({
            where: { streamer: vidInfo.user_name },
          });
          return channel;
        }
        let channel = await checkChanExist();

        if (!channel) {
          const newStreamer = await ctx.prisma.channel.create({
            data: { streamer: vidInfo.user_name },
          });
          channel = newStreamer;

          await getChannelTerms(channel.streamer, channel.id);
        }
        createVideo(vidInfo, channel);
      }
      const vidInfo = grabVideoData();
    }),
});
