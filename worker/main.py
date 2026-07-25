"""Entry point for the VOD ingest worker.

Long-running process: polls the video_jobs table, claims one job at a time and
indexes it. Designed to run on Railway, where more than one replica is fine -
job claiming uses FOR UPDATE SKIP LOCKED so replicas never collide.
"""

from __future__ import annotations

import asyncio
import logging
import signal
import sys

from config import Config
from db import Database
from ingest import Ingestor, PermanentError
from twitch import TwitchError

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)-7s %(name)s: %(message)s",
    stream=sys.stdout,
)
log = logging.getLogger("worker")


async def main() -> int:
    try:
        config = Config.from_env()
    except RuntimeError as exc:
        log.error("%s", exc)
        return 1

    db = Database(config.database_url)
    ingestor = Ingestor(db, config)

    shutdown = asyncio.Event()
    _install_signal_handlers(shutdown)

    log.info(
        "worker up - polling every %.0fs, %d segments per video",
        config.poll_interval,
        config.chunk_count,
    )

    try:
        while not shutdown.is_set():
            try:
                worked = await _tick(db, ingestor, config, shutdown)
            except Exception as exc:  # noqa: BLE001 - the loop must survive
                log.exception("unexpected error in poll loop: %s", exc)
                worked = False

            if not worked:
                await _sleep_or_shutdown(shutdown, config.poll_interval)
    finally:
        db.close()
        log.info("worker stopped")

    return 0


async def _tick(
    db: Database, ingestor: Ingestor, config: Config, shutdown: asyncio.Event
) -> bool:
    """One pass of the queue. Returns True if a job was processed."""
    recovered = await asyncio.to_thread(
        db.requeue_stale_jobs, config.stale_job_seconds, config.max_attempts
    )
    if recovered:
        log.info("requeued %d stale job(s)", recovered)

    job = await asyncio.to_thread(db.claim_job)
    if job is None:
        return False

    video_id = job["videoId"]
    attempt = job["attempts"] + 1
    log.info("claimed video %s (attempt %d)", video_id, attempt)

    try:
        total = await ingestor.run(job, shutdown)
    except PermanentError as exc:
        log.error("video %s cannot be indexed: %s", video_id, exc)
        await asyncio.to_thread(db.fail_job, job["id"], str(exc), retryable=False)
        return True
    except (TwitchError, OSError) as exc:
        retryable = attempt < config.max_attempts
        log.warning(
            "video %s failed (%s)%s",
            video_id,
            exc,
            " - will retry" if retryable else " - giving up",
        )
        await asyncio.to_thread(
            db.fail_job, job["id"], str(exc), retryable=retryable
        )
        return True
    except Exception as exc:  # noqa: BLE001
        retryable = attempt < config.max_attempts
        log.exception("video %s errored: %s", video_id, exc)
        await asyncio.to_thread(
            db.fail_job, job["id"], str(exc), retryable=retryable
        )
        return True

    if shutdown.is_set():
        #stopped part way through, hand it back so another replica finishes it
        log.info("shutdown during video %s, requeueing", video_id)
        await asyncio.to_thread(
            db.fail_job, job["id"], "Worker restarted", retryable=True
        )
        return True

    await asyncio.to_thread(db.finish_job, job["id"], comments_indexed=total)
    log.info("video %s done - %d comments", video_id, total)
    return True


async def _sleep_or_shutdown(shutdown: asyncio.Event, seconds: float) -> None:
    """Sleep, but wake immediately if we are being asked to stop."""
    try:
        await asyncio.wait_for(shutdown.wait(), timeout=seconds)
    except asyncio.TimeoutError:
        pass


def _install_signal_handlers(shutdown: asyncio.Event) -> None:
    loop = asyncio.get_running_loop()

    def _stop(signame: str) -> None:
        log.info("received %s, finishing up", signame)
        shutdown.set()

    for signame in ("SIGTERM", "SIGINT"):
        sig = getattr(signal, signame, None)
        if sig is None:
            continue
        try:
            loop.add_signal_handler(sig, _stop, signame)
        except NotImplementedError:
            #Windows event loops do not support add_signal_handler
            signal.signal(sig, lambda *_: shutdown.set())


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
