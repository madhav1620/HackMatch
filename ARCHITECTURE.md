# ARCHITECTURE.md — College Hackathon Discovery & Team-Building Platform

> Living architecture document. Update this file whenever the tech stack, schema, API, or folder structure changes.
> Status: **Phase 1 — Planning**

---

## 1. Tech Stack

| Layer | Technology | Why |
|---|---|---|
| **Frontend** | React 18 + TypeScript + Vite | Fast dev/build, typed end-to-end, easy deploy on Vercel/Netlify |
| **Styling** | Tailwind CSS + design tokens exported from **Stitch MCP** | Stitch design system drives colors/typography/components (see `DESIGN.md`) |
| **Routing / Data** | React Router v6 + TanStack Query | Client routing + cached server state with simple invalidation |
| **Backend** | Node.js 20+ / Express 4 + TypeScript | Small, hackathon-friendly REST API |
| **Validation** | Zod (request bodies/query params) | Single source of truth for API contracts, shared types |
| **Database** | PostgreSQL (Neon free tier) | Relational data (users ↔ teams ↔ hackathons) fits a relational model |
| **ORM** | Prisma | Typed schema, migrations, seed scripts. SQLite supported for local dev only |
| **Auth** | College-email + password, 6-digit OTP verification, JWT (access + refresh) | Meets "sign in with college email" requirement without OAuth dependency |
| **Mail** | Nodemailer (OTP emails); console-transport in dev | OTP delivery to `@college.edu` inboxes |
| **Deployment** | Frontend: Vercel · Backend: Render/Railway · DB: Neon | Free-tier friendly |

### Auth model (summary)
1. `POST /api/auth/register` — email must match a configurable college-domain allowlist (e.g. `.edu`, `.ac.in`, `@iiit*`, college-specific list in `COLLEGE_DOMAINS` env).
2. OTP (6 digits, 10-min expiry) is emailed; `POST /api/auth/verify-otp` activates the account.
3. Login returns a short-lived **access token** (15 min, `Authorization: Bearer`) and a **refresh token** (30 d, httpOnly cookie).
4. Roles: `STUDENT` (default), `ORGANIZER` (can post hackathons), `ADMIN` (full moderation).

### Auth implementation notes (Phase 2, as built)
- **Dev database:** SQLite (`server/prisma/dev.db`) — no local Postgres available. SQLite lacks array columns, so `User.skills`, `Hackathon.techTags`, `Team.requiredRoles/requiredSkills` are JSON-string columns with typed helpers (`server/src/lib/jsonArrays.ts`). Every such column is marked `PROD-NOTE` in `schema.prisma`; switching to Postgres = change `provider` and convert those to `String[]`.
- **Token transport:** the access token is returned in the response body and kept in `localStorage`; the refresh token is an httpOnly cookie (`hm_refresh`, `path=/api/auth`, `sameSite=lax`). `POST /auth/refresh` rotates it and returns a **new access token** in the body.
- **Overseen-in-testing rules (do not regress):**
  - Controllers must own the response. `issueTokens()` only mints tokens + sets the cookie and returns the string — it must never write to `res`.
  - All async route handlers are wrapped in `asyncHandler()` (`server/src/middleware/asyncHandler.ts`); Express 4 does not catch rejected promises and an unwrapped throw kills the process.
  - User responses go through the explicit `publicUser()` projection — never spread a Prisma row (`passwordHash`, `otpCode`, `otpExpiresAt` must never reach the client).

---

## 2. High-Level System Diagram

```
┌───────────────────────────────┐         ┌────────────────────────────────┐
│  client/  (React + Vite)      │  REST   │  server/  (Express + TS)       │
│  ─ AppShell (TopNav/BottomNav)│ ──────▶ │  ─ routes/   (HTTP wiring)     │
│  ─ pages/  (Feed, Profile,    │  JSON   │  ─ controllers/ (validation)   │
│            TeamBoard, Admin)  │  Bearer │  ─ services/  (business rules) │
│  ─ components/ui (Stitch DS)  │  JWT    │  ─ middleware/ (auth, roles)   │
└───────────────────────────────┘         └───────────────┬────────────────┘
                                                          │ Prisma
                                              ┌───────────▼───────────┐
                                              │  PostgreSQL           │
                                              │  Users, Hackathons,   │
                                              │  Teams, TeamMembers,  │
                                              │  JoinRequests, ...    │
                                              └───────────────────────┘
```

---

## 3. Database Schema (Prisma)

### Enums

