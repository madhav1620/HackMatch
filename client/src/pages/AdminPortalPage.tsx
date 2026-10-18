import { useDeferredValue, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Activity, ArrowUpRight, CalendarDays, ChevronLeft, ChevronRight, Plus, Search, ShieldCheck, Users, UsersRound } from "lucide-react";
import { adminApi, type AdminBookmark, type AdminEvent, type AdminRequest, type AdminSoloPost, type AdminUser } from "../api/admin";
import type { Paged } from "../api/types";
import { useAuth } from "../context/AuthContext";
import { Badge, Button, Input, Section, Tabs } from "../components/ui";

type Panel = "overview" | "events" | "users" | "teams" | "activity";
const PANELS = [
  { id: "overview", label: "Overview" },
  { id: "events", label: "Events" },
  { id: "users", label: "Users" },
  { id: "teams", label: "Teams" },
  { id: "activity", label: "Activity" },
];
const date = (value: string) => new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
const tone = (status: string) => status === "PUBLISHED" || status === "ACCEPTED" ? "mint" : status === "DRAFT" || status === "PENDING" ? "amber" : "neutral";

function PageControls({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (page: number) => void }) {
  if (totalPages <= 1) return null;
  return <div className="mt-5 flex items-center justify-end gap-2">
    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="Previous page"><ChevronLeft className="h-4 w-4" /></Button>
    <span className="label-mono-sm text-ink-muted">Page {page} of {totalPages}</span>
    <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onChange(page + 1)} aria-label="Next page"><ChevronRight className="h-4 w-4" /></Button>
  </div>;
}

function QueryState({ loading, error, empty }: { loading: boolean; error: unknown; empty?: string }) {
  if (loading) return <p className="label-mono-sm text-ink-muted py-8 text-center">Loading live data…</p>;
  if (error) return <p className="text-error py-8 text-center text-sm">{error instanceof Error ? error.message : "Could not load data"}</p>;
  if (empty) return <p className="slot-dashed text-ink-muted rounded-xl px-4 py-10 text-center text-sm">{empty}</p>;
  return null;
}

function EventTable({ items }: { items: AdminEvent[] }) {
  return <div className="overflow-x-auto"><table className="w-full min-w-[750px] text-left text-sm">
    <thead className="label-caps text-ink-muted border-hairline border-b"><tr><th className="pb-3 font-medium">Event</th><th className="pb-3 font-medium">Status</th><th className="pb-3 font-medium">Deadline</th><th className="pb-3 font-medium">Teams</th><th className="pb-3 font-medium">Organizer</th><th className="pb-3 text-right font-medium">Manage</th></tr></thead>
    <tbody className="divide-hairline-subtle divide-y">{items.map((event) => <tr key={event.id}>
      <td className="py-3 pr-4"><p className="font-medium">{event.name}</p><p className="label-mono-sm text-ink-muted mt-1">{event.mode} · {event.location || "Online"}</p></td>
      <td className="py-3"><Badge tone={tone(event.status)}>{event.status}</Badge></td>
      <td className="label-mono-sm py-3">{date(event.registrationDeadline)}</td>
      <td className="label-mono-sm py-3">{event._count.teams}</td>
      <td className="py-3">{event.organizer?.name || "—"}</td>
      <td className="py-3 text-right"><Link className="text-link label-mono-sm inline-flex items-center gap-1 hover:underline" to={`/admin/events/${event.id}`}>Edit <ArrowUpRight className="h-3.5 w-3.5" /></Link></td>
    </tr>)}</tbody>
  </table></div>;
}

