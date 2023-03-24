import { api } from "~/utils/api";

import type {
  Twitch,
  Card,
  Timestamp,
  SetCardsFunction,
} from "~/types/commentCard";

import Image from "next/image";
export const CommentCards = ({
  videoId,
  playerRef,
  cards,
  setCards,
  player,
}: {
  player: Twitch | null;
  videoId: number;
  cards: Card[];
  setCards: SetCardsFunction;
  playerRef: React.RefObject<HTMLDivElement>;
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

  if (!playerRef.current?.clientWidth) return <h1>hi</h1>;

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
  // if (cards.length === 0) setCards(queryData);
  return (
    <div className="my-2 mr-2 flex flex-col gap-2 ">
      {cards?.map((card: Card) => {
        if (!card.url) return;

        if (!card.timestamps) {
          return (
            <button
              onClick={() => getTimestamps.mutate({ cardId: card.id })}
              key={card.id}
              className="flex w-full grow items-center rounded-lg border-2 border-black bg-slate-900 p-2 py-4"
            >
              <div className="relative h-14 w-14">
                <Image src={card.url} alt="emote" fill={true} />
              </div>
              <div className="ml-auto mr-5 flex">
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
        } else {
          return (
            <div key={card.id}>
              <button
                onClick={() => {
                  const updatedCards = cards.map((c) => {
                    if (c.id === card.id) {
                      return { ...c, timestamps: null } as Card;
                    } else {
                      return c;
                    }
                  });
                  setCards(updatedCards);
                }}
                key={card.id}
                className="flex w-full grow items-center rounded-lg border-2 border-black bg-slate-900 p-2 py-4"
              >
                <div className="relative h-14 w-14">
                  <Image src={card.url} alt="emote" fill={true} />
                </div>
                <div className="ml-auto mr-5 flex">
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
              <div className="scrollbar-x max-h-56 overflow-y-scroll bg-slate-900">
                {card.timestamps?.map((timestamp) => {
                  if (!timestamp.messages) {
                    return (
                      <div
                        key={timestamp.id}
                        className=" flex justify-center gap-5 "
                      >
                        <button
                          className="text-blue-400 underline"
                          onClick={() =>
                            player?.seek(timestamp.contentOffsetSeconds)
                          }
                        >
                          {timestamp.timestamp}
                        </button>
                        <h1 className="text-red-500">{timestamp.count}</h1>
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
                      </div>
                    );
                  } else {
                  
                    return (
                      <div
                        key={timestamp.id}
                        className="mx-2 border border-slate-600 py-1 text-periwinkle-gray-500"
                      >
                        <div className="around flex justify-center gap-5">
                          <button
                            className="text-blue-400 underline"
                            onClick={() =>
                              player?.seek(timestamp.contentOffsetSeconds)
                            }
                          >
                            {timestamp.timestamp}
                          </button>
                          <h1 className="text-red-400">{timestamp.count}</h1>
                          <button
                            className="text-blue-400 underline"
                            onClick={() => handleClearMessages(card, timestamp)}
                          >
                            Hide Messages
                          </button>
                        </div>
                        <div>
                          {timestamp.messages.map((message) => {
                            return (
                              <div className="mx-5 flex" key={message.id}>
                                <h1 className="mr-1 font-bold">
                                  {message.commenter}:
                                </h1>
                                <h1>{message.message}</h1>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  }
                })}
              </div>
            </div>
          );
        }
      })}
    </div>
  );
};
