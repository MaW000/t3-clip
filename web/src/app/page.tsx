import { SearchVod, VodThumbnails, HeaderMain } from "@/components";
import { api } from "@/trpc/server";

/**
 * This used to be a `getStaticProps` prefetch feeding a client `useQuery`, so
 * the thumbnails were frozen at build time. As a server component it reads the
 * top five on every request instead, and ships no query for them to the client.
 */
/** Same reasoning as /browse - the top five change as people vote. */
export const dynamic = "force-dynamic";

export default async function Home() {
  const videoThumbs = await api.video.getFive();

  return (
    <main className="min-h-screen">
      <HeaderMain toggleSearch={false} />
      <div className="">
        <div className=" flex select-none flex-col items-center  ">
          <h1 className="text-center text-5xl font-semibold text-purple-400 hover:cursor-pointer sm:text-6xl md:text-9xl">
            <span className="text-periwinkle-gray-500">Next</span>.Clip
          </h1>
        </div>
        <div className="mt-8 flex justify-center md:mt-12">
          {videoThumbs.length >= 1 && (
            <div
              className={` mt-10 mx-4 flex flex-wrap justify-center gap-4 rounded-lg bg-slate-500 p-2  `}
            >
              <VodThumbnails videos={videoThumbs} />
            </div>
          )}
        </div>
        <p className="text-md mt-10 px-5 text-center font-medium text-white md:text-lg lg:text-2xl">
          Paste in a <span className="text-purple-400">Twitch VOD</span> and find
          the most{" "}
          <span className="font-bold uppercase text-red-500">
            hype moments!!!
          </span>
        </p>
        <SearchVod />
      </div>
    </main>
  );
}
