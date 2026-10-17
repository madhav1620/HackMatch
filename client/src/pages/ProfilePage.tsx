import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  BadgeCheck, Bookmark, Check, Github, Globe, Linkedin, MessageCircle, Pencil, Share2, Trophy, UserPlus, X,
} from "lucide-react";
import { Button, Input } from "../components/ui";
import { OpenSlot } from "../components/ui/Tag";
import { useAuth } from "../context/AuthContext";

const ROLE_LABEL: Record<string, string> = {
  FRONTEND: "Frontend Engineer", BACKEND: "Backend Engineer", AIML: "AI / ML Engineer",
  UIUX: "Product Designer", DEVOPS: "DevOps Engineer", DATA: "Data Engineer",
  PITCH: "Product / Pitch", OTHER: "Builder",
};

const AVAIL: Record<string, { l: string; cls: string }> = {
  AVAILABLE: { l: "Available", cls: "bg-mint-bg text-mint-text" },
  BUSY: { l: "Busy", cls: "bg-amber-bg text-amber-text" },
  UNAVAILABLE: { l: "Unavailable", cls: "bg-surface-sunk text-ink-muted" },
};

function SectionHead({ n, title, meta }: { n: string; title: string; meta?: string }) {
  return (
    <div className="border-hairline flex items-baseline justify-between border-b pb-2">
      <h2 className="label-caps text-ink">
        {n} // {title}
      </h2>
      {meta && <span className="label-mono-sm text-ink-muted">{meta}</span>}
    </div>
  );
}

