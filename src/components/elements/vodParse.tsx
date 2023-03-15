import React, { useEffect, useRef, useState } from "react";
import { ProgressBar } from "./progressBar";
import Script from "next/script";
import { api } from "~/utils/api";
export const VodParse = ({
  player,
  videoId,
}: {
  player: object;
  videoId: number;
}) => {
  const getComments = api.comment.getComments.useMutation({
    onSuccess: () => console.log("success"),
  });
  const deleteAll = api.video.deleteAll.useMutation({
    onSuccess: () => console.log("success"),
  });
  const getVideo = api.video.getVideo.useMutation({
    onSuccess: (res) => console.log(res),
  });
  const checkDupe = api.comment.fetch.useMutation({
    onSuccess: () => console.log("success"),
  });
  return (
    <div className="relative col-start-10 col-end-13 row-span-full ml-5 rounded-lg  bg-slate-700 text-center">
      <div>
        <h1 className="mx-10 my-5 text-xl font-semibold text-slate-900">
          Fetching comments this will take a while refresh in a few minutes...
        </h1>
      </div>
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
        onClick={() => getVideo.mutate({ videoId: videoId })}
      >
        Get Video
      </button>
      <button
        className=" bg-black px-2 text-white"
        onClick={() => checkDupe.mutate({ videoId: videoId })}
      >
        Check dupe
      </button>
      <ProgressBar videoId={videoId} />
    </div>
  );
};
