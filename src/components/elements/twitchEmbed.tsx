import React, { useEffect, useRef } from "react";

interface Twitch {
  current?: {
    seek(time: number): void;
  };
  Player(player: string, options: any): void;
}
interface TwitchPlayer {
  Player: {
    new (id: string, options: string): string;
  };
  Current?: {
    seek(time: number): void;
  };
}
export const TwitchEmbed = ({
  videoId,
  playerRef,
}: {
  videoId: number;
  playerRef: React.RefObject<HTMLDivElement>;
}) => {
  // useEffect(() => {
  //   if (!playerRef.current?.clientWidth) return;

  //   const w = playerRef.current.clientWidth - 50;
  //   const h = (9 / 16) * w;
  //   const options = {
  //     width: w,
  //     height: h + 0.11,
  //     video: videoId,
  //     time: "0h0m1s",
  //   };

  //   if (playerRefFunc?.current === null) {
  //     const initPlayer = new (window as any).Twitch.Player("player", options);
  //   }
  // }, [videoId]);

  return (
    <div
    // id="player"
    // ref={playerRef}
    // className=" col-span-9 col-start-1  row-span-full  "
    ></div>
  );
};
