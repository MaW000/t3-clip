import type { Dispatch, SetStateAction } from "react";

export interface Twitch {
  seek(time: number): void;
}
//a real state setter, so children can update off the previous cards rather than
//off a `cards` array captured when they rendered. Plain `setCards(next)` calls
//still type-check.
export type SetCardsFunction = Dispatch<SetStateAction<Card[]>>;

//which column of the timestamp list the sort pills are currently ordering by
export type SortMode = "time" | "count" | "likes";

//the timestamp block whose chat is showing in the comments panel
export interface Selection {
  cardId: string;
  tsId: string;
}

export interface Card {
  id: string;
  vidId: string;
  keyword: string;
  interval: number;
  sum: number | null;
  avg: number | null;
  max: number | null;
  min: number | null;
  url: string | null;
  likes: number;
  timestamps?: Timestamp[] | null;
  //client-only: cards come off the database without one
  sort?: SortMode;
}
export interface Timestamp {
  id: string;
  timestamp: string;
  likes: number;
  contentOffsetSeconds: number;
  count: number;
  cardId: string;
  vidId: string;
  msgIds: string[];
  liked: string[];
  messages?: Message[] | null;
}
export interface Message {
  id: string;
  vidId: string;
  message: string;
  commentId: string;
  commenter: string | null;
  contentOffsetSeconds: number;
}

export interface CommentCard {
  id: string;
  timestamp: string;
  contentOffsetSeconds: number;
  count: number;
  likes: number;
  finder?: string;
  liked: string[];
  cardId: string[];
  vidId: string;
  msgIds: string[];
}
