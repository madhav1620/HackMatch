import type { ReactNode } from "react";

export type TabItem = { id: string; label: string; count?: number };

/** Underlined section tabs — ink active rule, mono caps labels. */
export function Tabs({
  items,
  active,
  onChange,
  className = "",
}: {
  items: TabItem[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
}) {
  return (
    <div className={`border-hairline flex gap-1 overflow-x-auto border-b ${className}`} role="tablist">
      {items.map((t) => {
        const isActive = t.id === active;
        return (
          <button
            key={t.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(t.id)}
            className={`press label-caps -mb-px whitespace-nowrap border-b-2 px-3 py-3 transition-colors ${
              isActive ? "border-ink text-ink" : "text-ink-muted border-transparent hover:text-ink"
            }`}
          >
            {t.label}
            {t.count !== undefined && <span className="ml-2 opacity-60">({String(t.count).padStart(2, "0")})</span>}
          </button>
        );
      })}
    </div>
  );
}

/** Segmented control — venue type / sort switches. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  label?: string;
}) {
  return (
    <div>
      {label && <p className="label-caps text-ink-muted mb-2">{label}</p>}
      <div className="border-hairline inline-flex flex-wrap gap-1 rounded-lg border bg-surface-sunk p-1">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            aria-pressed={value === o.value}
            className={`press label-mono-sm rounded-md px-3 py-1.5 transition-colors ${
              value === o.value ? "bg-ink text-white" : "text-ink-muted hover:text-ink"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Bento section wrapper: mono eyebrow label + content. */
export function Section({
  eyebrow,
  title,
  children,
  action,
}: {
  eyebrow: string;
  title?: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-hairline bg-surface p-5 md:p-6">
      <header className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <p className="label-caps text-ink-muted">{eyebrow}</p>
          {title && <h2 className="mt-1 font-display text-lg leading-6 font-semibold">{title}</h2>}
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}
