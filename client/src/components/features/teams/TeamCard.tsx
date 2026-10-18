import { Link } from "react-router-dom";
import { ArrowRight, Zap } from "lucide-react";
import type { Team } from "../../../api/types";
import { Badge, Button } from "../../ui";
import { initials, roleLabel } from "../../../lib/format";

/**
 * Matchmaking board card — mirrors `design-reference/board-light.html`:
 * squad name + filled badge, track line, confirmed-teammate cells, and the
 * signature **dashed open-slot cells** for every unfilled seat.
 */
export function TeamCard({
  team,
  onApply,
  showHackathon = false,
}: {
  team: Team;
  onApply?: (team: Team) => void;
  showHackathon?: boolean;
}) {
  const openCount = Math.max(0, team.openSlots);
  const roles = team.requiredRoles.length > 0 ? team.requiredRoles : ["OTHER"];
  const openings = Array.from({ length: openCount }, (_, i) => ({
    role: roles[i % roles.length],
    skills: team.requiredSkills,
  }));

  const pending = team.myRequest?.status === "PENDING";

  return (
    <article className="animate-fade-up border-hairline bg-surface lift flex flex-col rounded-xl border p-5">
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-display truncate text-base leading-6 font-semibold">
            Squad &ldquo;{team.name}&rdquo;
          </h3>
          <p className="label-mono-sm text-ink-muted mt-0.5">
            {team.track ?? roleLabel(team.requiredRoles[0] ?? "OTHER")}
            {showHackathon && <> · {team.hackathon.name}</>}
          </p>
        </div>
        <Badge tone={team.isRecruiting && openCount > 0 ? "mint" : "neutral"} caps={false}>
          {team.filledSlots}/{team.slotsTotal} Filled
        </Badge>
      </header>

      <p className="text-ink-muted mt-3 line-clamp-3 text-sm leading-6">{team.description}</p>

      {/* confirmed teammates */}
      <p className="label-caps text-ink-muted mt-4">Confirmed teammates</p>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        {team.members.map((m) => (
          <div key={m.userId} className="border-hairline bg-surface-sunk flex items-center gap-2.5 rounded-lg border px-3 py-2.5">
            <span
              className="border-hairline label-code grid h-8 w-8 shrink-0 place-items-center rounded-full border bg-surface"
              aria-hidden
            >
              {initials(m.name)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">
                {m.name}
                {m.isLeader && <span className="label-mono-sm text-ink-muted"> · Lead</span>}
              </p>
              <p className="label-mono-sm text-ink-muted truncate">{roleLabel(m.role)}</p>
            </div>
          </div>
        ))}

        {/* signature dashed open-slot cells */}
        {openings.map((slot, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onApply?.(team)}
            disabled={!onApply || pending || team.isMember || !team.isRecruiting}
            className="slot-dashed rounded-lg px-3 py-2.5 text-left disabled:cursor-default"
          >
            <p className="text-ink-muted text-sm font-medium">+ Need {roleLabel(slot.role)}</p>
            <p className="label-mono-sm text-ink-muted mt-0.5 truncate">
              {slot.skills.length > 0 ? slot.skills.join(" · ") : "Any strong builder"}
            </p>
          </button>
        ))}
      </div>

      <footer className="mt-auto flex flex-wrap items-center gap-2 pt-4">
        <Badge tone={openCount === 1 ? "amber" : team.isRecruiting ? "mint" : "neutral"} caps={false}>
          <Zap className="h-3 w-3" aria-hidden />
          {team.isRecruiting && openCount > 0 ? `${openCount} spot${openCount === 1 ? "" : "s"} left` : openCount > 0 ? "Recruitment paused" : "Squad complete"}
        </Badge>

        <div className="ml-auto flex items-center gap-2">
          <Link to={`/teams/${team.id}`} className="press label-mono-sm text-ink-muted underline">
            View
          </Link>
          {team.isMember ? (
            <Badge tone="mint" caps={false}>You&rsquo;re on this squad</Badge>
          ) : pending ? (
            <Badge tone="amber" caps={false}>Application pending</Badge>
          ) : team.isRecruiting && openCount > 0 && onApply ? (
            <Button variant="accent" size="sm" onClick={() => onApply(team)}>
              Request to join
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Button>
          ) : (
            <Badge tone="neutral" caps={false}>Not recruiting</Badge>
          )}
        </div>
      </footer>
    </article>
  );
}
