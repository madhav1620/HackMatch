import type { ReactNode } from "react";

/** Mono pill — filters, tech tags, spec labels. */
export function Chip({
  children,
  active = false,
  onClick,
  title,
  as = "button",
}: {
  children: ReactNode;
  active?: boolean;
  onClick?: () => void;
  title?: string;
  as?: "button" | "span";
}) {
  const cls = `label-mono-sm inline-flex items-center gap-1 rounded-full border px-3 py-1.5 transition-colors ${
    active ? "border-ink bg-ink text-canvas" : "border-hairline bg-surface text-ink hover:border-ink/40"
  }`;
  if (as === "span" || !onClick) {
    return (
      <span className={cls} title={title}>
        {children}
      </span>
    );
  }
  return (
    <button type="button" className={`press ${cls}`} onClick={onClick} title={title} aria-pressed={active}>
      {children}
    </button>
  );
}

type Tone = "neutral" | "accent" | "mint" | "amber" | "link" | "danger";

const TONES: Record<Tone, string> = {
  neutral: "border-hairline bg-surface-sunk text-ink",
  accent: "border-transparent bg-accent/10 text-primary",
  mint: "border-transparent bg-mint-bg text-mint-text",
  amber: "border-transparent bg-amber-bg text-amber-text",
  link: "border-transparent bg-link/10 text-link",
  danger: "border-transparent bg-error-container text-error",
};

/** Small status badge (mono, caps). */
export function Badge({
  children,
  tone = "neutral",
  caps = true,
  className = "",
}: {
  children: ReactNode;
  tone?: Tone;
  caps?: boolean;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-sm border px-2 py-1 ${
        caps ? "label-caps" : "label-mono-sm"
      } ${TONES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