```prisma
enum UserRole       { STUDENT  ORGANIZER  ADMIN }
enum PrimaryRole    { FRONTEND BACKEND  AIML  UIUX  PITCH  DEVOPS  DATA  OTHER }
enum Mode           { ONLINE   OFFLINE  HYBRID }
enum OrgType        { INTERNAL EXTERNAL }
enum HackathonStatus{ DRAFT    PUBLISHED  CLOSED }
enum Availability   { AVAILABLE  BUSY  UNAVAILABLE }
enum TeamChannel    { DISCORD  WHATSAPP  EMAIL }
enum RequestType    { JOIN     INVITE }
enum RequestStatus  { PENDING  ACCEPTED  DECLINED  CANCELLED }
```

### Tables

**Users** — student identity + profile (onboarding output)
```prisma
model User {
  id            String   @id @default(cuid())
  email         String   @unique              // college email (domain-verified)
  passwordHash  String
  name          String
  avatarUrl     String?
  verified      Boolean  @default(false)
  role          UserRole @default(STUDENT)
  // onboarding profile
  primaryRole   PrimaryRole
  bio           String?  @db.Text
  skills        String[]                     // e.g. ["React","Python","Figma"]
  githubUrl     String?
  linkedinUrl   String?
  portfolioUrl  String?
  discordHandle String?
  whatsappNo    String?
  availability  Availability @default(AVAILABLE)
  // otp fields
  otpCode       String?
  otpExpiresAt  DateTime?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  teams         TeamMember[]
  requestsSent  JoinRequest[]
  hackathons    Hackathon[]    @relation("postedBy")
  bookmarks     Bookmark[]
  soloPosts     SoloPost[]
}
```

**Hackathons** — discovery feed items (internal & external)
```prisma
model Hackathon {
  id                 String          @id @default(cuid())
  name               String
  tagline            String?
  description        String          @db.Text
  logoUrl            String?
  url                String?                       // external registration link
  mode               Mode
  location           String?                       // venue/city when OFFLINE/HYBRID
  orgType            OrgType        @default(EXTERNAL)
  prizePool          Int            @default(0)    // in INR
  registrationDeadline DateTime
  startDate          DateTime
  endDate            DateTime
  techTags           String[]                      // ["React","ML","IoT"]
  minTeamSize        Int            @default(1)
  maxTeamSize        Int            @default(6)
  status             HackathonStatus @default(PUBLISHED)
  organizerId        String?                        // null = external/scraped
  organizer          User?          @relation("postedBy", fields: [organizerId], references: [id])
  createdAt          DateTime        @default(now())
  updatedAt          DateTime        @updatedAt

  teams       Team[]
  bookmarks   Bookmark[]
  soloPosts   SoloPost[]
}
```

**Teams** — a team recruiting for a specific hackathon
```prisma
model Team {
  id             String      @id @default(cuid())
  hackathonId    String
  hackathon      Hackathon   @relation(fields: [hackathonId], references: [id], onDelete: Cascade)
  name           String
  description    String      @db.Text
  isRecruiting   Boolean     @default(true)
  openSlots      Int         @default(1)
  requiredRoles  PrimaryRole[]                 // e.g. [BACKEND, UIUX]
  requiredSkills String[]                      // e.g. ["Python","Figma"]
  contactChannel TeamChannel @default(DISCORD)
  contactValue   String?                      // discord invite / wa.me link / email
  createdById    String
  createdBy      User        @relation(fields: [createdById], references: [id], onDelete: Cascade)
  createdAt      DateTime    @default(now())
  updatedAt      DateTime    @updatedAt

  members       TeamMember[]
  joinRequests  JoinRequest[]
}
```

**TeamMembers** — accepted membership (unique per team+user)
```prisma
model TeamMember {
  id       String   @id @default(cuid())
  teamId   String
  team     Team     @relation(fields: [teamId], references: [id], onDelete: Cascade)
  userId   String
  user     User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  role     PrimaryRole           // member's role inside this team
  isLeader Boolean  @default(false)
  joinedAt DateTime @default(now())

  @@unique([teamId, userId])
}
```

**JoinRequests** — join/invite workflow
```prisma
model JoinRequest {
  id          String        @id @default(cuid())
  teamId      String
  team        Team          @relation(fields: [teamId], references: [id], onDelete: Cascade)
  requesterId String
  requester   User          @relation(fields: [requesterId], references: [id], onDelete: Cascade)
  type        RequestType   @default(JOIN)
  message     String?       @db.Text          // "Hi, I'm a backend dev, 3 hackathons..."
  status      RequestStatus @default(PENDING)
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  @@unique([teamId, requesterId])             // one live request per user/team
}
```

