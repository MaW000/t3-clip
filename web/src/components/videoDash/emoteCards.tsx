"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { api } from "@/trpc/react";
import type { Term } from "@/types/emote";
import type { SetCardsFunction, Card } from "@/types/commentCard";

export const EmoteCards = ({
  terms,
  videoId,
  setCards,
  cards,
}: {
  cards: Card[];
  setCards: SetCardsFunction;
  terms: Term[];
  videoId: number;
}) => {
  const [updatedTerms, setUpdatedTerms] = useState<Term[]>(terms);

  useEffect(() => {
    if (!terms || !cards) return;
    //a copy, so sorting does not reorder the array React Query is holding
    const sorted = [...terms].sort((a, b) => b.amount - a.amount);

    const filteredTerms = sorted.filter((term) =>
      cards.every((card) => card.keyword !== term.term),
    );
    setUpdatedTerms(filteredTerms);
  }, [terms, cards]);

  const comments = api.comment.getComments.useMutation({
    onSuccess: (data) => {
      if (!data || "message" in data) return;
      setCards((prev) => [...prev, data]);
    },
  });

  const handleTermClick = (clickedTerm: Term) => {
    comments.mutate({ videoId, keyword: clickedTerm.term });
    setUpdatedTerms(
      (prevTerms) =>
        prevTerms.filter((term) => term.emojiId !== clickedTerm.emojiId), // create new array without clicked term
    );
  };

  if (!updatedTerms.length) {
    return (
      <p className="text-periwinkle-gray-900 px-4 py-6 text-center text-[13px]">
        {terms.length
          ? "Every emote already has a card."
          : "Emotes appear here once the worker reaches this channel."}
      </p>
    );
  }

  return (
    <div className="scrollbar-x flex min-w-0 gap-2 overflow-x-auto px-4 py-3">
      {updatedTerms.map((term) => (
        <button
          key={term.emojiId}
          onClick={() => handleTermClick(term)}
          className="flex w-21 shrink-0 cursor-pointer flex-col items-center gap-2 rounded-[10px] border border-transparent bg-slate-900 px-1.5 py-2.5 transition duration-200 hover:border-purple-600 hover:bg-[#17203a]"
        >
          <span className="relative h-10 w-10">
            <Image
              src={term.url}
              alt={term.term}
              fill={true}
              className="object-contain"
            />
          </span>
          <span className="max-w-18 truncate text-xs font-semibold text-purple-400">
            {term.term}
          </span>
          <span className="font-mono text-[11px] text-[#64ffda]">
            {term.amount.toLocaleString()}
          </span>
        </button>
      ))}
    </div>
  );
};
