import React, { useRef, useEffect, useState } from "react";

import { VodParse, EmoteCarousel } from "@/elements";
import { api } from "~/utils/api";
interface TwitchPlayera {
  play: () => void;
  pause: () => void;
  destroy: () => void;
  // Add any other properties or methods that you need
}

interface TwitchPlayer {
  seek(time: number): void | null;
}
export const VideoDash = ({ videoId }: { videoId: number }) => {
  const playerRef = useRef<HTMLDivElement>(null);
  const videoSaveRes = api.video.getVideo.useQuery({ videoId: videoId });
  const response = videoSaveRes.data;
  const [player, setPlayer] = useState<TwitchPlayer | null>(null);
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
    setPlayer(initPlayer);
    if (player === null && playerRef.current !== null) {
      // playerRefFunc.current = initPlayer;
      // setPlayer(new (window as any).Twitch.Player("player", options));
    }
    return () => {
      if (initPlayer !== null) {
        initPlayer.destroy();
      }
    };
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
          player={player}
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
