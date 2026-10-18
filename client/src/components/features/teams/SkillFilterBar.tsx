import { SlidersHorizontal, X } from "lucide-react";
import { Button, Chip } from "../../ui";
import { roleLabel } from "../../../lib/format";

const ROLE_FILTERS = ["FRONTEND", "BACKEND", "AIML", "UIUX", "DEVOPS", "DATA"];

/**
 * Matchmaking board filters — role + skill chips (OR match) and an
 * "open slots only" switch. Mirrors the filter rhythm of the discovery feed.
 */
export function SkillFilterBar({
  skillOptions,
  activeSkills,
  onToggleSkill,
  activeRole,
  onRole,
  openOnly,
  onOpenOnly,
  onClear,
}: {
  skillOptions: string[];
  activeSkills: string[];
  onToggleSkill: (skill: string) => void;
  activeRole: string;
  onRole: (role: string) => void;
  openOnly: boolean;
  onOpenOnly: (v: boolean) => void;
  onClear: () => void;
}) {
  const hasFilters = activeSkills.length > 0 || Boolean(activeRole) || openOnly;

  return (
    <section className="border-hairline bg-surface rounded-xl border p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="label-caps text-ink-muted inline-flex items-center gap-1.5">
          <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden />
          Filter the board
        </span>
        {hasFilters && (
          <Button size="sm" variant="ghost" className="ml-auto" onClick={onClear}>
            <X className="h-3.5 w-3.5" aria-hidden />
            Clear
          </Button>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {ROLE_FILTERS.map((r) => (
          <Chip key={r} active={activeRole === r} onClick={() => onRole(activeRole === r ? "" : r)}>
            {roleLabel(r)}
          </Chip>
        ))}
        <Chip active={openOnly} onClick={() => onOpenOnly(!openOnly)} title="Hide squads with a full roster">
          <span aria-hidden>⚡</span> Open slots only
        </Chip>
      </div>

      {skillOptions.length > 0 && (
        <>
          <p className="label-caps text-ink-muted mt-4 mb-2">Skills needed</p>
          <div className="flex flex-wrap gap-1.5">
            {skillOptions.map((s) => (
              <Chip key={s} active={activeSkills.includes(s)} onClick={() => onToggleSkill(s)}>
                {s}
              </Chip>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
