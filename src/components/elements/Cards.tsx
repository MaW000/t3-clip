import Image from "next/image";
import { api } from "~/utils/api";
import type {
  SetCardsFunction,
  Card,
  Timestamp,
  Twitch,
  Message,
} from "~/types/commentCard";
import { useSession } from "next-auth/react";
import { AiFillHeart, AiOutlineHeart } from "react-icons/ai";
export const CardEle = ({
  card,
  cards,
  setCards,
  toggle,
}: {
  toggle: boolean;
  card: Card;
  cards: Card[];
  setCards: SetCardsFunction;
}) => {
  const getTimestamps = api.card.getCard.useMutation({
    onSuccess: (data) => {
      const updatedCards =
        cards?.map((card) => {
          if (!data[0]) return { ...card };
          if (card.id === data[0].cardId) {
            const updatedCard = { ...card };
            updatedCard.timestamps = data;
            return updatedCard;
          } else {
            return card;
          }
        }) ?? null;
      setCards(updatedCards);
    },
  });
  const handleHideTimestamps = () => {
    setCards(
      cards.map((c) => {
        if (c.id === card.id) {
          return { ...c, timestamps: null } as Card;
        } else {
          return c;
        }
      })
    );
  };
  return (
    <button
      onClick={() => {
        if (toggle) {
          getTimestamps.mutate({ cardId: card.id });
        } else {
          handleHideTimestamps();
        }
      }}
      className="flex w-full grow items-center rounded-t-xl border-2 border-black bg-slate-900 p-2 py-4"
    >
      <div className="relative h-14 w-14">
        {card.url && (
          <Image
            src={card.url}
            alt="emote"
            fill={true}
            className="  h-auto  w-full object-cover"
          />
        )}
      </div>
      <div className="ml-auto mr-5 flex">
        <div className="relative mr-20  h-10 w-20">
          <label className="labelCardsH">Likes</label>
          <div className="absolute -bottom-2 left-1/2 h-[.1rem] w-[200%] -translate-x-1/2 transform bg-periwinkle-gray-500" />
          <h1
            className={`float-right content-center  font-bold  text-purple-500 ${
              card.keyword.length > 20 ? "text-xl" : "text-2xl"
            }`}
          >
            {card.likes}
          </h1>
        </div>
        <div className="relative ml-auto  h-10 w-20">
          <label className="labelCardsH">Keyword</label>
          <div className="absolute -bottom-2 left-1/2 h-[.1rem] w-[200%] -translate-x-1/2 transform bg-periwinkle-gray-500" />
          <h1
            className={`float-right content-center  font-bold  text-purple-500 ${
              card.keyword.length > 20 ? "text-xl" : "text-2xl"
            }`}
          >
            {card.keyword}
          </h1>
        </div>
        <div className="relative ml-7 h-10 w-10">
          <label className="labelCardsH">Interval</label>
          <div className="absolute -bottom-2 left-1/2 h-[.1rem] w-[200%] -translate-x-1/2 transform bg-periwinkle-gray-500" />
          <h1 className="  content-center justify-center align-middle text-2xl font-bold text-purple-500">
            {card.interval}s
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-2 ">
        <div className="relative float-right w-16 justify-end">
          <label className="labelCards">Min:</label>
          <h1
            className={`justify-end text-right text-2xl text-purple-500 ${
              toggle ? "" : ""
            }`}
          >
            {card.min}
          </h1>
        </div>
        <div className="relative float-right  w-16 justify-end">
          <label className="labelCards">Max:</label>
          <h1 className="mb-2 justify-end text-right text-2xl text-purple-500">
            {card.max}
          </h1>
        </div>
        <div className="relative float-right  w-16 justify-end">
          <label className="labelCards">Sum:</label>
          <h1 className="mb-2 justify-end text-right text-2xl text-purple-500">
            {card.sum}
          </h1>
        </div>
        <div className="relative float-right  w-16 justify-end">
          <label className="labelCards">Avg:</label>
          <h1 className="justify-end text-right text-2xl text-purple-500">
            {card.avg}
          </h1>
        </div>
      </div>
    </button>
  );
};

