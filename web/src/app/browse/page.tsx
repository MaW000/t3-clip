import { type Metadata } from "next";

import { BrowseContent } from "@/components";
import { api, HydrateClient } from "@/trpc/server";

export const metadata: Metadata = {
  title: "Browse Vods",
};

/**
 * Rendered per request, never prerendered. The old page used `getStaticProps`,
 * which meant the browse rankings froze at build time and a sleeping database
 * failed the deploy outright. Neither is wanted for a live leaderboard.
 */
export const dynamic = "force-dynamic";

/**
 * The browse page keeps its client hooks - the time filter is stateful and the
 * card list re-reads from the cache when it flips. Prefetching here is the
 * app-router equivalent of the old `getStaticProps` + `ssg.dehydrate()`.
 */
export default async function BrowsePage() {
  void api.video.getAll.prefetch();
  void api.ui.getTopUsers.prefetch();
  void api.ui.getRecentCards.prefetch();

  return (
    <HydrateClient>
      <BrowseContent />
    </HydrateClient>
  );
}
