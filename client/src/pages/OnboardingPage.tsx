import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, Plus, X } from "lucide-react";
import { Button, Input } from "../components/ui";
import { Tag } from "../components/ui/Tag";
import { useAuth } from "../context/AuthContext";
import type { User } from "../api/types";

const ROLES: { value: NonNullable<User["primaryRole"]>; label: string; blurb: string }[] = [
  { value: "FRONTEND", label: "Frontend", blurb: "React, Vue, CSS, motion" },
  { value: "BACKEND", label: "Backend", blurb: "APIs, databases, infra" },
  { value: "AIML", label: "AI / ML", blurb: "Models, data pipelines, RAG" },
  { value: "UIUX", label: "UI / UX", blurb: "Figma, research, prototyping" },
  { value: "DEVOPS", label: "DevOps", blurb: "CI/CD, Docker, cloud" },
  { value: "DATA", label: "Data", blurb: "Analytics, ETL, visualization" },
  { value: "PITCH", label: "Pitch", blurb: "Storytelling, product, decks" },
  { value: "OTHER", label: "Other", blurb: "Something else entirely" },
];

const SKILL_SUGGESTIONS = [
  "React", "TypeScript", "Node.js", "Python", "PyTorch", "FastAPI",
  "Figma", "Tailwind CSS", "PostgreSQL", "Docker", "Flutter", "LangChain",
];

const STEPS = ["Role", "Skills", "Links", "Availability"] as const;

