import type { GetStaticProps, NextPage } from "next";
import Head from "next/head";
import { SearchVod, VodThumbnails, HeaderMain } from "~/components";
import { api } from "~/utils/api";

const Home: NextPage = () => {
  const videoThumbs = api.video.getFive.useQuery().data;
  return (
    <>
      <Head>
        <title>NextClip</title>
        <meta name="description" content="Generated by create-t3-app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="max-h-screen min-h-screen">
        <HeaderMain toggleSearch={false} />
        <div className="">
          <div className=" flex select-none flex-col items-center  ">
            <h1 className="text-6xl font-semibold text-purple-400 hover:cursor-pointer md:text-9xl">
              <span className="text-periwinkle-gray-500">Next</span>.Clip
            </h1>
          </div>
          <div className="mt-12 flex justify-center">
      {videoThumbs && videoThumbs.length >= 1 && 
            <div
              className={` mt-10 mx-5 flex-wrap flex gap-4 rounded-lg bg-slate-500 p-2  `}
            >
              
              <VodThumbnails videos={videoThumbs} />
              
            </div>
            }
          </div>
          <p className="text-md mt-10 px-5 text-center font-medium text-white md:text-lg lg:text-2xl">
            Paste in a <span className="text-purple-400">Twitch VOD</span> and
            find the most{" "}
            <span className="font-bold uppercase text-red-500">
              hype moments!!!
            </span>
          </p>
          <SearchVod />
        </div>
      </main>
    </>
  );
};

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

  await ssg.video.getFive.prefetch();

  return {
    props: {
      trpcState: ssg.dehydrate(),
    },
  };
};

export default Home;
