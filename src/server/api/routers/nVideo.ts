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
              await createChannel(vidInfo);
            }
          })
          .catch((error) => {
            console.error(error);
          });
      }
      async function getChannelTerms(
        username: string,
        channelObjectId: string
      ) {
        const chanInfo = addStreamEleInfoToChannel(username);
        if (!chanInfo) return;
        await FetchEmoteImgUrls();

        async function addStreamEleInfoToChannel(username: string) {
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
          if (!userData) return;
          const info = userData;

          await ctx.prisma.channel.update({
            where: { streamer: info.displayName },
            data: { avatar: info.avatar, seId: info._id },
          });
          return info;
        }
        function FetchEmoteImgUrls() {}
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
      }
    }),
});
