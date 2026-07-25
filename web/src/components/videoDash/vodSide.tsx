"use client";

import React from "react";

import { ProgressBar, CommentCards, KeywordList } from "@/components";
import type {
  Card,
  Selection,
  SetCardsFunction,
  Timestamp,
} from "@/types/commentCard";

/**
 * Left column: the VOD's most-typed words on top, and under them the cards of
 * 30s blocks built from a word or an emote.
 *
 * Fixed height beside the player on xl so the two lists scroll independently of
 * the page; below that the columns stack and it grows with its content.
 */
export const VodSide = ({
  videoId,
  indexing,
  cards,
  setCards,
  selected,
  onSelect,
}: {
  cards: Card[];
  setCards: SetCardsFunction;
  videoId: number;
  indexing: boolean | undefined;
  selected: Selection | null;
  onSelect: (card: Card, timestamp: Timestamp, seek: boolean) => void;
}) => {
  return (
    <section className="flex flex-col overflow-hidden rounded-xl border border-slate-900 bg-slate-800 xl:h-180">
      <div className="border-b border-slate-900 px-4 py-3">
        <h2 className="text-periwinkle-gray-500 font-mono text-xs tracking-[.14em]">
          TIMESTAMPS
        </h2>
        <p className="text-periwinkle-gray-900 text-xs">
          30s blocks, ranked by hype
        </p>
      </div>

      {indexing && <ProgressBar videoId={videoId} />}
      <KeywordList videoId={videoId} cards={cards} setCards={setCards} />
      <CommentCards
        cards={cards}
        setCards={setCards}
        selected={selected}
        onSelect={onSelect}
      />
    </section>
  );
};
