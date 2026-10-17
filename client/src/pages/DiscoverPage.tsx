import { CalendarSearch, Sparkles, Users } from "lucide-react";
import { OpenSlot } from "../components/ui/Tag";

/**
 * Discover — placeholder for the Phase 3 Discovery Hub (feed + filters + bookmarks).
 * Renders inside AppShell; proves the token layer + motion in an authed context.
 */
export default function DiscoverPage() {
  return (
    <div className="animate-fade-up">
      <p className="label-mono-sm text-ink-muted">College Hackathon Team Finder</p>
      <h1 className="mt-1 text-2xl leading-8 font-bold md:text-3xl">
        Discover hackathons. Find your squad.
      </h1>
      <p className="text-ink-muted mt-2 max-w-2xl text-sm">
        Phase 2 complete: college-email onboarding, OTP verification, and your Read.cv-style profile are live.
        Next up — the Discovery Hub feeds this shell.
      </p>

      <div className="stagger mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { icon: CalendarSearch, title: "Discovery Feed", body: "Hackathon cards with mono countdowns, filters, bookmarks.", phase: "Phase 3" },
          { icon: Users, title: "Matchmaking Board", body: "Teams recruiting + solo builders, skill-tag filtering.", phase: "Phase 4" },
          { icon: Sparkles, title: "Instant Connect", body: "Join requests → Discord / WhatsApp / Email handoff.", phase: "Phase 4" },
        ].map(({ icon: Icon, title, body, phase }, i) => (
          <section
            key={title}
            className="lift border-hairline bg-surface rounded-xl border p-6"
            style={{ "--stagger": i + 1 } as React.CSSProperties}
          >
            <div className="flex items-center justify-between">
              <Icon className="text-accent h-5 w-5" aria-hidden />
              <span className="label-caps text-ink-muted border-hairline rounded-sm border px-2 py-1">{phase}</span>
            </div>
            <h2 className="mt-3 text-lg leading-6 font-semibold">{title}</h2>
            <p className="text-ink-muted mt-2 text-sm leading-5">{body}</p>
          </section>
        ))}
      </div>

      <div className="mt-6 max-w-xl">
        <OpenSlot>// feed loads here once hackathon data is seeded via API (Phase 3)</OpenSlot>
      </div>
    </div>
  );
}
