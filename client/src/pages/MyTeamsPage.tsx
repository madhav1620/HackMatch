import { Link } from "react-router-dom";
import { useMyRequests, useMyTeams, useReviewRequest } from "../hooks/useTeams";
import { Badge, Button, EmptyState, Section } from "../components/ui";
import { ContactReveal } from "../components/features/teams/ContactReveal";
import { JoinRequestRow } from "../components/features/teams/JoinRequestRow";
import { roleLabel } from "../lib/format";

/** My Teams — squads you lead or build with, plus applications awaiting review. */
export default function MyTeamsPage() {
  const { data, isLoading, isError, error } = useMyTeams();
  const requests = useMyRequests();
  const review = useReviewRequest();

  const teams = data?.items ?? [];
  const incoming = requests.data?.incoming ?? [];

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-28 rounded-xl" />
        <div className="skeleton h-44 rounded-xl" />
      </div>
    );
  }

  if (isError) {
    return <EmptyState eyebrow="Error" title="Couldn't load your squads" hint={(error as Error)?.message} />;
  }

  return (
    <div className="animate-fade-up space-y-5">
      <header>
        <p className="label-caps text-ink-muted">Team matchmaking</p>
        <h1 className="font-display mt-1 text-2xl font-semibold">My squads</h1>
        <p className="text-ink-muted mt-1 text-sm">
          Squads you lead or have joined, plus every application waiting on your review.
        </p>
      </header>

      {incoming.length > 0 && (
        <Section eyebrow="// Applications to review" title={`${incoming.length} pending`}>
          <div className="space-y-3">
            {incoming.map((r) => (
              <JoinRequestRow
                key={r.id}
                request={r}
                teamLabel={r.team ? `${r.team.name} · ${r.team.hackathon.name}` : undefined}
                busy={review.isPending}
                onAccept={(req) => review.mutate({ requestId: req.id, status: "ACCEPTED" })}
                onDecline={(req) => review.mutate({ requestId: req.id, status: "DECLINED" })}
              />
            ))}
          </div>
        </Section>
      )}

      {teams.length === 0 ? (
        <EmptyState
          eyebrow="No squads yet"
          title="You're not on a squad"
          hint="Browse a hackathon's matchmaking board and request to join a recruiting squad — or post your own requirement."
        >
          <Link to="/">
            <Button variant="accent">Find a hackathon</Button>
          </Link>
        </EmptyState>
      ) : (
        <div className="space-y-4">
          {teams.map((t) => (
            <section key={t.id} className="border-hairline bg-surface lift rounded-xl border p-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <h2 className="font-display truncate text-base font-semibold">{t.name}</h2>
                  <p className="label-mono-sm text-ink-muted mt-0.5">
                    {t.track ?? roleLabel(t.myRole ?? "OTHER")} · {t.hackathon.name}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {t.isLeader ? (
                    <Badge tone="accent" caps={false}>You lead</Badge>
                  ) : (
                    <Badge tone="neutral" caps={false}>{roleLabel(t.myRole ?? "OTHER")}</Badge>
                  )}
                  <Badge tone={t.openSlots > 0 ? "mint" : "neutral"} caps={false}>
                    {t.filledSlots}/{t.slotsTotal} filled
                  </Badge>
                </div>
              </div>

              <p className="text-ink-muted mt-3 line-clamp-2 text-sm leading-6">{t.description}</p>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Link to={`/teams/${t.id}`} className="press">
                  <Button variant="outline" size="sm">Open squad</Button>
                </Link>
                {t.openSlots > 0 && (
                  <Link to={`/hackathons/${t.hackathon.id}`} className="press label-mono-sm text-ink-muted underline">
                    {t.openSlots} open slot{t.openSlots === 1 ? "" : "s"} — invite more
                  </Link>
                )}
              </div>

              {t.contact && (
                <div className="mt-4">
                  <ContactReveal contact={t.contact} note="Your squad's Instant Connect channel." />
                </div>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
