"use client";

import React, { useRef, useEffect, useState } from "react";
import type { Card } from "@/types/commentCard";
import { VodSide, EmoteCarousel } from "@/components";
import { api } from "@/trpc/react";
interface Twitch {
  seek(time: number): void | null;
  destroy(): void | null;
}
interface TwitchObject {
  Player?: new (elementId: string, options: PlayerOptions) => Twitch;
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
//`indexing` is owned by VideoPageView so the job is queued whether or not the
//Twitch embed script ever loads.
export const VideoDash = ({
  videoId,
  indexing,
}: {
  videoId: number;
  indexing: boolean | undefined;
}) => {
  const playerRef = useRef<HTMLDivElement>(null);
  const [player, setPlayer] = useState<Twitch | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [containerWidth, setContainerWidth] = useState(0);

  const { data: queryData } = api.card.getCards.useQuery({
    videoId: videoId,
  });

  // Re-measure on resize / rotate so the embed isn't stuck at its first size.
  useEffect(() => {
    const measure = () => {
      const el = playerRef.current;
      if (!el) return;
      setContainerWidth((prev) =>
        Math.abs(el.clientWidth - prev) > 20 ? el.clientWidth : prev
      );
    };
    measure();

    let timer: ReturnType<typeof setTimeout>;
    const onResize = () => {
      clearTimeout(timer);
      timer = setTimeout(measure, 200);
    };
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
    };
  }, []);

  useEffect(() => {
    const twitch: TwitchObject = (window as MyWindow).Twitch ?? {};
    if (!containerWidth) return;
    if (!twitch.Player) return
    // The 50px gutter only exists in the xl side-by-side layout.
    const gutter = window.innerWidth >= 1280 ? 50 : 0;
    const w = containerWidth - gutter;
    const h = (9 / 16) * w;
    const options: PlayerOptions = {
      width: w,
      height: h + 0.11,
      video: videoId,
      time: "0h0m1s",
    };

    const initPlayer: Twitch = new twitch.Player("player", options);
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
  }, [videoId, queryData, containerWidth]);

  return (
    <div className="relative">
      <div className="mx-0 bg-slate-700 sm:mx-5 xl:grid xl:grid-cols-12">
        <div
          id="player"
          ref={playerRef}
          className=" w-full xl:col-span-9 xl:col-start-1  xl:row-span-full  "
        ></div>

        <VodSide
          cards={cards}
          setCards={setCards}
          player={player}
          playerRef={playerRef}
          videoId={videoId}
          completed={indexing}
        />
      </div>
      <div>
        <EmoteCarousel videoId={videoId} setCards={setCards} cards={cards} />
      </div>
    </div>
  );
};
