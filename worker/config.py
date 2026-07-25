"""Environment-driven configuration for the ingest worker."""

from __future__ import annotations

import os
from dataclasses import dataclass


def _int(name: str, default: int) -> int:
    raw = os.environ.get(name)
    if raw is None or raw.strip() == "":
        return default
    try:
        return int(raw)
    except ValueError as exc:
        raise RuntimeError(f"{name} must be an integer, got {raw!r}") from exc


def _float(name: str, default: float) -> float:
    raw = os.environ.get(name)
    if raw is None or raw.strip() == "":
        return default
    try:
        return float(raw)
    except ValueError as exc:
        raise RuntimeError(f"{name} must be a number, got {raw!r}") from exc


def _bool(name: str, default: bool) -> bool:
    raw = os.environ.get(name)
    if raw is None or raw.strip() == "":
        return default
    return raw.strip().lower() in {"1", "true", "yes", "on"}


@dataclass(frozen=True)
class Config:
    database_url: str

    #how long to wait between polls when the queue is empty
    poll_interval: float = 5.0

    #the VOD timeline is split into this many segments, walked concurrently.
    #Twitch throttles a single IP fairly hard, so raising this past ~12 tends to
    #cost more in retries than it gains in throughput.
    chunk_count: int = 8

    #comments buffered in memory before being flushed to Postgres
    batch_size: int = 2000

    #how often the running job's progress row is rewritten. This is what the
    #video page's progress bar reads, so it doubles as the heartbeat interval -
    #keep it well under stale_job_seconds.
    progress_interval: float = 1.0

    http_timeout: float = 30.0
    max_http_retries: int = 5

    #how many top emotes per provider to pull usage stats for
    emote_stat_limit: int = 100

    #how many of a VOD's most-typed words to store for the sidebar
    keyword_limit: int = 100

    #Off by default, and it should stay off unless the duplication really
    #bothers you. Channels register "LOL", "LUL", "LMAO" and "WW" as emotes, and
    #those normalise into the "lol" and "w" groups - turning this on deletes the
    #two most-typed words on a typical VOD.
    keyword_exclude_emotes: bool = False

    #a RUNNING job whose heartbeat is older than this is considered abandoned
    #(worker crashed / redeployed) and goes back on the queue
    stale_job_seconds: int = 300

    #how many times a job may be attempted before it is marked FAILED
    max_attempts: int = 3

    @classmethod
    def from_env(cls) -> "Config":
        database_url = os.environ.get("DATABASE_URL", "").strip()
        if not database_url:
            raise RuntimeError(
                "DATABASE_URL is not set. Point it at the same Neon database "
                "the Next.js app uses."
            )

        return cls(
            database_url=database_url,
            poll_interval=_float("POLL_INTERVAL_SECONDS", 5.0),
            chunk_count=max(1, _int("CHUNK_COUNT", 8)),
            batch_size=max(1, _int("COMMENT_BATCH_SIZE", 2000)),
            progress_interval=max(0.25, _float("PROGRESS_INTERVAL_SECONDS", 1.0)),
            http_timeout=_float("HTTP_TIMEOUT_SECONDS", 30.0),
            max_http_retries=max(0, _int("MAX_HTTP_RETRIES", 5)),
            emote_stat_limit=max(1, _int("EMOTE_STAT_LIMIT", 100)),
            keyword_limit=max(1, _int("KEYWORD_LIMIT", 100)),
            keyword_exclude_emotes=_bool("KEYWORD_EXCLUDE_EMOTES", False),
            stale_job_seconds=max(30, _int("STALE_JOB_SECONDS", 300)),
            max_attempts=max(1, _int("MAX_ATTEMPTS", 3)),
        )
