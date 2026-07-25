"use client";

import { api } from "@/trpc/react";
import type { SetCardsFunction, Card } from "@/types/commentCard";

/**
 * The VOD's most-typed words, at the top of the timestamps panel. Tapping one
 * builds a card of timestamps for it, the same flow the emote carousel uses.
 *
 * Words come from the Python worker, which folds spellings together, so "w"
 * here covers "ww", "wwww" and so on, and "lol" covers "lmao" and "haha".
 */
export const KeywordList = ({
  videoId,
  cards,
  setCards,
}: {
  videoId: number;
  cards: Card[];
  setCards: SetCardsFunction;
}) => {
  //keywords are written when indexing finishes, so keep asking until they
  //appear rather than leaving the list empty until a manual reload
  const { data: keywords } = api.video.getKeywords.useQuery(
    { videoId },
    {
      refetchInterval: (query) =>
        (query.state.data?.length ?? 0) > 0 ? false : 5000,
      refetchOnWindowFocus: false,
    },
  );

  const generate = api.comment.getComments.useMutation({
    onSuccess: (data) => {
      if (!data || "message" in data) return;
      setCards((prev) => [...prev, data]);
    },
  });

  if (!keywords?.length) return null;

  //a word already turned into a card should not offer to build it again
  const pending = generate.variables?.keyword;
  const available = keywords.filter(
    (word) => !cards.some((card) => card.keyword === word.key),
  );

  if (!available.length) return null;

  return (
    <div className="border-b border-slate-900 px-4 py-3">
      <h3 className="text-periwinkle-gray-700 pb-2 font-mono text-[11px] tracking-[.14em]">
        MOST TYPED
      </h3>

      {/* capped height so the list scrolls instead of pushing the cards down */}
      <div className="scrollbar-x flex max-h-21 flex-wrap gap-1.5 overflow-y-auto">
        {available.map((word) => {
          const busy = generate.isPending && pending === word.key;
          return (
            <button
              key={word.key}
              disabled={generate.isPending}
              onClick={() =>
                generate.mutate({ videoId, keyword: word.key, interval: 30 })
              }
              className="flex shrink-0 items-baseline gap-1.5 rounded-lg bg-slate-900 px-2.5 py-[5px] text-[13px] text-white transition duration-200 hover:bg-purple-600 disabled:opacity-50"
            >
              <span className="font-semibold">{word.label}</span>
              <span className="text-periwinkle-gray-700 font-mono text-[11px]">
                {busy ? "..." : word.amount.toLocaleString()}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
