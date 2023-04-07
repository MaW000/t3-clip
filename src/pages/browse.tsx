import type { GetStaticProps, NextPage } from "next";
import { HeaderMain, VodThumbnails, TopUsers, LikedCards } from "~/components";
import Head from "next/head";
import { api } from "~/utils/api";
import {useState} from "react"
import type { SetTimeFunction } from "~/types/Browse";
const BrowsePage: NextPage = () => {
  const [time, setTime] = useState('sec')
  const topUsers = api.ui.getTopUsers.useQuery().data;

  return (
    <>
      <Head>
        <title>Browse Vods</title>
        <meta name="description" content="Generated by create-t3-app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="max-h-screen min-h-screen ">
        <HeaderMain toggleSearch={true} />
        <div className="mx-10 flex ">
      
          
            <VodComp/>
            <div>

           <div className="relative">
              <TimeMark time={time} setTime={setTime}/>
           </div>
             
              <div className="flex flex-col">
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
    </>
  );
};

export const TimeMark = ({time, setTime}: {time: string, setTime: SetTimeFunction}) => {

  const recentCards = api.ui.getRecentCards.useQuery().data;
  const cards = time === 'sec' ? recentCards?.top20CardsBySecond : time === "minute" ? recentCards?.top20CardsByMinute : time === "day" ? recentCards?.top20CardsByDay : time === "week" ? recentCards?.top20CardsByWeek : recentCards?.top20CardsBySecond;
  const string = time === 'sec' ? "Most Liked 60 Seconds:               " : time === "minute" ? "Most Liked 30 Minutes:               " : time === "day" ? "Most Liked 24 Hours:               " : time === "week" ? "Most Liked 7 Days:               " : "Most Liked 60 Seconds:               "
  const nextTime = time === 'sec' ? 'minute' : time === 'minute' ? 'day' : time === 'day' ? 'week' : 'sec'
  console.log(cards, recentCards)
  return (
    <>
    
    <h1 className="mb-5 text-lg  -ml-16  text-periwinkle-gray-500  underline underline-offset-8">
              {string}<span className="absolute right-14 cursor-pointer" onClick={() => setTime(nextTime)}>{"><>"}</span>
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
    <div className="  ">
    <h1 className="mb-5 text-lg text-periwinkle-gray-500 underline underline-offset-8">
      Top Vods:               
    </h1>
    <div className="grid grid-cols-2 grid-rows-3  gap-2">
      {videoThumbs && <VodThumbnails videos={videoThumbs} />}
    </div>
  </div>
  )
}



import { createProxySSGHelpers } from "@trpc/react-query/ssg";
import { appRouter } from "~/server/api/root";
import superjson from "superjson";
import { prisma } from "~/server/db";
export const getStaticProps: GetStaticProps = async () => {
  const ssg = createProxySSGHelpers({
    router: appRouter,
    ctx: { prisma, session: null },
    transformer: superjson,
  });

  await ssg.video.getAll.prefetch();
  await ssg.ui.getTopUsers.prefetch();
  await ssg.ui.getRecentCards.prefetch();
  return {
    props: {
      trpcState: ssg.dehydrate(),
    },
  };
};

export default BrowsePage;
