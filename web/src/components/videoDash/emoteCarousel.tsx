"use client";

import { api } from "@/trpc/react";
import { EmoteCards } from "@/components";
import type { Term } from "@/types/emote";
import type { SetCardsFunction, Card } from "@/types/commentCard";
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
    }
  );
  const terms = (a.data ?? []) as Term[];

  return (
    <div className={`mx-0 flex min-w-0 rounded-b-xl bg-slate-600 pb-2 sm:mx-5`} id="container">
      <EmoteCards
        terms={terms}
        videoId={videoId}
        cards={cards}
        setCards={setCards}
      />
    </div>
  );
};
