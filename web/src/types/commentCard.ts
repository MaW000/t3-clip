import type { Dispatch, SetStateAction } from "react";

export interface Twitch {
  seek(time: number): void;
}
//a real state setter, so children can update off the previous cards rather than
//off a `cards` array captured when they rendered. Plain `setCards(next)` calls
//still type-check.
export type SetCardsFunction = Dispatch<SetStateAction<Card[]>>;

//which column the server ranks a card's blocks by. Count is the default - the
//panel exists to surface the hypest blocks, not to walk the VOD in order.
export type SortMode = "count" | "likes";

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
//mirrors the `select` in card.getCard - the columns a row actually draws. It
//used to be the whole commentCard row, msgIds and rolling like windows included.
export interface Timestamp {
  id: string;
  timestamp: string;
  likes: number;
  contentOffsetSeconds: number;
  count: number;
  cardId: string;
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
