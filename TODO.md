# TODO.md — Development Board

> **Rule:** Mark items `- [x]` immediately when done and note the next task under "Currently working on".
> **Currently working on:** Phase 1 → repo init & scaffold at `D:\MADDY\HackMatch`.

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
- [ ] Animotion MCP: currently **not connected** — add `animotion` server to opencode config + restart (user action), then replace interim CSS animations/icons with MCP assets. *Proceeding with interim hand-authored CSS + lucide-react icons meanwhile.*

## Phase 2 — Database & Authentication
- [ ] Define Prisma schema (Users, Hackathons, Teams, TeamMembers, JoinRequests, Bookmark, SoloPost)
- [ ] Run first migration + seed script (demo users, sample hackathons)
- [ ] Auth endpoints: register (college-domain check) → OTP verify → login → refresh → logout
- [ ] OTP email delivery (Nodemailer; console transport in dev)
- [ ] Frontend auth flow: sign-in page, OTP entry, AuthContext, protected routes
- [ ] Onboarding wizard: primary role → skill tags → GitHub/LinkedIn/Portfolio links → availability badge
- [ ] Profile page (Read.cv style, per Stitch ref) + edit profile

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
| 2026-10-18 | **Phase 1 complete.** Git repo + npm workspaces initialized; Vite/React/TS/Tailwind-v4 client + Express/TS server scaffolded; Stitch tokens + interim animation layer exported; verified: API health :4000 ✅, Vite proxy ✅, production build ✅. Next: **Phase 2** — Prisma schema + college-email OTP auth. |
