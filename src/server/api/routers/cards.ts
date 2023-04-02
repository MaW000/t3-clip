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
        },
      });
    }),
  getCardComments: publicProcedure
    .input(
      z.object({
        cardId: z.string(),
        timestamp: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.commentCard.findMany({
        where: {
          cardId: input.cardId,
          timestamp: input.timestamp,
        },
        include: {
          messages: true,
        },
      });
    }),
  likeCard: protectedProcedure
    .input(
      z.object({
        cardId: z.string(),
        userId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const test = await ctx.prisma.commentCard.findUnique({
        where: {
          id: input.cardId,
        },
      });
      if (test?.liked.includes(input.userId)) return;
      let card;

      //both increment likes by 1 and add video to users likedCards array, either sets commentCard Finder to user id or not.
      if (test?.finder) {
        card = await ctx.prisma.commentCard.update({
          where: {
            id: input.cardId,
          },
          data: {
            likes: {
              increment: 1,
            },
            liked: {
              push: input.userId,
            },
          },
        });
        await ctx.prisma.user.update({
          where: {
            id: input.userId,
          },
          data: {
            cardIds: {
              push: card.id,
            },
            likedCards: {
              connect: {
                id: card.id,
              },
            },
          },
        });
        if (card.finder && card.finder !== input.userId) {
          await ctx.prisma.user.update({
            where: {
              id: card.finder,
            },
            data: {
              likes: {
                increment: 1,
              },
            },
          });
        }
      } else {
        card = await ctx.prisma.commentCard.update({
          where: {
            id: input.cardId,
          },
          data: {
            finder: input.userId,
            likes: {
              increment: 1,
            },
            liked: {
              push: input.userId,
            },
          },
        });
        await ctx.prisma.user.update({
          where: {
            id: input.userId,
          },
          data: {
            cardIds: {
              push: card.id,
            },
            likedCards: {
              connect: {
                id: card.id,
              },
            },
          },
        });
      }

      await ctx.prisma.video.update({
        where: {
          id: card.vidId,
        },
        data: {
          likes: {
            increment: 1,
          },
        },
      });
     const termCard = await ctx.prisma.card.update({
        where: {
          id: card.cardId,
        },
        data: {
          likes: {
            increment: 1,
          },
        },
      });
      const data = {...card, cardLikes: termCard.likes}
      return data
    }),
  disLikeCard: protectedProcedure
    .input(
      z.object({
        cardId: z.string(),
        userId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const test = await ctx.prisma.commentCard.findUnique({
        where: {
          id: input.cardId,
        },
      });
      if (!test?.liked.includes(input.userId)) return;
      let card;
      const filtered = test?.liked.filter((id) => id !== input.userId);
      //both increment likes by 1 and add video to users likedCards array, either sets commentCard Finder to user id or not.
      if (test?.finder === input.userId) {
        const user = await ctx.prisma.user.findUnique({
          where: {
            id: input.userId,
          },
        });

        const filteredCards = user?.cardIds?.filter(
          (id) => id !== input.cardId
        );
        card = await ctx.prisma.commentCard.update({
          where: {
            id: input.cardId,
          },
          data: {
            likes: {
              decrement: 1,
            },
            liked: filtered,
          },
        });
        await ctx.prisma.user.update({
          where: {
            id: input.userId,
          },
          data: {
            cardIds: filteredCards,
            likedCards: {
              disconnect: {
                id: card.id,
              },
            },
          },
        });
      } else {
        const user = await ctx.prisma.user.findUnique({
          where: {
            id: input.userId,
          },
        });
        const filteredCards = user?.cardIds?.filter(
          (id) => id !== input.cardId
        );
        card = await ctx.prisma.commentCard.update({
          where: {
            id: input.cardId,
          },
          data: {
            likes: {
              decrement: 1,
            },
            liked: filtered,
          },
        });
        await ctx.prisma.user.update({
          where: {
            id: input.userId,
          },
          data: {
            cardIds: filteredCards,
            likedCards: {
              disconnect: {
                id: card.id,
              },
            },
          },
        });

        if (card.finder) {
          await ctx.prisma.user.update({
            where: {
              id: card.finder,
            },
            data: {
              likes: {
                decrement: 1,
              },
            },
          });
        }
      }

      await ctx.prisma.video.update({
        where: {
          id: card.vidId,
        },
        data: {
          likes: {
            decrement: 1,
          },
        },
      });
      const termCard = await ctx.prisma.card.update({
        where: {
          id: card.cardId,
        },
        data: {
          likes: {
            decrement: 1,
          },
        },
      });
      const data = {...card, cardLikes: termCard.likes}
      return data;
    }),
});
