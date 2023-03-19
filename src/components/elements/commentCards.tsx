import { api } from "~/utils/api";
import { useState } from "react";
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
}
import type { Term } from "~/types/emote";
import Image from "next/image";
export const CommentCards = ({
  videoId,
  playerRef,
}: {
  videoId: number;
  playerRef: React.RefObject<HTMLDivElement>;
}) => {
  const [cards, setCards] = useState<Card[]>([]);

  if (!playerRef.current?.clientWidth) return <h1>hi</h1>;
  const getTimestamps = api.card.getCard.useMutation({
    onSuccess: (data) => {
      const updatedCards =
        cards?.map((card) => {
          if (!data[0]) return { ...card };
          if (card.id === data[0].cardId) {
            // create a new card object with updated timestamps
            const updatedCard = { ...card };
            updatedCard.timestamps = data;
            console.log;
            return updatedCard;
          } else {
            // return the original card object for all other cards
            return card;
          }
        }) ?? null;
      console.log(updatedCards);
      setCards(updatedCards);
    },
  });

  // const videoSaveRes = api.video.getVideo.useQuery({ videoId: videoId });
  // console.log(videoSaveRes);
  const { data: queryData } = api.card.getCards.useQuery({ videoId: videoId });
  if (!queryData) return <h1>Loading...</h1>;
  if (!cards) setCards(queryData);
  const x = playerRef.current.clientHeight - 200;
  console.log(x);
  if (!cards) return <h1>loading cards</h1>
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
                  console.log(timestamp);
                  return (
                    <div key={timestamp.id}>
                      <button>{timestamp.timestamp}</button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        }
      })}
    </div>
  );
};
