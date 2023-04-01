import React from "react";
import { ProgressBar, CommentCards } from "~/components";
import type {
  Twitch,
  Card,
  SetCardsFunction,
} from "~/types/commentCard";

export const VodSide = ({
  videoId,
  completed,
  playerRef,
  cards,
  setCards,
  player,
}: {
  cards: Card[];
  setCards: SetCardsFunction;
  player: Twitch | null;
  videoId: number;
  completed: boolean | undefined;
  playerRef: React.RefObject<HTMLDivElement>;
}) => {

  if (!playerRef.current?.clientWidth) return <h1>hi</h1>;

  const x = playerRef.current.clientHeight - 0;

  return (
    <div
      style={{ height: x }}
      className={`scrollbar-x relative col-start-10 col-end-13 row-span-full -ml-10 overflow-y-scroll rounded-lg bg-slate-700 text-center`}
    >
      {completed && <ProgressBar videoId={videoId} />}
      <CommentCards
        playerRef={playerRef}
        cards={cards}
        setCards={setCards}
        videoId={videoId}
        player={player}
      />
    </div>
  );
};
