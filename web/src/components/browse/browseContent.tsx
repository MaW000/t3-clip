"use client";

import { useState } from "react";

import { HeaderMain, VodThumbnails, TopUsers, LikedCards } from "@/components";
import { api } from "@/trpc/react";
import type { SetTimeFunction, TimeRange } from "@/types/Browse";

const heading = "font-mono text-xs tracking-[.16em] text-periwinkle-gray-500";

/**
 * Client half of /browse. The server component prefetches the three queries
 * below into the React Query cache, so these hooks resolve from hydration
 * rather than firing a second round trip.
 */
export const BrowseContent = () => {
  const [time, setTime] = useState<TimeRange>("sec");
  const topUsers = api.ui.getTopUsers.useQuery().data;

  return (
    <main className="min-h-screen pb-15">
      <HeaderMain toggleSearch={true} />

      <div className="grid grid-cols-1 gap-6 px-8 pt-2 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)_minmax(0,.8fr)]">
        <VodComp />
        <TimeMark time={time} setTime={setTime} />

        <section className="flex flex-col gap-4">
          <h2 className={heading}>TOP USERS</h2>
          <div className="flex flex-col gap-2">
            {topUsers && <TopUsers topUsers={topUsers} />}
          </div>
        </section>
      </div>
    </main>
  );
};

const RANGES: { key: TimeRange; label: string; title: string }[] = [
  { key: "sec", label: "60S", title: "MOST LIKED · LAST 60 SECONDS" },
  { key: "minute", label: "30M", title: "MOST LIKED · LAST 30 MINUTES" },
  { key: "day", label: "24H", title: "MOST LIKED · LAST 24 HOURS" },
  { key: "week", label: "7D", title: "MOST LIKED · LAST 7 DAYS" },
];

/**
 * The liked moments, over one of four windows. All four lists arrive in a
 * single query, so flipping the range is a re-read of the cache and not a
 * refetch - the pills swap instantly.
 */
export const TimeMark = ({
  time,
  setTime,
}: {
  time: TimeRange;
  setTime: SetTimeFunction;
}) => {
  const recentCards = api.ui.getRecentCards.useQuery().data;
  const byRange = {
    sec: recentCards?.top20CardsBySecond,
    minute: recentCards?.top20CardsByMinute,
    day: recentCards?.top20CardsByDay,
    week: recentCards?.top20CardsByWeek,
  };
  const cards = byRange[time];
  const active = RANGES.find((range) => range.key === time) ?? RANGES[0]!;

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className={heading}>{active.title}</h2>
        <div className="flex shrink-0 gap-1 rounded-full border border-slate-900 bg-slate-800 p-0.75">
          {RANGES.map((range) => (
            <button
              key={range.key}
              onClick={() => setTime(range.key)}
              className={`cursor-pointer rounded-full px-3 py-1.25 font-mono text-[11px] tracking-[.06em] ${
                range.key === time
                  ? "bg-purple-600 text-white"
                  : "text-periwinkle-gray-700 hover:text-periwinkle-gray-400"
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {cards && <LikedCards recentCards={cards} range={time} />}
      </div>
    </section>
  );
};

export const VodComp = () => {
  const videoThumbs = api.video.getAll.useQuery().data;

  return (
    <section className="flex flex-col gap-4">
      <h2 className={heading}>TOP VODS</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {videoThumbs && <VodThumbnails videos={videoThumbs} />}
      </div>
    </section>
  );
};
