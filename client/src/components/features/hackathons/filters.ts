import type { HackathonQuery, Sort } from "../../../api/types";

/** UI-level feed filter state (strings so date/prize inputs stay controlled). */
export type FeedFilters = {
  search: string;
  mode: string;
  orgType: string;
  tech: string[];
  from: string;
  to: string;
  minPrize: string;
  sort: Sort;
  closingSoon: boolean;
};

export const EMPTY_FILTERS: FeedFilters = {
  search: "",
  mode: "",
  orgType: "",
  tech: [],
  from: "",
  to: "",
  minPrize: "",
  sort: "deadline",
  closingSoon: false,
};

export const TECH_OPTIONS = [
  "AI/ML",
  "React",
  "TypeScript",
  "Python",
  "Rust",
  "Web3",
  "Flutter",
  "Firebase",
  "Hardware",
  "Figma",
  "Go",
  "Node.js",
];

export const PRIZE_OPTIONS = [
  { value: "", label: "Any prize pool" },
  { value: "50000", label: "≥ ₹50K" },
  { value: "100000", label: "≥ ₹1L" },
  { value: "500000", label: "≥ ₹5L" },
  { value: "1000000", label: "≥ ₹10L" },
];

export function activeFilterCount(f: FeedFilters): number {
  let n = 0;
  if (f.search) n++;
  if (f.mode) n++;
  if (f.orgType) n++;
  if (f.tech.length) n++;
  if (f.from || f.to) n++;
  if (f.minPrize) n++;
  if (f.closingSoon) n++;
  if (f.sort !== "deadline") n++;
  return n;
}

/** "Closing soon" is a shortcut for a 7-day registration-deadline window. */
export function toQuery(f: FeedFilters, page: number, limit: number): HackathonQuery {
  const iso = (value: string, endOfDay = false) =>
    value ? new Date(endOfDay ? `${value}T23:59:59` : `${value}T00:00:00`).toISOString() : undefined;

  const windowed = f.closingSoon;

  return {
    search: f.search.trim() || undefined,
    mode: f.mode || undefined,
    orgType: f.orgType || undefined,
    tech: f.tech.length ? f.tech : undefined,
    from: windowed ? new Date().toISOString() : iso(f.from),
    to: windowed ? new Date(Date.now() + 7 * 864e5).toISOString() : iso(f.to, true),
    minPrize: f.minPrize ? Number(f.minPrize) : undefined,
    sort: f.sort,
    page,
    limit,
  };
}

/** Chips shown above the results — the "ACTIVE QUERY" line from `feed-states`. */
export function activeChips(f: FeedFilters): string[] {
  const chips: string[] = [];
  if (f.mode) chips.push(f.mode === "OFFLINE" ? "IN-PERSON" : f.mode);
  if (f.orgType) chips.push(f.orgType);
  if (f.closingSoon) chips.push("CLOSING < 7D");
  if (f.tech.length) chips.push(f.tech.join(" + "));
  if (f.minPrize) chips.push(`≥ ₹${(Number(f.minPrize) / 1000).toFixed(0)}K`);
  if (f.from && f.to) chips.push(`${f.from} → ${f.to}`);
  else if (f.from) chips.push(`AFTER ${f.from}`);
  else if (f.to) chips.push(`BEFORE ${f.to}`);
  return chips;
}
