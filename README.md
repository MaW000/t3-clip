# Info

New and improved pogInChat, a web app that parses VODS

Save your favorite streamers vods for users to vote on the best moments

Paste in ids/urls from recent broadcasts [Twitch Channel](https://www.twitch.tv/twitchplayspokemon/videos)

If you are the first person to like a moment you become the "finder" all subsequent likes will be added to your rating.

View the browse page to look at the most recently liked moments across all videos ranked by the number of likes in the last 60 seconds, 30 minutes, day, week.

The browse page also features the most liked videos and the highest rated users rank and rating.

Styling is a WIP

# Architecture

Two deployments sharing one Neon Postgres database:

| Piece | Runs on | Job |
| --- | --- | --- |
| [`web/`](web/) | Vercel | Next.js app. UI, auth, card generation. Enqueues VODs, never calls Twitch. |
| [`worker/`](worker/) | Railway | Long-running consumer. Indexes VOD chat and channel emotes. |

The repo root holds no code of its own — everything lives in one of those two
directories. **On Vercel, set the project's Root Directory to `web`.**

Pasting a video writes a `QUEUED` row to `video_jobs`. The worker claims it,
fetches metadata, stores the channel's emotes, then walks the VOD timeline
writing comments and progress. The web app polls `video.getProgress` to render
the loading bar straight off that row.

This replaces the previous setup, where the serverless function fetched comments
itself and pushed progress over Pusher. That is what made Vercel deployments fail
on the 10 second function limit — indexing now happens off-platform, so there is
no timeout to hit and no realtime service to run.

No Twitch credentials are required anywhere; both sides use Twitch's public
web-player Client-ID. See [`worker/README.md`](worker/README.md) for the ingest
details and Railway setup.

# Setup

```bash
npm run setup                        # installs the root runner + web/
cp web/.env.example web/.env         # DATABASE_URL, AUTH_SECRET, GOOGLE_CLIENT_*
cp worker/.env.example worker/.env   # the same DATABASE_URL
npm run db:push                      # creates the tables, including video_jobs
npm run dev                          # starts both
```

`npm run dev` brings up the Next.js app on
[localhost:3000](http://localhost:3000) and the Python worker together, with
their output interleaved and tagged `[web]` / `[worker]`. Ctrl-C stops both.

The worker's virtualenv is built on first run by
[`scripts/dev-worker.sh`](scripts/dev-worker.sh), using [uv](https://docs.astral.sh/uv/)
if it is installed and `python3 -m venv` otherwise. Nothing to set up by hand.

| Command | Does |
| --- | --- |
| `npm run dev` | Both apps |
| `npm run dev:web` | Next.js only |
| `npm run dev:worker` | Worker only |
| `npm run build` | Production build of `web/` |
| `npm run db:push` | Push the Prisma schema |
| `npm run db:studio` | Prisma Studio |

The root `package.json` is only a task runner — `web/` and `worker/` are not
workspaces of it, so their installs, lockfiles and deploys stay independent.

Without the worker running, videos sit at 0% forever: the web app enqueues but
never indexes. See [`worker/README.md`](worker/README.md) for the ingest details.

## Vercel

Root Directory must be `web`. Required environment variables:

| Variable | Notes |
| --- | --- |
| `DATABASE_URL` | Same Neon database the worker uses. |
| `AUTH_SECRET` | Renamed from `NEXTAUTH_SECRET` in the NextAuth v5 upgrade. |
| `GOOGLE_CLIENT_ID` | |
| `GOOGLE_CLIENT_SECRET` | |

`NEXTAUTH_URL` is no longer used — v5 infers the deployment URL. `postinstall`
runs `prisma generate`, so the client is built on every deploy.
