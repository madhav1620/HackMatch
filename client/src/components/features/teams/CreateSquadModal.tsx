import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Send } from "lucide-react";
import type { PrimaryRole, TeamChannel } from "../../../api/types";
import { Button, Chip, Modal, Segmented, TagInput, Textarea } from "../../ui";
import { roleLabel } from "../../../lib/format";
import { useCreateTeam } from "../../../hooks/useTeams";

const ROLE_OPTIONS: PrimaryRole[] = ["FRONTEND", "BACKEND", "AIML", "UIUX", "DEVOPS", "DATA", "PITCH", "OTHER"];

const CHANNEL_OPTIONS: { value: TeamChannel; label: string }[] = [
  { value: "DISCORD", label: "Discord" },
  { value: "WHATSAPP", label: "WhatsApp" },
  { value: "EMAIL", label: "Email" },
];

const CHANNEL_PLACEHOLDER: Record<TeamChannel, string> = {
  DISCORD: "https://discord.gg/your-invite",
  WHATSAPP: "+91 98XXXXXX12",
  EMAIL: "squad@college.edu",
};

const SKILL_SUGGESTIONS = ["React", "Python", "Figma", "PyTorch", "TypeScript", "Node.js", "Flutter", "Rust", "Go", "Design"];

/** "Post a Team Requirement" — founds a squad on a hackathon; you join as lead. */
export function CreateSquadModal({
  open,
  hackathon,
  onClose,
}: {
  open: boolean;
  hackathon: { id: string; name: string; maxTeamSize: number } | null;
  onClose: () => void;
}) {
  const create = useCreateTeam(hackathon?.id ?? "");
  const navigate = useNavigate();
  const maxOpen = Math.max(0, (hackathon?.maxTeamSize ?? 4) - 1);

  const [name, setName] = useState("");
  const [track, setTrack] = useState("");
  const [description, setDescription] = useState("");
  const [roles, setRoles] = useState<PrimaryRole[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [openSlots, setOpenSlots] = useState(maxOpen);
  const [channel, setChannel] = useState<TeamChannel>("DISCORD");
  const [contactValue, setContactValue] = useState("");

  useEffect(() => {
    if (!open) return;
    setName("");
    setTrack("");
    setDescription("");
    setRoles([]);
    setSkills([]);
    setOpenSlots(maxOpen);
    setChannel("DISCORD");
    setContactValue("");
    create.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, hackathon?.id]);

  if (!hackathon) return null;

  const toggleRole = (r: PrimaryRole) =>
    setRoles((prev) => (prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]));

  const submit = async () => {
    try {
      const team = await create.mutateAsync({
        name: name.trim(),
        description: description.trim(),
        track: track.trim() || undefined,
        openSlots,
        requiredRoles: roles,
        requiredSkills: skills,
        contactChannel: channel,
        contactValue: contactValue.trim() || undefined,
      });
      onClose();
      navigate(`/teams/${team.id}`);
    } catch {
      /* surfaced below */
    }
  };

  const valid = name.trim().length >= 2 && description.trim().length >= 10;

  return (
    <Modal open={open} title="Post a team requirement" eyebrow={`Recruiting for · ${hackathon.name}`} onClose={onClose} wide>
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="label-caps text-ink-muted mb-1.5 block">Squad name</span>
            <input
              className="border-hairline focus:border-ink w-full rounded-lg border bg-surface px-3 py-2 text-sm outline-none"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ZeroKnowledge Vote"
            />
          </label>
          <label className="block">
            <span className="label-caps text-ink-muted mb-1.5 block">Track</span>
            <input
              className="border-hairline focus:border-ink w-full rounded-lg border bg-surface px-3 py-2 text-sm outline-none"
              value={track}
              onChange={(e) => setTrack(e.target.value)}
              placeholder="Applied AI · Bio-Sensing Track"
            />
          </label>
        </div>

        <Textarea
          label="What are you building?"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="The idea in two sentences, plus what the squad has already nailed down."
          hint="At least 10 characters."
        />

        <div>
          <span className="label-caps text-ink-muted mb-2 block">Open roles you need</span>
          <div className="flex flex-wrap gap-1.5">
            {ROLE_OPTIONS.map((r) => (
              <Chip key={r} active={roles.includes(r)} onClick={() => toggleRole(r)}>
                {roleLabel(r)}
              </Chip>
            ))}
          </div>
        </div>

        <TagInput label="Skills you need" value={skills} onChange={setSkills} suggestions={SKILL_SUGGESTIONS} />

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="label-caps text-ink-muted mb-1.5 block">Open slots</span>
            <input
              type="number"
              min={0}
              max={maxOpen}
              className="border-hairline focus:border-ink w-full rounded-lg border bg-surface px-3 py-2 text-sm outline-none"
              value={openSlots}
              onChange={(e) => setOpenSlots(Math.max(0, Math.min(maxOpen, Number(e.target.value) || 0)))}
            />
            <span className="label-mono-sm text-ink-muted mt-1 block">
              Max {maxOpen} — this hackathon caps squads at {hackathon.maxTeamSize}. You join as the first member.
            </span>
          </label>

          <Segmented
            label="Instant Connect channel"
            options={CHANNEL_OPTIONS}
            value={channel}
            onChange={(v) => setChannel(v as TeamChannel)}
          />
        </div>

        <label className="block">
          <span className="label-caps text-ink-muted mb-1.5 block">Contact handle</span>
          <input
            className="border-hairline focus:border-ink w-full rounded-lg border bg-surface px-3 py-2 text-sm outline-none"
            value={contactValue}
            onChange={(e) => setContactValue(e.target.value)}
            placeholder={CHANNEL_PLACEHOLDER[channel]}
          />
          <span className="label-mono-sm text-ink-muted mt-1 block">
            Only revealed to members you accept — never shown on the public board.
          </span>
        </label>

        {create.isError && <p className="label-mono-sm text-error">{(create.error as Error).message}</p>}

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="accent" onClick={submit} loading={create.isPending} disabled={!valid}>
            <Send className="h-4 w-4" aria-hidden />
            Publish requirement
          </Button>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </Modal>
  );
}
