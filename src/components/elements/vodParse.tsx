import React, { useState, useEffect } from "react";
import { ProgressBar, CommentCards } from "@/elements";

import { api } from "~/utils/api";
import type {
  Twitch,
  Card,
  Timestamp,
  Message,
  SetCardsFunction,
} from "~/types/commentCard";

export const VodParse = ({
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
  const getComments = api.comment.getComments.useMutation({
    onSuccess: () => console.log("success"),
  });
  const deleteAll = api.video.deleteAll.useMutation({
    onSuccess: () => console.log("success"),
  });

  const checkDupe = api.comment.fetch.useMutation({
    onSuccess: () => console.log("success"),
  });

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

      {/* <button
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
      </button> */}
    </div>
  );
};
