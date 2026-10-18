import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Save, UsersRound } from "lucide-react";
import { adminApi, type AdminTeam, type AdminTeamPatch } from "../api/admin";
import { useAuth } from "../context/AuthContext";
import { Badge, Button, Input, Section, Textarea } from "../components/ui";

type TeamForm = Pick<AdminTeam, "name" | "description" | "track" | "isRecruiting" | "openSlots" | "requiredRoles" | "requiredSkills" | "contactChannel" | "contactValue">;
const ROLES = ["FRONTEND", "BACKEND", "AIML", "UIUX", "PITCH", "DEVOPS", "DATA", "OTHER"];

export default function AdminTeamPage() {
  const { id = "" } = useParams();
  const { token } = useAuth();
  const cache = useQueryClient();
  const [form, setForm] = useState<TeamForm | null>(null);
  const [skillsText, setSkillsText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const team = useQuery({ queryKey: ["admin", "team", id], queryFn: () => adminApi.team(token!, id), enabled: Boolean(token && id) });
  const save = useMutation({ mutationFn: async (value: TeamForm) => {
    const patch: AdminTeamPatch = {
      name: value.name.trim(), description: value.description.trim(), track: value.track?.trim() || null,
      isRecruiting: value.isRecruiting, openSlots: value.openSlots,
      requiredRoles: value.requiredRoles,
      requiredSkills: (skillsText ?? value.requiredSkills.join(", ")).split(",").map((skill) => skill.trim()).filter(Boolean),
      contactChannel: value.contactChannel, contactValue: value.contactValue?.trim() || null,
    };
    return adminApi.updateTeam(token!, id, patch);
  }, onSuccess: async (updated) => { setError(null); setSaved(true); setForm(updated); setSkillsText(null); await cache.invalidateQueries({ queryKey: ["admin"] }); }, onError: (cause) => { setSaved(false); setError(cause.message); } });

  if (team.isLoading) return <p className="label-mono-sm text-ink-muted">Loading team…</p>;
  if (team.error || !team.data) return <p className="text-error">{team.error?.message ?? "Team not found"}</p>;
  const current = form ?? team.data;
  const set = <K extends keyof TeamForm>(key: K, value: TeamForm[K]) => { setForm({ ...current, [key]: value }); setSaved(false); };
  const toggleRole = (role: string) => set("requiredRoles", current.requiredRoles.includes(role) ? current.requiredRoles.filter((item) => item !== role) : [...current.requiredRoles, role]);

  return <div className="animate-fade-up mx-auto max-w-5xl space-y-5">
    <Link to="/admin" className="label-mono-sm text-ink-muted inline-flex items-center gap-1 hover:text-ink"><ArrowLeft className="h-4 w-4" /> Admin workspace</Link>
    <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="label-caps text-primary flex items-center gap-1"><UsersRound className="h-3.5 w-3.5" /> Team editor</p><h1 className="font-display mt-1 text-2xl font-semibold">{team.data.name}</h1><p className="text-ink-muted mt-1 text-sm">{team.data.hackathon.name} · Created by {team.data.createdBy.name}</p></div><Badge tone={current.isRecruiting ? "mint" : "neutral"}>{current.isRecruiting ? "Recruiting" : "Paused"}</Badge></div>
    <form onSubmit={(e) => { e.preventDefault(); setError(null); save.mutate(current); }} className="space-y-5">
      <Section eyebrow="01 / Team" title="Public details"><div className="grid gap-4 md:grid-cols-2">
        <Input label="Team name" minLength={2} maxLength={120} required value={current.name} onChange={(e) => set("name", e.target.value)} />
        <Input label="Track" maxLength={160} value={current.track ?? ""} onChange={(e) => set("track", e.target.value)} />
        <div className="md:col-span-2"><Textarea label="Description" rows={4} required maxLength={2000} value={current.description} onChange={(e) => set("description", e.target.value)} /></div>
        <Input label="Open slots" type="number" min="0" max="100" required value={current.openSlots} onChange={(e) => set("openSlots", Number(e.target.value))} />
        <label className="border-hairline bg-surface-sunk flex items-center gap-3 rounded-lg border px-3 py-2 text-sm"><input type="checkbox" checked={current.isRecruiting} onChange={(e) => set("isRecruiting", e.target.checked)} /><span>Recruiting is open</span></label>
      </div></Section>
      <Section eyebrow="02 / Recruiting" title="Required skills and roles"><div className="space-y-4">
        <Input label="Required skills" hint="Separate skills with commas" value={skillsText ?? current.requiredSkills.join(", ")} onChange={(e) => { setSkillsText(e.target.value); setSaved(false); }} />
        <div><p className="label-caps text-ink-muted mb-2">Required roles</p><div className="flex flex-wrap gap-2">{ROLES.map((role) => <label key={role} className={`label-mono-sm border-hairline flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-2 ${current.requiredRoles.includes(role) ? "bg-ink text-canvas" : "bg-surface"}`}><input type="checkbox" className="sr-only" checked={current.requiredRoles.includes(role)} onChange={() => toggleRole(role)} />{role}</label>)}</div></div>
      </div></Section>
      <Section eyebrow="03 / Contact" title="Private team channel"><div className="grid gap-4 md:grid-cols-2">
        <label className="block"><span className="label-caps text-ink-muted mb-1.5 block">Channel</span><select className="border-hairline bg-surface w-full rounded-lg border px-3 py-2 text-sm" value={current.contactChannel} onChange={(e) => set("contactChannel", e.target.value as TeamForm["contactChannel"])}><option value="DISCORD">Discord</option><option value="WHATSAPP">WhatsApp</option><option value="EMAIL">Email</option></select></label>
        <Input label="Contact value" maxLength={160} value={current.contactValue ?? ""} onChange={(e) => set("contactValue", e.target.value)} />
      </div><p className="label-mono-sm text-ink-muted mt-3">Contact details remain hidden from non-members in the public team board.</p></Section>
      <div className="flex flex-wrap items-center justify-end gap-3">{error && <p className="text-error mr-auto text-sm" role="alert">{error}</p>}{saved && <p className="text-mint-text mr-auto text-sm" role="status">Team saved.</p>}<Button type="submit" variant="accent" loading={save.isPending}><Save className="h-4 w-4" /> Save team</Button></div>
    </form>
    <Section eyebrow="Roster" title={`${team.data.members.length} members`}><div className="divide-hairline-subtle divide-y">{team.data.members.map((member) => <div key={member.id} className="flex flex-wrap items-center justify-between gap-2 py-3"><div><p className="font-medium">{member.user.name}</p><p className="label-mono-sm text-ink-muted">{member.user.email}</p></div><Badge tone={member.isLeader ? "amber" : "neutral"}>{member.isLeader ? "Lead" : member.role}</Badge></div>)}</div></Section>
  </div>;
}
