import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CalendarDays, Save } from "lucide-react";
import { adminApi, type AdminEvent } from "../api/admin";
import { useAuth } from "../context/AuthContext";
import { Badge, Button, Input, Section, Textarea } from "../components/ui";

type EventForm = {
  name: string; tagline: string; description: string; logoUrl: string; url: string;
  mode: "ONLINE" | "OFFLINE" | "HYBRID"; location: string; orgType: "INTERNAL" | "EXTERNAL";
  prizePool: string; registrationDeadline: string; startDate: string; endDate: string;
  techTags: string; minTeamSize: string; maxTeamSize: string; status: "DRAFT" | "PUBLISHED" | "CLOSED";
};

function localDateTime(value: string) {
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}
function toForm(event: AdminEvent): EventForm {
  return {
    name: event.name, tagline: event.tagline ?? "", description: event.description,
    logoUrl: event.logoUrl ?? "", url: event.url ?? "", mode: event.mode,
    location: event.location ?? "", orgType: event.orgType,
    prizePool: String(event.prizePool), registrationDeadline: localDateTime(event.registrationDeadline),
    startDate: localDateTime(event.startDate), endDate: localDateTime(event.endDate),
    techTags: event.techTags.join(", "), minTeamSize: String(event.minTeamSize),
    maxTeamSize: String(event.maxTeamSize), status: event.status,
  };
}

