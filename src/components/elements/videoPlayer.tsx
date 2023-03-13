/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import React, { useEffect, useState, useRef } from "react";
import { SearchVod, VodParse } from "@/elements";

export const VideoDash = ({
  videoId,
  toggle,
}: {
  videoId: number;
  toggle: boolean;
}) => {
  const [player, setPlayer] = useState(null);
  const playerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!playerRef.current?.clientWidth) return;
 
    const w = playerRef.current.clientWidth;
    const h = (9 / 16) * w;
    const options = {
      width: w,
      height: h + 0.11,
      video: videoId,
      time: "0h0m1s",
    };
    const initPlayer = new window.Twitch.Player("player", options);
    if (player === null) {
      setPlayer(initPlayer);
    }

    return () => {
      initPlayer.destroy();
    };
  }, [videoId]);

  return (
    <div className="mx-5 md:grid md:grid-cols-12">
      <div
        id="player"
        ref={playerRef}
        className=" col-span-9 col-start-1  row-span-full  "
      ></div>
      {player && <VodParse player={player} videoId={videoId} />}
    </div>
  );
};
