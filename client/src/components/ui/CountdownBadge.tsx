import { useCountdown } from "../../lib/useCountdown";

/**
 * Deadline countdown, JetBrains Mono, per `feed-light` / `hackathon-detail`.
 * Turns amber + pulses under 24h (DESIGN.md §6), and reads CLOSED once past.
 */
export function CountdownBadge({
  target,
  compact = false,
  className = "",
  label = "Registration closes in",
}: {
  target: string | undefined;
  compact?: boolean;
  className?: string;
  label?: string;
}) {
  const c = useCountdown(target);
  if (!target || !c) return null;

  if (c.expired) {
    return (
      <span className={`label-caps text-ink-muted rounded-sm border border-hairline bg-surface px-2 py-1 ${className}`}>
        Registration closed
      </span>
    );
  }

  const value = compact
    ? `${String(c.days).padStart(2, "0")}D ${String(c.hours).padStart(2, "0")}H ${String(c.minutes).padStart(2, "0")}M`
    : c.label;

  return (
    <span
      className={`inline-flex flex-wrap items-center gap-x-2 gap-y-0.5 rounded-sm border px-2 py-1 ${
        c.urgent ? "animate-soft-pulse border-transparent bg-amber-bg text-amber-text" : "border-hairline bg-surface"
      } ${className}`}
      title={`${label} ${c.label}`}
    >
      <span className="label-caps opacity-70">{label}</span>
      <span className="label-code tabular-nums">{value}</span>
    </span>
  );
}
