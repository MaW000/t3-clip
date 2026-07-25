import { type Metadata } from "next";

import { VideoPageView } from "@/components";

export const metadata: Metadata = {
  title: "Clip Hunter",
};

/**
 * The id is a catch-all so `/video/1749256306` and any stray trailing segments
 * both land here. Next 15 hands `params` over as a promise.
 */
export default async function VideoPage({
  params,
}: {
  params: Promise<{ id: string[] }>;
}) {
  const { id } = await params;
  const videoId = parseInt(id.join(""));

  if (!videoId || Number.isNaN(videoId)) return <h1>Wrong Id</h1>;

  return <VideoPageView videoId={videoId} />;
}
