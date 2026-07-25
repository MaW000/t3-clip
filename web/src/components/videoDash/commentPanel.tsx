"use client";

import type { Card, Timestamp } from "@/types/commentCard";
import { Comments } from "./Cards";

/**
 * Right column: the chat that happened inside the selected 30s block.
 *
 * The messages used to unfold underneath the timestamp that fetched them, which
 * pushed the rest of the card off screen in a column this narrow. They get their
 * own panel here, and the card list stays a list.
 */
export const CommentPanel = ({
  card,
  timestamp,
  loading,
}: {
  card: Card | null;
  timestamp: Timestamp | null;
  loading: boolean;
}) => {
  const messages = timestamp?.messages ?? [];

  return (
    <section className="flex flex-col overflow-hidden rounded-xl border border-slate-900 bg-slate-800 xl:h-180">
      <div className="border-b border-slate-900 px-4 py-3">
        <h2 className="text-periwinkle-gray-500 font-mono text-xs tracking-[.14em]">
          COMMENTS
        </h2>
        <p className="text-periwinkle-gray-900 text-xs">
          {timestamp ? "chat inside this 30s block" : "nothing selected"}
        </p>
      </div>

      {card && timestamp ? (
        <>
          <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-900 bg-[#17203a] px-3.5 py-2.5">
            <span className="rounded-md border border-[#3b2d5c] bg-[#1e1b33] px-2 py-[3px] font-mono text-[11px] font-bold text-purple-400">
              {card.keyword}
            </span>
            <span className="text-periwinkle-gray-500 font-mono text-xs">
              {timestamp.timestamp}
            </span>
            <span className="ml-auto font-mono text-xs text-[#64ffda]">
              {timestamp.count.toLocaleString()} msgs
            </span>
          </div>

          {messages.length ? (
            <div className="scrollbar-x min-h-0 flex-1 overflow-y-auto py-1">
              {messages.map((message) => (
                <Comments key={message.id} message={message} />
              ))}
            </div>
          ) : (
            <Empty>
              {loading ? "Loading chat..." : "No chat stored for this block."}
            </Empty>
          )}
        </>
      ) : (
        <Empty>
          Pick a timestamp block on the left to read the chat that happened
          inside it.
        </Empty>
      )}
    </section>
  );
};

const Empty = ({ children }: { children: React.ReactNode }) => (
  <div className="flex flex-1 items-center justify-center p-8 text-center">
    <p className="text-periwinkle-gray-900 text-[13px] leading-relaxed text-pretty">
      {children}
    </p>
  </div>
);
