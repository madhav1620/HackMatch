import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useCancelRequest, useMyRequests, useReviewRequest } from "../hooks/useTeams";
import { Button, EmptyState, Section } from "../components/ui";
import { JoinRequestRow } from "../components/features/teams/JoinRequestRow";

/**
 * My Requests — applications you've sent (withdraw while pending) and the ones
 * squad leads are waiting to review. Accepted applications unlock Instant Connect.
 */
export default function MyRequestsPage() {
  const { data, isLoading, isError, error } = useMyRequests();
  const review = useReviewRequest();
  const cancel = useCancelRequest();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-32 rounded-xl" />
        <div className="skeleton h-32 rounded-xl" />
      </div>
    );
  }

  if (isError || !data) {
    return <EmptyState eyebrow="Error" title="Couldn't load your requests" hint={(error as Error)?.message} />;
  }

  return (
    <div className="animate-fade-up space-y-5">
      <header>
        <p className="label-caps text-ink-muted">Team matchmaking</p>
        <h1 className="font-display mt-1 text-2xl font-semibold">My requests</h1>
        <p className="text-ink-muted mt-1 text-sm">
          Everything you&rsquo;ve sent, and every application waiting on you. Instant Connect unlocks on acceptance.
        </p>
      </header>

      <Section eyebrow="// Incoming — waiting on you" title={`${data.incoming.length} pending`}>
        {data.incoming.length === 0 ? (
          <p className="text-ink-muted text-sm">
            Nothing waiting on you. Applications appear here when someone applies to a squad you lead.
          </p>
        ) : (
          <div className="space-y-3">
            {data.incoming.map((r) => (
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
        )}
      </Section>

      <Section eyebrow="// Applications I sent" title={`${data.outgoing.length} sent`}>
        {data.outgoing.length === 0 ? (
          <EmptyState
            eyebrow="Nothing sent"
            title="No applications yet"
            hint="Open a hackathon's matchmaking board and request to join a squad with an open slot."
          >
            <Link to="/">
              <Button variant="accent">
                Browse hackathons
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Button>
            </Link>
          </EmptyState>
        ) : (
          <div className="space-y-3">
            {data.outgoing.map((r) => (
              <div key={r.id} className="space-y-2">
                <JoinRequestRow
                  request={r}
                  teamLabel={r.team ? `${r.team.name} · ${r.team.hackathon.name}` : undefined}
                  busy={cancel.isPending}
                  onCancel={r.status === "PENDING" ? (req) => cancel.mutate(req.id) : undefined}
                />
                {r.team && (
                  <div className="sm:pl-12">
                    <Link to={`/teams/${r.team.id}`} className="press label-mono-sm text-ink-muted underline">
                      Open squad →
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}
