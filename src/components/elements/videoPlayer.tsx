import React, { useRef, useEffect, useState } from "react";
import type { Card } from "~/types/commentCard";
import { VodParse, EmoteCarousel } from "@/elements";
import { api } from "~/utils/api";
interface TwitchPlayera {
  play: () => void;
  pause: () => void;
  destroy: () => void;
  // Add any other properties or methods that you need
}

interface Twitch {
  seek(time: number): void | null;
}
export const VideoDash = ({ videoId }: { videoId: number }) => {
  const playerRef = useRef<HTMLDivElement>(null);
  const videoSaveRes = api.video.getVideo.useQuery({ videoId: videoId });
  const response = videoSaveRes.data;
  const [player, setPlayer] = useState<Twitch | null>(null);
  const [cards, setCards] = useState<Card[]>([]);

  const { data: queryData } = api.card.getCards.useQuery({
    videoId: videoId,
  });

  useEffect(() => {
    if (!playerRef.current?.clientWidth) return;

    const w = playerRef.current.clientWidth - 50;
    const h = (9 / 16) * w;
    const options = {
      width: w,
      height: h + 0.11,
      video: videoId,
      time: "0h0m1s",
    };

    const initPlayer = new (window as any).Twitch.Player("player", options);
    if (initPlayer) {
      setPlayer(initPlayer);
    }
    if (queryData) {
      setCards(queryData);
    }
    return () => {
      if (queryData) {
        setCards(queryData);
      }
      if (initPlayer !== null) {
        initPlayer.destroy();
      }
    };
  }, [videoId, queryData]);

  return (
    <div className="relative">
      <div className="mx-5 bg-slate-700 md:grid md:grid-cols-12">
        <div
          id="player"
          ref={playerRef}
          className=" col-span-9 col-start-1  row-span-full  "
        ></div>

        <VodParse
          cards={cards}
          setCards={setCards}
          player={player}
          playerRef={playerRef}
          videoId={videoId}
          completed={response}
        />
      </div>
      <div>
        <EmoteCarousel videoId={videoId} setCards={setCards} cards={cards} />
      </div>
    </div>
  );
};
