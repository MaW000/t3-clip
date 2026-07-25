"use client";

import { useState } from "react";

import { HeaderMain, VodThumbnails, TopUsers, LikedCards } from "@/components";
import { api } from "@/trpc/react";
import type { SetTimeFunction } from "@/types/Browse";

/**
 * Client half of /browse. The server component prefetches the three queries
 * below into the React Query cache, so these hooks resolve from hydration
 * rather than firing a second round trip.
 */
export const BrowseContent = () => {
  const [time, setTime] = useState("sec");
  const topUsers = api.ui.getTopUsers.useQuery().data;

  return (
    <main className="min-h-screen ">
      <HeaderMain toggleSearch={true} />
      <div className="mx-4 flex flex-col gap-8 md:mx-10 md:flex-row ">
        <VodComp />
        <div className="w-full min-w-0 md:w-auto">
          <div className="relative">
            <TimeMark time={time} setTime={setTime} />
          </div>

          <div className="mt-8 flex flex-col">
            <h1 className="mb-5 text-lg  float-right text-periwinkle-gray-500 underline underline-offset-8">
              Top Users
            </h1>
            <div className="flex flex-col flex-wrap gap-5">
              {topUsers && <TopUsers topUsers={topUsers} />}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export const TimeMark = ({time, setTime}: {time: string, setTime: SetTimeFunction}) => {

  const recentCards = api.ui.getRecentCards.useQuery().data;
  const cards = time === 'sec' ? recentCards?.top20CardsBySecond : time === "minute" ? recentCards?.top20CardsByMinute : time === "day" ? recentCards?.top20CardsByDay : time === "week" ? recentCards?.top20CardsByWeek : recentCards?.top20CardsBySecond;
  const string = time === 'sec' ? "Most Liked 60 Seconds:               " : time === "minute" ? "Most Liked 30 Minutes:               " : time === "day" ? "Most Liked 24 Hours:               " : time === "week" ? "Most Liked 7 Days:               " : "Most Liked 60 Seconds:               "
  const nextTime = time === 'sec' ? 'minute' : time === 'minute' ? 'day' : time === 'day' ? 'week' : 'sec'

  return (
    <>

    <h1 className="mb-5 flex items-center justify-between gap-4 text-lg text-periwinkle-gray-500">
              <span className="underline underline-offset-8 md:whitespace-pre">{string}</span>
              <span className="shrink-0 cursor-pointer" onClick={() => setTime(nextTime)}>{"><>"}</span>
              </h1>
              <div className="flex flex-col  gap-5">
                {cards && (
                  <LikedCards recentCards={cards} />
                )}
    </div>
    </>
  )
}


export const VodComp = () => {
  const videoThumbs = api.video.getAll.useQuery().data;
  return (
    <div className=" w-full min-w-0 md:w-auto ">
    <h1 className="mb-5 text-lg text-periwinkle-gray-500 underline underline-offset-8">
      Top Vods:
    </h1>
    <div className="grid grid-cols-1 justify-items-center gap-2 sm:grid-cols-2 sm:grid-rows-3 sm:justify-items-start">
      {videoThumbs && <VodThumbnails videos={videoThumbs} />}
    </div>
  </div>
  )
}