function UserTable({ items }: { items: AdminUser[] }) {
  return <div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left text-sm">
    <thead className="label-caps text-ink-muted border-hairline border-b"><tr><th className="pb-3 font-medium">User</th><th className="pb-3 font-medium">Role</th><th className="pb-3 font-medium">Verified</th><th className="pb-3 font-medium">Teams</th><th className="pb-3 font-medium">Joined</th><th className="pb-3 text-right font-medium">Manage</th></tr></thead>
    <tbody className="divide-hairline-subtle divide-y">{items.map((person) => <tr key={person.id}>
      <td className="py-3 pr-4"><p className="font-medium">{person.name}</p><p className="label-mono-sm text-ink-muted mt-1">{person.email}</p></td>
      <td className="py-3"><Badge tone={person.role === "ADMIN" ? "amber" : person.role === "ORGANIZER" ? "mint" : "neutral"}>{person.role}</Badge></td>
      <td className="label-mono-sm py-3">{person.verified ? "Yes" : "No"}</td>
      <td className="label-mono-sm py-3">{person._count.teams}</td>
      <td className="label-mono-sm py-3">{date(person.createdAt)}</td>
      <td className="py-3 text-right"><Link className="text-link label-mono-sm inline-flex items-center gap-1 hover:underline" to={`/admin/users/${person.id}`}>Details <ArrowUpRight className="h-3.5 w-3.5" /></Link></td>
    </tr>)}</tbody>
  </table></div>;
}

