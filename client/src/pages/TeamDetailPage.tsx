import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { LogOut, Trash2, UserPlus, Users } from "lucide-react";
import { useDeleteTeam, useReviewRequest, useTeam } from "../hooks/useTeams";
import { Badge, Button, EmptyState, OpenSlot, Section, Tag } from "../components/ui";
import { ContactReveal } from "../components/features/teams/ContactReveal";
import { JoinRequestRow } from "../components/features/teams/JoinRequestRow";
import { SquadApplicationModal } from "../components/features/teams/SquadApplicationModal";
import { initials, roleLabel } from "../lib/format";

/**
 * Squad detail — full roster, the dashed open-slot cells, Instant Connect for
 * members, and the squad lead's application review queue.
 */
export default function TeamDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: team, isLoading, isError, error } = useTeam(id);
  const remove = useDeleteTeam();
  const review = useReviewRequest();
  const [applying, setApplying] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-5 w-28 rounded-sm" />
        <div className="skeleton h-40 rounded-xl" />
        <div className="skeleton h-56 rounded-xl" />
      </div>
    );
  }

  if (isError || !team) {
    return (
      <EmptyState eyebrow="404" title="Squad not found" hint={(error as Error)?.message ?? "It may have been disbanded."}>
        <Link to="/">
          <Button variant="outline">← Back to discovery</Button>
        </Link>
      </EmptyState>
    );
  }

  const roles = team.requiredRoles.length > 0 ? team.requiredRoles : ["OTHER"];
  const openings = Array.from({ length: team.openSlots }, (_, i) => roles[i % roles.length]);

  const onAccept = (requestId: string) => review.mutate({ requestId, status: "ACCEPTED" });
  const onDecline = (requestId: string) => review.mutate({ requestId, status: "DECLINED" });

  const disband = async () => {
    if (!window.confirm(`Disband “${team.name}”? This removes the squad and its applications.`)) return;
    await remove.mutateAsync(team.id);
    navigate(`/hackathons/${team.hackathonId}`);
  };

  return (
    <div className="animate-fade-up space-y-5">
      <div className="flex items-center gap-3">
        <Link to={`/hackathons/${team.hackathonId}`} className="press label-mono-sm inline-flex items-center gap-1.5 underline">
          <span aria-hidden>←</span> {team.hackathon.name}
        </Link>
        {team.isLeader && (
          <Button variant="ghost" size="sm" className="ml-auto" loading={remove.isPending} onClick={disband}>
            <Trash2 className="h-3.5 w-3.5" aria-hidden />
            Disband squad
          </Button>
        )}
      </div>

      <section className="border-hairline bg-surface rounded-xl border p-5">
        <div className="flex flex-wrap items-start gap-4">
          <div className="border-hairline bg-surface-sunk flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border">
            <span className="label-code text-ink-muted">{initials(team.name)}</span>
          </div>
          <div className="min-w-0 flex-1">
            <span className="label-caps text-ink-muted">
              {team.track ?? "Open track"} · {team.hackathon.name}
            </span>
            <h1 className="font-display mt-1 text-2xl leading-7 font-semibold md:text-3xl">{team.name}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={team.filledSlots >= team.slotsTotal ? "neutral" : "mint"} caps={false}>
              <Users className="h-3 w-3" aria-hidden />
              {team.filledSlots}/{team.slotsTotal} filled
            </Badge>
            <Badge tone={team.isRecruiting && team.openSlots > 0 ? "mint" : "neutral"} caps={false}>
              {team.openSlots > 0 ? `${team.openSlots} slot${team.openSlots === 1 ? "" : "s"} open` : "Squad complete"}
            </Badge>
          </div>
        </div>

        <p className="text-ink-muted mt-4 text-sm leading-6">{team.description}</p>

        {team.requiredSkills.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-1.5">
            <span className="label-caps text-ink-muted mr-1">Needs</span>
            {team.requiredSkills.map((s) => (
              <Tag key={s} tone="accent">
                {s}
              </Tag>
            ))}
          </div>
        )}

        {!team.isMember && team.openSlots > 0 && team.myRequest?.status !== "PENDING" && (
          <div className="mt-5">
            <Button variant="accent" onClick={() => setApplying(true)}>
              <UserPlus className="h-4 w-4" aria-hidden />
              {team.myRequest ? "Apply again" : "Request to join"}
            </Button>
          </div>
        )}
        {!team.isMember && team.myRequest?.status === "PENDING" && (
          <p className="label-mono-sm text-ink-muted mt-5">Your application is pending review by the squad lead.</p>
        )}
      </section>

      {team.isMember && team.contact && <ContactReveal contact={team.contact} />}

      <Section eyebrow="// Roster" title={`${team.filledSlots} confirmed`}>
        <div className="grid gap-2 sm:grid-cols-2">
          {team.members.map((m) => (
            <div key={m.userId} className="border-hairline bg-surface-sunk flex items-center gap-3 rounded-lg border px-3 py-3">
              <span className="border-hairline label-code grid h-9 w-9 shrink-0 place-items-center rounded-full border bg-surface" aria-hidden>
                {initials(m.name)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  <Link to={`/profile/${m.userId}`} className="press underline">
                    {m.name}
                  </Link>
                  {m.isLeader && <span className="label-mono-sm text-ink-muted"> · Lead</span>}
                </p>
                <p className="label-mono-sm text-ink-muted truncate">{roleLabel(m.role)}</p>
              </div>
            </div>
          ))}

          {openings.map((role, i) => (
            <OpenSlot key={i}>+ NEED {roleLabel(role).toUpperCase()}</OpenSlot>
          ))}
        </div>
      </Section>

      {team.isLeader && (
        <Section eyebrow="// Applications" title={`${team.pendingRequests.length} pending`}>
          {team.pendingRequests.length === 0 ? (
            <p className="text-ink-muted text-sm">
              No pending applications. Share the squad on Discord or WhatsApp to reach more builders.
            </p>
          ) : (
            <div className="space-y-3">
              {team.pendingRequests.map((r) => (
                <JoinRequestRow
                  key={r.id}
                  request={r}
                  busy={review.isPending}
                  onAccept={(req) => onAccept(req.id)}
                  onDecline={(req) => onDecline(req.id)}
                />
              ))}
            </div>
          )}
        </Section>
      )}

      {team.isMember && !team.isLeader && (
        <p className="label-mono-sm text-ink-muted inline-flex items-center gap-1.5">
          <LogOut className="h-3 w-3" aria-hidden />
          You&rsquo;re a member of this squad — contact the lead to step out.
        </p>
      )}

      <SquadApplicationModal open={applying} team={team} onClose={() => setApplying(false)} />
    </div>
  );
}
