import React, { useState, useRef } from "react";
import { VodParse, TwitchEmbed, EmoteCarousel } from "@/elements";
import { api } from "~/utils/api";
interface TwitchPlayer {
  play: () => void;
  pause: () => void;
  destroy: () => void;
  // Add any other properties or methods that you need
}
interface Twitch {
  current?: {
    seek(time: number): void;
  };
}
export const VideoDash = ({ videoId }: { videoId: number }) => {
  const [player, setPlayer] = useState<TwitchPlayer | null>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const videoSaveRes = api.video.getVideo.useQuery({ videoId: videoId });
  const response = videoSaveRes.data;
  const playerRefFunc = useRef<Twitch>(null);
  return (
    <div className="relative">
      <div className="mx-5 bg-slate-700 md:grid md:grid-cols-12">
        <TwitchEmbed
          player={player}
          playerRef={playerRef}
          playerRefFunc={playerRefFunc}
          setPlayer={setPlayer}
          videoId={videoId}
        />
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
