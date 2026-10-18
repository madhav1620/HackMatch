/** Display helpers — all user-facing values are formatted here, never inline. */

const INR = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

/** Full form for the detail spec grid: "₹1,00,000" */
export function formatPrize(amount: number): string {
  if (!Number.isFinite(amount) || amount <= 0) return "No prize pool";
  return INR.format(amount);
}

/** Compact form for feed cards: "₹33,00,000" → "₹33L" */
export function formatCompactPrize(amount: number): string {
  if (!Number.isFinite(amount) || amount <= 0) return "No pool";
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(amount % 10000000 === 0 ? 0 : 1)}Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(amount % 100000 === 0 ? 0 : 1)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(amount % 1000 === 0 ? 0 : 1)}K`;
  return INR.format(amount);
}

export function formatDate(iso: string, opts: Intl.DateTimeFormatOptions = {}): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...opts,
  });
}

/** "07 Nov · 11:59 PM" — the schedule-row format from the detail screen. */
export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
  const time = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  return `${date} · ${time}`;
}

export function formatDateRange(startIso: string, endIso: string): string {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
  const day = (d: Date) => d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }).toUpperCase();
  return sameMonth
    ? `${start.getDate()}–${day(end)}`
    : `${day(start).toUpperCase()} – ${day(end).toUpperCase()}`;
}

export function modeLabel(mode: string): string {
  return { ONLINE: "Online", OFFLINE: "In-person", HYBRID: "Hybrid" }[mode] ?? mode;
}

export function orgTypeLabel(orgType: string): string {
  return orgType === "INTERNAL" ? "Internal" : "External";
}

/** "CH", "SIH" — logo fallback initials for the card logo cell. */
export function initials(name: string): string {
  const words = name.replace(/[^A-Za-z0-9 ]/g, " ").split(/\s+/).filter(Boolean);
  if (words.length === 0) return "HM";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

/** Whole-day/decade label used by the detail spec grid ("EDITION 11" style). */
export function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`;
}

// ── Phase 4 — teams & matchmaking ─────────────────────────────────────────────

const ROLE_LABELS: Record<string, string> = {
  FRONTEND: "Frontend",
  BACKEND: "Backend",
  AIML: "AI / ML",
  UIUX: "UI/UX Design",
  PITCH: "Product & Pitch",
  DEVOPS: "DevOps",
  DATA: "Data Engineering",
  OTHER: "Generalist",
};

/** "UIUX" → "UI/UX Design" */
export function roleLabel(role: string): string {
  return ROLE_LABELS[role] ?? role;
}

export function channelLabel(channel: string): string {
  return { DISCORD: "Discord", WHATSAPP: "WhatsApp", EMAIL: "Email" }[channel] ?? channel;
}

export function commitmentLabel(commitment: string | null | undefined): string {
  return { FULL_SPRINT: "Full sprint", PARTIAL: "Partial hours", FLEXIBLE: "Flexible" }[commitment ?? ""] ?? "Flexible";
}

/** Solo-builder availability pill. */
export function availabilityLabel(availability: string): string {
  return { OPEN: "Open to teams", SELECTIVE: "Selective", LOCKED: "Locked in" }[availability] ?? availability;
}

/** Deep link for an Instant Connect value (wa.me / mailto), else null. */
export function contactHref(channel: string, value: string): string | null {
  if (channel === "WHATSAPP") return `https://wa.me/${value.replace(/[^\d+]/g, "").replace(/^\+/, "")}`;
  if (channel === "EMAIL") return `mailto:${value}`;
  if (/^https?:\/\//i.test(value)) return value;
  return null;
}

/** "3h ago" / "just now" — for request rows. */
export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

