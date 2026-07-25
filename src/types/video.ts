export interface VideoResponse {
    data: {
        video: {
            id: string;
            creator: {
                id: string;
                channel: {
                    id: string;
                    __typename: string;
                };
                __typename: string;
            };
            comments: {
                edges: {
                    cursor: string;
                    node: {
                        id: string;
                        commenter: {
                            id: string;
                            login: string;
                            displayName: string;
                            __typename: string;
                        };
                        contentOffsetSeconds: number;
                        createdAt: string;
                        message: {
                            fragments: [
                                {
                                    emote: string;
                                    text: string;
                                    __typename: string;
                                }
                            ];
                            userBadges: [
                                {
                                    id: string;
                                    setID: string;
                                    version: string;
                                    __typename: string;
                                }
                            ];
                            userColor: string;
                            __typename: string;
                        };
                        __typename: string;
                    };
                    __typename: string;
                }[];
                pageInfo: {
                    hasNextPage: boolean;
                    hasPreviousPage: boolean;
                    __typename: string;
                };
                __typename: string;
            };
            __typename: string;
        };
    };
    extensions: {
        durationMilliseconds: number;
        operationName: string;
        requestID: string;
    };
}
/** Raw shape of the public gql.twitch.tv `video(id:)` query. Needs no API key. */
export interface GqlVideoResponse {
    data: {
        video: {
            id: string;
            title: string;
            lengthSeconds: number;
            viewCount: number;
            createdAt: string;
            previewThumbnailURL: string;
            language: string;
            description: string | null;
            owner: {
                login: string;
                displayName: string;
            } | null;
        } | null;
    };
}

/**
 * Video metadata normalised to the field names the rest of the pipeline uses.
 * Field names intentionally mirror the old Helix payload so `createVideo` and the
 * thumbnail components did not have to change.
 */
export interface VideoMeta {
    user_name: string;
    title: string;
    description: string;
    created_at: string;
    url: string;
    thumbnail_url: string;
    view_count: number;
    language: string;
    /** Helix-style display string, e.g. "9h13m35s". Stored on Video.duration. */
    duration: string;
    /** Exact length from Twitch. Use this for arithmetic, never parse `duration`. */
    lengthSeconds: number;
}
export interface TermDataInput {
    term: string;
    channelId: string;
    amount: number;
    emojiId: string;
    type: string;
}
export interface Channel {
    id: string;
    streamer: string;
}
export interface EmojiData {
    channel: string;
    totalMessages: number;
    chatters: [];
    hashtags: [];
    commands: [];
    bttvEmotes: [];
    ffzEmotes: [];
    twitchEmotes: [];
}
export interface HashtagData {
    hashtag: string;
    amount: number;
}
export interface EmoteData {
    id: string;
    emote: string;
    amount: number;

}

export interface EmoteCreateManyInput {
    emojiId: string;
    name: string;
    gif: boolean;
    type: string;
    url1?: string;
    url2?: string;
    url3?: string;
}

export interface StreamerProfile {
    profile: {
        headerImage: string;
        title: string;
    };
    provider: string;
    broadcasterType: string;
    suspended: boolean;
    _id: string;
    providerId: string;
    avatar: string;
    username: string;
    alias: string;
    displayName: string;
    inactive: boolean;
    isPartner: boolean;
}
export interface Emote {
    _id: string;
    name: string;
    type: string;
    width: number;
    height: number;
    gif: boolean;
    urls: {
        [key: string]: {
            "1": string;
            "2": string;
            "4": string;
        };
    };
}
export interface EmoteGroup {
    [key: string]: Emote | null;
}

export interface Emotes {
    bttvChannelEmotes: Array<EmoteGroup>;
    bttvGlobalEmotes: Array<EmoteGroup>;
    ffzChannelEmotes: Array<EmoteGroup>;
    ffzGlobalEmotes: Array<EmoteGroup>;
    twitchGlobalEmotes: Array<EmoteGroup>;
    sevenTvEmotes: Array<EmoteGroup>;
    sevenTVGlobalEmotes: Array<EmoteGroup>;
}