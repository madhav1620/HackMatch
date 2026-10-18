# TODO.md — Development Board

> **Rule:** Mark items `- [x]` immediately when done and note the next task under "Currently working on".
> **Currently working on:** Phase 5 — Polish, Responsiveness & Deployment Prep 🚧 **IN PROGRESS**

---

## Phase 1 — Architecture, Design Setup & Planning
- [x] Create `ARCHITECTURE.md` (tech stack, DB schema, API routes, folder structure)
- [x] Create `DESIGN.md` (Stitch workflow, layout, component hierarchy)
- [x] Create `TODO.md` (this board)
- [x] Verify Stitch MCP connectivity and list available Stitch projects
- [x] Select Stitch design → **"College Hackathon Team Finder"** (`10121204597706454375`, theme: *Tactile Editorial Minimalist*)
- [x] Export 8 Stitch screen references → `design-reference/` (feed/board/modal/profile × light+dark)
- [x] Relocate project to `D:\MADDY\HackMatch` (user-confirmed location)
- [x] Initialize git repository + npm workspaces in `D:\MADDY\HackMatch`
- [x] Scaffold `client/` (Vite + React + TS + Tailwind v4) and `server/` (Express + TS); verified `npm run dev` → API :4000, app :5173, proxy OK, production build OK
- [x] Export Stitch tokens → `client/src/index.css` (`@theme` tokens — Tailwind v4 is CSS-configured, no tailwind.config.ts) + `client/src/styles/animations.css`
- [x] Animotion MCP connected & verified — `list_categories` returns 20 categories / 745 animations; `suggest_animation` and icon search working (9,745 SVG icons across Lucide, Heroicons, Tabler, Bootstrap). Will replace interim CSS + swap lucide-react icons for MCP-sourced SVGs during Phase 3 UI build.

## Phase 2 — Database & Authentication
- [x] Define Prisma schema (Users, Hackathons, Teams, TeamMembers, JoinRequests, Bookmark, SoloPost) — **SQLite dev** (no local Postgres; skill lists as JSON-string columns, `PROD-NOTE` markers for the Postgres switch)
- [x] Run first migration (✅ `dev.db`, 7 tables); seed script next
- [x] Auth endpoints: register (college-domain check) → OTP verify → login → refresh → logout; ✅ **verified via live smoke tests (no leaks: no passwordHash/OTP in responses)**
- [x] OTP email delivery (Nodemailer; console transport in dev) — console output visible in server logs; ready for SMTP
- [x] Frontend auth flow: sign-in page, OTP entry, AuthContext (localStorage access token + httpOnly refresh cookie with silent rotation), protected routes — ✅ verified in a real browser
- [x] Onboarding wizard: primary role → skill tags → GitHub/LinkedIn/Portfolio links → availability badge — ✅ 4-step rail, verified end-to-end (role/skills/links/availability persist)
- [x] Profile page (Read.cv style, per Stitch ref) + inline edit profile — ✅ HACKER ID / Verified / 01 Core Tech / 02 Track Record / 03 Looking to Build / 04 Repos; edits persist to DB
- [x] App shell: top bar (search, Post, user chip, sign out) + mobile bottom tab bar (Discover/Talent/Squads/Chats/Profile); Phase 3–4 destinations stubbed as placeholders
- [x] **Bug fixes found by live testing:** (1) `ERR_HTTP_HEADERS_SENT` — `issueTokens()` wrote the response *and* the controller wrote again on every login/verify-otp/refresh; (2) same root cause masked a missing `{accessToken, user}` body; (3) `passwordHash`+OTP fields leaked in `/me` responses — now stripped via an explicit `publicUser()` projection.
- [x] Vite dev server pinned to `5173` with `strictPort: true` (was silently drifting to 5174)

## Phase 3 — Hackathon Discovery Hub

### Pre-work — complete the Stitch screen set (user chose design-first)
- [x] Generate 5 missing Stitch screens against design system `5188d4e4b4b249cf8d2882e0e31fe22c` (MOBILE, matching the existing 780w canvases): **hackathon detail**, **post-hackathon organizer form**, **feed loading + empty states**, **landing page**, **auth + OTP** — Stitch MCP tool timeout is 60s vs multi-minute generation, so generation ran via `scripts/stitch-generate.mjs` (plain HTTP to the MCP endpoint) as a background job; all 5 completed (67–93s each)
- [x] Export the 5 generated screens → `design-reference/` (+ `.png` renders + `manifest.json` with Stitch screen IDs) and add them to the `DESIGN.md` screen map

