import type { ReactNode } from "react";

/** Skill / tech pill — mono label per design system (`.label-mono-sm`). */
export function Tag({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "accent" | "mint" | "link" }) {
  const tones = {
    neutral: "border-hairline bg-surface-sunk text-ink",
    accent: "border-transparent bg-accent/10 text-primary",
    mint: "border-transparent bg-mint-bg text-mint-text",
    link: "border-transparent bg-link/10 text-link",
  } as const;
  return (
    <span className={`label-mono-sm inline-flex items-center rounded-sm border px-2 py-1 ${tones[tone]}`}>
      {children}
    </span>
  );
}

/** Dashed "open slot" cell — signature HackMatch empty state. */
export function OpenSlot({ children }: { children: ReactNode }) {
  return (
    <div className="slot-dashed rounded-xl px-4 py-6 text-center">
      <span className="label-code text-ink-muted">{children}</span>
    </div>
  );
}
