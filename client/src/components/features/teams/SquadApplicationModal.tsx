import { useEffect, useState } from "react";
import { CheckCircle2, Send, ShieldCheck } from "lucide-react";
import type { Commitment, PrimaryRole, Team } from "../../../api/types";
import { Badge, Button, Chip, Modal, Segmented, Tag, Textarea } from "../../ui";
import { commitmentLabel, initials, roleLabel } from "../../../lib/format";
import { useApplyToTeam } from "../../../hooks/useTeams";

const COMMITMENT_OPTIONS: { value: Commitment; label: string }[] = [
  { value: "FULL_SPRINT", label: "Full sprint" },
  { value: "PARTIAL", label: "Partial hours" },
  { value: "FLEXIBLE", label: "Flexible" },
];

const FALLBACK_ROLES: PrimaryRole[] = ["FRONTEND", "BACKEND", "AIML", "UIUX", "DEVOPS", "DATA"];

/**
 * Squad Application Modal — mirrors `design-reference/modal-light.html`:
 * target squad, the vacant slot being applied for, roster breakdown, a
 * 280-char pitch, portfolio link and a commitment window.
 */
export function SquadApplicationModal({
  open,
  team,
  onClose,
}: {
  open: boolean;
  team: Team | null;
  onClose: () => void;
}) {
  const apply = useApplyToTeam();
  const [role, setRole] = useState<PrimaryRole | "">("");
  const [message, setMessage] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [commitment, setCommitment] = useState<Commitment>("FULL_SPRINT");
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!open) return;
    setRole((team?.requiredRoles[0] as PrimaryRole) ?? "");
    setMessage("");
    setPortfolioUrl("");
    setCommitment("FULL_SPRINT");
    setSent(false);
    apply.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, team?.id]);

  if (!team) return null;

  const vacant = team.requiredRoles.length > 0 ? (team.requiredRoles as PrimaryRole[]) : FALLBACK_ROLES;

  const submit = async () => {
    try {
      await apply.mutateAsync({
        teamId: team.id,
        body: {
          message: message.trim() || undefined,
          role: (role || undefined) as PrimaryRole | undefined,
          portfolioUrl: portfolioUrl.trim() || undefined,
          commitment,
        },
      });
      setSent(true);
    } catch {
      /* surfaced below */
    }
  };

  return (
    <Modal open={open} title="Squad application" eyebrow={`Recruiting now · ${team.hackathon.name}`} onClose={onClose} wide>
      {sent ? (
        <div className="py-6 text-center">
          <CheckCircle2 className="text-mint-text mx-auto h-10 w-10" aria-hidden />
          <h3 className="font-display mt-3 text-base font-semibold">Application transmitted to {team.name}</h3>
          <p className="text-ink-muted mx-auto mt-2 max-w-sm text-sm leading-6">
            Your application is private. The squad lead will review it and Instant Connect unlocks the moment you&rsquo;re accepted.
          </p>
          <div className="mt-5 flex justify-center">
            <Button variant="ink" onClick={onClose}>Done</Button>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {/* target squad */}
          <section className="border-hairline bg-surface-sunk rounded-lg border p-4">
            <p className="label-caps text-ink-muted">Target squad</p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <h3 className="font-display text-base font-semibold">{team.name}</h3>
              <Badge tone="neutral" caps={false}>{team.filledSlots}/{team.slotsTotal} Filled</Badge>
              <Badge tone="mint" caps={false}>{team.openSlots} slot{team.openSlots === 1 ? "" : "s"} open</Badge>
            </div>
            <p className="text-ink-muted mt-2 text-sm leading-6">{team.description}</p>
            {team.track && <p className="label-mono-sm text-ink-muted mt-1">{team.track}</p>}
          </section>

          {/* roster breakdown */}
          <section>
            <p className="label-caps text-ink-muted mb-2">Roster breakdown</p>
            <ul className="divide-hairline-subtle divide-y">
              {team.members.map((m) => (
                <li key={m.userId} className="flex items-center gap-3 py-2">
                  <span className="border-hairline label-code grid h-8 w-8 shrink-0 place-items-center rounded-full border" aria-hidden>
                    {initials(m.name)}
                  </span>
                  <span className="text-sm font-medium">{m.name}</span>
                  {m.isLeader && <Badge tone="neutral" caps={false}>Lead</Badge>}
                  <span className="label-mono-sm text-ink-muted ml-auto">{roleLabel(m.role)}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* vacant slot */}
          <section>
            <p className="label-caps text-ink-muted mb-2">Applying for vacant slot</p>
            <div className="flex flex-wrap gap-1.5">
              {vacant.map((r) => (
                <Chip key={r} active={role === r} onClick={() => setRole(r)}>
                  {roleLabel(r)}
                </Chip>
              ))}
            </div>
            {team.requiredSkills.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <span className="label-mono-sm text-ink-muted">High need:</span>
                {team.requiredSkills.map((s) => (
                  <Tag key={s} tone="accent">{s}</Tag>
                ))}
              </div>
            )}
          </section>

          <Textarea
            label="Why you're a great fit"
            rows={3}
            maxLength={280}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="What you'll own on this squad, and how you'll get it shipped…"
            hint={`${message.length}/280`}
          />

          <label className="block">
            <span className="label-caps text-ink-muted mb-1.5 block">Portfolio or relevant project</span>
            <input
              className="border-hairline focus:border-ink w-full rounded-lg border bg-surface px-3 py-2 text-sm outline-none"
              value={portfolioUrl}
              onChange={(e) => setPortfolioUrl(e.target.value)}
              placeholder="read.cv/you or github.com/you"
            />
          </label>

          <Segmented
            label="Hackathon commitment window"
            options={COMMITMENT_OPTIONS}
            value={commitment}
            onChange={(v) => setCommitment(v as Commitment)}
          />

          <div className="border-hairline-subtle flex items-start gap-2 border-t pt-4">
            <ShieldCheck className="text-ink-muted mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <p className="label-mono-sm text-ink-muted">
              Applications are private. The squad lead reviews them in-app — Instant Connect reveals the squad&rsquo;s Discord / WhatsApp / Email once you&rsquo;re accepted.
            </p>
          </div>

          {apply.isError && (
            <p className="label-mono-sm text-error">{(apply.error as Error).message}</p>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="accent" onClick={submit} loading={apply.isPending}>
              <Send className="h-4 w-4" aria-hidden />
              Send team application
            </Button>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <span className="label-mono-sm text-ink-muted ml-auto hidden sm:block">Applied for {commitmentLabel(commitment)}</span>
          </div>
        </div>
      )}
    </Modal>
  );
}
