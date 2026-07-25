"use client";

import { api } from "@/trpc/react";
import type { SetCardsFunction, Card } from "@/types/commentCard";

/**
 * The VOD's most-typed words, at the top of the sidebar. Tapping one builds a
 * card of timestamps for it, the same flow the emote carousel uses.
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
    }
  );

  const generate = api.comment.getComments.useMutation({
    onSuccess: (data) => {
      if (!data || "message" in data) return;
      setCards([...cards, data]);
    },
  });

  if (!keywords?.length) return null;

  //a word already turned into a card should not offer to build it again
  const pending = generate.variables?.keyword;
  const available = keywords.filter(
    (word) => !cards.some((card) => card.keyword === word.key)
  );

  if (!available.length) return null;

  return (
    <div className="sticky top-0 z-10 bg-slate-800/95 px-2 pt-2 pb-1 backdrop-blur">
      <h2 className="pb-1 text-left font-mono text-xs tracking-wide text-periwinkle-gray-500">
        MOST TYPED
      </h2>

      {/* capped height so the list scrolls instead of pushing the cards down */}
      <div className="scrollbar-x flex max-h-28 flex-wrap gap-1.5 overflow-y-auto pb-1">
        {available.map((word) => {
          const busy = generate.isPending && pending === word.key;
          return (
            <button
              key={word.key}
              disabled={generate.isPending}
              onClick={() =>
                generate.mutate({ videoId, keyword: word.key, interval: 30 })
              }
              className="flex shrink-0 items-baseline gap-1.5 rounded-lg bg-slate-900 py-1 px-2 text-sm text-white transition duration-200 hover:bg-purple-600 disabled:opacity-50"
            >
              <span className="font-semibold">{word.label}</span>
              <span className="font-mono text-xs text-periwinkle-gray-700">
                {busy ? "..." : word.amount.toLocaleString()}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
