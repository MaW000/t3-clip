"use client";

import React from "react";

import { ProgressBar, CommentCards } from "@/components";
import type {
  Twitch,
  Card,
  SetCardsFunction,
} from "@/types/commentCard";

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
  //React 19: useRef<T>(null) yields RefObject<T | null>, so the prop matches.
  playerRef: React.RefObject<HTMLDivElement | null>;
}) => {

  if (!playerRef.current?.clientWidth) return <h1>hi</h1>;

  const x = playerRef.current.clientHeight - 0;
  // const getComments = api.comment.getComments.useMutation({
  //   onSuccess: () => console.log("success"),
  // });
  // const deleteAll = api.video.deleteAll.useMutation({
  //   onSuccess: () => console.log("success"),
  // });

  // const checkDupe = api.comment.fetch.useMutation({
  //   onSuccess: () => console.log("success"),
  // });

 
  return (
    <div
      style={{ "--vod-h": `${x}px` } as React.CSSProperties}
      className={`scrollbar-x relative mt-2 h-[60vh] w-full min-w-0 overflow-y-scroll rounded-lg bg-slate-700 text-center xl:col-start-10 xl:col-end-13 xl:row-span-full xl:mt-0 xl:h-[var(--vod-h)]`}
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
