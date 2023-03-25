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
    timestamps?: Timestamp[] | null;
}
export interface Timestamp {
    id: string;
    timestamp: string;
    contentOffsetSeconds: number;
    count: number;
    cardId: string;
    vidId: string;
    msgIds: string[];
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