**Supporting tables**
```prisma
model Bookmark {           // reminders on hackathons
  id          String    @id @default(cuid())
  userId      String
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  hackathonId String
  hackathon   Hackathon @relation(fields: [hackathonId], references: [id], onDelete: Cascade)
  remindAt    DateTime?                       // optional reminder time
  createdAt   DateTime  @default(now())
  @@unique([userId, hackathonId])
}

model SoloPost {           // "Looking for Team" individuals
  id          String    @id @default(cuid())
  hackathonId String
  hackathon   Hackathon @relation(fields: [hackathonId], references: [id], onDelete: Cascade)
  userId      String
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  pitch       String    @db.Text
  isOpen      Boolean   @default(true)
  createdAt   DateTime  @default(now())
  @@unique([hackathonId, userId])
}
```

### Entity relationship overview

```
User 1─n TeamMember n─1 Team n─1 Hackathon 1─n Bookmark n─1 User
User 1─n JoinRequest n─1 Team
User 1─n SoloPost   n─1 Hackathon
User 1─n Hackathon (posted by ORGANIZER/ADMIN)
```

---

## 4. API Routes (REST, base `/api`)

### Auth
| Method | Route | Description |
|---|---|---|
| POST | `/auth/register` | Create account (college email domain check) → sends OTP |
| POST | `/auth/verify-otp` | Verify OTP → activate account |
| POST | `/auth/resend-otp` | Resend OTP |
| POST | `/auth/login` | Email + password → access + refresh tokens |
| POST | `/auth/refresh` | Rotate refresh token → new access token |
| POST | `/auth/logout` | Clear refresh cookie |
| GET | `/auth/me` | Current user (auth) |

### Profiles
| Method | Route | Description |
|---|---|---|
| GET | `/profiles/me` | Own profile |
| PATCH | `/profiles/me` | Update bio, skills, links, role, availability |
| GET | `/profiles/:id` | Public profile view |
| GET | `/profiles?skills=&role=&availability=` | Search potential teammates |
| GET | `/profiles/matches/:hackathonId` | Skill-matched students for a hackathon |

### Hackathons (discovery hub)
| Method | Route | Description |
|---|---|---|
| GET | `/hackathons?search=&mode=&orgType=&tech=&from=&to=&minPrize=&sort=&page=` | Feed with filters |
| GET | `/hackathons/:id` | Detail (includes team count) |
| POST | `/hackathons` | Create (ORGANIZER/ADMIN) |
| PATCH | `/hackathons/:id` | Update (owner/admin) |
| DELETE | `/hackathons/:id` | Remove (owner/admin) |
| GET | `/hackathons/mine` | Organizer's own posts incl. drafts (ORGANIZER/ADMIN) |
| POST | `/hackathons/:id/bookmark` | Bookmark / set reminder |
| DELETE | `/hackathons/:id/bookmark` | Remove bookmark |
| GET | `/bookmarks` | My bookmarked hackathons |

**Implementation notes (Phase 3, live):**
- Feed response shape: `{ items, page, pageSize, total, totalPages }`; each item is a card projection with `techTags: string[]`, `teamCount`, `soloPostCount`, `bookmarked`, `remindAt`.
- Feed pagination defaults: `page=1`, `limit=12` (max `50`). `sort` is one of `deadline` (default) / `prize` / `recent`.
- Only `status = PUBLISHED` is returned by default; `?includeClosed=true` includes DRAFT/CLOSED.
- `from`/`to` bound **`registrationDeadline`**; `tech` is comma-separated and matches **any** selected tag (OR) — implemented in memory because SQLite stores tags as a JSON string (`PROD-NOTE` for Postgres `hasSome`).
- `bookmarked`/`remindAt` are resolved with `optionalAuth`, so the same feed serves signed-out and signed-in users.
- `POST /hackathons/:id/bookmark` is an idempotent upsert (unique `[userId, hackathonId]`); body optional `{ remindAt }`.
- Authoring: `POST` requires ORGANIZER/ADMIN, `PATCH`/`DELETE` require the owner or ADMIN, and end date ≥ start date + max team size ≥ min team size are enforced.

### Teams & recruitment
| Method | Route | Description |
|---|---|---|
| POST | `/hackathons/:id/teams` | Create team ("Post a Team Requirement") |
| GET | `/hackathons/:id/teams?skills=&role=&openOnly=` | Matchmaking board for a hackathon |
| GET | `/teams/:id` | Team detail + members + open slots |
| PATCH | `/teams/:id` | Edit requirements / toggle recruiting |
| DELETE | `/teams/:id` | Disband (leader) |
| GET | `/teams/mine` | Teams I lead or belong to |
| POST | `/teams/:id/requests` | Send join request ("Find a Team") |
| GET | `/teams/:id/requests` | Incoming requests (leader only) |
| PATCH | `/requests/:id` | Accept / decline (leader) |
| DELETE | `/requests/:id` | Cancel my request (requester) |
| GET | `/requests/mine` | My sent requests + their status |

