import { useEffect, useState } from "react";
import { Megaphone, Pencil, Trash2, UsersRound } from "lucide-react";
import type { SoloPost } from "../../../api/types";
import { Badge, Button, Modal, Textarea } from "../../ui";
import { useDeleteSolo, usePostSolo } from "../../../hooks/useTeams";

/**
 * "Looking for Team" — one-click presence on a hackathon's solo-builder board.
 * Renders the publish CTA, or your live post with edit / withdraw controls.
 */
export function LookingForTeamButton({
  hackathonId,
  hackathonName,
  mine,
}: {
  hackathonId: string;
  hackathonName: string;
  mine: SoloPost | null;
}) {
  const [open, setOpen] = useState(false);
  const [pitch, setPitch] = useState("");
  const post = usePostSolo(hackathonId);
  const remove = useDeleteSolo();

  useEffect(() => {
    if (open) {
      setPitch(mine?.pitch ?? "");
      post.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const submit = async () => {
    try {
      await post.mutateAsync(pitch.trim());
      setOpen(false);
    } catch {
      /* surfaced below */
    }
  };

  return (
    <>
      {mine ? (
        <section className="border-hairline bg-amber-bg/40 rounded-xl border p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="amber" caps={false}>
              <Megaphone className="h-3 w-3" aria-hidden />
              You&rsquo;re on the solo board
            </Badge>
            <div className="ml-auto flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
                <Pencil className="h-3.5 w-3.5" aria-hidden />
                Edit pitch
              </Button>
              <Button
                size="sm"
                variant="ghost"
                loading={remove.isPending}
                onClick={() => remove.mutate(mine.id)}
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden />
                Withdraw
              </Button>
            </div>
          </div>
          <p className="text-ink-muted mt-2 text-sm leading-6">{mine.pitch}</p>
        </section>
      ) : (
        <section className="border-hairline bg-surface flex flex-wrap items-center gap-3 rounded-xl border p-4">
          <UsersRound className="text-ink-muted h-5 w-5 shrink-0" aria-hidden />
          <div className="min-w-0">
            <p className="text-sm font-medium">Not got a squad yet?</p>
            <p className="label-mono-sm text-ink-muted">
              Post a one-line pitch and let recruiting squads find you on {hackathonName}.
            </p>
          </div>
          <Button variant="ink" size="sm" className="ml-auto" onClick={() => setOpen(true)}>
            Looking for a team
          </Button>
        </section>
      )}

      <Modal
        open={open}
        title={mine ? "Edit your solo pitch" : "Looking for a team"}
        eyebrow={hackathonName}
        onClose={() => setOpen(false)}
      >
        <div className="space-y-4">
          <Textarea
            label="Your pitch"
            rows={4}
            maxLength={600}
            value={pitch}
            onChange={(e) => setPitch(e.target.value)}
            placeholder="Designer with a working prototype. Need two more builders who like deadlines."
            hint={`${pitch.length}/600 — what you bring and who you're looking for.`}
          />
          {post.isError && <p className="label-mono-sm text-error">{(post.error as Error).message}</p>}
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="accent" onClick={submit} loading={post.isPending} disabled={pitch.trim().length < 10}>
              {mine ? "Update pitch" : "Publish to solo board"}
            </Button>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
