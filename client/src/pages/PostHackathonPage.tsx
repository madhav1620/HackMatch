import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Check, Plus, Trash2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useCreateHackathon, useDeleteHackathon, useMyHackathons } from "../hooks/useHackathons";
import { Badge, Button, Chip, EmptyState, Input, Section, Segmented } from "../components/ui";
import { formatCompactPrize, formatDate } from "../lib/format";
import type { HackathonDraft, Mode, OrgType } from "../api/types";

type Step = 0 | 1 | 2;

const STEPS: { id: Step; label: string; eyebrow: string }[] = [
  { id: 0, label: "Basics", eyebrow: "// 01 Basics" },
  { id: 1, label: "Logistics", eyebrow: "// 02 Logistics" },
  { id: 2, label: "Teams & tracks", eyebrow: "// 03 Teams & tracks" },
];

/** Local form state — strings keep the inputs controlled; converted on submit. */
type FormState = {
  name: string;
  tagline: string;
  url: string;
  logoUrl: string;
  description: string;
  mode: Mode;
  location: string;
  orgType: OrgType;
  registrationDeadline: string;
  startDate: string;
  endDate: string;
  prizePool: string;
  techTags: string[];
  tagDraft: string;
  minTeamSize: number;
  maxTeamSize: number;
};

const INITIAL: FormState = {
  name: "",
  tagline: "",
  url: "",
  logoUrl: "",
  description: "",
  mode: "OFFLINE",
  location: "",
  orgType: "EXTERNAL",
  registrationDeadline: "",
  startDate: "",
  endDate: "",
  prizePool: "",
  techTags: [],
  tagDraft: "",
  minTeamSize: 2,
  maxTeamSize: 4,
};