### Solo builders ("Looking for Teammates")
| Method | Route | Description |
|---|---|---|
| POST | `/hackathons/:id/solo-post` | Post availability for a hackathon |
| GET | `/hackathons/:id/solo-posts` | List solo builders (filter by skill) |
| DELETE | `/solo-posts/:id` | Take down post |

### Conventions
- **Auth:** `Authorization: Bearer <accessToken>` on all non-public routes.
- **Errors:** `{ "error": { "code": "VALIDATION_ERROR", "message": "...", "details": [...] } }`
- **Pagination:** `?page=1&limit=20` → `{ items, total, page, pages }`
- **Accepting a request** atomically: mark request ACCEPTED → create `TeamMember` → decrement `openSlots` → if 0, `isRecruiting=false` → response includes team `contactChannel`/`contactValue` for Discord/WhatsApp/Email connect.

---

## 5. Folder Structure

```
hackathon-hub/
├── ARCHITECTURE.md            # this file
├── DESIGN.md                  # Stitch design system doc
├── TODO.md                    # phased task board
├── package.json               # npm workspaces: client, server
├── .env.example
├── client/
│   ├── index.html
│   ├── vite.config.ts         # tailwind v4 plugin + /api proxy → localhost:4000
│   ├── tsconfig.json
│   └── src/
│       ├── main.tsx            # providers: QueryClient, BrowserRouter, Auth, Toast
│       ├── Router.tsx          # route table (protected + public routes)
│       ├── index.css           # Tailwind v4 @theme tokens (from Stitch) + base + utilities
│       ├── styles/
│       │   └── animations.css  # motion layer (Animotion-classed, reduced-motion aware)
│       ├── components/
│       │   ├── ui/            # Button, Input/Textarea, Chip/Badge, Modal, Toast, Tabs,
│       │   │                  # Tag, TagInput, CountdownBadge, Skeleton/EmptyState
│       │   ├── layout/        # AppShell (top bar + bottom tabs + search)
│       │   └── features/
│       │       ├── hackathons/  # HackathonCard, FilterBar, BookmarkButton
│       │       ├── teams/       # TeamCard, HackathonBoard, SoloBoard, SkillFilterBar,
│       │       │                # CreateSquadModal, SquadApplicationModal, JoinRequestRow,
│       │       │                # ContactReveal, LookingForTeam, SoloBuilderCard
│       │       └── auth/        # ProtectedRoute (OTP UI lives in AuthPage)
│       ├── pages/             # Auth, Onboarding, Discover, HackathonDetail, Saved,
│       │                      # TeamDetail, MyTeams, MyRequests, Talent, Profile, PostHackathon
│       ├── api/               # typed fetch clients (authApi, hackathonsApi, teamsApi)
│       ├── hooks/             # useHackathons, useTeams (TanStack Query)
│       └── context/           # AuthContext
└── server/
    ├── prisma/
    │   ├── schema.prisma
    │   └── seed.ts            # sample hackathons + demo users
    └── src/
        ├── index.ts           # express bootstrap
        ├── config/            # env loading, constants (COLLEGE_DOMAINS)
        ├── routes/            # one file per resource (auth.routes.ts...)
        ├── controllers/       # request parsing + Zod validation
        ├── services/          # business logic (matchmaking, request accept)
        ├── middleware/        # requireAuth, requireRole, errorHandler
        └── lib/               # prisma client, jwt, mailer, otp
```

---

## 6. Key Architectural Decisions

1. **Monorepo with npm workspaces** — one `npm run dev` runs client (5173) + server (4000) with Vite proxy.
2. **REST over GraphQL** — simpler for this domain; TanStack Query handles caching.
3. **Matchmaking is filter-based, not algorithmic (v1)** — skill/role overlap filters via Postgres arrays (`hasSome`); scoring/recommendation can be layered later.
4. **Contact handoff instead of in-app chat (v1)** — accepted requests expose Discord/WhatsApp/Email links; keeps scope tight ("Instant Connect").
5. **All mutations validated with Zod** and typed into shared `client/src/api/types.ts`.
6. **Design source of truth = Stitch** — UI components must derive from the selected Stitch design system (see `DESIGN.md`).
7. **Single-origin production serving** — the client calls the API with relative `/api/*` paths. In production (`NODE_ENV=production` or `SERVE_CLIENT=true`) Express serves the built `client/dist` with an SPA fallback for non-`/api` routes, so one process hosts both and no CORS or API-base config is needed. Dev keeps the Vite proxy split (client :5173 → API :4000).
8. **Instant Connect privacy rule** — a team's `contactChannel`/`contactValue` is never included in public board or detail payloads; it is only returned to accepted members, the team lead, and ADMIN (enforced server-side in `team.service.ts`).
