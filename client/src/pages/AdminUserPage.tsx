import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Save, ShieldCheck, UserRound } from "lucide-react";
import { adminApi, type AdminUserDetail, type AdminUserPatch } from "../api/admin";
import { useAuth } from "../context/AuthContext";
import { Badge, Button, Input, Section, Textarea } from "../components/ui";

type UserForm = Pick<AdminUserDetail,
  "email" | "name" | "verified" | "role" | "primaryRole" | "bio" | "skills" |
  "avatarUrl" | "githubUrl" | "linkedinUrl" | "portfolioUrl" |
  "discordHandle" | "whatsappNo" | "availability"
>;
const date = (value: string) => new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));

export default function AdminUserPage() {
  const { id = "" } = useParams();
  const { token, user: viewer } = useAuth();
  const cache = useQueryClient();
  const [form, setForm] = useState<UserForm | null>(null);
  const [skillsText, setSkillsText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const person = useQuery({ queryKey: ["admin", "user", id], queryFn: () => adminApi.user(token!, id), enabled: Boolean(token && id) });
  const save = useMutation({ mutationFn: async (value: UserForm) => {
    const patch: AdminUserPatch = {
      email: value.email.trim().toLowerCase(), name: value.name.trim(), verified: value.verified,
      role: value.role, primaryRole: value.primaryRole, bio: value.bio?.trim() || null,
      skills: (skillsText ?? value.skills.join(", ")).split(",").map((skill) => skill.trim()).filter(Boolean),
      avatarUrl: value.avatarUrl?.trim() || null, githubUrl: value.githubUrl?.trim() || null,
      linkedinUrl: value.linkedinUrl?.trim() || null, portfolioUrl: value.portfolioUrl?.trim() || null,
      discordHandle: value.discordHandle?.trim() || null, whatsappNo: value.whatsappNo?.trim() || null,
      availability: value.availability,
    };
    return adminApi.updateUser(token!, id, patch);
  }, onSuccess: async (updated) => {
    setError(null); setSaved(true); setForm((current) => current ? { ...current, ...updated } : current);
    setSkillsText(null); await cache.invalidateQueries({ queryKey: ["admin"] });
  }, onError: (cause) => { setSaved(false); setError(cause.message); } });

  if (person.isLoading) return <p className="label-mono-sm text-ink-muted">Loading user…</p>;
  if (person.error || !person.data) return <p className="text-error">{person.error?.message ?? "User not found"}</p>;
  const current = form ?? person.data;
  const set = <K extends keyof UserForm>(key: K, value: UserForm[K]) => { setForm({ ...current, [key]: value }); setSaved(false); };
  const ownAccount = viewer?.id === id;

  return <div className="animate-fade-up mx-auto max-w-5xl space-y-5">
    <Link to="/admin" className="label-mono-sm text-ink-muted inline-flex items-center gap-1 hover:text-ink"><ArrowLeft className="h-4 w-4" /> Admin workspace</Link>
    <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="label-caps text-primary flex items-center gap-1"><UserRound className="h-3.5 w-3.5" /> User record</p><h1 className="font-display mt-1 text-2xl font-semibold">{person.data.name}</h1><p className="text-ink-muted mt-1 text-sm">Joined {date(person.data.createdAt)} · {person.data.email}</p></div><Badge tone={person.data.role === "ADMIN" ? "amber" : person.data.role === "ORGANIZER" ? "mint" : "neutral"}>{person.data.role}</Badge></div>
    <form onSubmit={(e) => { e.preventDefault(); setError(null); save.mutate(current); }} className="space-y-5">
      <Section eyebrow="01 / Account" title="Identity and access"><div className="grid gap-4 md:grid-cols-2">
        <Input label="Full name" required minLength={2} maxLength={80} value={current.name} onChange={(e) => set("name", e.target.value)} />
        <Input label="Email" type="email" required value={current.email} onChange={(e) => set("email", e.target.value)} />
        <label className="block"><span className="label-caps text-ink-muted mb-1.5 block">Role</span><select className="border-hairline bg-surface w-full rounded-lg border px-3 py-2 text-sm" value={current.role} disabled={ownAccount} onChange={(e) => set("role", e.target.value)}><option value="STUDENT">Student</option><option value="ORGANIZER">Organizer</option><option value="ADMIN">Admin</option></select>{ownAccount && <span className="label-mono-sm text-ink-muted mt-1 block">Your own admin role is protected.</span>}</label>
        <label className="border-hairline bg-surface-sunk flex items-center gap-3 rounded-lg border px-3 py-2 text-sm"><input type="checkbox" checked={current.verified} disabled={ownAccount} onChange={(e) => set("verified", e.target.checked)} /><span>Verified account</span></label>
      </div></Section>
      <Section eyebrow="02 / Profile" title="Builder profile"><div className="grid gap-4 md:grid-cols-2">
        <label className="block"><span className="label-caps text-ink-muted mb-1.5 block">Primary role</span><select className="border-hairline bg-surface w-full rounded-lg border px-3 py-2 text-sm" value={current.primaryRole} onChange={(e) => set("primaryRole", e.target.value)}>{["OTHER", "FRONTEND", "BACKEND", "AIML", "UIUX", "PITCH", "DEVOPS", "DATA"].map((role) => <option key={role} value={role}>{role}</option>)}</select></label>
        <label className="block"><span className="label-caps text-ink-muted mb-1.5 block">Availability</span><select className="border-hairline bg-surface w-full rounded-lg border px-3 py-2 text-sm" value={current.availability} onChange={(e) => set("availability", e.target.value)}><option value="AVAILABLE">Available</option><option value="BUSY">Busy</option><option value="UNAVAILABLE">Unavailable</option></select></label>
        <div className="md:col-span-2"><Textarea label="Bio" rows={3} maxLength={500} value={current.bio ?? ""} onChange={(e) => set("bio", e.target.value)} /></div>
        <div className="md:col-span-2"><Input label="Skills" hint="Separate skills with commas" value={skillsText ?? current.skills.join(", ")} onChange={(e) => { setSkillsText(e.target.value); setSaved(false); }} /></div>
        <Input label="Avatar URL" type="url" value={current.avatarUrl ?? ""} onChange={(e) => set("avatarUrl", e.target.value)} />
        <Input label="GitHub URL" type="url" value={current.githubUrl ?? ""} onChange={(e) => set("githubUrl", e.target.value)} />
        <Input label="LinkedIn URL" type="url" value={current.linkedinUrl ?? ""} onChange={(e) => set("linkedinUrl", e.target.value)} />
        <Input label="Portfolio URL" type="url" value={current.portfolioUrl ?? ""} onChange={(e) => set("portfolioUrl", e.target.value)} />
      </div></Section>
      <Section eyebrow="03 / Contact" title="Private contact details"><div className="grid gap-4 md:grid-cols-2"><Input label="Discord handle" maxLength={40} value={current.discordHandle ?? ""} onChange={(e) => set("discordHandle", e.target.value)} /><Input label="WhatsApp number" maxLength={20} value={current.whatsappNo ?? ""} onChange={(e) => set("whatsappNo", e.target.value)} /></div></Section>
      <div className="flex flex-wrap items-center justify-end gap-3">{error && <p className="text-error mr-auto text-sm" role="alert">{error}</p>}{saved && <p className="text-mint-text mr-auto text-sm" role="status">User saved.</p>}<Button type="submit" variant="accent" loading={save.isPending}><Save className="h-4 w-4" /> Save user</Button></div>
    </form>
    <Section eyebrow="Connections" title="Related activity" action={<ShieldCheck className="text-primary h-4 w-4" aria-hidden />}>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Related title="Teams" items={person.data.teams.map((item) => `${item.team.name} · ${item.role}${item.isLeader ? " · Lead" : ""}`)} />
        <Related title="Posted events" items={person.data.hackathons.map((item) => `${item.name} · ${item.status}`)} />
        <Related title="Join requests" items={person.data.requestsSent.map((item) => `${item.team.name} · ${item.status}`)} />
        <Related title="Solo posts" items={person.data.soloPosts.map((item) => `${item.hackathon.name} · ${item.isOpen ? "Open" : "Closed"}`)} />
        <Related title="Bookmarks" items={person.data.bookmarks.map((item) => item.hackathon.name)} />
      </div>
    </Section>
  </div>;
}

function Related({ title, items }: { title: string; items: string[] }) {
  return <div className="border-hairline bg-surface-sunk rounded-lg border p-3"><p className="label-caps text-ink-muted">{title} · {items.length}</p>{items.length ? <ul className="mt-2 space-y-1 text-sm">{items.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul> : <p className="text-ink-muted mt-2 text-sm">None</p>}</div>;
}
