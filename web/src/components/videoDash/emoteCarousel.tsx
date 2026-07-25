"use client";

import { api } from "@/trpc/react";
import { EmoteCards } from "@/components";
import type { Term } from "@/types/emote";
import type { SetCardsFunction, Card } from "@/types/commentCard";

/**
 * The channel's emotes, under the player. Each one builds a card of the blocks
 * it was typed in, the same flow the most-typed word list uses.
 */
export const EmoteCarousel = ({
  videoId,
  setCards,
  cards,
}: {
  cards: Card[];
  videoId: number;
  setCards: SetCardsFunction;
}) => {
  //The worker writes emotes early in the run, partway through RUNNING rather
  //than on a status change, so the invalidation in VideoPageView can land
  //before they exist. Keep asking until they show up, then stop.
  const a = api.emote.getComments.useQuery(
    { videoId: videoId },
    {
      refetchInterval: (query) =>
        (query.state.data?.length ?? 0) > 0 ? false : 5000,
      refetchOnWindowFocus: false,
    },
  );
  const terms = (a.data ?? []) as Term[];

  return (
    <div className="overflow-hidden rounded-xl border border-slate-900 bg-slate-800">
      <div className="flex items-baseline justify-between border-b border-slate-900 px-4 py-3">
        <h2 className="text-periwinkle-gray-500 font-mono text-xs tracking-[.14em]">
          CHANNEL EMOTES
        </h2>
        <span className="text-periwinkle-gray-900 font-mono text-xs whitespace-nowrap">
          click to build a card
        </span>
      </div>
      <EmoteCards
        terms={terms}
        videoId={videoId}
        cards={cards}
        setCards={setCards}
      />
    </div>
  );
};
