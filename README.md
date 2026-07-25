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
cd web
npm install
cp .env.example .env      # fill in DATABASE_URL, AUTH_SECRET, GOOGLE_CLIENT_*
npx prisma db push        # creates the tables, including video_jobs
npm run dev
```

Then start the worker (see [`worker/README.md`](worker/README.md)) pointed at the
same `DATABASE_URL`. Without it, videos will sit at 0% forever — the web app
enqueues but never indexes.

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
