import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Users } from "lucide-react";
import { useHackathon } from "../hooks/useHackathons";
import { Button, CountdownBadge, EmptyState, Section, Tabs, Tag } from "../components/ui";
import { BookmarkButton } from "../components/features/hackathons/BookmarkButton";
import { HackathonLogo } from "../components/features/hackathons/HackathonLogo";
import { TeamsBoard } from "../components/features/teams/HackathonBoard";
import { SoloBoard } from "../components/features/teams/SoloBoard";
import { formatDateTime, formatPrize, modeLabel } from "../lib/format";

/**
 * Hackathon detail — mirrors `design-reference/hackathon-detail.html`:
 * hero + spec grid (mode / prize / team size / live countdown), then
 * ABOUT · TEAMS · SCHEDULE tabs.
 */
export default function HackathonDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: h, isLoading, isError, error } = useHackathon(id);
  const [tab, setTab] = useState("about");
  const [copied, setCopied] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-6 w-24 rounded-sm" />
        <div className="skeleton h-40 rounded-xl" />
        <div className="skeleton h-64 rounded-xl" />
      </div>
    );
  }

  if (isError || !h) {
    return (
      <EmptyState
        eyebrow="404"
        title="Hackathon not found"
        hint={(error as Error)?.message ?? "It may have been removed by its organizer."}
      >
        <Link to="/">
          <Button variant="outline">← Back to discovery</Button>
        </Link>
      </EmptyState>
    );
  }

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="animate-fade-up space-y-5">
      {/* top rail */}
      <div className="flex items-center gap-3">
        <Link to="/" className="press label-mono-sm inline-flex items-center gap-1.5 underline">
          <span aria-hidden>←</span> Discover
        </Link>
        <div className="ml-auto flex items-center gap-2">
          <BookmarkButton hackathon={h} />
          <Button variant="outline" size="sm" onClick={share}>
            {copied ? "Copied ✓" : "Share"}
          </Button>
        </div>
      </div>

      {/* hero */}
      <section className="rounded-xl border border-hairline bg-surface p-4 md:p-6">
        <div className="flex flex-wrap items-start gap-4">
          <HackathonLogo name={h.name} url={h.logoUrl} />
          <div className="min-w-0 flex-1">
            <span className="label-caps text-ink-muted">{modeLabel(h.mode)} · {h.location ?? "Global / remote"}</span>
            <h1 className="font-display mt-1 text-2xl leading-7 font-semibold md:text-3xl md:leading-9">{h.name}</h1>
            {h.tagline && <p className="text-ink-muted mt-1 text-sm">{h.tagline}</p>}
          </div>
        </div>

        {/* spec grid */}
        <dl className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-hairline bg-hairline lg:grid-cols-4">
          <SpecCell label="Mode" value={modeLabel(h.mode)} sub={h.location ?? "Remote"} />
          <SpecCell label="Prize pool" value={formatPrize(h.prizePool)} sub="All tracks combined" />
          <SpecCell label="Team size" value={`${h.minTeamSize}–${h.maxTeamSize}`} sub="Cross-school OK" />
          <SpecCell
            label="Registration closes"
            value={new Date(h.registrationDeadline).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
            })}
            sub={formatDateTime(h.registrationDeadline)}
          />
        </dl>

        {/* live countdown + CTAs */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <CountdownBadge target={h.registrationDeadline} label="Reg. closes in" />
          <Button variant="accent" className="ml-auto" onClick={() => setTab("teams")}>
            <Users className="h-4 w-4" aria-hidden />
            Find a team
          </Button>
          <BookmarkButton hackathon={h} withLabel />
        </div>
      </section>

      {/* tabs */}
      <div>
        <Tabs
          items={[
            { id: "about", label: "About" },
            { id: "teams", label: "Teams", count: h.teamCount },
            { id: "solo", label: "Solo builders", count: h.soloPostCount },
            { id: "schedule", label: "Schedule" },
          ]}
          active={tab}
          onChange={setTab}
        />

        <div className="space-y-4 pt-4">
          {tab === "about" && (
            <>
              <Section eyebrow="// 01 About this hackathon">
                <p className="text-sm leading-6 whitespace-pre-line">{h.description}</p>
              </Section>
              <Section eyebrow="// 02 Tracks" title={h.techTags.length ? `${h.techTags.length} categories` : "Tracks"}>
                {h.techTags.length ? (
                  <div className="flex flex-wrap gap-1.5">
                    {h.techTags.map((t) => (
                      <Tag key={t}>[ {t} ]</Tag>
                    ))}
                  </div>
                ) : (
                  <p className="text-ink-muted text-sm">Tracks are announced closer to the event.</p>
                )}
              </Section>
            </>
          )}

          {tab === "teams" && (
            <TeamsBoard hackathonId={h.id} hackathonName={h.name} maxTeamSize={h.maxTeamSize} />
          )}

          {tab === "solo" && <SoloBoard hackathonId={h.id} hackathonName={h.name} />}

          {tab === "schedule" && (
            <Section eyebrow="// 04 Schedule">
              <ol className="space-y-3">
                <ScheduleRow iso={h.registrationDeadline} label="Registration closes" />
                <ScheduleRow iso={h.startDate} label="Hackathon begins" />
                <ScheduleRow iso={h.endDate} label="Submissions due" />
              </ol>
            </Section>
          )}
        </div>
      </div>
    </div>
  );
}

function SpecCell({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-surface p-4">
      <dt className="label-caps text-ink-muted">{label}</dt>
      <dd className="font-display mt-1 text-base leading-6 font-semibold">{value}</dd>
      {sub && <dd className="label-mono-sm text-ink-muted mt-0.5">{sub}</dd>}
    </div>
  );
}

/** Schedule row — mono timestamp + label, hairline separated (per the detail screen). */
function ScheduleRow({ iso, label }: { iso: string; label: string }) {
  return (
    <li className="border-hairline-subtle flex flex-wrap items-baseline gap-x-4 gap-y-1 border-b py-3 last:border-b-0">
      <span className="label-code text-ink-muted w-40 shrink-0">{formatDateTime(iso)}</span>
      <span className="text-sm">{label}</span>
    </li>
  );
}
