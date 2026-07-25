"""Turns one queued VOD into rows in the database.

Strategy: split the video timeline into N equal segments and walk each one
forward by content offset, concurrently. Progress is the fraction of the total
timeline covered so far, which is what the web app renders.

Why not the cursor-based paging the old TypeScript code used: Twitch rejects
cursor requests with an integrity challenge. See twitch.py.
"""

from __future__ import annotations

import asyncio
import logging
from dataclasses import dataclass, field
from typing import Any

from config import Config
from db import Database
from emotes import EmoteCollector
from twitch import TwitchClient

log = logging.getLogger(__name__)


class PermanentError(RuntimeError):
    """A failure retrying will not fix, e.g. the VOD no longer exists."""


@dataclass
class _State:
    """Shared mutable state across the concurrent segment walkers."""

    #per-segment current position on the timeline
    positions: list[int]
    starts: list[int]
    total_span: int
    video_db_id: str

    seen: set[str] = field(default_factory=set)
    buffer: list[dict[str, Any]] = field(default_factory=list)
    inserted: int = 0
    #seconds too dense to page through - see _walk
    unreachable_seconds: int = 0

    def progress(self) -> float:
        if self.total_span <= 0:
            return 100.0
        covered = sum(
            max(0, pos - start) for pos, start in zip(self.positions, self.starts)
        )
        return min(100.0, covered / self.total_span * 100.0)