export default function ProfilePage() {
  const { id } = useParams();
  const { user, updateMe } = useAuth();
  const isMe = !id || id === "me";
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // draft state (edit mode)
  const [name, setName] = useState(user?.name ?? "");
  const [primaryRole, setPrimaryRole] = useState(user?.primaryRole ?? "OTHER");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [skills, setSkills] = useState<string[]>(user?.skills ?? []);
  const [skillDraft, setSkillDraft] = useState("");
  const [githubUrl, setGithubUrl] = useState(user?.githubUrl ?? "");
  const [linkedinUrl, setLinkedinUrl] = useState(user?.linkedinUrl ?? "");
  const [portfolioUrl, setPortfolioUrl] = useState(user?.portfolioUrl ?? "");
  const [availability, setAvailability] = useState(user?.availability ?? "AVAILABLE");

  const initials = useMemo(
    () => (user?.name ?? "H").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase(),
    [user?.name],
  );
  const domain = user?.email.split("@")[1] ?? "";
  const hackerId = useMemo(() => (user?.id ?? "").slice(-8).toUpperCase(), [user?.id]);

  if (!user) return null;

  async function save() {
    setSaving(true);
    setError(null);
    try {
      await updateMe({
        name, primaryRole, bio: bio || null, skills,
        githubUrl: githubUrl || null, linkedinUrl: linkedinUrl || null, portfolioUrl: portfolioUrl || null,
        availability,
      });
      setEditing(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }

  const avail = AVAIL[availability] ?? AVAIL.AVAILABLE;

  return (
    <div className="animate-fade-up mx-auto max-w-3xl space-y-6">
      {/* ── Identity header ── */}
      <header className="border-hairline bg-surface shadow-card rounded-xl border p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="label-caps border-hairline text-ink-muted rounded-sm border px-2 py-1">
              HACKER ID // {hackerId}
            </span>
            {user.verified && (
              <span className="label-caps text-link bg-link/10 inline-flex items-center gap-1 rounded-sm px-2 py-1">
                <BadgeCheck className="h-3 w-3" aria-hidden /> Verified
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isMe && !editing && (
              <button className="press text-ink-muted" onClick={() => setEditing(true)} aria-label="Edit profile" title="Edit profile">
                <Pencil className="h-4 w-4" />
              </button>
            )}
            <button className="press text-ink-muted" aria-label="Bookmark" title="Bookmark (Phase 3)">
              <Bookmark className="h-4 w-4" />
            </button>
            <button className="press text-ink-muted" aria-label="Share" title="Share">
              <Share2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mt-5 flex items-start gap-4">
          <div className="border-hairline bg-surface-warm font-display flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border text-xl font-bold">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            {editing ? (
              <Input value={name} onChange={(e) => setName(e.target.value)} className="font-display max-w-xs font-semibold" />
            ) : (
              <h1 className="text-2xl leading-7 font-bold">{user.name}</h1>
            )}
            <p className="label-mono-sm text-ink-muted mt-1">
              {domain}
              {editing ? (
                <>
                  {" · "}
                  <select
                    className="label-mono-sm border-hairline bg-surface rounded-lg border px-1 py-0.5"
                    value={primaryRole}
                    onChange={(e) => setPrimaryRole(e.target.value)}
                    aria-label="Primary role"
                  >
                    {["FRONTEND", "BACKEND", "AIML", "UIUX", "DEVOPS", "DATA", "PITCH", "OTHER"].map((r) => (
                      <option key={r} value={r}>
                        {ROLE_LABEL[r]}
                      </option>
                    ))}
                  </select>
                </>
              ) : (
                ` · ${ROLE_LABEL[primaryRole] ?? "Builder"}`
              )}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className={`label-caps rounded-sm px-2 py-1 ${avail.cls}`}>{avail.l}</span>
              {editing ? (
                <select
                  className="label-mono-sm border-hairline bg-surface rounded-lg border px-2 py-1"
                  value={availability}
                  onChange={(e) => setAvailability(e.target.value)}
                >
                  <option value="AVAILABLE">Available</option>
                  <option value="BUSY">Busy</option>
                  <option value="UNAVAILABLE">Unavailable</option>
                </select>
              ) : (
                <span className="label-mono-sm text-ink-muted">
                  {skills.length > 0 ? `Looking for a squad on ${skills.slice(0, 2).join(" / ")}` : "Open to teammates"}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* links row */}
        <div className="border-hairline mt-5 flex flex-wrap gap-2 border-t pt-4">
          {editing ? (
            <div className="grid w-full gap-2 sm:grid-cols-3">
              <Input value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} placeholder="GitHub URL" />
              <Input value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} placeholder="LinkedIn URL" />
              <Input value={portfolioUrl} onChange={(e) => setPortfolioUrl(e.target.value)} placeholder="Portfolio URL" />
            </div>
          ) : (
            <>
              {user.githubUrl && (
                <a className="label-mono-sm border-hairline hover:border-ink/30 flex items-center gap-2 rounded-sm border px-2 py-1" href={user.githubUrl} target="_blank" rel="noreferrer">
                  <Github className="h-3.5 w-3.5" aria-hidden /> {user.githubUrl.replace(/^https?:\/\/(www\.)?/, "")}
                </a>
              )}
              {user.linkedinUrl && (
                <a className="label-mono-sm border-hairline hover:border-ink/30 flex items-center gap-2 rounded-sm border px-2 py-1" href={user.linkedinUrl} target="_blank" rel="noreferrer">
                  <Linkedin className="h-3.5 w-3.5" aria-hidden /> LinkedIn
                </a>
              )}
              {user.portfolioUrl && (
                <a className="label-mono-sm border-hairline hover:border-ink/30 flex items-center gap-2 rounded-sm border px-2 py-1" href={user.portfolioUrl} target="_blank" rel="noreferrer">
                  <Globe className="h-3.5 w-3.5" aria-hidden /> {user.portfolioUrl.replace(/^https?:\/\/(www\.)?/, "")}
                </a>
              )}
              {!user.githubUrl && !user.linkedinUrl && !user.portfolioUrl && (
                <span className="label-mono-sm text-ink-muted">No links yet{isMe ? " — add some in edit mode" : ""}</span>
              )}
            </>
          )}
        </div>
      </header>

      {/* ── 01 Core Tech & Domains ── */}
      <section className="border-hairline bg-surface shadow-card rounded-xl border p-6">
        <SectionHead n="01" title="Core Tech & Domains" meta={editing ? undefined : `${skills.length} Specializations`} />
        <div className="mt-4 flex flex-wrap gap-2">
          {(editing ? skills : user.skills).length === 0 && <span className="label-mono-sm text-ink-muted">No skills tagged yet.</span>}
          {(editing ? skills : user.skills).map((s) => (
            <span key={s} className="label-mono-sm border-hairline bg-surface-sunk inline-flex items-center gap-1 rounded-sm border px-2 py-1">
              {s}
              {editing && (
                <button onClick={() => setSkills(skills.filter((x) => x !== s))} aria-label={`Remove ${s}`}>
                  <X className="text-ink-muted h-3 w-3" />
                </button>
              )}
            </span>
          ))}
        </div>
        {editing && (
          <form
            className="mt-3 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const v = skillDraft.trim();
              if (v && !skills.includes(v) && skills.length < 20) setSkills([...skills, v]);
              setSkillDraft("");
            }}
          >
            <Input value={skillDraft} onChange={(e) => setSkillDraft(e.target.value)} placeholder="Add a skill…" />
            <Button type="submit" className="shrink-0" aria-label="Add skill">Add</Button>
          </form>
        )}
      </section>

      {/* ── 02 Hackathon Track Record ── */}
      <section className="border-hairline bg-surface shadow-card rounded-xl border p-6">
        <SectionHead n="02" title="Hackathon Track Record" meta="0 Podiums" />
        <div className="mt-4">
          <OpenSlot>
            <span className="inline-flex items-center gap-2">
              <Trophy className="h-4 w-4" aria-hidden /> No podiums yet — submit a project to claim your first.
            </span>
          </OpenSlot>
        </div>
      </section>

      {/* ── 03 What I'm looking to build ── */}
      <section className="border-hairline bg-surface shadow-card rounded-xl border p-6">
        <SectionHead n="03" title="What I'm Looking to Build" />
        {editing ? (
          <textarea
            className="border-hairline bg-surface mt-4 w-full rounded-lg border px-3 py-2 text-sm outline-none"
            rows={3}
            maxLength={500}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="What kind of teammate + project are you after?"
          />
        ) : (
          <blockquote className="text-ink mt-4 border-l-2 border-accent pl-4 text-[15px] leading-6 italic">
            {user.bio || "No statement yet — add one to attract the right teammates."}
          </blockquote>
        )}
      </section>

      {/* ── 04 Past Project Repos ── */}
      <section className="border-hairline bg-surface shadow-card rounded-xl border p-6">
        <SectionHead n="04" title="Past Project Repos" meta="Open Source" />
        <div className="mt-4">
          <OpenSlot>// no repositories linked yet — connect GitHub in Phase 3</OpenSlot>
        </div>
      </section>

      {error && <p className="text-error text-sm">{error}</p>}

      {/* ── Footer actions ── */}
      <div className="border-hairline bg-surface sticky bottom-20 z-20 flex items-center justify-between rounded-xl border p-4 shadow-card">
        <span className="label-mono-sm text-ink-muted">{[domain, "PST"].filter(Boolean).join(" · ")}</span>
        <div className="flex items-center gap-2">
          {editing ? (
            <>
              <Button className="bg-surface-sunk text-ink border-hairline border" onClick={() => setEditing(false)}>
                <X className="mr-1 h-4 w-4" aria-hidden /> Cancel
              </Button>
              <Button onClick={save} loading={saving}>
                <Check className="mr-1 h-4 w-4" aria-hidden /> Save
              </Button>
            </>
          ) : (
            <>
              <Button className="bg-surface-sunk text-ink border-hairline border" title="Chats arrive in Phase 4">
                <MessageCircle className="mr-1 h-4 w-4" aria-hidden /> Message
              </Button>
              <Button title="Invites arrive in Phase 4">
                <UserPlus className="mr-1 h-4 w-4" aria-hidden /> Invite to Squad
              </Button>
            </>
          )}
        </div>
      </div>

      {!isMe && (
        <p className="label-mono-sm text-ink-muted flex items-center gap-1">
          <Trophy className="h-3 w-3" aria-hidden /> Viewing another student&apos;s profile (id: {id})
        </p>
      )}
    </div>
  );
}