export default function AdminEventEditPage() {
  const { id = "" } = useParams();
  const { token } = useAuth();
  const cache = useQueryClient();
  const [form, setForm] = useState<EventForm | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const event = useQuery({ queryKey: ["admin", "event", id], queryFn: () => adminApi.event(token!, id), enabled: Boolean(token && id) });
  const save = useMutation({ mutationFn: async (value: EventForm) => {
    if (!value.name.trim() || !value.description.trim()) throw new Error("Name and description are required.");
    if (!value.registrationDeadline || !value.startDate || !value.endDate) throw new Error("Set all three event dates.");
    if (new Date(value.endDate) < new Date(value.startDate)) throw new Error("End date must be on or after start date.");
    if (Number(value.maxTeamSize) < Number(value.minTeamSize)) throw new Error("Max team size must be at least min team size.");
    return adminApi.updateEvent(token!, id, {
      name: value.name.trim(), tagline: value.tagline.trim() || null, description: value.description.trim(),
      logoUrl: value.logoUrl.trim() || null, url: value.url.trim() || null,
      mode: value.mode, location: value.mode === "ONLINE" ? null : value.location.trim() || null,
      orgType: value.orgType, prizePool: Number(value.prizePool || 0),
      registrationDeadline: new Date(value.registrationDeadline).toISOString(),
      startDate: new Date(value.startDate).toISOString(), endDate: new Date(value.endDate).toISOString(),
      techTags: value.techTags.split(",").map((tag) => tag.trim()).filter(Boolean),
      minTeamSize: Number(value.minTeamSize), maxTeamSize: Number(value.maxTeamSize), status: value.status,
    });
  }, onSuccess: async () => { setError(null); setSaved(true); await cache.invalidateQueries({ queryKey: ["admin"] }); }, onError: (cause) => { setSaved(false); setError(cause.message); } });

  if (event.isLoading) return <p className="label-mono-sm text-ink-muted">Loading event…</p>;
  if (event.error || !event.data) return <p className="text-error">{event.error?.message ?? "Event not found"}</p>;
  const current = form ?? toForm(event.data);
  const set = <K extends keyof EventForm>(key: K, value: EventForm[K]) => { setForm({ ...current, [key]: value }); setSaved(false); };

  return <div className="animate-fade-up mx-auto max-w-5xl space-y-5">
    <Link to="/admin" className="label-mono-sm text-ink-muted inline-flex items-center gap-1 hover:text-ink"><ArrowLeft className="h-4 w-4" /> Admin workspace</Link>
    <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="label-caps text-primary flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" /> Event editor</p><h1 className="font-display mt-1 text-2xl font-semibold">{event.data.name}</h1><p className="text-ink-muted mt-1 text-sm">Changes to this event appear in the live discovery feed.</p></div><Badge tone={current.status === "PUBLISHED" ? "mint" : current.status === "DRAFT" ? "amber" : "neutral"}>{current.status}</Badge></div>
    <form onSubmit={(e) => { e.preventDefault(); setError(null); save.mutate(current); }} className="space-y-5">
      <Section eyebrow="01 / Basics" title="Event details"><div className="grid gap-4 md:grid-cols-2">
        <Input label="Name" required maxLength={140} value={current.name} onChange={(e) => set("name", e.target.value)} />
        <Input label="Tagline" maxLength={160} value={current.tagline} onChange={(e) => set("tagline", e.target.value)} />
        <div className="md:col-span-2"><Textarea label="Description" rows={5} required maxLength={5000} value={current.description} onChange={(e) => set("description", e.target.value)} /></div>
        <Input label="Registration URL" type="url" value={current.url} onChange={(e) => set("url", e.target.value)} />
        <Input label="Logo URL" type="url" value={current.logoUrl} onChange={(e) => set("logoUrl", e.target.value)} />
      </div></Section>
      <Section eyebrow="02 / Logistics" title="Dates and venue"><div className="grid gap-4 md:grid-cols-2">
        <label className="block"><span className="label-caps text-ink-muted mb-1.5 block">Mode</span><select className="border-hairline bg-surface w-full rounded-lg border px-3 py-2 text-sm" value={current.mode} onChange={(e) => set("mode", e.target.value as EventForm["mode"])}><option value="ONLINE">Online</option><option value="OFFLINE">In-person</option><option value="HYBRID">Hybrid</option></select></label>
        <Input label="Venue / city" value={current.location} disabled={current.mode === "ONLINE"} onChange={(e) => set("location", e.target.value)} />
        <label className="block"><span className="label-caps text-ink-muted mb-1.5 block">Host type</span><select className="border-hairline bg-surface w-full rounded-lg border px-3 py-2 text-sm" value={current.orgType} onChange={(e) => set("orgType", e.target.value as EventForm["orgType"])}><option value="INTERNAL">Internal</option><option value="EXTERNAL">External</option></select></label>
        <Input label="Prize pool (INR)" type="number" min="0" value={current.prizePool} onChange={(e) => set("prizePool", e.target.value)} />
        <Input label="Registration closes" type="datetime-local" required value={current.registrationDeadline} onChange={(e) => set("registrationDeadline", e.target.value)} />
        <Input label="Start" type="datetime-local" required value={current.startDate} onChange={(e) => set("startDate", e.target.value)} />
        <Input label="End" type="datetime-local" required value={current.endDate} onChange={(e) => set("endDate", e.target.value)} />
      </div></Section>
      <Section eyebrow="03 / Discovery" title="Teams and visibility"><div className="grid gap-4 md:grid-cols-2">
        <Input label="Technology tags" hint="Separate tags with commas" value={current.techTags} onChange={(e) => set("techTags", e.target.value)} />
        <label className="block"><span className="label-caps text-ink-muted mb-1.5 block">Status</span><select className="border-hairline bg-surface w-full rounded-lg border px-3 py-2 text-sm" value={current.status} onChange={(e) => set("status", e.target.value as EventForm["status"])}><option value="DRAFT">Draft</option><option value="PUBLISHED">Published</option><option value="CLOSED">Closed</option></select></label>
        <Input label="Minimum team size" type="number" min="1" required value={current.minTeamSize} onChange={(e) => set("minTeamSize", e.target.value)} />
        <Input label="Maximum team size" type="number" min="1" required value={current.maxTeamSize} onChange={(e) => set("maxTeamSize", e.target.value)} />
      </div></Section>
      <div className="flex flex-wrap items-center justify-end gap-3">{error && <p className="text-error mr-auto text-sm" role="alert">{error}</p>}{saved && <p className="text-mint-text mr-auto text-sm" role="status">Event saved.</p>}<Button type="submit" variant="accent" loading={save.isPending}><Save className="h-4 w-4" /> Save changes</Button></div>
    </form>
  </div>;
}
