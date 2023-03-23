import React from "react";
import { ProgressBar, CommentCards } from "@/elements";

import { api } from "~/utils/api";
interface Twitch {
  seek(time: number): void;
}
export const VodParse = ({
  videoId,
  completed,
  playerRef,

  player,
}: {
  player: Twitch | null;
  videoId: number;
  completed: boolean | undefined;
  playerRef: React.RefObject<HTMLDivElement>;
}) => {
  if (!playerRef.current?.clientWidth) return <h1>hi</h1>;
  const getComments = api.comment.getComments.useMutation({
    onSuccess: () => console.log("success"),
  });
  const deleteAll = api.video.deleteAll.useMutation({
    onSuccess: () => console.log("success"),
  });
  const a = api.emote.getComments.useQuery({ videoId: videoId });
  const checkDupe = api.comment.fetch.useMutation({
    onSuccess: () => console.log("success"),
  });
  const x = playerRef.current.clientHeight - 0;

  return (
    <div
      style={{ height: x }}
      className={`scrollbar-x relative col-start-10 col-end-13 row-span-full -ml-10 overflow-y-scroll rounded-lg bg-slate-700 text-center`}
    >
      {completed && <ProgressBar videoId={videoId} />}

      <CommentCards playerRef={playerRef} videoId={videoId} player={player} />
      {/* 
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
      </button> */}
    </div>
  );
};
