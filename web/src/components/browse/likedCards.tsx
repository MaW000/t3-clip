import Image from "next/image";
import Link from "next/link";
import { AiFillHeart } from "react-icons/ai";

import type { Comment } from "@/types/ui";
import type { TimeRange } from "@/types/Browse";

//the list is ranked by the active window's counter, so that is the number to
//show - "41" beside a 60s row means 41 likes in the last minute, not ever
const COUNTER: Record<TimeRange, keyof Comment> = {
  sec: "second",
  minute: "minute",
  day: "day",
  week: "week",
};

export const LikedCards = ({
  recentCards,
  range,
}: {
  recentCards: Comment[];
  range: TimeRange;
}) => {
  return (
    <>
      {recentCards?.map((card) => {
        const counter = card[COUNTER[range]];
        const likes = typeof counter === "number" ? counter : card.likes;

        return (
          <div
            key={card.id}
            className="flex items-center gap-3 rounded-[10px] border border-slate-900 bg-slate-800 px-3 py-2.5"
          >
            {/* word cards carry no image - the keyword itself becomes the tile,
                so every row lines up at the same width */}
            {card.card.url ? (
              <Image
                src={card.card.url}
                alt={card.card.keyword}
                width={36}
                height={36}
                className="h-9 w-9 shrink-0 object-contain"
              />
            ) : (
              <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#3b2d5c] bg-[#1e1b33] font-mono text-xs font-bold text-purple-400">
                {card.card.keyword}
              </span>
            )}

            <span className="min-w-0 flex-1 truncate text-sm font-semibold text-purple-400">
              {card.card.keyword}
            </span>

            <span className="flex items-center gap-1 font-mono text-xs text-[#64ffda]">
              <AiFillHeart />
              {likes}
            </span>

            <Link
              href={`/video/${card.video.videoId}`}
              className="text-periwinkle-gray-500 font-mono text-xs whitespace-nowrap hover:text-purple-400"
            >
              {card.timestamp}
            </Link>
          </div>
        );
      })}
    </>
  );
};
