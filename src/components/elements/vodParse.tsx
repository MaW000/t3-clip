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
  const hello = api.example.getVideo.useMutation({
    onSuccess: () => console.log("success"),
  });
  const helloo = api.example.deleteAll.useMutation({
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
        onClick={() => helloo.mutate({ videoId: videoId })}
        className=" bg-black px-2 text-white"
      >
        Delete Comments
      </button>
      <button
        className=" bg-black px-2 text-white"
        onClick={() => hello.mutate({ videoId: videoId })}
      >
        Get Comments
      </button>

      <ProgressBar videoId={videoId} />
    </div>
  );
};
