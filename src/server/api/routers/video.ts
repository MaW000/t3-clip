import { z } from "zod";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";

/**
 * Video ingestion is handled by the Python worker in /worker, not here.
 *
 * The web app's only job is to put a row on the queue and then read progress
 * back off the database. Nothing in this router talks to Twitch.
 */
export const videoRouter = createTRPCRouter({
  /**
   * Called when a video page mounts. Enqueues the VOD for indexing if it is not
   * already stored, and reports whether indexing is still in flight.
   *
   * Returns true while the progress bar should be shown, false once the video is
   * fully indexed. Safe to call repeatedly - it will not disturb a running job.
   */
  getVideo: publicProcedure
    .input(z.object({ videoId: z.number() }))
    .query(async ({ input, ctx }) => {
      const video = await ctx.prisma.video.findUnique({
        where: { videoId: input.videoId },
        select: { complete: true },
      });
      if (video?.complete) return false;

      const job = await ctx.prisma.videoJob.findUnique({
        where: { videoId: input.videoId },
      });

      if (!job) {
        await ctx.prisma.videoJob.create({
          data: { videoId: input.videoId },
        });
      } else if (job.status === "FAILED") {
        //let the user retry a failed job by revisiting the page
        await ctx.prisma.videoJob.update({
          where: { videoId: input.videoId },
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
    .input(z.object({ videoId: z.number() }))
    .query(async ({ input, ctx }) => {
      const job = await ctx.prisma.videoJob.findUnique({
        where: { videoId: input.videoId },
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
        const video = await ctx.prisma.video.findUnique({
          where: { videoId: input.videoId },
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

      return { ...job, updatedAt: job.updatedAt as Date | null };
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
      //order matters, children before parents
      await ctx.prisma.msg.deleteMany({});
      await ctx.prisma.hashtag.deleteMany({});
      await ctx.prisma.term.deleteMany({});
      await ctx.prisma.emote.deleteMany({});
      await ctx.prisma.commentCard.deleteMany({});
      await ctx.prisma.card.deleteMany({});
      await ctx.prisma.video.deleteMany({});
      await ctx.prisma.channel.deleteMany({});
      await ctx.prisma.videoJob.deleteMany({});

      return { deleted: input.videoId };
    }),

  getSecretMessage: protectedProcedure.query(() => {
    return "you can now see this secret message!";
  }),
});