class Ingestor:
    def __init__(self, db: Database, config: Config) -> None:
        self.db = db
        self.config = config
        #psycopg connections are not safe to use from two coroutines at once,
        #so every database call funnels through this
        self._db_lock = asyncio.Lock()

    async def _db_call(self, fn, *args, **kwargs):
        async with self._db_lock:
            return await asyncio.to_thread(fn, *args, **kwargs)

    async def run(self, job: dict[str, Any], shutdown: asyncio.Event) -> int:
        """Index one VOD. Returns the number of comments written."""
        job_id: str = job["id"]
        video_id: int = job["videoId"]

        async with TwitchClient(
            timeout=self.config.http_timeout,
            max_retries=self.config.max_http_retries,
        ) as client:
            meta = await client.fetch_video(video_id)
            if meta is None:
                raise PermanentError(
                    f"Twitch has no video {video_id} (deleted, private, or bad id)"
                )

            length_seconds = int(meta["lengthSeconds"])
            await self._db_call(
                self.db.set_job_meta,
                job_id,
                title=meta["title"],
                streamer=meta["streamer"],
                length_seconds=length_seconds,
            )

            channel_id = await self._db_call(self.db.upsert_channel, meta["streamer"])
            video_db_id = await self._db_call(
                self.db.upsert_video, video_id, channel_id, meta
            )

            await self._collect_emotes(channel_id, meta)

            #a retried job should not refetch what is already stored
            seen = await self._db_call(self.db.existing_comment_ids, video_db_id)
            if seen:
                log.info(
                    "video %s already has %d comments, resuming", video_id, len(seen)
                )

            chunks = _split(length_seconds, self.config.chunk_count)
            state = _State(
                positions=[start for start, _ in chunks],
                starts=[start for start, _ in chunks],
                total_span=length_seconds,
                video_db_id=video_db_id,
                seen=seen,
            )

            reporter = asyncio.create_task(
                self._report_progress(job_id, state, shutdown)
            )
            try:
                await asyncio.gather(
                    *(
                        self._walk(client, video_id, index, start, end, state, shutdown)
                        for index, (start, end) in enumerate(chunks)
                    )
                )
            finally:
                reporter.cancel()
                try:
                    await reporter
                except asyncio.CancelledError:
                    pass

            await self._flush(video_db_id, state)

            if state.unreachable_seconds:
                log.warning(
                    "video %s indexed with %d second(s) that could not be fully "
                    "paged - the comment count is a floor, not a total",
                    video_id,
                    state.unreachable_seconds,
                )

            if not shutdown.is_set():
                await self._db_call(self.db.mark_video_complete, video_db_id)

            total = await self._db_call(self.db.count_comments, video_db_id)
            return total

    async def _collect_emotes(self, channel_id: str, meta: dict[str, Any]) -> None:
        """Store the channel's emotes and chat term counts.

        Best-effort: emote providers going down should not stop a VOD from
        being indexed, so failures are logged rather than raised.
        """
        try:
            async with EmoteCollector(timeout=self.config.http_timeout) as collector:
                emote_rows, term_rows = await collector.collect(
                    meta["login"],
                    meta["twitchUserId"],
                    stat_limit=self.config.emote_stat_limit,
                )
        except Exception as exc:  # noqa: BLE001
            log.warning("emote collection failed for %s: %s", meta["streamer"], exc)
            return

        if not emote_rows:
            log.info("no emotes found for %s", meta["streamer"])
            return

        #emotes first: terms."emojiId" is a foreign key onto emotes."emojiId"
        await self._db_call(self.db.upsert_emotes, emote_rows)
        await self._db_call(self.db.upsert_terms, channel_id, term_rows)
        log.info(
            "stored %d emotes and %d terms for %s",
            len(emote_rows),
            len(term_rows),
            meta["streamer"],
        )

    async def _walk(
        self,
        client: TwitchClient,
        video_id: int,
        index: int,
        start: int,
        end: int,
        state: _State,
        shutdown: asyncio.Event,
    ) -> None:
        """Walk one timeline segment forward, a page at a time."""
        offset = start

        while offset < end and not shutdown.is_set():
            page = await client.fetch_comments(video_id, offset)
            if not page:
                #nothing left at or after this offset
                break

            fresh = [
                comment
                for comment in page
                if comment["commentId"] not in state.seen
            ]
            for comment in fresh:
                state.seen.add(comment["commentId"])
            state.buffer.extend(fresh)

            #flush as we go, otherwise a long VOD buffers millions of rows
            if len(state.buffer) >= self.config.batch_size:
                await self._flush(state.video_db_id, state)

            page_offsets = [comment["contentOffsetSeconds"] for comment in page]
            last_offset = max(page_offsets)

            if last_offset > offset:
                offset = last_offset
            else:
                #The page did not move us forward. Normally harmless: it means
                #we re-fetched the page we just walked (Twitch returns the same
                #fixed page for any offset inside it), so stepping one second
                #past its end lands on the next page and nothing is missed.
                #
                #The exception is a page whose comments all share one second.
                #Then the next page for that second is unreachable - Twitch
                #rejects cursor paging with an integrity check and will not
                #accept a fractional contentOffsetSeconds. Measured against live
                #VODs pages span at least three seconds, so this should never
                #fire; if it does, the comment count is short and it says so
                #rather than silently under-indexing.
                if min(page_offsets) == last_offset:
                    log.warning(
                        "video %s: second %d fills an entire page (%d comments) "
                        "- any beyond it cannot be reached by offset paging",
                        video_id,
                        last_offset,
                        len(page),
                    )
                    state.unreachable_seconds += 1
                offset = offset + 1

            state.positions[index] = min(offset, end)

        state.positions[index] = end

    async def _report_progress(
        self, job_id: str, state: _State, shutdown: asyncio.Event
    ) -> None:
        """Write progress and heartbeat while the walkers run.

        Writes once up front so the UI leaves 0% immediately, then on a timer.
        """
        while not shutdown.is_set():
            try:
                await self._db_call(
                    self.db.update_progress,
                    job_id,
                    progress=state.progress(),
                    comments_indexed=state.inserted + len(state.buffer),
                )
            except Exception as exc:  # noqa: BLE001 - never kill the run over this
                log.warning("progress update failed: %s", exc)
            await asyncio.sleep(3)

    async def _flush(self, video_db_id: str, state: _State) -> None:
        if not state.buffer:
            return
        batch, state.buffer = state.buffer, []
        written = await self._db_call(self.db.insert_comments, video_db_id, batch)
        state.inserted += written


def _split(length_seconds: int, chunk_count: int) -> list[tuple[int, int]]:
    """Divide [0, length] into contiguous segments."""
    if length_seconds <= 0:
        return [(0, 0)]

    count = max(1, min(chunk_count, length_seconds))
    size = length_seconds / count
    bounds = [round(i * size) for i in range(count)] + [length_seconds]
    return [
        (bounds[i], bounds[i + 1])
        for i in range(count)
        if bounds[i] < bounds[i + 1]
    ]
