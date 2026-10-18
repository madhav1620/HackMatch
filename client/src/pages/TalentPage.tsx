import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Users } from "lucide-react";
import { useHackathons } from "../hooks/useHackathons";
import { Button, Chip, EmptyState } from "../components/ui";
import { SoloBoard } from "../components/features/teams/SoloBoard";

/**
 * Talent directory — the "Looking for Team" boards, one hackathon at a time.
 * Pick an event to see everyone hunting for a squad there.
 */
export default function TalentPage() {
  const { data, isLoading } = useHackathons({ sort: "deadline", limit: 50 });
  const [selected, setSelected] = useState("");

  const items = data?.items ?? [];
  const current = items.find((h) => h.id === selected) ?? items[0];

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-6 w-40 rounded-sm" />
        <div className="skeleton h-24 rounded-xl" />
        <div className="skeleton h-44 rounded-xl" />
      </div>
    );
  }

  if (!current) {
    return (
      <EmptyState eyebrow="Talent" title="No hackathons to browse yet" hint="Solo-builder boards appear once hackathons are published.">
        <Link to="/">
          <Button variant="accent">Back to discovery</Button>
        </Link>
      </EmptyState>
    );
  }

  return (
    <div className="animate-fade-up space-y-5">
      <header>
        <p className="label-caps text-ink-muted inline-flex items-center gap-1.5">
          <Users className="h-3 w-3" aria-hidden />
          Talent directory
        </p>
        <h1 className="font-display mt-1 text-2xl font-semibold">Solo builders</h1>
        <p className="text-ink-muted mt-1 text-sm">
          People hunting for a squad. Post your own one-line pitch, or jump into a hackathon&rsquo;s matchmaking board.
        </p>
      </header>

      <section className="border-hairline bg-surface rounded-xl border p-4">
        <label className="block">
          <span className="label-caps text-ink-muted mb-1.5 block">Hackathon</span>
          <select
            className="border-hairline focus:border-ink w-full rounded-lg border bg-surface px-3 py-2 text-sm outline-none"
            value={current.id}
            onChange={(e) => setSelected(e.target.value)}
          >
            {items.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </select>
        </label>

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {items.slice(0, 5).map((h) => (
            <Chip key={h.id} active={h.id === current.id} onClick={() => setSelected(h.id)}>
              {h.name}
            </Chip>
          ))}
          <Link to={`/hackathons/${current.id}`} className="press label-mono-sm text-ink-muted ml-auto inline-flex items-center gap-0.5 underline">
            Matchmaking board
            <ArrowRight className="h-3 w-3" aria-hidden />
          </Link>
        </div>
      </section>

      <SoloBoard hackathonId={current.id} hackathonName={current.name} />
    </div>
  );
}
