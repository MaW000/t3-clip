import React, {  useState,  } from "react";
import {  VodParse, TwitchEmbed } from "@/elements";
import { api } from "~/utils/api";
interface TwitchPlayer {
  play: () => void;
  pause: () => void;
  destroy: () => void;
  // Add any other properties or methods that you need
}
export const VideoDash = ({ videoId }: { videoId: number }) => {
  const [player, setPlayer] = useState<TwitchPlayer | null>(null);

  const videoSaveRes = api.video.getVideo.useQuery({ videoId: videoId });
  const response = videoSaveRes.data;

  return (
    <div>
      <div className="mx-5 md:grid md:grid-cols-12">
        <TwitchEmbed player={player} setPlayer={setPlayer} videoId={videoId} />

        {player && (
          <VodParse player={player} videoId={videoId} completed={response} />
        )}
      </div>
      <div>
        <h1>asdfasdfom</h1>
      </div>
    </div>
  );
};
