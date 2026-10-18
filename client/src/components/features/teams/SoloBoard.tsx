import { useState } from "react";
import { Chip, EmptyState } from "../../ui";
import { useSoloPosts } from "../../../hooks/useTeams";
import { SoloBuilderCard } from "./SoloBuilderCard";
import { LookingForTeamButton } from "./LookingForTeam";

/** Solo builders ("Looking for Team") board for one hackathon. */
export function SoloBoard({ hackathonId, hackathonName }: { hackathonId: string; hackathonName: string }) {
  const [skills, setSkills] = useState<string[]>([]);
  const { data, isLoading, isError, error } = useSoloPosts(hackathonId, {
    skills: skills.join(",") || undefined,
    limit: 50,
  });

  const items = data?.items ?? [];
  const skillOptions = Array.from(new Set(items.flatMap((p) => p.user.skills))).slice(0, 12);

  const toggleSkill = (skill: string) =>
    setSkills((prev) => (prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]));

  return (
    <div className="space-y-4">
      <LookingForTeamButton hackathonId={hackathonId} hackathonName={hackathonName} mine={data?.mine ?? null} />

      {skillOptions.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="label-caps text-ink-muted mr-1">Skills</span>
          {skillOptions.map((s) => (
            <Chip key={s} active={skills.includes(s)} onClick={() => toggleSkill(s)}>
              {s}
            </Chip>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton h-44 rounded-xl" />
          ))}
        </div>
      ) : isError ? (
        <EmptyState
          eyebrow="Error"
          title="Couldn't load the solo board"
          hint={(error as Error)?.message ?? "Try again in a moment."}
        />
      ) : items.length === 0 ? (
        <EmptyState
          eyebrow="Solo board"
          title="No solo builders here yet"
          hint="Post a one-line pitch and recruiting squads can find you — or browse the matchmaking board for open slots."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {items.map((post) => (
            <SoloBuilderCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
