import { useState } from "react";
import { Filter } from "lucide-react";
import { Badge, Chip, Input, Segmented } from "../../ui";
import type { Sort } from "../../../api/types";
import {
  PRIZE_OPTIONS,
  TECH_OPTIONS,
  activeChips,
  activeFilterCount,
  type FeedFilters,
} from "./filters";

const QUICK_MODES = [
  { value: "", label: "All" },
  { value: "ONLINE", label: "Online" },
  { value: "OFFLINE", label: "In-person" },
  { value: "HYBRID", label: "Hybrid" },
];

const ORG_TYPES = [
  { value: "", label: "Any host" },
  { value: "INTERNAL", label: "Internal" },
  { value: "EXTERNAL", label: "External" },
];

/** Filter rail / chip bar for the discovery feed. */
export function FilterBar({
  filters,
  onChange,
  onClear,
  total,
  loading = false,
}: {
  filters: FeedFilters;
  onChange: (patch: Partial<FeedFilters>) => void;
  onClear: () => void;
  total: number;
  loading?: boolean;
}) {
  const [more, setMore] = useState(false);
  const count = activeFilterCount(filters);
  const chips = activeChips(filters);

  const toggleTech = (tag: string) =>
    onChange({
      tech: filters.tech.includes(tag) ? filters.tech.filter((t) => t !== tag) : [...filters.tech, tag],
    });

  return (
    <div className="rounded-xl border border-hairline bg-surface p-4 md:p-5">
      {/* search + sort */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <label className="border-hairline bg-surface-sunk flex flex-1 items-center gap-2 rounded-lg border px-3 py-2">
          <span className="sr-only">Search hackathons</span>
          <span className="label-mono-sm text-ink-muted" aria-hidden>
            ⌘K
          </span>
          <input
            value={filters.search}
            onChange={(e) => onChange({ search: e.target.value })}
            placeholder="Search name, city, or keyword…"
            className="label-mono-sm w-full bg-transparent outline-none"
          />
          {filters.search && (
            <button className="press label-caps text-ink-muted" onClick={() => onChange({ search: "" })}>
              Clear
            </button>
          )}
        </label>

        <div className="flex items-center gap-2">
          <Segmented<Sort>
            value={filters.sort}
            onChange={(sort) => onChange({ sort })}
            options={[
              { value: "deadline", label: "Deadline" },
              { value: "prize", label: "Prize" },
              { value: "recent", label: "New" },
            ]}
          />
          <button
            type="button"
            className={`press label-mono-sm inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 ${
              more || count > 0 ? "border-ink bg-ink text-canvas" : "border-hairline bg-surface text-ink"
            }`}
            onClick={() => setMore((v) => !v)}
            aria-expanded={more}
          >
            <Filter className="h-4 w-4" aria-hidden />
            Filters{count > 0 ? ` · ${count}` : ""}
          </button>
        </div>
      </div>

      {/* quick chips */}
      <div className="mt-4 flex flex-wrap items-center gap-1.5">
        {QUICK_MODES.map((m) => (
          <Chip key={m.value || "all"} active={filters.mode === m.value} onClick={() => onChange({ mode: m.value })}>
            {m.label}
          </Chip>
        ))}
        <span className="bg-hairline mx-1 hidden h-5 w-px md:block" aria-hidden />
        <Chip active={filters.closingSoon} onClick={() => onChange({ closingSoon: !filters.closingSoon })}>
          Closing soon
        </Chip>
        <Chip active={filters.minPrize === "500000"} onClick={() => onChange({ minPrize: filters.minPrize === "500000" ? "" : "500000" })}>
          ≥ ₹5L pool
        </Chip>
      </div>

      {/* expanded filters */}
      {more && (
        <div className="animate-fade-in border-hairline mt-4 grid gap-4 border-t pt-4 md:grid-cols-2">
          <div>
            <p className="label-caps text-ink-muted mb-2">Registration closes between</p>
            <div className="flex items-center gap-2">
              <Input
                type="date"
                aria-label="Closing from"
                value={filters.from}
                onChange={(e) => onChange({ from: e.target.value, closingSoon: false })}
                className="label-mono-sm"
              />
              <span className="label-mono-sm text-ink-muted">→</span>
              <Input
                type="date"
                aria-label="Closing to"
                value={filters.to}
                onChange={(e) => onChange({ to: e.target.value, closingSoon: false })}
                className="label-mono-sm"
              />
            </div>
            <label className="mt-3 inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={filters.closingSoon}
                onChange={(e) => onChange({ closingSoon: e.target.checked })}
              />
              <span className="label-mono-sm">Closing within 7 days</span>
            </label>
          </div>

          <div>
            <p className="label-caps text-ink-muted mb-2">Minimum prize pool</p>
            <select
              value={filters.minPrize}
              onChange={(e) => onChange({ minPrize: e.target.value })}
              className="border-hairline label-mono-sm w-full rounded-lg border bg-surface px-3 py-2 outline-none"
            >
              {PRIZE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>

            <p className="label-caps text-ink-muted mt-4 mb-2">Host type</p>
            <div className="flex flex-wrap gap-1.5">
              {ORG_TYPES.map((o) => (
                <Chip key={o.value || "any"} active={filters.orgType === o.value} onClick={() => onChange({ orgType: o.value })}>
                  {o.label}
                </Chip>
              ))}
            </div>
          </div>

          <div className="md:col-span-2">
            <p className="label-caps text-ink-muted mb-2">Tech tags — matches any selected</p>
            <div className="flex flex-wrap gap-1.5">
              {TECH_OPTIONS.map((t) => (
                <Chip key={t} active={filters.tech.includes(t)} onClick={() => toggleTech(t)}>
                  {t}
                </Chip>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* active query summary */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Badge tone="neutral">{loading ? "Syncing…" : `${total} ${total === 1 ? "event" : "events"}`}</Badge>
        {chips.length > 0 ? (
          <>
            <span className="label-caps text-ink-muted">Active query</span>
            {chips.map((c) => (
              <Chip key={c} as="span">
                {c}
              </Chip>
            ))}
          </>
        ) : (
          <span className="label-caps text-ink-muted">Showing every open hackathon</span>
        )}
        {count > 0 && (
          <button className="press label-mono-sm text-ink-muted ml-auto inline-flex items-center gap-1.5" onClick={() => onClear()}>
            <span aria-hidden>⨯</span>
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}
