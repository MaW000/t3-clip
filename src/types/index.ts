export interface TwitchVideoCommentResponse {
  data: {
    video: {
      comments: {
        edges: VideoCommentEdge[];
        pageInfo: {
          hasNextPage: boolean;
          endCursor: string;
        };
      };
    };
  };
}

export interface UniqueCommentsResult {
  comments: {
    message: string;
    commenter: string;
    contentOffsetSeconds: number;
    videoId: number;
  }[];
  duplicateIds: Set<string>;
}
export interface VideoComment {
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
    fragments: Array<{
      text: string;
      type: string;
    }>;
    userBadges: []; // replace `any` with the correct type for your use case
    userColor: string;
    __typename: string;
  };
  __typename: string;
}
export interface VideoCommentEdge {
  cursor: string;
  node: VideoComment;
  __typename: string;
}

export interface TwitchVideoCommentResponse {
  data: {
    video: {
      comments: {
        edges: VideoCommentEdge[];
        pageInfo: {
          hasNextPage: boolean;
          endCursor: string;
        };
      };
    };
  };
}

export interface TwitchVideoResponse {
  data: {
    id: string;
    user_id: string;
    user_name: string;
    title: string;
    description: string;
    created_at: string;
    published_at: string;
    url: string;
    thumbnail_url: string;
    viewable: string;
    view_count: number;
    language: string;
    type: string;
    duration: string;
  }[];
  pagination: {
    cursor: string;
  };
}