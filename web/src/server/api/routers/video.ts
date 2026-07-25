import { z } from "zod";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "@/server/api/trpc";

/**
 * Video ingestion is handled by the Python worker in /worker, not here.
 *
 * The web app's only job is to put a row on the queue and then read progress
 * back off the database. Nothing in this router talks to Twitch.
 *
 * `videoId` is BIGINT in the database because Twitch VOD ids outgrew INT4, so
 * Prisma types it as `bigint`. Every VOD id is far below Number.MAX_SAFE_INTEGER
 * though, so the tRPC surface stays `number` and the two conversions below are
 * the only place the distinction exists. Letting `bigint` escape would retype
 * every component prop and the hand-written `Comment` interface in types/ui.ts.
 */
const videoIdInput = z.object({ videoId: z.number().int().positive() });

const toClientVideo = <T extends { videoId: bigint }>(video: T) => ({
  ...video,
  videoId: Number(video.videoId),
});

export const videoRouter = createTRPCRouter({
  /**
   * Called when a video page mounts. Enqueues the VOD for indexing if it is not
   * already stored, and reports whether indexing is still in flight.
   *
   * Returns true while the progress bar should be shown, false once the video is
   * fully indexed. Safe to call repeatedly - it will not disturb a running job.
   */
  getVideo: publicProcedure
    .input(videoIdInput)
    .query(async ({ input, ctx }) => {
      const videoId = BigInt(input.videoId);

      const video = await ctx.db.video.findUnique({
        where: { videoId },
        select: { complete: true },
      });
      if (video?.complete) return false;

      const job = await ctx.db.videoJob.findUnique({ where: { videoId } });

      if (!job) {
        //upsert rather than create: this now runs the moment the route mounts,
        //so two tabs opening the same VOD would otherwise race the unique index
        await ctx.db.videoJob.upsert({
          where: { videoId },
          create: { videoId },
          update: {},
        });
      } else if (job.status === "FAILED") {
        //let the user retry a failed job by revisiting the page
        await ctx.db.videoJob.update({
          where: { videoId },
          data: { status: "QUEUED", progress: 0, error: null },
        });
      }

      return true;
    }),

  /**
   * Polled by the progress bar. Reads straight off the queue row the worker
   * updates, so there is no realtime transport involved.
   */
  getProgress: publicProcedure
    .input(videoIdInput)
    .query(async ({ input, ctx }) => {
      const videoId = BigInt(input.videoId);

      const job = await ctx.db.videoJob.findUnique({
        where: { videoId },
        select: {
          status: true,
          progress: true,
          commentsIndexed: true,
          lengthSeconds: true,
          title: true,
          streamer: true,
          error: true,
          updatedAt: true,
        },
      });

      if (!job) {
        //no queue row means either nothing asked for it yet, or it finished and
        //the row was cleaned up. Fall back to the video itself.
        const video = await ctx.db.video.findUnique({
          where: { videoId },
          select: { complete: true, title: true, streamer: true },
        });
        return {
          status: video?.complete ? ("DONE" as const) : ("QUEUED" as const),
          progress: video?.complete ? 100 : 0,
          commentsIndexed: 0,
          lengthSeconds: null,
          title: video?.title ?? null,
          streamer: video?.streamer ?? null,
          error: null,
          updatedAt: null,
        };
      }

      //widened so this matches the no-row branch above, which has no timestamp
      const updatedAt: Date | null = job.updatedAt;
      return { ...job, updatedAt };
    }),

  /**
   * The VOD's most-typed words, for the keyword list at the top of the sidebar.
   * Written by the Python worker when indexing finishes - see worker/words.py
   * for how spellings are folded together.
   */
  getKeywords: publicProcedure
    .input(videoIdInput)
    .query(async ({ ctx, input }) => {
      const video = await ctx.db.video.findUnique({
        where: { videoId: BigInt(input.videoId) },
        select: { id: true },
      });
      //not indexed yet - an empty list, never undefined
      if (!video) return [];

      return ctx.db.keyword.findMany({
        where: { vidId: video.id },
        orderBy: { amount: "desc" },
        select: { key: true, label: true, amount: true },
      });
    }),

  getFive: publicProcedure.query(async ({ ctx }) => {
    const videos = await ctx.db.video.findMany({
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
    return videos.map(toClientVideo);
  }),

  getAll: publicProcedure.query(async ({ ctx }) => {
    const videos = await ctx.db.video.findMany({
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
    return videos.map(toClientVideo);
  }),

  deleteAll: publicProcedure
    .input(videoIdInput)
    .mutation(async ({ ctx, input }) => {
      //order matters, children before parents
      await ctx.db.msg.deleteMany({});
      await ctx.db.hashtag.deleteMany({});
      await ctx.db.term.deleteMany({});
      await ctx.db.emote.deleteMany({});
      await ctx.db.commentCard.deleteMany({});
      await ctx.db.card.deleteMany({});
      await ctx.db.video.deleteMany({});
      await ctx.db.channel.deleteMany({});
      await ctx.db.videoJob.deleteMany({});

      return { deleted: input.videoId };
    }),

  getSecretMessage: protectedProcedure.query(() => {
    return "you can now see this secret message!";
  }),
});
