"use client";

import type {
  Card,
  Selection,
  SetCardsFunction,
  Timestamp,
} from "@/types/commentCard";
import { CardEle, Timestamps, TimestampFilter } from "./Cards";

/**
 * The scrolling list of cards inside the timestamps panel. A card is open when
 * its timestamps have been fetched, so the expanded half is driven by the data
 * rather than by a second flag.
 */
export const CommentCards = ({
  cards,
  setCards,
  selected,
  onSelect,
}: {
  cards: Card[];
  setCards: SetCardsFunction;
  selected: Selection | null;
  onSelect: (card: Card, timestamp: Timestamp, seek: boolean) => void;
}) => {
  if (!cards.length) {
    return (
      <div className="flex flex-1 items-center justify-center px-8 py-10 text-center">
        <p className="text-periwinkle-gray-900 text-[13px] leading-relaxed text-pretty">
          Pick a word above or an emote below the player to build a card of
          timestamps.
        </p>
      </div>
    );
  }

  return (
    <div className="scrollbar-x flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3">
      {cards.map((card) => (
        <div
          key={card.id}
          className="shrink-0 overflow-hidden rounded-[10px] border border-[#172033] bg-slate-900"
        >
          <CardEle card={card} setCards={setCards} />

          {card.timestamps && (
            <div className="border-t border-[#172033]">
              <TimestampFilter card={card} setCards={setCards} />
              {card.timestamps.map((timestamp) => (
                <Timestamps
                  key={timestamp.id}
                  card={card}
                  timestamp={timestamp}
                  setCards={setCards}
                  selected={selected?.tsId === timestamp.id}
                  onSelect={onSelect}
                />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