### Backend — Discovery Hub API
- [x] `GET /api/hackathons` — search + filters (mode, orgType, tech, deadline `from`/`to`, `minPrize`), sort (`deadline`/`prize`/`recent`), pagination; `bookmarked` flag injected via `optionalAuth`
- [x] `GET /api/hackathons/:id` — detail with `teamCount` / `soloPostCount` / bookmark state
- [x] `POST` / `PATCH` / `DELETE /api/hackathons(/:id)` — role-gated (ORGANIZER/ADMIN), owner check on PATCH, Zod-validated
- [x] `GET /api/hackathons/mine` — organizer's own posts (incl. drafts)
- [x] `POST` / `DELETE /api/hackathons/:id/bookmark` + `GET /api/bookmarks` (reminder `remindAt` support, idempotent upsert)
- [x] `optionalAuth` middleware; seed rebuilt (4 users incl. an **ORGANIZER**, 13 hackathons w/ mixed modes, org types, prizes, deadlines, tags, 1 CLOSED + 1 DRAFT, 4 teams, 3 solo posts, 3 bookmarks)
- [x] Live smoke test: `scripts/test-hackathons.mjs` — 30 assertions green (filters, sort order, pagination, 404/400/401/403 paths, bookmark idempotency)

### Frontend — Discovery Hub
- [x] TanStack Query provider + `api/hackathons.ts` client + types (`hooks/useHackathons.ts`, optimistic bookmark toggle)
- [x] `HackathonCard` (logo cell, mode pill, internal/external, mono countdown, prize, skill pills) per `feed-light`
- [x] Filter bar: search, date range, mode, prize, tech tags, sort — chip bar on mobile, rail on desktop (`FilterBar.tsx` + `filters.ts`)
- [x] Bookmark/reminder toggle + `/saved` view (`BookmarkButton`, `SavedPage` w/ reminder copy)
- [x] Loading skeletons + empty state per `feed-states`
- [x] Hackathon detail page per `hackathon-detail` (spec grid, live countdown, about/tracks/judging/schedule tabs, team + solo counts)
- [x] Organizer post form per `post-hackathon` (3-step: basics → logistics → teams & tracks) + "my posts" list, role-gated
- [x] `npm run typecheck` clean (client + server) and `npm run build` green
- [x] **Live browser verification** — feed (11 events → mode filter → 3), detail page, bookmark → Saved (2 saved), student role gate on the post form, organizer login, and a full create → feed → delete cycle for a smoke hackathon
- [x] **Bug found by live testing:** `AppShell` used `<BadgeCheck>` without importing it, throwing on every authed route (blank page) — fixed.

## Phase 4 — Team Matchmaking & Recruitment Engine

### Backend — schema + matchmaking API
- [x] Schema migration: `Team.track`; `JoinRequest.role` / `portfolioUrl` / `commitment` / `reviewedAt`
- [x] `team.service.ts` — board listing (skill + role + open-slots filters), squad CRUD (leader-owned), membership projection (contact never leaks to non-members)
- [x] `POST /api/hackathons/:id/teams` (create squad + leader member) + `GET /api/hackathons/:id/teams` (matchmaking board)
- [x] `GET` / `PATCH` / `DELETE /api/teams/:id` (detail w/ roster, leader-only edit) + `GET /api/teams/mine`
- [x] Join-request workflow: `POST /api/teams/:id/requests`, `GET /api/teams/:id/requests` (leader), `PATCH /api/requests/:id` (accept → member added + slot decremented → auto-close at 0; decline), `DELETE /api/requests/:id` (cancel), `GET /api/requests/mine`
- [x] Solo builders ("Looking for Team"): `POST /api/hackathons/:id/solo-post` (upsert), `GET /api/hackathons/:id/solo-posts`, `DELETE /api/solo-posts/:id`
- [x] Instant Connect: `contactChannel`/`contactValue` projected **only** to confirmed members / leader
- [x] Seed extension (5 squads w/ tracks + open slots incl. a full squad, 4 solo posts, 4 join requests, 3 bookmarks)
- [x] `scripts/test-teams.mjs` live smoke test — **52 assertions green** (re-runnable)