export default function OnboardingPage() {
  const { user, updateMe } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [primaryRole, setPrimaryRole] = useState<string>(user?.primaryRole ?? "OTHER");
  const [skills, setSkills] = useState<string[]>(user?.skills ?? []);
  const [skillDraft, setSkillDraft] = useState("");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [githubUrl, setGithubUrl] = useState(user?.githubUrl ?? "");
  const [linkedinUrl, setLinkedinUrl] = useState(user?.linkedinUrl ?? "");
  const [portfolioUrl, setPortfolioUrl] = useState(user?.portfolioUrl ?? "");
  const [discordHandle, setDiscordHandle] = useState(user?.discordHandle ?? "");
  const [whatsappNo, setWhatsappNo] = useState(user?.whatsappNo ?? "");
  const [availability, setAvailability] = useState(user?.availability ?? "AVAILABLE");

  function addSkill(s: string) {
    const v = s.trim();
    if (!v || skills.includes(v) || skills.length >= 20) return;
    setSkills([...skills, v]);
    setSkillDraft("");
  }

  async function finish() {
    setSaving(true);
    setError(null);
    try {
      await updateMe({
        primaryRole,
        skills,
        bio: bio || null,
        githubUrl: githubUrl || null,
        linkedinUrl: linkedinUrl || null,
        portfolioUrl: portfolioUrl || null,
        discordHandle: discordHandle || null,
        whatsappNo: whatsappNo || null,
        availability,
      });
      navigate("/profile/me");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save your profile");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* step rail */}
      <div className="label-caps text-ink-muted flex items-center gap-2">
        {STEPS.map((s, i) => (
          <span key={s} className="flex items-center gap-2">
            <span className={i === step ? "text-accent" : i < step ? "text-ink" : ""}>
              {String(i + 1).padStart(2, "0")} {s}
            </span>
            {i < STEPS.length - 1 && <span className="text-hairline">—</span>}
          </span>
        ))}
      </div>

      <div className="border-hairline bg-surface shadow-card animate-scale-in mt-4 rounded-xl border p-6">
        {step === 0 && (
          <section>
            <h1 className="text-xl font-semibold">What do you build best?</h1>
            <p className="text-ink-muted mt-1 text-sm">Your primary role — teammates filter on this.</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {ROLES.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setPrimaryRole(r.value)}
                  className={`press rounded-xl border p-4 text-left transition-colors ${
                    primaryRole === r.value ? "border-accent bg-accent/5" : "border-hairline bg-surface hover:border-ink/30"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{r.label}</span>
                    {primaryRole === r.value && <Check className="text-accent h-4 w-4" aria-hidden />}
                  </div>
                  <p className="label-mono-sm text-ink-muted mt-1">{r.blurb}</p>
                </button>
              ))}
            </div>
          </section>
        )}

        {step === 1 && (
          <section>
            <h1 className="text-xl font-semibold">Tag your skills</h1>
            <p className="text-ink-muted mt-1 text-sm">Up to 20. Press Enter to add.</p>
            <form
              className="mt-4 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                addSkill(skillDraft);
              }}
            >
              <Input value={skillDraft} onChange={(e) => setSkillDraft(e.target.value)} placeholder="e.g. Rust" />
              <Button type="submit" className="shrink-0" aria-label="Add skill">
                <Plus className="h-4 w-4" aria-hidden />
              </Button>
            </form>

            <div className="mt-4 flex flex-wrap gap-2">
              {skills.length === 0 && <span className="label-mono-sm text-ink-muted">No skills yet.</span>}
              {skills.map((s) => (
                <span key={s} className="label-mono-sm border-hairline bg-surface-sunk inline-flex items-center gap-1 rounded-sm border px-2 py-1">
                  {s}
                  <button onClick={() => setSkills(skills.filter((x) => x !== s))} aria-label={`Remove ${s}`}>
                    <X className="text-ink-muted h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>

            <div className="mt-5">
              <span className="label-caps text-ink-muted">Suggestions</span>
              <div className="mt-2 flex flex-wrap gap-2">
                {SKILL_SUGGESTIONS.filter((s) => !skills.includes(s)).map((s) => (
                  <button key={s} onClick={() => addSkill(s)} className="press">
                    <Tag>+ {s}</Tag>
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}

        {step === 2 && (
          <section className="space-y-4">
            <div>
              <h1 className="text-xl font-semibold">Where can teammates find you?</h1>
              <p className="text-ink-muted mt-1 text-sm">All optional — but profiles with links get 3× more invites.</p>
            </div>
            <label className="block">
              <span className="label-caps text-ink-muted">GitHub</span>
              <Input className="mt-1" value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} placeholder="https://github.com/you" />
            </label>
            <label className="block">
              <span className="label-caps text-ink-muted">LinkedIn</span>
              <Input className="mt-1" value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} placeholder="https://linkedin.com/in/you" />
            </label>
            <label className="block">
              <span className="label-caps text-ink-muted">Portfolio</span>
              <Input className="mt-1" value={portfolioUrl} onChange={(e) => setPortfolioUrl(e.target.value)} placeholder="https://you.dev" />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="label-caps text-ink-muted">Discord handle</span>
                <Input className="mt-1" value={discordHandle} onChange={(e) => setDiscordHandle(e.target.value)} placeholder="you#0001" />
              </label>
              <label className="block">
                <span className="label-caps text-ink-muted">WhatsApp</span>
                <Input className="mt-1" value={whatsappNo} onChange={(e) => setWhatsappNo(e.target.value)} placeholder="+91…" />
              </label>
            </div>
          </section>
        )}

        {step === 3 && (
          <section className="space-y-4">
            <div>
              <h1 className="text-xl font-semibold">Set your availability</h1>
              <p className="text-ink-muted mt-1 text-sm">This is the badge on your profile card.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { v: "AVAILABLE", l: "Available", tone: "text-mint-text bg-mint-bg" },
                { v: "BUSY", l: "Busy", tone: "text-amber-text bg-amber-bg" },
                { v: "UNAVAILABLE", l: "Unavailable", tone: "text-ink-muted bg-surface-sunk" },
              ].map((o) => (
                <button
                  key={o.v}
                  onClick={() => setAvailability(o.v)}
                  className={`press rounded-xl border p-4 text-left ${
                    availability === o.v ? "border-accent" : "border-hairline"
                  }`}
                >
                  <span className={`label-caps rounded-sm px-2 py-1 ${o.tone}`}>{o.l}</span>
                </button>
              ))}
            </div>
            <label className="block">
              <span className="label-caps text-ink-muted">One-liner for teammates</span>
              <textarea
                className="border-hairline bg-surface mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none"
                rows={3}
                maxLength={500}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Excited about local-first software. Looking for an ML engineer!"
              />
            </label>
          </section>
        )}

        {error && <p className="text-error mt-4 text-sm">{error}</p>}

        <div className="mt-6 flex items-center justify-between">
          <Button
            type="button"
            className="bg-surface-sunk text-ink border-hairline border"
            onClick={() => (step === 0 ? navigate("/") : setStep(step - 1))}
          >
            <ArrowLeft className="mr-1 h-4 w-4" aria-hidden /> {step === 0 ? "Skip" : "Back"}
          </Button>

          {step < STEPS.length - 1 ? (
            <Button type="button" onClick={() => setStep(step + 1)}>
              Next <ArrowRight className="ml-1 h-4 w-4" aria-hidden />
            </Button>
          ) : (
            <Button type="button" onClick={finish} loading={saving}>
              Finish profile <Check className="ml-1 h-4 w-4" aria-hidden />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
