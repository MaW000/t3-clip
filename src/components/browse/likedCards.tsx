import Image from "next/image";
import type { Comment } from "~/types/ui";


export const LikedCards = ({recentCards}: {recentCards: Comment[]}) => {
    console.log(recentCards)
  return (
  <>
      { recentCards &&  
        recentCards.map((card, i) => {
            let thumbnail: string;
            if (card.video.thumbnail.includes("vod-secure")) {
              thumbnail = card.video.thumbnail
                .replace(/%{width}/, "320")
                .replace(/%{height}/, "180");
            } else {
              thumbnail = card.video.thumbnail
                .replace(/%{width}/, "480")
                .replace(/%{height}/, "270");
            }
          return (
            <div
              key={i}
              className={
                " flex rounded-md border-4 border-slate-900 bg-slate-700 p-2 ml-2 drop-shadow-lg"
              }
            >   
            {card.card.url && <Image src={card.card.url} height={50} width={50} alt="url" />}
            <h1 className="mt-3 mx-2 text-purple-400">{card.card.keyword}</h1>
            <h1 className="mt-3 mx-2">{card.minute}</h1>
            <h1 className="text-blue-400 mt-3 mx-2 underline underline-offset-2">Timestamp</h1>
            <Image src={thumbnail} height={50} width={80} alt="video" className="hidden" />
            </div>
          );
        })}
  </>
  );
};
