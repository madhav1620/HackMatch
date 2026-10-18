# HackMatch

College hackathon discovery + team matchmaking. Find events, found or join a squad, and unlock contact details ("Instant Connect") once a squad lead accepts your application.

Built as a monorepo: **React 19 + Vite + TypeScript + Tailwind v4** (client) and **Express 4 + TypeScript + Prisma** (server). See [`ARCHITECTURE.md`](./ARCHITECTURE.md) and [`DESIGN.md`](./DESIGN.md) for the full stack and design-system breakdown.

## Features

- **Discovery Hub** — searchable, filterable hackathon feed (mode, org type, tech, date range, prize pool, sort), detail pages with live squad/solo counts, and bookmarks with deadline countdowns.
- **Team matchmaking** — per-hackathon board of recruiting squads, join-request workflow (apply → lead accepts/declines), and solo "Looking for Team" posts.
- **Instant Connect** — a squad's Discord / WhatsApp / Email is revealed **only** to accepted members, the lead, and admins. It never appears on public board payloads.
- **Auth** — college-email gate with OTP verification, access token in `localStorage` + rotating refresh cookie.
- **Dark mode** — class-based theme with a system-preference default and a persisted header toggle; light-first design system retained.

## Demo logins

All use password `password123`.

| Role | Email |
|---|---|
| Student | `arjun@iiit.ac.in` |
| Organizer | `priya@bits-pilani.ac.in` |
| Student | `maya@berkeley.edu` |
| Student | `ravi@iitb.ac.in` |

## Quick start (development)

```bash
npm install
npm run dev
```

- Client: http://localhost:5173 (Vite, proxies `/api` → :4000)
- API: http://localhost:4000 (`GET /api/health`)

The dev database is Postgres — set `DATABASE_URL` in `server/.env` to any instance you can reach (local install, Docker, or hosted). **Note:** a Render *internal* connection string (host like `dpg-…-a`) is only reachable from inside Render's network — it will time out locally, so point `DATABASE_URL` at a local/hosted Postgres when running `npm run dev`. To (re)seed it:

```bash
npm run seed -w server
```

## Production build

The client calls the API with **relative `/api/*` paths**, so production hosts both from the same origin — no CORS or API-base configuration is needed.

```bash
# 1. Build both workspaces (client -> client/dist, server typecheck)
npm run build

# 2. Configure the environment
cp .env.example server/.env   # then edit secrets + DATABASE_URL

# 3. Apply migrations (and seed if you want the demo data)
npm run migrate -w server
npm run seed -w server        # optional

# 4. Start — NODE_ENV=production makes Express serve client/dist + SPA fallback
NODE_ENV=production npm start
```

With `NODE_ENV=production` (or `SERVE_CLIENT=true`), the Express server serves `client/dist` statically and falls back to `index.html` for any non-`/api` route, so deep links like `/teams/:id` work on refresh.

### Environment variables

Copy `.env.example` to `server/.env`. Key values:

| Var | Notes |
|---|---|
| `PORT` | API port (default `4000`) |
| `CLIENT_URL` | CORS origin for the dev client (`http://localhost:5173`) |
| `NODE_ENV` / `SERVE_CLIENT` | `production` (or `true`) serves the built client from Express |
| `DATABASE_URL` | Postgres connection string — used for dev and prod alike |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | **Change both** from the placeholders |
| `COLLEGE_DOMAINS` | Comma-separated allowed email domains, matched as suffixes |
| `SMTP_*` / `MAIL_FROM` | Leave `SMTP_*` empty to log OTP codes to the console instead of emailing |

> **Database:** `server/prisma/schema.prisma` uses the `postgresql` provider for both dev and prod. Skill/role/tag lists are native `String[]` columns. On a fresh clone run `npm run migrate -w server` before seeding.

## Verification

Focused service regression tests run without a database:

```bash
npm run test -w server
```

Two additional smoke scripts hit the running API:

```bash
node scripts/test-hackathons.mjs   # discovery/bookmark/auth rules
node scripts/test-teams.mjs        # squads, join requests, Instant Connect rules
```

Both expect the API on `:4000`. Type safety and build integrity are checked with:

```bash
npm run typecheck   # tsc -b (client) + tsc --noEmit (server)
npm run build
```

## Project layout

```
client/   React + Vite + Tailwind v4 SPA
server/   Express + Prisma API (controllers thin, logic in services/)
scripts/  API smoke-test scripts
design-reference/   Exported Stitch screen references (source of truth)
```
