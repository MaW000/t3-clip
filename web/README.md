# web

The Next.js half of NextClip. Deploys to Vercel with the project's Root
Directory set to `web`. See the [repo README](../README.md) for how this fits
together with the Python worker.

Built on the T3 stack: Next.js 15 (App Router), tRPC 11, Prisma 6, NextAuth v5,
Tailwind 4.

## Layout

| Path | What |
| --- | --- |
| `src/app/` | Routes. `/`, `/browse`, `/video/[...id]`, plus the auth and tRPC handlers. |
| `src/components/` | UI, re-exported through `src/components/index.ts`. Nearly all client components. |
| `src/server/api/routers/` | tRPC routers: `video`, `comment`, `emote`, `card`, `ui`. |
| `src/server/auth/` | NextAuth v5 config. Google is the only provider. |
| `src/types/` | Hand-written shapes for the card / emote / browse UI. |
| `prisma/schema.prisma` | Shared with the worker. Tables are `@@map`ed to snake_case because the worker uses raw SQL. |

## Notes

- Routes are server-rendered on demand. `/` and `/browse` set
  `dynamic = "force-dynamic"` so a sleeping database cannot fail a deploy and
  the rankings are never stale.
- The Prisma client is generated into `generated/` by `postinstall`. It is not
  committed.
- Indexing a VOD is the worker's job. This app only writes `QUEUED` rows to
  `video_jobs` and polls `video.getProgress`.
