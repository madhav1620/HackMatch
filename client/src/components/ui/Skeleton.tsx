import type { ReactNode } from "react";

/** Shimmer block — Animotion C13 shimmer, tuned to the paper palette. */
export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton rounded-sm ${className}`} aria-hidden />;
}

/** A full feed-card placeholder matching the card's rhythm. */
export function HackathonCardSkeleton() {
  return (
    <article className="rounded-xl border border-hairline bg-surface p-5">
      <div className="flex items-start gap-3">
        <Skeleton className="h-12 w-12" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
      </div>
      <div className="mt-4 flex gap-2">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-14 rounded-full" />
      </div>
      <div className="mt-4 flex items-center gap-3">
        <Skeleton className="h-8 w-28" />
        <Skeleton className="h-8 w-24" />
      </div>
    </article>
  );
}

export function SkeletonList({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4" aria-busy="true" aria-live="polite">
      {Array.from({ length: count }, (_, i) => (
        <HackathonCardSkeleton key={i} />
      ))}
    </div>
  );
}

/** Dashed recessed frame — the signature HackMatch empty / not-found state. */
export function EmptyState({
  title,
  hint,
  children,
  eyebrow = "No results",
}: {
  title: string;
  hint?: string;
  children?: ReactNode;
  eyebrow?: string;
}) {
  return (
    <section className="slot-dashed animate-fade-up rounded-xl px-6 py-12 text-center">
      <p className="label-caps text-ink-muted">{eyebrow}</p>
      <h2 className="mt-3 font-display text-lg font-semibold">{title}</h2>
      {hint && <p className="text-ink-muted mx-auto mt-2 max-w-md text-sm leading-6">{hint}</p>}
      {children && <div className="mt-5 flex flex-wrap items-center justify-center gap-2">{children}</div>}
    </section>
  );
}
