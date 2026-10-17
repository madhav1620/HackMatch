# DESIGN.md — UI/UX Design System (Stitch MCP)

> **Status:** ✅ **FINALIZED** — Design selected: **"College Hackathon Team Finder"** (Stitch project `10121204597706454375`)
> Design system name: **"Tactile Editorial Minimalist"** · Light-first with dark-mode screen variants.
> Local screen exports: `design-reference/*.html` (**13 screens**, open in browser to preview). `design-reference/manifest.json` records the Stitch screen IDs for the 5 generated screens.

---

## 1. Design Workflow (Stitch → Code)

1. ✅ Pull design DNA from Stitch project `10121204597706454375` (tokens + guidelines + 8 screens).
2. ✅ Export screen HTML references → `design-reference/` (feed, board, modal, profile × light/dark).
3. ⬜ Export tokens → `client/src/index.css` via Tailwind v4 `@theme` (v4 is CSS-configured — no tailwind.config.ts needed) ✅ *(done: full token set + utilities live in `index.css`, motion in `styles/animations.css`)*
4. ⬜ Build `client/src/components/ui/*` primitives strictly from the Stitch component specs (§6).
5. ⬜ Compose feature screens from those primitives; verify against `design-reference/*.html`.
6. ⬜ No one-off hex values in feature code — everything through tokens.

---

## 2. Design DNA — "Tactile Editorial Minimalist"

> High-craft editorial utility: Linear's structure + Notion's warmth + Read.cv portfolio typography.
> **Principles:** Paper & Ink foundation · Bento utility grid · Micro-tactility (1px borders, inset presses) · Anti-trope restraint (no glassmorphism, no neon gradients, no 3D meshes).

### 2.1 Color Tokens (LIGHT — primary theme)

| Token | Value | Usage |
|---|---|---|
| `canvas-paper` | `#F9F9F8` | App background canvas |
| `surface-card` | `#FFFFFF` | Cards, bento cells, modals |
| `surface` | `#FCF9F4` | Warm surface tint |
| `border-hairline` | `#E4E4E0` | 1px card/divider stroke |
| `border-subtle` | `#E6E6E3` | Internal cell subdivisions |
| `text-primary` | `#141413` | Ink — headlines, values, button labels |
| `text-secondary` | `#686763` | Captions, telemetry, timestamps |
| `accent-orange` | `#FF4F00` | **Primary focal CTA**, active status, notification pings |
| `primary` (deep) | `#A93100` / container `#D34000` | Deep brand orange (hover/active depth) |
| `accent-blue` | `#2563EB` (`#0051D5` token) | Links, verified emblems, active tabs |
| `badge-mint-bg` / `-text` | `#DCFCE7` / `#166534` | Affirmative: accepted, live prize, open slots |
| `badge-amber-bg` / `-text` | `#FEF3C7` / `#92400E` | Warning: deadline-soon, pending, draft |
| `error` / `error-container` | `#BA1A1A` / `#FFDAD6` | Destructive / validation errors |

Dark-mode variants exist for all 4 screens (`design-reference/*-dark.html`) and can be wired as a `.dark` token layer later; **v1 ships light-first**.

### 2.2 Typography

| Role | Font | Spec |
|---|---|---|
| Headlines | **Plus Jakarta Sans** | Tight tracking (−0.01 → −0.03em), weights 600–700 |
| Body | **Inter** | 14/16px, relaxed line-height, −0.01em on large |
| Telemetry / labels / tags | **JetBrains Mono** | Countdowns, prize pools, skill pills, all-caps captions (+0.08em) |

Scale (Tailwind mapping planned):

| Token | Size/Line | Weight | Tracking |
|---|---|---|---|
| `display-hero` | 56/64 (mobile 36/44) | 700 | −0.03em (−0.02em) |
| `headline-lg` | 32/40 (mobile 26/34) | 600 | −0.02em |
| `headline-md` | 22/28 | 600 | −0.01em |
| `headline-sm` | 18/24 | 600 | −0.01em |
| `body-lg` | 16/26 | 400 | −0.01em |
| `body-md` | 14/22 | 400 | 0 |
| `body-sm` | 12/18 | 400 | 0 |
| `label-code` | 13/18 | 500 | −0.01em (JetBrains Mono) |
| `label-mono-sm` | 11/16 | 500 | +0.02em (JetBrains Mono) |
| `caption-caps` | 10/14 | 600 | +0.08em (JetBrains Mono, uppercase) |

### 2.3 Spacing, Shape, Elevation

