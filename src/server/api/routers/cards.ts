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
      const sec15 = new Date(Date.now() - 15 * 1000);

      const lastWithin15Secs = test?.last30.filter((dateTime) => {
        const date = new Date(dateTime);
        return date >= sec15;
      });
      lastWithin15Secs?.push(new Date(Date.now()));
      const min30 = new Date(Date.now() - 30 * 60 * 1000);
      const last30Within30Mins = test?.last30.filter((dateTime) => {
        const date = new Date(dateTime);
        return date >= min30;
      });
      last30Within30Mins?.push(new Date(Date.now()));
      const hr24 = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const lastWithin24Hr = test?.last30.filter((dateTime) => {
        const date = new Date(dateTime);
        return date >= hr24;
      });
      lastWithin24Hr?.push(new Date(Date.now()));
      const day7 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const lastWithin7D = test?.last30.filter((dateTime) => {
        const date = new Date(dateTime);
        return date >= day7;
      });
      lastWithin7D?.push(new Date(Date.now()));
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
            last60: lastWithin15Secs,
            last24: lastWithin24Hr,
            last30: last30Within30Mins,
            last7: lastWithin7D,
            second: lastWithin15Secs?.length,
            minute: last30Within30Mins?.length,
            day: lastWithin24Hr?.length,
            week: lastWithin7D?.length,
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
            last60: lastWithin15Secs,
            last24: lastWithin24Hr,
            last30: last30Within30Mins,
            last7: lastWithin7D,
            second: lastWithin15Secs?.length,
            minute: last30Within30Mins?.length,
            day: lastWithin24Hr?.length,
            week: lastWithin7D?.length,
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
      const data = { ...card, cardLikes: termCard.likes };
      return data;
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
      const sec15 = new Date(Date.now() - 15 * 1000);

      const lastWithin15Secs = test?.last30.filter((dateTime) => {
        const date = new Date(dateTime);
        return date >= sec15;
      });
      lastWithin15Secs?.pop();
      const min30 = new Date(Date.now() - 30 * 60 * 1000);
      const last30Within30Mins = test?.last30.filter((dateTime) => {
        const date = new Date(dateTime);
        return date >= min30;
      });
      last30Within30Mins?.pop();
      const hr24 = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const lastWithin24Hr = test?.last30.filter((dateTime) => {
        const date = new Date(dateTime);
        return date >= hr24;
      });
      lastWithin24Hr?.pop();
      const day7 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const lastWithin7D = test?.last30.filter((dateTime) => {
        const date = new Date(dateTime);
        return date >= day7;
      });
      lastWithin7D?.pop();
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
      const data = { ...card, cardLikes: termCard.likes };
      return data;
    }),
});
