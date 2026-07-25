import Link from "next/link";

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
    <main className="min-h-screen pb-20">
      <HeaderMain toggleSearch={false} />

      <div className="mx-auto flex max-w-[1100px] flex-col items-center gap-12 px-6">
        <div className="flex flex-col items-center gap-4 pt-6 select-none">
          <h1 className="text-center text-6xl leading-none font-bold tracking-[-.03em] text-purple-400 sm:text-8xl md:text-[104px]">
            <span className="text-periwinkle-gray-500">Next</span>.Clip
          </h1>
          <p className="text-periwinkle-gray-700 text-center text-xl leading-normal text-pretty">
            Paste in a{" "}
            <span className="font-semibold text-purple-400">Twitch VOD</span>{" "}
            and find the most{" "}
            <span className="text-periwinkle-gray-400 font-bold">
              hype moments
            </span>
            .
          </p>
        </div>

        <SearchVod />

        {videoThumbs.length >= 1 && (
          <section className="flex w-full flex-col gap-4">
            <div className="flex items-baseline justify-between">
              <h2 className="text-periwinkle-gray-500 font-mono text-xs tracking-[.16em]">
                TOP VODS
              </h2>
              <Link
                href="/browse"
                className="text-periwinkle-gray-700 hover:text-periwinkle-gray-400 text-[13px]"
              >
                see all
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              <VodThumbnails videos={videoThumbs} />
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
