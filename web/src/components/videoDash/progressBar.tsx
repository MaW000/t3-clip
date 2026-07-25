"use client";

import React from "react";
import { api } from "@/trpc/react";

/**
 * Indexing progress for a VOD.
 *
 * The Python worker writes progress to the video_jobs row as it walks the
 * timeline; this just polls that row. No realtime transport involved, so it
 * works the same on Vercel as it does locally.
 */
export const ProgressBar = ({ videoId }: { videoId: number }) => {
  const { data } = api.video.getProgress.useQuery(
    { videoId },
    {
      //stop polling once the job reaches a terminal state. React Query v5 hands
      //the callback the Query, not the data, so the status is read off state.
      //matches the worker's progress write interval, so the bar advances in
      //step with the job rather than in visible jumps
      refetchInterval: (query) => {
        const status = query.state.data?.status;
        return status === "DONE" || status === "FAILED" ? false : 1000;
      },
      refetchOnWindowFocus: false,
    }
  );

  if (!data || data.status === "DONE") return null;

  if (data.status === "FAILED") {
    return (
      <div className="mx-auto select-none space-y-3 px-5 pt-10 align-middle">
        <h1 className="text-2xl text-red-400">Indexing failed</h1>
        <p className="text-sm text-slate-300">
          {data.error ?? "Something went wrong fetching this VOD."}
        </p>
        <p className="text-xs text-slate-400">Reload the page to try again.</p>
      </div>
    );
  }

  const percent = Math.min(100, Math.ceil(data.progress));

  return (
    <div className="mx-auto select-none space-y-5 px-5 pt-10 align-middle">
      <h1 className="-mb-5 text-4xl">{percent}%</h1>
      <div className="h-10 w-full overflow-hidden rounded-3xl bg-slate-800">
        <div
          style={{ width: `${percent}%` }}
          className="z-10 h-10 rounded-3xl bg-black transition-[width] duration-500 ease-out"
        />
      </div>
      <p className="text-sm text-slate-300">
        {data.status === "QUEUED"
          ? "Queued - waiting for a worker to pick this up"
          : `Indexing chat${
              data.streamer ? ` for ${data.streamer}` : ""
            } - ${data.commentsIndexed.toLocaleString()} comments so far`}
      </p>
    </div>
  );
};