export default function AdminPortalPage() {
  const { token } = useAuth();
  const auth = token ?? "";
  const [panel, setPanel] = useState<Panel>("overview");
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search.trim());
  const [page, setPage] = useState(1);
  const [scope, setScope] = useState<"upcoming" | "all">("upcoming");
  const [eventStatus, setEventStatus] = useState("");
  const [userRole, setUserRole] = useState("");
  const [activityKind, setActivityKind] = useState<"requests" | "solo-posts" | "bookmarks">("requests");

  const summary = useQuery({ queryKey: ["admin", "summary"], queryFn: () => adminApi.summary(auth), enabled: Boolean(auth) });
  const events = useQuery({ queryKey: ["admin", "events", panel, deferredSearch, page, scope, eventStatus], queryFn: () => adminApi.events(auth, { search: deferredSearch, page, scope, status: eventStatus, limit: 20 }), enabled: Boolean(auth) && (panel === "events" || panel === "overview") });
  const users = useQuery({ queryKey: ["admin", "users", panel, deferredSearch, page, userRole], queryFn: () => adminApi.users(auth, { search: deferredSearch, page, role: userRole, limit: 20 }), enabled: Boolean(auth) && (panel === "users" || panel === "overview") });
  const teams = useQuery({ queryKey: ["admin", "teams", deferredSearch, page], queryFn: () => adminApi.teams(auth, { search: deferredSearch, page, limit: 20 }), enabled: Boolean(auth) && panel === "teams" });
  const activity = useQuery<Paged<AdminRequest | AdminSoloPost | AdminBookmark>>({ queryKey: ["admin", "activity", activityKind, page], queryFn: () => activityKind === "requests" ? adminApi.requests(auth, page) : activityKind === "solo-posts" ? adminApi.soloPosts(auth, page) : adminApi.bookmarks(auth, page), enabled: Boolean(auth) && panel === "activity" });

  const changePanel = (next: string) => { setPanel(next as Panel); setSearch(""); setPage(1); };
  const listing = (panel === "events" ? events.data : panel === "users" ? users.data : panel === "teams" ? teams.data : activity.data) as Paged<unknown> | undefined;

  return <div className="animate-fade-up space-y-6">
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="label-caps text-primary flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5" /> Admin workspace</p><h1 className="font-display mt-1 text-3xl font-semibold tracking-tight">Control room</h1><p className="text-ink-muted mt-1 text-sm">Events, people, teams and platform activity in one place.</p></div>
      <Link to="/admin/hackathons/new"><Button variant="accent"><Plus className="h-4 w-4" /> New event</Button></Link>
    </header>

    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {[
        { label: "Upcoming events", value: summary.data?.upcomingEvents, icon: CalendarDays },
        { label: "Registered users", value: summary.data?.users, icon: Users },
        { label: "Active teams", value: summary.data?.teams, icon: UsersRound },
        { label: "Draft events", value: summary.data?.draftEvents, icon: CalendarDays },
        { label: "Pending requests", value: summary.data?.pendingRequests, icon: Activity },
        { label: "Open solo posts", value: summary.data?.soloPosts, icon: Users },
      ].map(({ label, value, icon: Icon }) => <div key={label} className="border-hairline bg-surface rounded-xl border p-5 shadow-card"><div className="flex items-start justify-between"><p className="label-caps text-ink-muted">{label}</p><Icon className="text-primary h-4 w-4" aria-hidden /></div><p className="font-display mt-3 text-3xl font-semibold">{summary.isError ? "—" : value ?? "…"}</p></div>)}
    </div>

    <div className="border-hairline bg-surface overflow-hidden rounded-xl border shadow-card">
      <Tabs items={PANELS} active={panel} onChange={changePanel} className="px-3 sm:px-5" />
      <div className="p-4 sm:p-6">
        {panel === "overview" && <div className="grid gap-5 xl:grid-cols-2">
          <Section eyebrow="Next up" title="Upcoming events" action={<button className="text-link label-mono-sm" onClick={() => changePanel("events")}>View all →</button>}>
            <QueryState loading={events.isLoading} error={events.error} empty={events.data?.items.length === 0 ? "No upcoming events." : undefined} />
            {events.data?.items.slice(0, 5).map((event) => <Link key={event.id} to={`/admin/events/${event.id}`} className="border-hairline-subtle flex items-center justify-between gap-3 border-b py-3 last:border-0"><div><p className="font-medium">{event.name}</p><p className="label-mono-sm text-ink-muted mt-1">Closes {date(event.registrationDeadline)}</p></div><Badge tone={tone(event.status)}>{event.status}</Badge></Link>)}
          </Section>
          <Section eyebrow="People" title="Recently joined" action={<button className="text-link label-mono-sm" onClick={() => changePanel("users")}>View all →</button>}>
            <QueryState loading={users.isLoading} error={users.error} empty={users.data?.items.length === 0 ? "No users yet." : undefined} />
            {users.data?.items.slice(0, 5).map((person) => <Link key={person.id} to={`/admin/users/${person.id}`} className="border-hairline-subtle flex items-center justify-between gap-3 border-b py-3 last:border-0"><div><p className="font-medium">{person.name}</p><p className="label-mono-sm text-ink-muted mt-1">{person.email}</p></div><Badge tone={person.role === "ADMIN" ? "amber" : "neutral"}>{person.role}</Badge></Link>)}
          </Section>
        </div>}

        {panel !== "overview" && <div className="mb-5 flex flex-wrap items-end gap-3">
          {panel !== "activity" && <div className="min-w-56 flex-1"><Input label={`Search ${panel}`} value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder={panel === "events" ? "Event name, location…" : panel === "users" ? "Name or email…" : "Team or event…"} /></div>}
          {panel === "events" && <><label className="block"><span className="label-caps text-ink-muted mb-1.5 block">Scope</span><select className="border-hairline bg-surface rounded-lg border px-3 py-2 text-sm" value={scope} onChange={(e) => { setScope(e.target.value as "upcoming" | "all"); setPage(1); }}><option value="upcoming">Upcoming</option><option value="all">All events</option></select></label><label className="block"><span className="label-caps text-ink-muted mb-1.5 block">Status</span><select className="border-hairline bg-surface rounded-lg border px-3 py-2 text-sm" value={eventStatus} onChange={(e) => { setEventStatus(e.target.value); setPage(1); }}><option value="">All statuses</option><option value="PUBLISHED">Published</option><option value="DRAFT">Draft</option><option value="CLOSED">Closed</option></select></label></>}
          {panel === "users" && <label className="block"><span className="label-caps text-ink-muted mb-1.5 block">Role</span><select className="border-hairline bg-surface rounded-lg border px-3 py-2 text-sm" value={userRole} onChange={(e) => { setUserRole(e.target.value); setPage(1); }}><option value="">All roles</option><option value="STUDENT">Student</option><option value="ORGANIZER">Organizer</option><option value="ADMIN">Admin</option></select></label>}
          {panel === "activity" && <label className="block"><span className="label-caps text-ink-muted mb-1.5 block">Activity</span><select className="border-hairline bg-surface rounded-lg border px-3 py-2 text-sm" value={activityKind} onChange={(e) => { setActivityKind(e.target.value as typeof activityKind); setPage(1); }}><option value="requests">Join requests</option><option value="solo-posts">Solo posts</option><option value="bookmarks">Bookmarks</option></select></label>}
          <span className="label-mono-sm text-ink-muted ml-auto">{listing?.total ?? 0} records</span>
        </div>}

        {panel === "events" && <><QueryState loading={events.isLoading} error={events.error} empty={events.data?.items.length === 0 ? "No events match these filters." : undefined} />{events.data && events.data.items.length > 0 && <EventTable items={events.data.items} />}<PageControls page={page} totalPages={events.data?.totalPages ?? 1} onChange={setPage} /></>}
        {panel === "users" && <><QueryState loading={users.isLoading} error={users.error} empty={users.data?.items.length === 0 ? "No users match this search." : undefined} />{users.data && users.data.items.length > 0 && <UserTable items={users.data.items} />}<PageControls page={page} totalPages={users.data?.totalPages ?? 1} onChange={setPage} /></>}
        {panel === "teams" && <><QueryState loading={teams.isLoading} error={teams.error} empty={teams.data?.items.length === 0 ? "No teams found." : undefined} />{teams.data && teams.data.items.length > 0 && <div className="divide-hairline-subtle divide-y">{teams.data.items.map((team) => <div key={team.id} className="flex flex-wrap items-center justify-between gap-3 py-4"><div><p className="font-medium">{team.name} <span className="label-mono-sm text-ink-muted">· {team.hackathon.name}</span></p><p className="label-mono-sm text-ink-muted mt-1">{team.members.length} members · {team.openSlots} open slots · {team._count.joinRequests} requests</p></div><div className="flex items-center gap-3"><Badge tone={team.isRecruiting ? "mint" : "neutral"}>{team.isRecruiting ? "Recruiting" : "Paused"}</Badge><Link className="text-link label-mono-sm" to={`/admin/teams/${team.id}`}>Manage ↗</Link></div></div>)}</div>}<PageControls page={page} totalPages={teams.data?.totalPages ?? 1} onChange={setPage} /></>}
        {panel === "activity" && <><QueryState loading={activity.isLoading} error={activity.error} empty={activity.data?.items.length === 0 ? "No records in this category." : undefined} />{activity.data && <div className="divide-hairline-subtle divide-y">{activityKind === "requests" && activity.data.items.map((row) => { const item = row as AdminRequest; return <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-4"><div><p className="font-medium">{item.requester.name} → {item.team.name}</p><p className="label-mono-sm text-ink-muted mt-1">{item.team.hackathon.name} · {date(item.createdAt)}</p></div><Badge tone={tone(item.status)}>{item.status}</Badge></div>; })}{activityKind === "solo-posts" && activity.data.items.map((row) => { const item = row as AdminSoloPost; return <div key={item.id} className="py-4"><p className="font-medium">{item.user.name} · {item.hackathon.name}</p><p className="text-ink-muted mt-1 text-sm">{item.pitch}</p></div>; })}{activityKind === "bookmarks" && activity.data.items.map((row) => { const item = row as AdminBookmark; return <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-4"><p className="font-medium">{item.user.name} saved {item.hackathon.name}</p><span className="label-mono-sm text-ink-muted">{date(item.createdAt)}</span></div>; })}</div>}<PageControls page={page} totalPages={activity.data?.totalPages ?? 1} onChange={setPage} /></>}
      </div>
    </div>
    <p className="label-mono-sm text-ink-muted flex items-center gap-2"><Search className="h-3.5 w-3.5" /> Changes here update the connected HackMatch database immediately.</p>
  </div>;
}
