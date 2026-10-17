import { Rocket, Users, CalendarSearch, Sparkles } from "lucide-react";

/**
 * Phase-1 scaffold shell — proves the Stitch token layer + fonts + icons render.
 * Real routes land in Phase 2/3 (feed, boards, profile, auth).
 */
export default function App() {
  return (
    <div className="bg-dotmatrix min-h-screen">
      <header className="border-hairline border-b bg-surface">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between px-4 py-3 md:px-6">
          <div className="flex items-center gap-2">
            <Rocket className="text-accent h-5 w-5" aria-hidden />
            <span className="label-caps text-ink">HackMatch</span>
          </div>
          <span className="label-mono-sm text-ink-muted">PHASE 1 · SCAFFOLD</span>
        </div>
      </header>

      <main className="mx-auto max-w-[1280px] px-4 py-10 md:px-6">
        <p className="label-caps text-ink-muted">College Hackathon Team Finder</p>
        <h1 className="text-ink mt-2 text-3xl leading-9 font-bold tracking-tight md:text-4xl md:leading-10">
          Discover hackathons.
          <br />
          Find your squad.
        </h1>
        <p className="text-ink-muted mt-4 max-w-xl text-base leading-6">
          Architecture, Stitch design system, and the full token layer are in place. Next up:
          database &amp; authentication (Phase 2).
        </p>

        <div className="stagger mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" style={{ "--stagger": 0 } as React.CSSProperties}>
          {[
            { icon: CalendarSearch, title: "Discovery Feed", body: "Hackathon cards with mono countdowns, filters, bookmarks." },
            { icon: Users, title: "Matchmaking Board", body: "Teams recruiting + solo builders, skill-tag filtering." },
            { icon: Sparkles, title: "Instant Connect", body: "Join requests → Discord / WhatsApp / Email handoff." },
          ].map(({ icon: Icon, title, body }, i) => (
            <section
              key={title}
              className="lift border-hairline bg-surface rounded-xl border p-6"
              style={{ "--stagger": i + 1 } as React.CSSProperties}
            >
              <Icon className="text-accent h-5 w-5" aria-hidden />
              <h2 className="mt-3 text-lg leading-6 font-semibold">{title}</h2>
              <p className="text-ink-muted mt-2 text-sm leading-5">{body}</p>
            </section>
          ))}
        </div>

        <p className="label-mono-sm text-ink-muted mt-10">
          tokens: Tactile Editorial Minimalist · fonts: Plus Jakarta Sans / Inter / JetBrains Mono
        </p>
      </main>
    </div>
  );
}
