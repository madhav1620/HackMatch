import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { BellRing, Plus, Sparkles } from "lucide-react";
import { useHackathons } from "../hooks/useHackathons";
import { useAuth } from "../context/AuthContext";
import { Button, EmptyState, SkeletonList } from "../components/ui";
import { HackathonCard } from "../components/features/hackathons/HackathonCard";
import { FilterBar } from "../components/features/hackathons/FilterBar";
import { EMPTY_FILTERS, toQuery, type FeedFilters } from "../components/features/hackathons/filters";

const PAGE_SIZE = 8;

/** Discovery Hub — searchable, filterable feed of open hackathons. */
export default function DiscoverPage() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const [filters, setFilters] = useState<FeedFilters>(() => ({
    ...EMPTY_FILTERS,
    search: params.get("search") ?? "",
  }));
  const [page, setPage] = useState(1);

  const query = useMemo(() => toQuery(filters, page, PAGE_SIZE), [filters, page]);
  const { data, isLoading, isFetching, isError, error, refetch } = useHackathons(query);

  const patch = (p: Partial<FeedFilters>) => {
    setFilters((f) => ({ ...f, ...p }));
    setPage(1);
  };

  const clear = () => {
    setFilters(EMPTY_FILTERS);
    setParams({}, { replace: true });
    setPage(1);
  };

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const isOrganizer = user?.role === "ORGANIZER" || user?.role === "ADMIN";

  return (
    <div className="space-y-5">
      {/* header */}
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="label-caps text-ink-muted">Campus League · Season 2026</p>
          <h1 className="font-display mt-1 text-2xl leading-8 font-bold tracking-tight md:text-3xl">
            Hackathon Hub
          </h1>
          <p className="text-ink-muted mt-1 text-sm">
            {isLoading ? "Loading events…" : `${total} open ${total === 1 ? "event" : "events"} · closing dates tracked live`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/saved">
            <Button variant="outline" size="sm">
              <BellRing className="h-4 w-4" aria-hidden />
              Saved
            </Button>
          </Link>
          {isOrganizer && (
            <Link to="/admin/hackathons/new">
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4" aria-hidden />
                Post hackathon
              </Button>
            </Link>
          )}
          <Link to="/talent">
            <Button variant="accent" size="sm">
              <Sparkles className="h-4 w-4" aria-hidden />
              Find teammates
            </Button>
          </Link>
        </div>
      </header>

      <FilterBar filters={filters} onChange={patch} onClear={clear} total={total} loading={isFetching} />

      {/* results */}
      {isLoading ? (
        <SkeletonList count={4} />
      ) : isError ? (
        <EmptyState
          eyebrow="Request failed"
          title="Couldn't load hackathons"
          hint={(error as Error)?.message ?? "Check that the API server is running on port 4000."}
        >
          <Button variant="outline" onClick={() => refetch()}>
            Try again
          </Button>
        </EmptyState>
      ) : items.length === 0 ? (
        <EmptyState
          title="No hackathons match these filters"
          hint="Try widening the date range, clearing tech tags, or lowering the prize floor."
        >
          <Button variant="outline" onClick={clear}>
            Clear filters
          </Button>
          <Link to="/saved">
            <Button variant="ink">
              <BellRing className="h-4 w-4" aria-hidden />
              Notify me
            </Button>
          </Link>
        </EmptyState>
      ) : (
        <>
          <div className="stagger grid gap-4 xl:grid-cols-2">
            {items.map((h, i) => (
              <HackathonCard key={h.id} hackathon={h} index={i} />
            ))}
          </div>

          {totalPages > 1 && (
            <nav className="flex items-center justify-between gap-3 pt-1" aria-label="Pagination">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                ← Previous
              </Button>
              <span className="label-caps text-ink-muted">
                Page {page} / {totalPages}
              </span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                Next →
              </Button>
            </nav>
          )}

          <aside className="slot-dashed rounded-xl px-5 py-6 text-center">
            <p className="label-caps text-ink-muted">Looking for campus squads?</p>
            <p className="label-code text-ink-muted mt-2">
              {items.reduce((n, h) => n + h.soloPostCount, 0)} solo builders searching this page
            </p>
            <Link to="/talent" className="press label-mono-sm mt-3 inline-block underline">
              View pool →
            </Link>
          </aside>
        </>
      )}
    </div>
  );
}
