# TODO.md — Development Board

> **Rule:** Mark items `- [x]` immediately when done and note the next task under "Currently working on".
> **Currently working on:** Phase 2 ✅ complete → starting **Phase 3 (Discovery Hub)**.

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
- [ ] Hackathon Feed UI built from Stitch components (`design-reference/feed-light.html`)
- [ ] Search + filters: date range, mode (online/offline/hybrid), prize pool, tech tags, internal/external
- [ ] Bookmark/reminders on hackathon cards (deadline reminder state)
- [ ] Hackathon detail page (mono countdown badge, tabs for teams/solo builders)
- [ ] Admin/Organizer view: post new hackathon (role-gated form) + list/edit own posts

## Phase 4 — Team Matchmaking & Recruitment Engine
- [ ] "Create Team" / "Post a Team Requirement" flow tied to a hackathon
- [ ] "Looking for Team" one-click status → Solo Builder post on a hackathon
- [ ] Team matchmaking board per hackathon with skill-tag filtering (React, Python, Figma...) — match `design-reference/board-light.html` incl. dashed open-slot cells
- [ ] Join Request workflow (Squad Application Modal per `design-reference/modal-light.html`): send → accept/decline → member added, slots decremented
- [ ] Instant Connect: expose Discord/WhatsApp/Email contact links once accepted
- [ ] My Requests / My Teams views with status indicators

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