export const Timestamps = ({
  timestamp,
  player,
  cards,
  setCards,
  card,
  hide,
}: {
  hide: boolean;
  card: Card;
  cards: Card[];
  setCards: SetCardsFunction;
  timestamp: Timestamp;
  player: Twitch | null;
}) => {
  const getCardComments = api.card.getCardComments.useMutation({
    onSuccess: (data) => {
      const updatedCards: Card[] =
        cards.map((card) => {
          if (!data[0]) return { ...card };
          if (card.id === data[0].cardId) {
            const updatedTimestamps = card.timestamps?.map((timestamp) => {
              if (timestamp.timestamp === data[0]?.timestamp) {
                timestamp.messages = data[0].messages;
              }
              return timestamp;
            });
            return { ...card, timestamps: updatedTimestamps };
          }
          return card;
        }) ?? null;
      setCards(updatedCards);
    },
  });
  const handleClearMessages = (card: Card, timestamp: Timestamp) => {
    const updatedCards =
      cards.map((cardx) => {
        if (cardx.id === card.id) {
          const updatedTimestamps = card.timestamps?.map((timestampx) => {
            if (timestampx.timestamp === timestamp.timestamp) {
              timestampx.messages = null;
            }
            return timestampx;
          });
          return {
            ...card,
            timestamps: updatedTimestamps,
          };
        }
        return cardx;
      }) ?? null;
    setCards(updatedCards);
  };
  const handleLikes = api.card.likeCard.useMutation({
    onSuccess: (data) => {
      const updatedCards: Card[] =
        cards.map((card) => {
          if (!data) return { ...card };
          if (card.id === data.cardId) {
            const updatedLikes = card.likes++;

            const updatedTimestamps = card.timestamps?.map((timestamp) => {
              if (timestamp.id === data?.id) {
                timestamp.likes = data.likes;
                timestamp.liked = data.liked;
              }
              return timestamp;
            });
            return {
              ...card,
              timestamps: updatedTimestamps,
              likes: card.likes,
            };
          }
          return card;
        }) ?? null;
      setCards(updatedCards);
    },
  });
  const handleDisLike = api.card.disLikeCard.useMutation({
    onSuccess: (data) => {
      const updatedCards: Card[] =
        cards.map((card) => {
          if (!data) return { ...card };
          if (card.id === data.cardId) {
            const updatedLikes = card.likes--;

            const updatedTimestamps = card.timestamps?.map((timestamp) => {
              if (timestamp.id === data?.id) {
                timestamp.likes = data.likes;
                timestamp.liked = data.liked;
              }
              return timestamp;
            });
            return {
              ...card,
              timestamps: updatedTimestamps,
              likes: card.likes,
            };
          }
          return card;
        }) ?? null;
      setCards(updatedCards);
    },
  });
  const session = useSession();
  const id = session.data?.user.id;

  return (
    <div key={timestamp.id} className={` flex justify-center gap-5  pt-7`}>
      <div className="relative float-left mr-14 justify-end">
        <label className="labelCards w-[90%]  pb-7">Timestamp:</label>
        <button
          onClick={() => player?.seek(timestamp.contentOffsetSeconds)}
          className="relative float-left mb-2 justify-start  rounded-b-lg bg-gradient-to-b from-slate-900 to-slate-800 pb-5 text-2xl text-purple-500"
        >
          {timestamp.timestamp}
          {hide ? (
            <button
              onClick={() =>
                getCardComments.mutate({
                  cardId: card.id,
                  timestamp: timestamp.timestamp,
                })
              }
              className={`absolute left-0 top-2 w-full text-sm text-periwinkle-gray-500 `}
            >
              <br />
              Show Comments
            </button>
          ) : (
            <button
              onClick={() => handleClearMessages(card, timestamp)}
              className="absolute left-0 top-2   w-full text-sm text-periwinkle-gray-500"
            >
              <br />
              Hide Comments
            </button>
          )}
        </button>
      </div>
      <div className="relative float-left justify-end">
        <label className="labelCards mr-10 w-full pb-5">Total:</label>
        <h1 className="mb-2 justify-start text-left text-2xl text-purple-500">
          {timestamp.count}
        </h1>
      </div>
      {!id ? (
        <button disabled>Likes: {timestamp.likes}</button>
      ) : timestamp.liked.includes(id) ? (
        <button
          className="relative ml-10 text-red-500"
          onClick={() => {
            handleDisLike.mutate({
              cardId: timestamp.id,
              userId: id,
            });
          }}
        >
          <label className="labelCards mr-10 w-full pb-5">Likes:</label>
          <h1 className="mb-5 justify-start text-left text-2xl text-purple-500">
            {timestamp.likes}
          </h1>
          <AiFillHeart className="absolute -top-2 -right-5 text-lg" />
        </button>
      ) : (
        <button
          className="relative ml-10 text-blue-500"
          onClick={() => {
            handleLikes.mutate({
              cardId: timestamp.id,
              userId: id,
            });
          }}
        >
          <label className="labelCards mr-10 w-full pb-5">Likes:</label>
          <h1 className="mb-5 justify-start text-left text-2xl text-purple-500">
            {timestamp.likes}
          </h1>
          <AiOutlineHeart className="absolute -top-2 -right-5 text-lg" />
        </button>
      )}
    </div>
  );
};

export const Comments = ({ message }: { message: Message }) => {
  return (
    <div className="mx-5 flex" key={message.id}>
      <h1 className="mr-1 font-bold">{message.commenter}:</h1>
      <h1>{message.message}</h1>
    </div>
  );
};
export const TimestampFilter = ({
  timestamps,
  cards,
  setCards,
  card,
}: {
  card: Card;
  cards: Card[];
  setCards: SetCardsFunction;
  timestamps: Timestamp[];
}) => {
  const getTimestamps = api.card.getCard.useMutation({
    onSuccess: (data) => {
      console.log(data, "1");
      const updatedCards =
        cards?.map((card) => {
          if (!data[0]) return { ...card };
          if (card.id === data[0].cardId) {
            const updatedCard = { ...card };
            updatedCard.timestamps = data;
            return updatedCard;
          } else {
            return card;
          }
        }) ?? null;
      setCards(updatedCards);
    },
  });
  function sortCardsByCount(count: boolean) {
    if (count) {
      const asc = timestamps.sort((a, b) => b.count - a.count);
      const updatedCards: Card[] = cards.map((card) => {
        if (card.id === asc[0]?.cardId) {
          return {
            ...card,
            timestamps: asc,
          };
        }

        return card;
      });
      setCards(updatedCards);
    } else {
      getTimestamps.mutate({ cardId: card.id });
    }
  }

  return (
    <div className=" space-x-44 text-center text-xl  text-blue-400 ">
      <button className="  underline" onClick={() => sortCardsByCount(true)}>
        Count
      </button>
      <button className=" underline" onClick={() => sortCardsByCount(false)}>
        Time
      </button>
    </div>
  );
};
