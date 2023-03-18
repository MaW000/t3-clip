import React, { useEffect } from "react";
import type { SetPlayerFn, TwitchPlayer } from "~/types/twitchEmbed";

export const TwitchEmbed = ({
  videoId,
  setPlayer,
  player,
  playerRef,
}: {
  videoId: number;
  setPlayer: SetPlayerFn;
  player: TwitchPlayer | null;
  playerRef: React.RefObject<HTMLDivElement>;
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

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const initPlayer = new (window as any).Twitch.Player("player", options);

    if (player === null) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      setPlayer(initPlayer);
    }

    return () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      initPlayer.destroy();
    };
  }, [videoId, player, setPlayer]);

  return (
    <div
      id="player"
      ref={playerRef}
      className=" col-span-9 col-start-1  row-span-full  "
    ></div>
  );
};
