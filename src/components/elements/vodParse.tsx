import React, { useEffect, useRef, useState } from "react";
import { ProgressBar } from "./progressBar";
import Script from "next/script";
import { api } from "~/utils/api";
export const VodParse = ({
  player,
  videoId,
  completed,
}: {
  player: object;
  videoId: number;
  completed: boolean | undefined;
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
  return (
    <div className="relative col-start-10 col-end-13 row-span-full ml-5 rounded-lg  bg-slate-700 text-center">
      {completed && <ProgressBar videoId={videoId} />}
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
        onClick={() => getVideo.mutate({ videoId: videoId })}
      >
        Get Video
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