### Frontend — board, squad modal, Instant Connect
- [x] `api/teams.ts` + types + `hooks/useTeams.ts` (TanStack Query, invalidation across board / detail / my-teams)
- [x] `TeamCard` per `board-light` — solid member cells + **dashed open-slot cells**, track line, required role/skill pills, "Request to join"
- [x] `SquadApplicationModal` per `modal-light` — target squad, vacant slot, roster breakdown, 280-char pitch, portfolio, commitment window, privacy note
- [x] Create-squad / "Post a Team Requirement" modal (leader becomes first member; open slots from hackathon max team size)
- [x] "Looking for Team" one-click toggle → Solo Builder post (`SoloBuilderCard`)
- [x] `JoinRequestRow` (accept / decline) + **My Teams** + **My Requests** views with status indicators
- [x] `ContactReveal` — Instant Connect Discord / WhatsApp / Email, revealed once accepted
- [x] Wire `/hackathons/:id` TEAMS + SOLO tabs to the live board (replaced Phase-4 placeholders); `/squads`, `/talent` destinations
- [x] `npm run typecheck` clean (client + server) and `npm run build` green
- [x] **Live browser verification** — create squad → board card → apply → accept → contact revealed → slot decremented

## Phase 5 — Polish, Responsiveness & Deployment Prep
- [ ] Animation pass: verify all motion inventory items from `DESIGN.md` §6 (and swap in Animotion MCP assets if connected)
- [ ] Mobile-first responsiveness pass (360 / 768 / 1280 px vs Stitch references)
- [ ] Verify all Stitch design components cleanly integrated (no off-system styling)
- [ ] Loading/empty/error states, toasts, form validation feedback
- [ ] Accessibility pass (contrast, keyboard nav, focus states, prefers-reduced-motion)
- [ ] Production build + env config (.env.example, CORS, proxy) + deployment setup
- [ ] Final audit of `TODO.md` — all boxes checked, docs in sync

---

### Change Log
| Date | Change |
|---|---|
| 2026-10-18 | Board created; Phase 1 docs written; Stitch MCP verified. |
| 2026-10-18 | Design selected: **College Hackathon Team Finder** → "Tactile Editorial Minimalist". 8 screens exported to `design-reference/`. Project relocated to `D:\MADDY\HackMatch`. Animotion MCP not connected — interim CSS animations + lucide-react icons planned. Next: git init + scaffold client/server. |
| 2026-10-18 | **Phase 2 auth backend complete.** SQLite schema + seed running; register/login/verify-otp/resend-otp/refresh/logout + /me implemented; college-domain gate tested; leak-fixed (no passwordHash/OTP in responses); OTP console delivery working. Next: frontend auth (sign-in, OTP, AuthContext, protected routes) + onboarding + Read.cv profile. |
| 2026-10-18 | **Phase 2 COMPLETE.** Frontend: sign-in + OTP modal, `AuthContext` (access token in localStorage, refresh in httpOnly cookie w/ silent rotation), `ProtectedRoute`, 4-step onboarding wizard, Read.cv-style profile with inline edit, app shell + bottom tab bar. Fixed 3 live-test bugs (`ERR_HTTP_HEADERS_SENT` double-response on login/verify/refresh; missing `{accessToken,user}`; sensitive-field leak in `/me`). Verified end-to-end in a real browser + against the DB. Screenshot: `docs/phase2-profile.png`. **Next: Phase 3 — Discovery Hub** (feed, filters, bookmarks, hackathon detail). |
| 2026-10-18 | **Phase 3 COMPLETE — Discovery Hub.** 5 extra Stitch screens generated/exported (13 total). Backend: `hackathon.service.ts` + routes/controllers (feed w/ search·mode·orgType·tech-OR·date-range·minPrize·sort·pagination, detail w/ counts, organizer CRUD, bookmark upsert, `/mine`), `optionalAuth`, reseeded (4 users incl. organizer, 13 hackathons, 4 teams, 3 solo posts, 3 bookmarks); `scripts/test-hackathons.mjs` ≈30 assertions green. Frontend: TanStack Query data layer, `HackathonCard`, `FilterBar`, `BookmarkButton`, loading/empty states, `DiscoverPage`, `HackathonDetailPage`, `SavedPage`, `PostHackathonPage`. `npm run typecheck` clean, `npm run build` green, feed/detail/bookmark/saved/role-gate/create-publish-delete all live-verified in the browser. Fixed a missing `BadgeCheck` import in `AppShell` that blanked every authed route. **Next: Phase 4 — Team Matchmaking & Recruitment.** |
