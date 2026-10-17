import { Link } from "react-router-dom";
import { ArrowRight, MapPin, Users } from "lucide-react";
import type { Hackathon } from "../../../api/types";
import { Badge, Chip, CountdownBadge, Tag } from "../../ui";
import {
  formatCompactPrize,
  formatDateRange,
  initials,
  modeLabel,
  orgTypeLabel,
} from "../../../lib/format";
import { BookmarkButton } from "./BookmarkButton";

/**
 * Discovery feed card — mirrors `design-reference/feed-light.html`:
 * logo cell · mode/org caption · live mono countdown · prize pool · tech pills ·
 * squad activity · find-teammates CTA · bookmark.
 */
export function HackathonCard({ hackathon, index = 0 }: { hackathon: Hackathon; index?: number }) {
  const h = hackathon;
  const closingSoon = !new Date(h.registrationDeadline).getTime() ? false : new Date(h.registrationDeadline).getTime() - Date.now() < 7 * 864e5;

  return (
    <article
      className="lift animate-fade-up relative rounded-xl border border-hairline bg-surface p-5"
      style={{ ["--stagger" as string]: String(index + 1) }}
    >
      {/* row 1 — logo, identity, bookmark */}
      <div className="flex items-start gap-3">
        <div className="border-hairline bg-surface-sunk flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border">
          <span className="label-code text-ink-muted">{initials(h.name)}</span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="label-caps text-ink-muted">
              {modeLabel(h.mode)}
              {h.location ? ` · ${h.location}` : ""}
            </span>
            <Badge tone={h.orgType === "INTERNAL" ? "link" : "neutral"}>{orgTypeLabel(h.orgType)}</Badge>
            {closingSoon && <Badge tone="amber">Closing soon</Badge>}
          </div>

          <h3 className="font-display mt-1.5 text-lg leading-6 font-semibold">
            {/* Stretched link — keeps the whole card clickable without nesting a button inside an anchor. */}
            <Link className="after:absolute after:inset-0 hover:underline" to={`/hackathons/${h.id}`}>
              {h.name}
            </Link>
          </h3>

          <p className="label-caps text-ink-muted mt-1">
            {formatDateRange(h.startDate, h.endDate)} · {h.minTeamSize}–{h.maxTeamSize} BUILDERS
          </p>
        </div>

        <BookmarkButton hackathon={h} />
      </div>

      {h.tagline && <p className="text-ink-muted mt-3 line-clamp-2 text-sm leading-6">{h.tagline}</p>}

      {/* row 2 — telemetry */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <CountdownBadge target={h.registrationDeadline} compact />
        <span className="border-hairline label-code inline-flex items-center rounded-sm border bg-surface px-2 py-1">
          {formatCompactPrize(h.prizePool)} pool
        </span>
      </div>

      {/* row 3 — tech pills */}
      {h.techTags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {h.techTags.slice(0, 5).map((t) => (
            <Tag key={t}>{t}</Tag>
          ))}
        </div>
      )}

      {/* row 4 — squad activity + CTA */}
      <div className="border-hairline mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
        <div className="text-ink-muted flex flex-wrap items-center gap-3">
          <span className="label-mono-sm inline-flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" aria-hidden />
            {h.teamCount} {h.teamCount === 1 ? "squad" : "squads"} recruiting
          </span>
          {h.soloPostCount > 0 && (
            <span className="label-mono-sm inline-flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" aria-hidden />
              {h.soloPostCount} solo {h.soloPostCount === 1 ? "builder" : "builders"}
            </span>
          )}
        </div>

        <div className="relative z-10 flex items-center gap-2">
          <Link to={`/hackathons/${h.id}`} className="press label-mono-sm inline-flex items-center gap-1 underline">
            View event
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>
      </div>

      {h.status !== "PUBLISHED" && (
        <div className="mt-3">
          <Chip as="span" active>
            {h.status}
          </Chip>
        </div>
      )}
    </article>
  );
}
