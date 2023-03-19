import React, { useRef, useEffect } from "react";
import type { RefObject } from "react";
import { VodParse, TwitchEmbed, EmoteCarousel } from "@/elements";
import { api } from "~/utils/api";
interface TwitchPlayer {
  play: () => void;
  pause: () => void;
  destroy: () => void;
  // Add any other properties or methods that you need
}

interface TwitchPlayer {
  seek(time: number): void;
}
export const VideoDash = ({ videoId }: { videoId: number }) => {
  const playerRef = useRef<HTMLDivElement>(null);
  const videoSaveRes = api.video.getVideo.useQuery({ videoId: videoId });
  const response = videoSaveRes.data;
  const playerRefFunc = useRef<HTMLDivElement | null>(null);
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

    if (playerRefFunc?.current === null) {
      const initPlayer = new (window as any).Twitch.Player("player", options);
      playerRefFunc.current = initPlayer;
    }
  }, [videoId]);
  return (
    <div className="relative">
      <div className="mx-5 bg-slate-700 md:grid md:grid-cols-12">
        <div
          id="player"
          ref={playerRef}
          className=" col-span-9 col-start-1  row-span-full  "
        ></div>

        <VodParse
          playerRefFunc={playerRefFunc}
          playerRef={playerRef}
          videoId={videoId}
          completed={response}
        />
      </div>
      <div>
        <EmoteCarousel videoId={videoId} />
      </div>
    </div>
  );
};
