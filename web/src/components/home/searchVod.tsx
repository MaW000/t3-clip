"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { parseVodId } from "@/lib/vodId";

/**
 * The home page's vod box. The header search on the other pages does the same
 * job through the same parser - this one gets the label and the hint because it
 * is the first thing anyone does here.
 */
export const SearchVod = () => {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  function handleUrl() {
    const videoId = parseVodId(url);

    if (videoId === null) {
      setError("Please enter a valid Twitch VOD url or id");
      return;
    }

    setError("");
    router.push(`/video/${videoId}`);
  }

  return (
    <div className="flex w-full max-w-[720px] flex-col gap-2.5 rounded-[14px] border border-slate-900 bg-slate-800 p-6">
      <label className="text-periwinkle-gray-500 font-mono text-[11px] tracking-[.16em]">
        TWITCH VOD URL
      </label>

      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleUrl()}
          placeholder="https://www.twitch.tv/videos/1749256306"
          className="field h-12 min-w-0 flex-1 rounded-[10px] text-base"
        />
        <button
          onClick={handleUrl}
          className="h-12 shrink-0 cursor-pointer rounded-[10px] bg-purple-400 px-7 text-[15px] font-bold text-[#15162c] transition duration-200 hover:bg-purple-600 hover:text-white"
        >
          Submit
        </button>
      </div>

      {error ? (
        <p className="text-[13px] text-amber-600">{error}</p>
      ) : (
        <p className="text-periwinkle-gray-900 text-[13px]">
          Any recent broadcast id or url works. Indexing starts as soon as you
          submit.
        </p>
      )}
    </div>
  );
};
