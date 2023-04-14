import React, { useRef, useEffect, useState } from "react";
import type { Card } from "~/types/commentCard";
import { VodSide, EmoteCarousel } from "~/components";
import { api } from "~/utils/api";
interface Twitcha {
  seek(time: number): void | null;
  destroy(): void | null;
}
interface TwitchObject {
  Player?: new (elementId: string, options: PlayerOptions) => Twitcha;
}
interface PlayerOptions {
  width: number;
  height: number;
  video: number;
  time: string
}
interface MyWindow extends Window {
  Twitch?: TwitchObject;
}
export const VideoDash = ({ videoId }: { videoId: number }) => {
  const playerRef = useRef<HTMLDivElement>(null);
  const videoSaveRes = api.video.getVideo.useQuery({ videoId: videoId });
  const response = videoSaveRes.data;
  const [player, setPlayer] = useState<Twitcha | null>(null);
  const [cards, setCards] = useState<Card[]>([]);

  const { data: queryData } = api.card.getCards.useQuery({
    videoId: videoId,
  });
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment

  
  useEffect(() => {
    const twitch: TwitchObject = (window as MyWindow).Twitch || {};
    if (!playerRef.current?.clientWidth) return;
    if (!twitch.Player) return
    const w = playerRef.current.clientWidth ;
    const h = (9 / 16) * w;
    const options: PlayerOptions = {
      width: w,
      height: h + 0.11,
      video: videoId,
      time: "0h0m1s",
    };

    const initPlayer: Twitcha = new twitch.Player("player", options);
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
      <div className="mx-5 bg-slate-700 xl:grid xl:grid-cols-12">
        <div
          id="player"
          ref={playerRef}
          className="col-span-9 col-start-1 row-span-full "
        ></div>

        <VodSide
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
