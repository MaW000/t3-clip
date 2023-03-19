import { type NextPage } from "next";
import { useRouter } from "next/router";
import { VideoDash, HeaderMain } from "~/components/elements";

import { useState } from "react";
import Script from "next/script";
import Head from "next/head";
const VideoPage: NextPage = () => {
  const [toggle, setToggle] = useState(false);
  const router = useRouter();
  const { id } = router.query;

  const videoId = Array.isArray(id) ? parseInt(id.join("")) : id ?? "";
  if (!videoId || typeof videoId === "string") return <h1>Wrong Id</h1>;
  return (
    <>
      <Head>
        <title>Cr</title>
        <meta name="description" content="Generated by create-t3-app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Script
        type="text/javascript"
        src="https://player.twitch.tv/js/embed/v1.js"
        onReady={() => {
          setToggle(true);
        }}
      />
      <main className="max-h-screen min-h-screen ">
        <HeaderMain toggleSearch={true} />
        {toggle && <VideoDash videoId={videoId} />}
      </main>
    </>
  );
};

export default VideoPage;