/** Organizer authoring screen — mirrors `design-reference/post-hackathon.html`. */
export default function PostHackathonPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(0);
  const [form, setForm] = useState<FormState>(INITIAL);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const isOrganizer = user?.role === "ORGANIZER" || user?.role === "ADMIN";
  const create = useCreateHackathon();
  const mine = useMyHackathons(isOrganizer);
  const remove = useDeleteHackathon();

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));

  const problems = useMemo(() => {
    const out: string[] = [];
    if (step === 0) {
      if (!form.name.trim()) out.push("Hackathon name is required.");
      if (!form.description.trim()) out.push("Add a one-paragraph description.");
      if (form.mode !== "ONLINE" && !form.location.trim()) out.push("Add a venue or city.");
    }
    if (step === 1) {
      if (!form.registrationDeadline) out.push("Set the registration deadline.");
      if (!form.startDate || !form.endDate) out.push("Set both start and end dates.");
      if (form.startDate && form.endDate && new Date(form.endDate) < new Date(form.startDate))
        out.push("End date must be on or after the start date.");
    }
    if (step === 2) {
      if (form.maxTeamSize < form.minTeamSize) out.push("Max team size must be at least the min.");
      if (form.techTags.length === 0) out.push("Add at least one track or technology tag.");
    }
    return out;
  }, [form, step]);

  const addTag = () => {
    const t = form.tagDraft.trim();
    if (!t || form.techTags.includes(t)) return;
    set("techTags", [...form.techTags, t]);
    set("tagDraft", "");
  };

  const submit = async (status: "DRAFT" | "PUBLISHED") => {
    setError(null);
    try {
      if (!form.registrationDeadline || !form.startDate || !form.endDate) {
        throw new Error("Set the registration, start, and end dates before saving.");
      }
      const draft: HackathonDraft = {
        name: form.name.trim(),
        tagline: form.tagline.trim() || undefined,
        description: form.description.trim(),
        url: form.url.trim() || undefined,
        logoUrl: form.logoUrl.trim() || undefined,
        mode: form.mode,
        location: form.mode === "ONLINE" ? undefined : form.location.trim() || undefined,
        orgType: form.orgType,
        prizePool: Number(form.prizePool || 0),
        registrationDeadline: new Date(form.registrationDeadline).toISOString(),
        startDate: new Date(form.startDate).toISOString(),
        endDate: new Date(form.endDate).toISOString(),
        techTags: form.techTags,
        minTeamSize: form.minTeamSize,
        maxTeamSize: form.maxTeamSize,
        status,
      };
      const created = await create.mutateAsync(draft);
      setDone(created.id);
      setForm(INITIAL);
      setStep(0);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  if (!isOrganizer) {
    return (
      <EmptyState
        eyebrow="Organizer only"
        title="Posting requires an organizer account"
        hint="This is a student account. Sign in with the demo organizer (priya@bits-pilani.ac.in / password123) or ask an admin to upgrade your role."
      >
        <Link to="/">
          <Button variant="outline">← Back to discovery</Button>
        </Link>
      </EmptyState>
    );
  }

  return (
    <div className="animate-fade-up space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="label-caps text-ink-muted">Organizer</p>
          <h1 className="font-display mt-1 text-2xl leading-7 font-semibold">Post a hackathon</h1>
          <p className="text-ink-muted mt-1 text-sm">Publish to campus builders, or park it as a draft.</p>
        </div>
        <Link to="/">
          <Button variant="outline" size="sm">
            ← Back to discovery
          </Button>
        </Link>
      </header>

      {done && (
        <div className="animate-fade-up flex flex-wrap items-center gap-3 rounded-xl border border-hairline bg-surface p-4">
          <Badge tone="mint">
            <Check className="h-3.5 w-3.5" aria-hidden /> Saved
          </Badge>
          <span className="label-mono-sm">Your hackathon was created.</span>
          <Button size="sm" variant="outline" onClick={() => navigate(`/hackathons/${done}`)}>
            View it ↗
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setDone(null)}>
            Post another
          </Button>
        </div>
      )}

      <div className="rounded-xl border border-hairline bg-surface p-4 md:p-6">
        {/* step rail */}
        <div className="flex flex-wrap items-center gap-2">
          {STEPS.map((s) => {
            const active = s.id === step;
            const complete = s.id < step;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => { if (s.id <= step) setStep(s.id); }}
                disabled={s.id > step}
                aria-current={active}
                className={`press label-caps inline-flex items-center gap-2 rounded-lg border px-3 py-2 ${
                  active
                    ? "border-ink bg-ink text-canvas"
                    : complete
                      ? "border-mint-text bg-mint-bg text-mint-text"
                      : "border-hairline text-ink-muted"
                }`}
              >
                <span>{String(s.id + 1).padStart(2, "0")}</span>
                {s.label.toUpperCase()}
                {complete && <Check className="h-3 w-3" aria-hidden />}
              </button>
            );
          })}
        </div>

        <p className="label-caps text-ink-muted mt-6">{STEPS[step].eyebrow}</p>

        {/* ── 01 BASICS ─────────────────────────────────── */}
        {step === 0 && (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Input label="Hackathon name *" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="CalHacks 12.0" />
            <Input label="Tagline" value={form.tagline} onChange={(e) => set("tagline", e.target.value)} placeholder="36 hours of frontier tech" />
            <Input label="Event URL" value={form.url} onChange={(e) => set("url", e.target.value)} placeholder="https://…" />
            <Input label="Logo image URL" type="url" value={form.logoUrl} onChange={(e) => set("logoUrl", e.target.value)} placeholder="https://example.com/logo.png" />
            <div className="md:col-span-2">
              <Input
                label="Description *"
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="What is this hackathon about? Who should apply?"
              />
            </div>

            <div>
              <Segmented<Mode>
                label="Venue type"
                value={form.mode}
                onChange={(mode) => set("mode", mode)}
                options={[
                  { value: "OFFLINE", label: "In-person" },
                  { value: "ONLINE", label: "Online" },
                  { value: "HYBRID", label: "Hybrid" },
                ]}
              />
            </div>
            <div>
              {form.mode !== "ONLINE" && (
                <Input
                  label="Venue / city"
                  value={form.location}
                  onChange={(e) => set("location", e.target.value)}
                  placeholder="VIT Vellore, TN"
                />
              )}
            </div>
          </div>
        )}

        {/* ── 02 LOGISTICS ───────────────────────────────── */}
        {step === 1 && (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Input
              label="Registration closes *"
              type="datetime-local"
              value={form.registrationDeadline}
              onChange={(e) => set("registrationDeadline", e.target.value)}
              className="label-mono-sm"
            />
            <Input
              label="Start *"
              type="datetime-local"
              value={form.startDate}
              onChange={(e) => set("startDate", e.target.value)}
              className="label-mono-sm"
            />
            <Input
              label="End *"
              type="datetime-local"
              value={form.endDate}
              onChange={(e) => set("endDate", e.target.value)}
              className="label-mono-sm"
            />
            <div>
              <Input
                label="Total prize pool (INR)"
                type="number"
                min={0}
                value={form.prizePool}
                onChange={(e) => set("prizePool", e.target.value)}
                placeholder="200000"
              />
              {form.prizePool && (
                <p className="label-caps text-ink-muted mt-2">Cards will show {formatCompactPrize(Number(form.prizePool))}</p>
              )}
            </div>
            <div className="md:col-span-2">
              <Segmented<OrgType>
                label="Host type"
                value={form.orgType}
                onChange={(orgType) => set("orgType", orgType)}
                options={[
                  { value: "INTERNAL", label: "Internal (campus)" },
                  { value: "EXTERNAL", label: "External" },
                ]}
              />
            </div>
          </div>
        )}

        {/* ── 03 TEAMS & TRACKS ──────────────────────────── */}
        {step === 2 && (
          <div className="mt-4 space-y-5">
            <div>
              <p className="label-caps text-ink-muted mb-2">Tracks / technology tags *</p>
              <div className="flex flex-wrap items-center gap-1.5">
                {form.techTags.map((t) => (
                  <Chip key={t} active onClick={() => set("techTags", form.techTags.filter((x) => x !== t))}>
                    {t} ×
                  </Chip>
                ))}
                <span className="flex items-center gap-1">
                  <input
                    className="border-hairline label-mono-sm w-32 rounded-lg border bg-surface px-2 py-1.5 outline-none"
                    placeholder="AI/ML"
                    value={form.tagDraft}
                    onChange={(e) => set("tagDraft", e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                  />
                  <Button size="sm" variant="outline" onClick={addTag} type="button">
                    <Plus className="h-3.5 w-3.5" aria-hidden /> Add tag
                  </Button>
                </span>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Stepper label="Min team size" value={form.minTeamSize} onChange={(v) => set("minTeamSize", v)} min={1} />
              <Stepper label="Max team size" value={form.maxTeamSize} onChange={(v) => set("maxTeamSize", v)} min={1} />
            </div>
          </div>
        )}

        {problems.length > 0 && (
          <ul className="mt-5 space-y-1">
            {problems.map((p) => (
              <li key={p} className="label-mono-sm text-error">
                • {p}
              </li>
            ))}
          </ul>
        )}

        {error && <p className="label-mono-sm text-error mt-4">{error}</p>}

        <div className="border-hairline mt-6 flex flex-wrap items-center gap-2 border-t pt-4">
          <Button variant="outline" disabled={step === 0} onClick={() => setStep((s) => (s - 1) as Step)}>
            ← Back
          </Button>

          {step < 2 ? (
            <Button onClick={() => setStep((s) => (s + 1) as Step)} disabled={problems.length > 0}>
              Continue
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Button>
          ) : (
            <>
              <Button variant="outline" loading={create.isPending} disabled={problems.length > 0} onClick={() => submit("DRAFT")}>
                Save draft
              </Button>
              <Button variant="accent" loading={create.isPending} disabled={problems.length > 0} onClick={() => submit("PUBLISHED")}>
                Publish hackathon
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Button>
            </>
          )}

          <span className="label-caps text-ink-muted ml-auto">Use Save draft to keep an unpublished event</span>
        </div>
      </div>

      {/* my posts */}
      <Section
        eyebrow="Organizer"
        title="Your published hackathons"
        action={
          <span className="label-caps text-ink-muted">
            {mine.isLoading ? "Loading…" : `${mine.data?.items.length ?? 0} total`}
          </span>
        }
      >
        {remove.isError && <p className="text-error text-sm">Could not delete the hackathon. Please try again.</p>}
        {mine.isLoading ? (
          <p className="label-mono-sm text-ink-muted">Loading your posts…</p>
        ) : (mine.data?.items.length ?? 0) === 0 ? (
          <p className="text-ink-muted text-sm">You haven't posted anything yet.</p>
        ) : (
          <ul className="divide-hairline-subtle divide-y">
            {mine.data?.items.map((h) => (
              <li key={h.id} className="flex flex-wrap items-center gap-3 py-3">
                <Badge tone={h.status === "PUBLISHED" ? "mint" : h.status === "DRAFT" ? "amber" : "neutral"}>
                  {h.status}
                </Badge>
                <Link to={`/hackathons/${h.id}`} className="font-display text-sm font-semibold hover:underline">
                  {h.name}
                </Link>
                <span className="label-mono-sm text-ink-muted">
                  {formatDate(h.registrationDeadline)} · {formatCompactPrize(h.prizePool)} pool
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="ml-auto"
                  loading={remove.isPending}
                  onClick={() => { if (window.confirm(`Delete ${h.name} and its teams?`)) remove.mutate(h.id); }}
                  title="Delete this hackathon"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden /> Delete
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}

/** −/+ numeric stepper used for team sizes. */
function Stepper({
  label,
  value,
  onChange,
  min = 1,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
}) {
  return (
    <div>
      <p className="label-caps text-ink-muted mb-2">{label}</p>
      <div className="border-hairline inline-flex items-center gap-1 rounded-lg border bg-surface p-1">
        <button
          type="button"
          className="press label-code border-hairline h-8 w-8 rounded-md border"
          onClick={() => onChange(Math.max(min, value - 1))}
          aria-label={`Decrease ${label}`}
        >
          −
        </button>
        <span className="label-code w-10 text-center tabular-nums">{value}</span>
        <button
          type="button"
          className="press label-code border-hairline h-8 w-8 rounded-md border"
          onClick={() => onChange(value + 1)}
          aria-label={`Increase ${label}`}
        >
          +
        </button>
      </div>
    </div>
  );
}
