"use client";

import React from "react";
import { api } from "@/trpc/react";

/**
 * Indexing progress for a VOD, at the top of the timestamps panel.
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
    },
  );

  if (!data || data.status === "DONE") return null;

  if (data.status === "FAILED") {
    return (
      <div className="border-b border-slate-900 px-4 py-3">
        <h3 className="font-mono text-xs tracking-[.14em] text-red-400">
          INDEXING FAILED
        </h3>
        <p className="text-periwinkle-gray-700 mt-2 text-xs leading-snug text-pretty">
          {data.error ?? "Something went wrong fetching this VOD."}
        </p>
        <p className="text-periwinkle-gray-900 mt-1 text-xs">
          Reload the page to try again.
        </p>
      </div>
    );
  }

  const percent = Math.min(100, Math.ceil(data.progress));

  return (
    <div className="border-b border-slate-900 px-4 py-3">
      <div className="flex items-baseline justify-between">
        <h3 className="text-periwinkle-gray-500 font-mono text-xs tracking-[.14em]">
          INDEXING
        </h3>
        <span className="font-mono text-xs text-[#64ffda]">{percent}%</span>
      </div>

      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-900">
        <div
          style={{ width: `${percent}%` }}
          className="h-1.5 rounded-full bg-purple-400 transition-[width] duration-500 ease-out"
        />
      </div>

      <p className="text-periwinkle-gray-900 mt-2 text-xs leading-snug text-pretty">
        {data.status === "QUEUED"
          ? "Queued - waiting for a worker to pick this up"
          : `Indexing chat${
              data.streamer ? ` for ${data.streamer}` : ""
            } - ${data.commentsIndexed.toLocaleString()} comments so far`}
      </p>
    </div>
  );
};
