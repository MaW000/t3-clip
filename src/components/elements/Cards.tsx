import Image from "next/image";
import { api } from "~/utils/api";
import type {
  SetCardsFunction,
  Card,
  Timestamp,
  Twitch,
  Message,
} from "~/types/commentCard";
import { signIn, signOut, useSession } from "next-auth/react";
export const CardEle = ({
  card,
  cards,
  setCards,
}: {
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
  return (
    <button
      onClick={() => getTimestamps.mutate({ cardId: card.id })}
      className="flex w-full grow items-center rounded-lg border-2 border-black bg-slate-900 p-2 py-4"
    >
      <div className="relative h-14 w-14">
        {card.url && <Image src={card.url} alt="emote" fill={true} />}
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
          <h1 className="justify-end text-right text-3xl text-purple-500">
            {card.min}
          </h1>
        </div>
        <div className="relative float-right  w-16 justify-end">
          <label className="labelCards">Max:</label>
          <h1 className="justify-end text-right text-3xl text-purple-500">
            {card.max}
          </h1>
        </div>
        <div className="relative float-right  w-16 justify-end">
          <label className="labelCards">Sum:</label>
          <h1 className="justify-end text-right text-3xl text-purple-500">
            {card.sum}
          </h1>
        </div>
        <div className="relative float-right  w-16 justify-end">
          <label className="labelCards">Avg:</label>
          <h1 className="justify-end text-right text-3xl text-purple-500">
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
    const updatedCardsf =
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
    setCards(updatedCardsf);
  };
  const handleLikes = api.card.likeCard.useMutation({
    onSuccess: (data) => {
      const updatedCards: Card[] =
        cards.map((card) => {
          if (!data) return { ...card };
          if (card.id === data.cardId) {
            const updatedTimestamps = card.timestamps?.map((timestamp) => {
              if (timestamp.id === data?.id) {
                timestamp.likes = data.likes;
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
  
  const session = useSession();
  const id = session.data?.user.id;
  return (
    <div key={timestamp.id} className=" flex justify-center gap-5 ">
      <button
        className="text-red-500"
        onClick={() => {
          if (id)
            handleLikes.mutate({
              cardId: timestamp.id,
              userId: id,
            });
        }}
      >
        likes {timestamp.likes}
      </button>
      <button
        className="text-blue-400 underline"
        onClick={() => player?.seek(timestamp.contentOffsetSeconds)}
      >
        {timestamp.timestamp}
      </button>
      <h1 className="text-red-500">{timestamp.count}</h1>
      {hide ? (
        <button
          className="text-blue-400 underline"
          onClick={() =>
            getCardComments.mutate({
              cardId: card.id,
              timestamp: timestamp.timestamp,
            })
          }
        >
          Show Comments
        </button>
      ) : (
        <button
          className="text-blue-400 underline"
          onClick={() => handleClearMessages(card, timestamp)}
        >
          Hide Comments
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
