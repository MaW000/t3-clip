import { api } from "~/utils/api";
import { useState, useEffect } from "react";
import type { SetPlayerFn, TwitchPlayer } from "~/types/twitchEmbed";
interface Card {
  id: string;
  vidId: string;
  keyword: string;
  interval: number;
  sum: number | null;
  avg: number | null;
  max: number | null;
  min: number | null;
  url: string | null;
  timestamps?: Timestamp[] | null;
}
interface Timestamp {
  id: string;
  timestamp: string;
  contentOffsetSeconds: number;
  count: number;
  cardId: string;
  vidId: string;
  msgIds: string[];
  messages?: Message[] | null;
}
type Message = {
  id: string;
  vidId: string;
  cardIds: string[];
  message: string;
  commentId: string;
  commenter: string | null;
  contentOffsetSeconds: number;
};
interface Twitch {
  current?: {
    seek(time: number): void;
  };
}
import Image from "next/image";
export const CommentCards = ({
  videoId,
  playerRef,
  playerRefFunc,
}: {
  videoId: number;
  playerRef: React.RefObject<HTMLDivElement>;
  playerRefFunc: React.RefObject<Twitch> | null;
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
      console.log(data);
      const updatedCards =
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
  const [cards, setCards] = useState<Card[]>([]);
  console.log(playerRefFunc);
  const { data: queryData } = api.card.getCards.useQuery({
    videoId: videoId,
  });
  useEffect(() => {
    if (queryData) {
      setCards(queryData);
    }
  }, [queryData]);
  if (!playerRef.current?.clientWidth || !playerRefFunc.current)
    return <h1>hi</h1>;
  console.log(queryData);
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
                onClick={() =>
                  setCards((cards) =>
                    cards.map((c) => {
                      if (c.id === card.id) {
                        return { ...c, timestamps: null } as Card;
                      } else {
                        return c;
                      }
                    })
                  )
                }
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
                            playerRefFunc?.current?.seek(
                              timestamp.contentOffsetSeconds
                            )
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
                        className="border border-slate-600 bg-slate-500 py-1 text-periwinkle-gray-500"
                      >
                        <div className="around flex justify-center">
                          <button
                            onClick={() =>
                              playerRefFunc?.current?.seek(
                                timestamp.contentOffsetSeconds
                              )
                            }
                          >
                            {timestamp.timestamp}
                          </button>
                          <h1>{timestamp.count}</h1>
                          <button
                            onClick={() => handleClearMessages(card, timestamp)}
                          >
                            Hide Messages
                          </button>
                        </div>
                        <div>
                          {timestamp.messages.map((message) => {
                            return (
                              <div key={message.id}>
                                <h1>{message.message}</h1>
                                <h1>{message.commenter}</h1>
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
