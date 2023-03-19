import React, { useEffect, useRef } from "react";
import type { SetPlayerFn, TwitchPlayer } from "~/types/twitchEmbed";

export const TwitchEmbed = ({
  videoId,
  setPlayer,
  player,
  playerRef,
  playerRefFunc,
}: {
  videoId: number;
  setPlayer: SetPlayerFn;
  player: TwitchPlayer | null;
  playerRef: React.RefObject<HTMLDivElement>;
  playerRefFunc: React.MutableRefObject<TwitchPlayer | null>;
}) => {
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

    if (playerRefFunc.current === null) {
      const initPlayer = new (window as any).Twitch.Player("player", options);
      playerRefFunc.current = initPlayer;
    }
  }, [videoId]);

  return (
    <div
      id="player"
      ref={playerRef}
      className=" col-span-9 col-start-1  row-span-full  "
    ></div>
  );
};
