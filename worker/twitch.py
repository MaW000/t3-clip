"""Thin async client for Twitch's public GraphQL endpoint.

Two things worth knowing before changing anything here:

1. The Client-ID below is Twitch's public web-player ID. It is not a secret and
   not tied to an account, so the worker needs no Twitch credentials at all.

2. The comment query supports paging either by cursor or by content offset.
   Cursor paging is deliberately NOT used: Twitch answers cursor requests with
   ``{"errors": [{"message": "failed integrity check"}]}`` because they sit
   behind a KPSDK browser challenge. Offset paging is not challenged. If you
   reintroduce cursors, ingestion will break.
"""

from __future__ import annotations

import asyncio
import json
import logging
from typing import Any

import httpx

log = logging.getLogger(__name__)

GQL_URL = "https://gql.twitch.tv/gql"
CLIENT_ID = "kimne78kx3ncx6brgo4mv6wki5h1ko"

#persisted query hash for VideoCommentsByOffsetOrCursor
COMMENTS_QUERY_HASH = (
    "b70a3591ff0f4e0313d126c6a1502d79a1c02baebb288227c582044aa76adf6a"
)

_VIDEO_QUERY = """query {
  video(id: "%s") {
    id
    title
    lengthSeconds
    viewCount
    createdAt
    previewThumbnailURL
    language
    description
    owner { id login displayName }
  }
}"""


class TwitchError(RuntimeError):
    """Raised when Twitch cannot be reached or answers with an error."""


def format_duration(total_seconds: int) -> str:
    """Render seconds the way the Helix API used to, e.g. ``9h13m35s``."""
    hours, remainder = divmod(max(0, total_seconds), 3600)
    minutes, seconds = divmod(remainder, 60)
    out = ""
    if hours:
        out += f"{hours}h"
    if hours or minutes:
        out += f"{minutes}m"
    return f"{out}{seconds}s"


class TwitchClient:
    def __init__(self, timeout: float = 30.0, max_retries: int = 5) -> None:
        self._max_retries = max_retries
        self._client = httpx.AsyncClient(
            timeout=timeout,
            headers={"Client-ID": CLIENT_ID},
            #Twitch is fine with keep-alive, and reusing the pool across the
            #whole VOD is what keeps chunked fetching cheap
            limits=httpx.Limits(max_connections=32, max_keepalive_connections=32),
        )

    async def __aenter__(self) -> "TwitchClient":
        return self

    async def __aexit__(self, *_: object) -> None:
        await self.close()

    async def close(self) -> None:
        await self._client.aclose()

    async def _post(self, payload: Any, content_type: str) -> Any:
        """POST with exponential backoff on throttling and transient failures."""
        delay = 2.0
        last_error: Exception | None = None
        body = json.dumps(payload).encode()

        for attempt in range(self._max_retries + 1):
            try:
                response = await self._client.post(
                    GQL_URL,
                    content=body,
                    headers={"Content-Type": content_type},
                )
                if response.status_code == 429 or response.status_code >= 500:
                    raise TwitchError(
                        f"Twitch responded {response.status_code}"
                    )
                response.raise_for_status()
                return response.json()
            except (httpx.HTTPError, TwitchError) as exc:
                last_error = exc
                if attempt == self._max_retries:
                    break
                log.warning(
                    "twitch request failed (%s), retrying in %.0fs", exc, delay
                )
                await asyncio.sleep(delay)
                delay = min(delay * 2, 30.0)

        raise TwitchError(f"giving up after {self._max_retries} retries: {last_error}")

    async def fetch_video(self, video_id: int) -> dict[str, Any] | None:
        """Video metadata, normalised to the columns the videos table wants.

        Returns None when Twitch does not know the id (deleted or never existed).
        """
        body = await self._post({"query": _VIDEO_QUERY % video_id}, "application/json")
        video = (body or {}).get("data", {}).get("video")
        if not video or not video.get("owner"):
            return None

        length_seconds = int(video["lengthSeconds"])
        thumbnail = (video.get("previewThumbnailURL") or "")
        #the web app's thumbnail components expect Helix's %{width} placeholders
        thumbnail = thumbnail.replace("{width}", "%{width}").replace(
            "{height}", "%{height}"
        )

        return {
            "streamer": video["owner"]["displayName"],
            #numeric Twitch user id - 7TV, BTTV and FFZ all key off this
            "twitchUserId": str(video["owner"]["id"]),
            "login": video["owner"]["login"],
            "title": video["title"],
            #gql returns null where Helix returned "", and the column is NOT NULL
            "description": video.get("description") or "",
            "date": video["createdAt"],
            "url": f"https://www.twitch.tv/videos/{video['id']}",
            "thumbnail": thumbnail,
            "views": int(video["viewCount"]),
            "language": video["language"],
            "duration": format_duration(length_seconds),
            "lengthSeconds": length_seconds,
        }

    async def fetch_comments(
        self, video_id: int, offset_seconds: int
    ) -> list[dict[str, Any]]:
        """One page of comments at a content offset. Roughly 50-60 per call."""
        payload = [
            {
                "operationName": "VideoCommentsByOffsetOrCursor",
                "variables": {
                    "videoID": str(video_id),
                    "contentOffsetSeconds": offset_seconds,
                },
                "extensions": {
                    "persistedQuery": {
                        "version": 1,
                        "sha256Hash": COMMENTS_QUERY_HASH,
                    }
                },
            }
        ]

        body = await self._post(payload, "text/plain")
        if not isinstance(body, list) or not body:
            return []

        first = body[0] or {}
        if first.get("errors"):
            message = first["errors"][0].get("message", "unknown error")
            raise TwitchError(f"comment query rejected: {message}")

        video = (first.get("data") or {}).get("video")
        if not video or not video.get("comments"):
            return []

        edges = video["comments"].get("edges") or []
        out: list[dict[str, Any]] = []
        for edge in edges:
            node = edge.get("node") or {}
            fragments = (node.get("message") or {}).get("fragments") or []
            text = "".join(fragment.get("text") or "" for fragment in fragments)
            commenter = node.get("commenter") or {}
            out.append(
                {
                    "commentId": node.get("id"),
                    "message": text,
                    "commenter": commenter.get("displayName"),
                    "contentOffsetSeconds": int(node.get("contentOffsetSeconds") or 0),
                }
            )
        return [row for row in out if row["commentId"]]
