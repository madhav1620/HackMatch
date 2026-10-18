import { useState } from "react";
import { Megaphone, Plus, Users } from "lucide-react";
import type { PrimaryRole, Team } from "../../../api/types";
import { Button, EmptyState } from "../../ui";
import { useMyTeams, useTeamBoard } from "../../../hooks/useTeams";
import { TeamCard } from "./TeamCard";
import { SkillFilterBar } from "./SkillFilterBar";
import { SquadApplicationModal } from "./SquadApplicationModal";
import { CreateSquadModal } from "./CreateSquadModal";

/**
 * The per-hackathon matchmaking board: recruiting squads with dashed open-slot
 * cells, role + skill filters, and the "Post a Team Requirement" entry point.
 */
export function TeamsBoard({
  hackathonId,
  hackathonName,
  maxTeamSize,
}: {
  hackathonId: string;
  hackathonName: string;
  maxTeamSize: number;
}) {
  const [skills, setSkills] = useState<string[]>([]);
  const [role, setRole] = useState("");
  const [openOnly, setOpenOnly] = useState(false);
  const [applying, setApplying] = useState<Team | null>(null);
  const [creating, setCreating] = useState(false);

  const { data, isLoading, isError, error } = useTeamBoard(hackathonId, {
    skills: skills.join(",") || undefined,
    role: (role || undefined) as PrimaryRole | undefined,
    openOnly: openOnly || undefined,
    limit: 50,
  });
  const mine = useMyTeams();

  const items = data?.items ?? [];
  const skillOptions = Array.from(new Set(items.flatMap((t) => t.requiredSkills))).slice(0, 12);
  const alreadyLeads = (mine.data?.items ?? []).some((t) => t.isLeader && t.hackathon.id === hackathonId);
  const hasFilters = skills.length > 0 || Boolean(role) || openOnly;

  const toggleSkill = (skill: string) =>
    setSkills((prev) => (prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]));

  const clear = () => {
    setSkills([]);
    setRole("");
    setOpenOnly(false);
  };

  return (
    <div className="space-y-4">
      {/* stats + primary CTA */}
      <section className="border-hairline bg-surface flex flex-wrap items-center gap-2 rounded-xl border p-4">
        <Users className="text-ink-muted h-4 w-4 shrink-0" aria-hidden />
        <span className="label-caps text-ink-muted">Matchmaking board</span>
        <span className="label-mono-sm text-ink-muted">
          {data
            ? `${data.recruitingTeams} recruiting · ${data.openSlots} open slot${data.openSlots === 1 ? "" : "s"}`
            : "Loading…"}
        </span>
        <Button
          variant="ink"
          size="sm"
          className="ml-auto"
          disabled={alreadyLeads}
          title={alreadyLeads ? "You already lead a squad in this hackathon" : undefined}
          onClick={() => setCreating(true)}
        >
          <Plus className="h-3.5 w-3.5" aria-hidden />
          Post a team requirement
        </Button>
      </section>

      <SkillFilterBar
        skillOptions={skillOptions}
        activeSkills={skills}
        onToggleSkill={toggleSkill}
        activeRole={role}
        onRole={setRole}
        openOnly={openOnly}
        onOpenOnly={setOpenOnly}
        onClear={clear}
      />

      {isLoading ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-56 rounded-xl" />
          ))}
        </div>
      ) : isError ? (
        <EmptyState
          eyebrow="Error"
          title="Couldn't load the board"
          hint={(error as Error)?.message ?? "Try again in a moment."}
        />
      ) : items.length === 0 ? (
        <EmptyState
          eyebrow="No squads yet"
          title={hasFilters ? "No squads match these filters" : "Be the first squad on this hackathon"}
          hint={
            hasFilters
              ? "Loosen the role or skill filters to see more recruiting squads."
              : "Post your idea and the slots you need — recruiting squads appear here with dashed open-slot cells."
          }
        >
          {hasFilters ? (
            <Button variant="outline" onClick={clear}>
              Clear filters
            </Button>
          ) : (
            <Button variant="accent" onClick={() => setCreating(true)}>
              <Plus className="h-4 w-4" aria-hidden />
              Post a team requirement
            </Button>
          )}
        </EmptyState>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {items.map((team) => (
            <TeamCard key={team.id} team={team} onApply={setApplying} />
          ))}
        </div>
      )}

      <p className="label-mono-sm text-ink-muted">
        <Megaphone className="mr-1 inline h-3 w-3" aria-hidden />
        Squad contacts stay private. Instant Connect reveals the Discord / WhatsApp / Email once a lead accepts you.
      </p>

      <SquadApplicationModal open={Boolean(applying)} team={applying} onClose={() => setApplying(null)} />
      <CreateSquadModal
        open={creating}
        hackathon={{ id: hackathonId, name: hackathonName, maxTeamSize }}
        onClose={() => setCreating(false)}
      />
    </div>
  );
}
