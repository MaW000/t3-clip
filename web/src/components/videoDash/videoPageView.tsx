"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";

import { VideoDash, HeaderMain } from "@/components";
import { api } from "@/trpc/react";

/**
 * Client half of the video route.
 *
 * The Twitch embed script attaches `window.Twitch` and the player can only be
 * constructed after it has loaded, so the dashboard stays unmounted until
 * `onReady` fires. This was the body of the old `pages/video/[...id].tsx`.
 */
export const VideoPageView = ({ videoId }: { videoId: number }) => {
  const [toggle, setToggle] = useState(false);

  //Queues the VOD for indexing. This used to live inside VideoDash, which only
  //mounts once the embed script above calls onReady - so a blocked or slow
  //script meant the job was never created and the VOD silently never indexed.
  //Nothing gates it here.
  const { data: indexing } = api.video.getVideo.useQuery({ videoId });

  //The sidebar queries run once on mount, which is before the worker has
  //written anything, so their results used to stay empty until a manual
  //reload. Watching the job status here and invalidating on each transition
  //makes them refetch as the data actually lands. Same query key as the
  //progress bar, so React Query shares one request rather than polling twice.
  const utils = api.useUtils();
  const { data: job } = api.video.getProgress.useQuery(
    { videoId },
    {
      refetchInterval: (query) => {
        const status = query.state.data?.status;
        return status === "DONE" || status === "FAILED" ? false : 1000;
      },
      refetchOnWindowFocus: false,
    }
  );

  const status = job?.status;
  const lastStatus = useRef<typeof status>(undefined);

  useEffect(() => {
    if (!status || status === lastStatus.current) return;
    lastStatus.current = status;

    void utils.emote.getComments.invalidate({ videoId });
    void utils.card.getCards.invalidate({ videoId });
  }, [status, videoId, utils]);

  return (
    <>
      <Script
        type="text/javascript"
        src="https://player.twitch.tv/js/embed/v1.js"
        onReady={() => {
          setToggle(true);
        }}
      />
      <main className="min-h-screen ">
        <HeaderMain toggleSearch={true} />
        {toggle && <VideoDash videoId={videoId} indexing={indexing} />}
      </main>
    </>
  );
};
