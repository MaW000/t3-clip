"""Collects a channel's emotes and the chat terms that use them.

Two different things are gathered:

* **Emotes** - the channel's full emote sets from 7TV, BTTV and FFZ, plus any
  emote StreamElements has seen used in chat. These become `emotes` rows and
  supply the images the web app renders.
* **Terms** - StreamElements' per-channel usage counts. These become `terms`
  rows and are what the card generator searches comments for.

Every source here is public; none of them needs an API key.

Note on the old implementation: it read emotes from
``streamelements.com/kappa/v2/channels/:id/emotes``, which now returns
``410 Gone - endpoint has been removed``. That is why images are assembled from
each provider's own CDN instead.
"""

from __future__ import annotations

import asyncio
import logging
from typing import Any

import httpx

log = logging.getLogger(__name__)

SE_STATS = "https://api.streamelements.com/kappa/v2/chatstats/{login}/stats?limit={limit}"
SEVENTV_USER = "https://7tv.io/v3/users/twitch/{user_id}"
BTTV_USER = "https://api.betterttv.net/3/cached/users/twitch/{user_id}"
FFZ_ROOM = "https://api.frankerfacez.com/v1/room/id/{user_id}"

#SE reports usage per provider under these keys, and the ids it returns are the
#provider's own ids, so image URLs can be built without a second lookup.
_SE_KEYS = {
    "ffzEmotes": "ffz",
    "twitchEmotes": "twitch",
    "bttvEmotes": "bttv",
    "sevenTVEmotes": "7tv",
}


def emote_urls(provider: str, emote_id: str) -> tuple[str, str, str]:
    """Small/medium/large image URLs for an emote id on a given provider."""
    if provider == "ffz":
        base = f"https://cdn.frankerfacez.com/emote/{emote_id}"
        return f"{base}/1", f"{base}/2", f"{base}/4"
    if provider == "bttv":
        base = f"https://cdn.betterttv.net/emote/{emote_id}"
        return f"{base}/1x", f"{base}/2x", f"{base}/3x"
    if provider == "7tv":
        base = f"https://cdn.7tv.app/emote/{emote_id}"
        return f"{base}/1x.webp", f"{base}/2x.webp", f"{base}/4x.webp"
    #twitch
    base = f"https://static-cdn.jtvnw.net/emoticons/v2/{emote_id}/default/dark"
    return f"{base}/1.0", f"{base}/2.0", f"{base}/3.0"


def _emote_row(
    emote_id: str, name: str, provider: str, *, animated: bool
) -> dict[str, Any]:
    url1, url2, url3 = emote_urls(provider, emote_id)
    return {
        "emojiId": str(emote_id),
        "name": name,
        "gif": animated,
        "type": provider,
        "url1": url1,
        "url2": url2,
        "url3": url3,
    }


class EmoteCollector:
    def __init__(self, timeout: float = 30.0) -> None:
        self._client = httpx.AsyncClient(
            timeout=timeout, headers={"Accept": "application/json"}
        )

    async def __aenter__(self) -> "EmoteCollector":
        return self

    async def __aexit__(self, *_: object) -> None:
        await self._client.aclose()

    async def _get(self, url: str) -> Any | None:
        """GET returning None instead of raising - a dead provider must not
        take the whole ingest down."""
        try:
            response = await self._client.get(url)
            if response.status_code != 200:
                log.info("emote source %s returned %s", url, response.status_code)
                return None
            return response.json()
        except (httpx.HTTPError, ValueError) as exc:
            log.info("emote source %s failed: %s", url, exc)
            return None

    async def collect(
        self, login: str, twitch_user_id: str, *, stat_limit: int = 100
    ) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
        """Returns (emotes, terms) for a channel.

        Terms are only returned for emotes that are also present in the emote
        list, because `terms.emojiId` is a foreign key onto `emotes.emojiId`.
        """
        seventv, bttv, ffz, stats = await asyncio.gather(
            self._get(SEVENTV_USER.format(user_id=twitch_user_id)),
            self._get(BTTV_USER.format(user_id=twitch_user_id)),
            self._get(FFZ_ROOM.format(user_id=twitch_user_id)),
            self._get(SE_STATS.format(login=login, limit=stat_limit)),
        )

        by_id: dict[str, dict[str, Any]] = {}
        for row in (
            *_parse_seventv(seventv),
            *_parse_bttv(bttv),
            *_parse_ffz(ffz),
        ):
            by_id.setdefault(row["emojiId"], row)

        terms: list[dict[str, Any]] = []
        for key, provider in _SE_KEYS.items():
            for entry in (stats or {}).get(key) or []:
                emote_id = str(entry.get("id") or "")
                name = entry.get("emote")
                if not emote_id or not name:
                    continue

                #an emote seen in chat may not be in the channel's current set
                #(retired, or a global), so make sure it has an image row too
                by_id.setdefault(
                    emote_id, _emote_row(emote_id, name, provider, animated=False)
                )
                terms.append(
                    {
                        "emojiId": emote_id,
                        "term": name,
                        "amount": int(entry.get("amount") or 0),
                        "type": provider,
                    }
                )

        #de-duplicate terms by emote id, keeping the highest usage count
        best: dict[str, dict[str, Any]] = {}
        for term in terms:
            current = best.get(term["emojiId"])
            if current is None or term["amount"] > current["amount"]:
                best[term["emojiId"]] = term

        return list(by_id.values()), list(best.values())


def _parse_seventv(payload: Any) -> list[dict[str, Any]]:
    if not isinstance(payload, dict):
        return []
    emote_set = payload.get("emote_set") or {}
    out = []
    for emote in emote_set.get("emotes") or []:
        emote_id = emote.get("id")
        name = emote.get("name")
        if not emote_id or not name:
            continue
        animated = bool((emote.get("data") or {}).get("animated"))
        out.append(_emote_row(emote_id, name, "7tv", animated=animated))
    return out


def _parse_bttv(payload: Any) -> list[dict[str, Any]]:
    if not isinstance(payload, dict):
        return []
    out = []
    for emote in (payload.get("channelEmotes") or []) + (
        payload.get("sharedEmotes") or []
    ):
        emote_id = emote.get("id")
        name = emote.get("code")
        if not emote_id or not name:
            continue
        animated = (emote.get("imageType") or "").lower() == "gif"
        out.append(_emote_row(emote_id, name, "bttv", animated=animated))
    return out


def _parse_ffz(payload: Any) -> list[dict[str, Any]]:
    if not isinstance(payload, dict):
        return []
    out = []
    for emote_set in (payload.get("sets") or {}).values():
        for emote in (emote_set or {}).get("emoticons") or []:
            emote_id = emote.get("id")
            name = emote.get("name")
            if emote_id is None or not name:
                continue
            animated = bool(emote.get("animated"))
            out.append(_emote_row(str(emote_id), name, "ffz", animated=animated))
    return out
