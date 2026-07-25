# VOD ingest worker

Background consumer that indexes Twitch VOD chat into the same Neon Postgres
database the Next.js app uses. Deployed to Railway; the web app is on Vercel.

## How the pieces fit

```
user opens /video/123      Vercel (Next.js)
        │
        ├─ video.getVideo ──────────► INSERT video_jobs (status QUEUED)
        │
        └─ video.getProgress ◄─────── SELECT video_jobs   (polled every 2s)
                                            ▲
                                            │ progress, commentsIndexed
                                            │
                              Railway (this worker)
                              claims QUEUED job, walks the
                              VOD timeline, writes msgs rows
```

The web app never talks to Twitch and the worker never talks to the web app.
The `video_jobs` table is the entire interface between them, which is why the
progress bar works on Vercel without any realtime transport.

## Running it

```bash
cd worker
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
DATABASE_URL="postgres://..." python main.py
```

Point `DATABASE_URL` at the **same** database as the Next.js app. Run
`npx prisma db push` from the repo root first so `video_jobs` exists.

## Railway setup

1. New service from this repo.
2. Set **Root Directory** to `worker` — that makes Railway use `worker/railway.toml`
   and `worker/Dockerfile`.
3. Add `DATABASE_URL` as a service variable.
4. Deploy. There is no HTTP port to expose; it is a worker, not a server.

Running more than one replica is safe. Jobs are claimed with
`SELECT ... FOR UPDATE SKIP LOCKED`, so two replicas never take the same VOD.

## Configuration

| Variable | Default | Meaning |
| --- | --- | --- |
| `DATABASE_URL` | *(required)* | Postgres connection string |
| `POLL_INTERVAL_SECONDS` | `5` | Wait between polls when the queue is empty |
| `CHUNK_COUNT` | `8` | Timeline segments walked concurrently |
| `COMMENT_BATCH_SIZE` | `2000` | Comments buffered before a flush |
| `HTTP_TIMEOUT_SECONDS` | `30` | Per-request timeout against Twitch |
| `MAX_HTTP_RETRIES` | `5` | Retries per request, exponential backoff |
| `STALE_JOB_SECONDS` | `300` | Heartbeat age after which a job is considered abandoned |
| `MAX_ATTEMPTS` | `3` | Attempts before a job is marked `FAILED` |
| `EMOTE_STAT_LIMIT` | `100` | Top emotes per provider to pull usage counts for |

No Twitch credentials are needed. The worker uses Twitch's public web-player
Client-ID, which is not tied to an account.

## Emotes

Before indexing chat, each job stores the channel's emotes and how often chat
uses them.

| Source | Gives us | Endpoint |
| --- | --- | --- |
| 7TV | full channel emote set | `7tv.io/v3/users/twitch/{id}` |
| BTTV | channel + shared emotes | `api.betterttv.net/3/cached/users/twitch/{id}` |
| FFZ | room emote sets | `api.frankerfacez.com/v1/room/id/{id}` |
| StreamElements | per-emote usage counts | `api.streamelements.com/kappa/v2/chatstats/{login}/stats` |

All four are public and keyless. The first three key off the channel's numeric
Twitch user id, which the worker reads from the VOD's `owner.id`.

`emotes` rows hold the images; `terms` rows hold usage counts and are what the
card generator searches comments for. Emotes are written first because
`terms."emojiId"` is a foreign key onto `emotes."emojiId"`. Any emote seen in
chat but missing from the current set (retired or global) gets an emote row
synthesised so the term never orphans.

Image URLs are built directly from each provider's id rather than fetched, since
StreamElements returns the provider's own ids:

```
7tv     cdn.7tv.app/emote/{id}/2x.webp
bttv    cdn.betterttv.net/emote/{id}/2x
ffz     cdn.frankerfacez.com/emote/{id}/2
twitch  static-cdn.jtvnw.net/emoticons/v2/{id}/default/dark/2.0
```

Emote collection is best-effort: if a provider is down the VOD still indexes.

> The old code read emotes from `streamelements.com/kappa/v2/channels/:id/emotes`.
> That endpoint now returns `410 Gone - endpoint has been removed`, which is why
> images are assembled per-provider instead.

## How indexing works

The VOD timeline is split into `CHUNK_COUNT` segments walked concurrently. Each
walker pages forward by **content offset**, taking the last comment's offset as
the next page's start, until it reaches the end of its segment. Progress is the
fraction of the total timeline covered, so it advances smoothly and monotonically.

### Do not switch to cursor paging

The comment query accepts either an offset or a cursor. Cursor paging is what
the original TypeScript implementation used, and Twitch now rejects it:

```json
{"errors":[{"message":"failed integrity check"}],
 "extensions":{"challenge":{"type":"integrity"}}}
```

Those requests sit behind a KPSDK browser challenge that needs a real browser to
solve. Offset paging is not challenged. This is deterministic, not flaky —
verified against a live VOD.

### Known trade-offs

- **Overlap.** Offset paging re-fetches comments near each page boundary; on a
  busy VOD roughly a third of fetched comments are duplicates. They are dropped
  by an in-memory id set and by `ON CONFLICT ("commentId") DO NOTHING`.
- **Very dense seconds.** If a single second holds more comments than fit in one
  page (~50-60), the walker force-advances by one second rather than stalling.
  A few comments in that second can be missed. Terminating beats hanging.
- **Rate limits.** Twitch throttles a single IP fairly aggressively past roughly
  10k messages. Retries back off exponentially (2s, doubling, capped at 30s).
  Raising `CHUNK_COUNT` much past 12 usually costs more in retries than it gains.

## Recovery

Jobs are heartbeated while running. If the worker is redeployed or crashes
mid-VOD, the row is left `RUNNING` with a stale `heartbeatAt`; the next worker
to poll requeues it. Re-running is cheap because already-stored comment ids are
loaded up front and skipped.

`MAX_ATTEMPTS` failures moves the job to `FAILED`, which the UI surfaces. A user
reloading the video page flips a `FAILED` job back to `QUEUED`.