- **Spacing:** `xs 0.25 · sm 0.5 · md 1 · lg 1.5 · xl 2.5rem`; gutters `1rem` mobile / `1.5rem` desktop; margins `1 / 2 / 3rem`; max content width **1280px**; 12-col desktop → 8-col tablet → 1–2-col mobile.
- **Radii:** `sm 2px · base 4px · md 6px · lg 8px · xl 12px · full 9999px`. Cards/modals = 12px; buttons/inputs = 8px; chips = pill.
- **Dot-matrix canvas:** optional fixed pattern, dots `rgba(20,20,19,0.05)` 1px radius on a 16×16px grid over `#F9F9F8`.
- **Elevation (borders over shadows):**
  - L0 canvas `#F9F9F8` — flat
  - L1 card `#FFFFFF` + 1px `#E4E4E0` + `0 1px 2px rgba(20,20,19,0.04)`
  - L2 hover/lift: border → `#141413` @20%, shadow `0 4px 12px rgba(20,20,19,0.06)`
  - L3 modal: 1px `#E4E4E0` + `0 16px 36px -4px rgba(20,20,19,0.10)`
  - Recessed (empty slots/dropzones): bg `rgba(20,20,19,0.02)` + **1px dashed** hairline

---

## 3. Stitch Screen References (source of truth)

| Screen | File | Maps to |
|---|---|---|
| Hackathon Discovery Feed | `design-reference/feed-light.html` | `/feed` |
| Hackathon Discovery Feed (Dark) | `design-reference/feed-dark.html` | `/feed` `.dark` |
| Team Matchmaking Board | `design-reference/board-light.html` | `/hackathons/:id` tabs |
| Team Matchmaking Board (Dark) | `design-reference/board-dark.html` | — |
| Squad Application Modal | `design-reference/modal-light.html` | Join Request modal |
| Squad Application Modal (Dark) | `design-reference/modal-dark.html` | — |
| Student Profile (Read.cv Style) | `design-reference/profile-light.html` | `/profile/:id`, onboarding |
| Student Profile (Dark) | `design-reference/profile-dark.html` | — |
| Hackathon Detail | `design-reference/hackathon-detail.html` | `/hackathons/:id` (hero, countdown, about/tracks/judging/schedule, recruiting teams + solo builders) |
| Feed Loading & Empty States | `design-reference/feed-states.html` | `/feed` skeleton cards + no-results state |
| Post a Hackathon (Organizer) | `design-reference/post-hackathon.html` | `/admin/hackathons/new` (3-step form: basics → logistics → teams & tracks) |
| Mobile Marketing Landing | `design-reference/landing.html` | `/` hero, live spotlight card, how-it-works, campus league, footer |
| Auth Flow (Sign-in + OTP) | `design-reference/auth.html` | `/auth` sign-in frame + OTP verification modal |

Each screen also has a `.png` render alongside its `.html`.

---

## 4. Layout Structure (mobile-first)

```
AppShell (dot-matrix canvas #F9F9F8, max-w 1280px)
├── Desktop (≥1024px)
│   ├── TopNav: wordmark (JetBrains Mono caps) · Feed · Boards · My Teams · Requests
│   │           · [Post Hackathon]* (orange accent) · Avatar menu
│   └── 12-col bento grid; Feed = span-3 filter rail + span-9 card column
├── Tablet (600–1023px): 8-col, filters collapse into chip bar
└── Mobile (<600px): compact top bar · 1-col stack · BottomNav + orange FAB "Find Team"
```

### Screen inventory
| Route | Screen | Stitch ref |
|---|---|---|
| `/` | Landing (hero + college-email CTA) | **landing** |
| `/auth` | Sign-in + OTP entry | **auth** |
| `/onboarding` | Role → skills → links → availability | profile-light |
| `/feed` | Discovery: search, filter chips, HackathonCards, bookmark | **feed-light** |
| `/hackathons/:id` | Detail: hero + countdown badge + About/Tracks/Judging/Schedule + Teams/Solo tabs | **hackathon-detail** |
| `/hackathons/:id/teams/new` | Create team / post requirement | composed from board |
| `/teams/:id` | Team detail + join requests accept/decline | **board-light** |
| `/profile/:id` `/profile/me` | Read.cv-style profile | **profile-light** |
| `/requests` | Sent/received requests | board rows |
| `/admin/hackathons/new` | Organizer post form (3-step) | **post-hackathon** |
| `/feed` (loading / no results) | Skeletons + empty state | **feed-states** |

---

## 5. Component Hierarchy

