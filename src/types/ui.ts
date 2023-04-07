export interface Comment {
  id: string;
  timestamp: string;
  contentOffsetSeconds: number;
  count: number;
  likes: number;
  finder: string | null;
  liked: string[];
  last60: Date[];
  second: number | null;
  last30: Date[];
  minute: number | null;
  last24: Date[];
  day: number | null;
  last7: Date[];
  week: number | null;
  cardId: string;
  vidId: string;
  msgIds: string[];
  video: {
    id: string;
    channelId: string;
    videoId: number;
    url: string;
    description: string;
    duration: string;
    title: string;
    thumbnail: string;
    streamer: string;
    views: number;
    likes: number;
    language: string;
    date: string;
    createdAt: string;
    complete: boolean;
  };
  card: {
    id: string;
    vidId: string;
    keyword: string;
    interval: number;
    likes: number;
    sum: number | null;
    avg: number | null; 
    max: number | null;
    min: number | null;
    url: string | null;
  };
}
