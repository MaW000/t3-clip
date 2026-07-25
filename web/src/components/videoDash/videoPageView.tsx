"use client";

import { useState } from "react";
import Script from "next/script";

import { VideoDash, HeaderMain } from "@/components";

/**
 * Client half of the video route.
 *
 * The Twitch embed script attaches `window.Twitch` and the player can only be
 * constructed after it has loaded, so the dashboard stays unmounted until
 * `onReady` fires. This was the body of the old `pages/video/[...id].tsx`.
 */
export const VideoPageView = ({ videoId }: { videoId: number }) => {
  const [toggle, setToggle] = useState(false);

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
        {toggle && <VideoDash videoId={videoId} />}
      </main>
    </>
  );
};