```
AppShell
├── TopNav / BottomNav / FAB
└── Page
    ├── SectionHeader (headline-sm + caption-caps mono category label)
    ├── FilterBar ── PillTag (mono), SearchInput, DeadlineSelect
    ├── HackathonCard (bento cell)
    │   ├── LogoCell · ModePill · Internal/External caption-caps
    │   ├── CountdownBadge (JetBrains Mono) · PrizePool (mono, mint badge if live)
    │   ├── SkillPills · DeadlineAmberBadge if <48h
    │   └── Actions: BookmarkIconBtn · "Find a Team" (outline) · "Post Requirement" (orange accent)
    ├── TeamCard
    │   ├── TeamName (headline-sm) · HackathonTag
    │   ├── OpenSlots: solid member cells + **dashed recessed slot cells** (signature element)
    │   ├── RequiredRolePills · RequiredSkillPills
    │   └── "Send Join Request" → SquadApplicationModal
    ├── SquadApplicationModal (Level-3 elevation): mini profile, message textarea, submit
    ├── SoloBuilderCard · ProfileCard · JoinRequestRow (list rows, hairline separated)
    ├── [HackathonDetail] DetailHero (back · title · bookmark · share) · SpecGrid
    │   └── SpecCell (label-caps + value: MODE / PRIZE POOL / TEAM SIZE / REG. CLOSES IN + live CountdownBadge)
    │   ├── TrackPill `[ AI / AGENTS ]` · JudgingRow (label + mono %) · ScheduleRow (mono date/time + title)
    │   └── RecruitingTeamRow (name · slots-left mono · skill pills · "Request to join →")
    ├── [Organizer form] StepRail (01 BASICS / 02 LOGISTICS / 03 TEAMS) · Dropzone (dashed) · SegmentedControl (venue type) · Stepper (− / +)
    ├── [Feed states] SkeletonCard (shimmer) · EmptyState (label-caps + dashed frame + "Clear filters" / "Notify me")
    └── ui/: Button (ink-filled / orange-accent / outline / ghost), Input, Textarea,
             PillTag, Badge (mint/amber), BentoCard, Modal, Avatar, Tabs,
             CountdownBadge, DashedSlot, EmptyState, Toast, Skeleton
```

### Component specs (from Stitch design system)
- **Buttons:** ink `#141413`/white (default), **orange `#FF4F00`/white (conversion only)**, outline (white + 1px hairline), ghost. Radius 8px, active `scale(0.98)` inset press.
- **Cards:** white, 1px hairline, 12px radius, padding `1.5rem`.
- **Chips/pills:** pill radius, `#F9F9F8` fill, 1px hairline, `label-mono-sm`.
- **Inputs:** white, 1px `#E4E4E0`, 8px radius; focus = border → `#141413` + crisp 1px offset ring (no glow).
- **Dashed slots/empty states:** dashed hairline + recessed bg + `label-code` text.

---

## 6. Animation & Motion Plan

> **MCP status:** Animotion MCP (`animotion-mcp`) is **connected and verified** — 20 categories / 745 animations (`suggest_animation` returns real CSS) and 9,745 SVG icons across Lucide, Heroicons, Tabler and Bootstrap.
> **Plan (v1):** interim hand-authored keyframes in `client/src/styles/animations.css` are written to Animotion's class-based conventions, so real Animotion CSS drops in 1:1. Phase 3–5 swaps in MCP-sourced animation CSS for the inventory below and replaces `lucide-react` glyphs with MCP-sourced SVG paths.
> **Icons (interim):** `lucide-react` (real, versioned SVG icon set — no hallucinated paths).

### Motion inventory (all respect `prefers-reduced-motion`)
| Moment | Animation | Timing |
|---|---|---|
| Feed cards entering | fade-up + stagger (16px translate) | 320ms ease-out, 40ms stagger |
| Card hover | micro-lift (L1→L2 elevation) + border darken | 160ms |
| Buttons | active `scale(0.98)` inset press | 90ms |
| Modal (Squad Application) | scale-in 0.96→1 + backdrop fade | 220ms |
| Toast | slide-up + settle | 240ms |
| Countdown badge | subtle pulse when <24h to deadline | 2s loop |
| Skeleton loaders | shimmer sweep across bento cells | 1.4s loop |
| BottomNav FAB | pop-in on mount | 280ms spring-ish |
| Page transitions | cross-fade + 8px rise | 200ms |

---

## 7. Accessibility & Responsiveness (Phase 5 audit targets)

- Mobile-first; touch targets ≥ 44px; BottomNav respects safe-area insets.
- Ink-on-paper contrast is extreme (≥ 12:1) — maintain for all body/label pairs; verify mint/amber badge text ≥ 4.5:1.
- Keyboard-navigable modals/filters with visible focus ring (1px offset `#141413`, per design system).
- Verify every screen at 360px / 768px / 1280px against Stitch references.
