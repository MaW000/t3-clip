export interface Twitch {
    seek(time: number): void;
}
export type SetCardsFunction = (cards: Card[]) => void;

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
    cardIds: string[];
    message: string;
    commentId: string;
    commenter: string | null;
    contentOffsetSeconds: number;
}