import { api } from "~/utils/api";

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
}
import type { Term } from "~/types/emote";
import Image from "next/image";
export const CommentCards = ({ videoId, playerRef }: { videoId: number }) => {
  // const videoSaveRes = api.video.getVideo.useQuery({ videoId: videoId });
  // console.log(videoSaveRes);
  const a = api.card.getCards.useQuery({ videoId: videoId });
  if (!a || !a.data) return <h1>Erorr loading Emotes</h1>;
  const cards = a.data;
  const x = playerRef.current.clientHeight - 200;
  console.log(x);
  return (
    <div className="mr-2 mt-2 flex flex-col gap-2 ">
      {cards?.map((card: Card) => {
        if (!card.url) return;
        console.log(card);
        return (
          <div
            key={card.id}
            className="flex w-full grow items-center rounded-lg border-2 border-black bg-slate-900 p-2 py-4"
          >
            <div className="relative h-20 w-20">
              <Image src={card.url} alt="emote" width={500} height={500} />
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
          </div>
        );
      })}
    </div>
  );
};
