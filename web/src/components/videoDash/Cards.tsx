"use client";

import Image from "next/image";
import { api } from "@/trpc/react";
import type {
  SetCardsFunction,
  Card,
  Timestamp,
  Message,
  SortMode,
} from "@/types/commentCard";
import { useSession } from "next-auth/react";
import { AiFillHeart, AiOutlineHeart } from "react-icons/ai";

/**
 * Opening a card and flipping which column ranks it are the same request. The
 * server hands back only the top blocks, so a different sort is a different set
 * of rows rather than a reorder of the ones already here.
 */
const useTimestamps = (setCards: SetCardsFunction) =>
  api.card.getCard.useMutation({
    //keyed off the request rather than the response, so a card that comes back
    //with nothing still opens instead of silently doing nothing
    onSuccess: (data, variables) => {
      setCards((prev) =>
        prev.map((c): Card =>
          c.id === variables.cardId
            ? { ...c, timestamps: data, sort: variables.sort }
            : c,
        ),
      );
    },
  });

/**
 * The head of a card: what it was built from, and the spread of message counts
 * across its blocks. Clicking it fetches the timestamps, or drops them again.
 */
export const CardEle = ({
  card,
  setCards,
}: {
  card: Card;
  setCards: SetCardsFunction;
}) => {
  const getTimestamps = useTimestamps(setCards);

  const open = !!card.timestamps;

  const handleToggle = () => {
    if (open) {
      setCards((prev) =>
        prev.map((c): Card =>
          c.id === card.id ? { ...c, timestamps: null } : c,
        ),
      );
    } else {
      getTimestamps.mutate({ cardId: card.id, sort: card.sort ?? "count" });
    }
  };

  const stats: { label: string; value: number | null }[] = [
    { label: "SUM", value: card.sum },
    { label: "AVG", value: card.avg },
    { label: "MIN", value: card.min },
    { label: "MAX", value: card.max },
  ];

  return (
    <>
      <button
        onClick={handleToggle}
        className="flex w-full cursor-pointer items-center gap-2.5 p-2.5 text-left"
      >
        {/* word cards carry no image, unlike emote cards - they get a tile of
            the word itself so both kinds line up at the same size */}
        {card.url ? (
          <span className="relative h-10 w-10 shrink-0">
            <Image
              src={card.url}
              alt={card.keyword}
              fill={true}
              className="object-contain"
            />
          </span>
        ) : (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#3b2d5c] bg-[#1e1b33] font-mono text-[13px] font-bold text-purple-400">
            {card.keyword}
          </span>
        )}

        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate text-[15px] font-semibold text-purple-400">
            {card.keyword}
          </span>
          <span className="text-periwinkle-gray-700 flex gap-2 font-mono text-[11px] whitespace-nowrap">
            {card.interval}s
            <span className="flex items-center gap-1 text-[#64ffda]">
              <AiFillHeart />
              {card.likes}
            </span>
          </span>
        </span>
      </button>

      {/* the 1px gap is the grid showing through, so the four stats read as one
          block rather than four floating labels */}
      <div className="grid grid-cols-2 gap-px border-t border-[#172033] bg-[#172033]">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-slate-900 px-2 py-[7px]">
            <div className="text-periwinkle-gray-900 font-mono text-[10px] tracking-[.1em]">
              {stat.label}
            </div>
            <div className="text-periwinkle-gray-500 font-mono text-sm font-semibold">
              {stat.value === null ? "-" : stat.value.toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

/**
 * One 30s block. The timestamp seeks the VOD and fills the chat panel; MSGS
 * fills the panel without moving the player.
 */
export const Timestamps = ({
  card,
  timestamp,
  setCards,
  selected,
  onSelect,
}: {
  card: Card;
  timestamp: Timestamp;
  setCards: SetCardsFunction;
  selected: boolean;
  onSelect: (card: Card, timestamp: Timestamp, seek: boolean) => void;
}) => {
  //both sides of the like write the same shape back, so one handler covers them
  const applyLike = (data: {
    id: string;
    cardId: string;
    likes: number;
    liked: string[];
    cardLikes: number;
  }) => {
    setCards((prev) =>
      prev.map((c): Card => {
        if (c.id !== data.cardId) return c;
        return {
          ...c,
          likes: data.cardLikes,
          timestamps: c.timestamps?.map((t) =>
            t.id === data.id
              ? { ...t, likes: data.likes, liked: data.liked }
              : t,
          ),
        };
      }),
    );
  };

  const handleLikes = api.card.likeCard.useMutation({
    onSuccess: (data) => data && applyLike(data),
  });
  const handleDisLike = api.card.disLikeCard.useMutation({
    onSuccess: (data) => data && applyLike(data),
  });

  const session = useSession();
  const id = session.data?.user.id;
  const liked = !!id && timestamp.liked.includes(id);

  return (
    <div
      className={`flex flex-col gap-1 border-t border-[#131c2e] px-2.5 py-2 ${
        selected ? "bg-[#17203a]" : ""
      }`}
    >
      <button
        onClick={() => onSelect(card, timestamp, true)}
        className="hover:text-periwinkle-gray-400 cursor-pointer text-left font-mono text-xs text-purple-400 transition"
      >
        {timestamp.timestamp}
      </button>

      <div className="flex items-center gap-2">
        <span className="text-periwinkle-gray-500 font-mono text-xs">
          {timestamp.count.toLocaleString()} msgs
        </span>

        <button
          disabled={!id}
          onClick={() => {
            if (!id) return;
            if (liked) {
              handleDisLike.mutate({ cardId: timestamp.id, userId: id });
            } else {
              handleLikes.mutate({ cardId: timestamp.id, userId: id });
            }
          }}
          className={`flex items-center gap-1 font-mono text-xs ${
            liked
              ? "text-purple-400"
              : "text-periwinkle-gray-800 enabled:hover:text-purple-400"
          } ${id ? "cursor-pointer" : "cursor-default"}`}
        >
          {liked ? <AiFillHeart /> : <AiOutlineHeart />}
          {timestamp.likes}
        </button>

        <button
          onClick={() => onSelect(card, timestamp, false)}
          className="text-periwinkle-gray-700 hover:text-periwinkle-gray-400 ml-auto cursor-pointer rounded-md border border-[#2b3856] px-2 py-[3px] font-mono text-[10px] tracking-[.08em] whitespace-nowrap transition hover:border-purple-600"
        >
          MSGS
        </button>
      </div>
    </div>
  );
};

export const Comments = ({ message }: { message: Message }) => {
  return (
    <div className="flex flex-col gap-px px-3.5 py-1.5">
      <span className="text-xs font-semibold [overflow-wrap:anywhere] text-purple-400">
        {message.commenter}
      </span>
      <span className="text-periwinkle-gray-400 text-[13px] leading-[1.35] text-pretty [overflow-wrap:anywhere]">
        {message.message}
      </span>
    </div>
  );
};

const SORTS: { key: SortMode; label: string }[] = [
  { key: "count", label: "COUNT" },
  { key: "likes", label: "LIKES" },
];

/**
 * Which column the card's blocks are ranked by. Each pill refetches, because
 * only the top slice is ever held here - the ten loudest blocks and the ten
 * most liked are not the same ten rows in a different order.
 */
export const TimestampFilter = ({
  card,
  setCards,
}: {
  card: Card;
  setCards: SetCardsFunction;
}) => {
  const getTimestamps = useTimestamps(setCards);
  const active = card.sort ?? "count";

  return (
    <div className="flex flex-wrap gap-1 p-2">
      {SORTS.map((sort) => (
        <button
          key={sort.key}
          disabled={getTimestamps.isPending || sort.key === active}
          onClick={() =>
            getTimestamps.mutate({ cardId: card.id, sort: sort.key })
          }
          className={`rounded-full border border-[#24304a] px-[7px] py-[3px] font-mono text-[10px] ${
            active === sort.key
              ? "bg-purple-600 text-white"
              : "text-periwinkle-gray-700 hover:text-periwinkle-gray-400 cursor-pointer disabled:opacity-50"
          }`}
        >
          {sort.label}
        </button>
      ))}
    </div>
  );
};
