import React from "react";

import { ProgressBar, CommentCards } from "~/components";
import type {
  Twitch,
  Card,
  SetCardsFunction,
} from "~/types/commentCard";
import { api } from "~/utils/api";
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
  const getComments = api.comment.getComments.useMutation({
    onSuccess: () => console.log("success"),
  });
  const deleteAll = api.video.deleteAll.useMutation({
    onSuccess: () => console.log("success"),
  });

  const checkDupe = api.comment.fetch.useMutation({
    onSuccess: () => console.log("success"),
  });

 
  return (
    <div
      style={{ height: x }}
      className={`scrollbar-x relative mr-20 ml-10 2xl:-ml-10 2xl:mr-0 2xl:col-start-10 2xl:col-end-13 row-span-full -ml-10 overflow-y-scroll rounded-lg bg-slate-700 text-center`}
    >
      {completed && <ProgressBar videoId={videoId} />}
      <CommentCards
        playerRef={playerRef}
        cards={cards}
        setCards={setCards}
        videoId={videoId}
        player={player}
      />
            <button
        onClick={() => deleteAll.mutate({ videoId: videoId })}
        className=" bg-black px-2 text-white"
      >
        Delete Comments
      </button>
      <button
        className=" bg-black px-2 text-white"
        onClick={() =>
          getComments.mutate({ videoId: videoId, keyword: "lul", interval: 5 })
        }
      >
        Get Commesdfgsdfgnts
      </button>

      <button
        className=" bg-black px-2 text-white"
        onClick={() => checkDupe.mutate({ videoId: videoId })}
      >
        Check dupe
      </button>
    </div>
  );
};
