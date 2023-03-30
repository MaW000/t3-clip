import { z } from "zod";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";

export const cardRouter = createTRPCRouter({
  getCards: publicProcedure
    .input(
      z.object({
        videoId: z.number(),
      })
    )
    .query(async ({ ctx, input }) => {
      const video = await ctx.prisma.video.findUnique({
        where: {
          videoId: input.videoId,
        },
        select: {
          id: true,
        },
      });
      if (!video) return;
      const cards = await ctx.prisma.card.findMany({
        where: {
          vidId: video.id,
        },
      });
      if (!cards) return;

      return cards;
    }),
  getCard: publicProcedure
    .input(
      z.object({
        cardId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {

      return await ctx.prisma.commentCard.findMany({
        where: {
          cardId: input.cardId,
        }
      })
    }),
  getCardComments: publicProcedure
    .input(
      z.object({
        cardId: z.string(),
        timestamp: z.string()
      })
    )
    .mutation(async ({ ctx, input }) => {

      return await ctx.prisma.commentCard.findMany({
        where: {
          cardId: input.cardId,
          timestamp: input.timestamp
        },
        include: {
          messages: true
        }
      })
    }),
  likeCard: protectedProcedure.input(
    z.object({
      cardId: z.string(),
      userId: z.string()
    })
  )
    .mutation(async ({ ctx, input }) => {

      const card = await ctx.prisma.commentCard.update({
        where: {
          id: input.cardId
        },
        data: {
          likes: {
            increment: 1
          },
          liked: {
            push: input.userId
          }
        }
      })

      await ctx.prisma.video.update({
        where: {
          id: card.vidId
        },
        data: {
          likes: {
            increment: 1
          },
        }
      })
      await ctx.prisma.card.update({
        where: {
          id: card.cardId
        },
        data: {
          likes: {
            increment: 1
          },
        }
      })
      return card
    }), disLikeCard: protectedProcedure.input(
      z.object({
        cardId: z.string(),
        userId: z.string()
      })
    )
      .mutation(async ({ ctx, input }) => {
        const ogCard = await ctx.prisma.commentCard.findUnique({
          where: {
            id: input.cardId
          },
        })
        console.log(ogCard)
        const filtered = ogCard?.liked.filter((id) => id !== input.userId)
        const card = await ctx.prisma.commentCard.update({
          where: {
            id: input.cardId
          },
          data: {
            likes: {
              decrement: 1
            },
            liked: {
              set: filtered
            }
          }
        })

        await ctx.prisma.video.update({
          where: {
            id: card.vidId
          },
          data: {
            likes: {
              decrement: 1
            },
          }
        })
        await ctx.prisma.card.update({
          where: {
            id: card.cardId
          },
          data: {
            likes: {
              decrement: 1
            },
          }
        })

        return card
      })
});
