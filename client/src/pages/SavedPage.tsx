import { Link } from "react-router-dom";
import { BellRing } from "lucide-react";
import { useBookmarks } from "../hooks/useHackathons";
import { Button, CountdownBadge, EmptyState, SkeletonList } from "../components/ui";
import { BookmarkButton } from "../components/features/hackathons/BookmarkButton";
import { formatCompactPrize, formatDateTime, initials } from "../lib/format";

/** Saved / reminder list — every bookmarked hackathon with its deadline. */
export default function SavedPage() {
  const { data, isLoading, isError } = useBookmarks();
  const items = data?.items ?? [];

  return (
    <div className="animate-fade-up space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="label-caps text-ink-muted">Reminders</p>
          <h1 className="font-display mt-1 text-2xl leading-7 font-semibold">Saved hackathons</h1>
          <p className="text-ink-muted mt-1 text-sm">
            {isLoading ? "Loading…" : `${items.length} saved · deadlines tracked automatically`}
          </p>
        </div>
        <Link to="/">
          <Button variant="outline" size="sm">
            ← Back to discovery
          </Button>
        </Link>
      </header>

      {isLoading ? (
        <SkeletonList count={3} />
      ) : isError ? (
        <EmptyState eyebrow="Request failed" title="Couldn't load your saved list" hint="Try again in a moment." />
      ) : items.length === 0 ? (
        <EmptyState
          eyebrow="Count: 00"
          title="Nothing saved yet"
          hint="Bookmark a hackathon from the feed and it will show up here with a live deadline countdown."
        >
          <Link to="/">
            <Button variant="accent">
              <BellRing className="h-4 w-4" aria-hidden />
              Browse hackathons
            </Button>
          </Link>
        </EmptyState>
      ) : (
        <ul className="grid gap-3">
          {items.map(({ hackathon: h, remindAt, savedAt }, i) => (
            <li
              key={h.id}
              className="lift animate-fade-up relative rounded-xl border border-hairline bg-surface p-4"
              style={{ ["--stagger" as string]: String(i + 1) }}
            >
              <div className="flex items-start gap-3">
                <div className="border-hairline bg-surface-sunk flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border">
                  <span className="label-code text-ink-muted">{initials(h.name)}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="font-display text-base leading-6 font-semibold">
                    <Link className="after:absolute after:inset-0 hover:underline" to={`/hackathons/${h.id}`}>
                      {h.name}
                    </Link>
                  </h2>
                  <p className="label-caps text-ink-muted mt-1">
                    {formatCompactPrize(h.prizePool)} pool · saved {new Date(savedAt).toLocaleDateString("en-GB")}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <CountdownBadge target={h.registrationDeadline} compact />
                    {remindAt && (
                      <span className="label-mono-sm text-ink-muted">Reminder set for {formatDateTime(remindAt)}</span>
                    )}
                  </div>
                </div>
                <BookmarkButton hackathon={h} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
