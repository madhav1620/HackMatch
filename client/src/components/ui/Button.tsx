import React from "react";

type Variant = "ink" | "accent" | "outline" | "ghost";
type Size = "sm" | "md";

const VARIANTS: Record<Variant, string> = {
  ink: "bg-ink text-white border border-transparent hover:bg-ink/90",
  // Conversion CTA. Uses the deep brand orange (primary-container → primary) rather
  // than the vivid `accent` fill, so white label text clears WCAG AA (4.66:1 base,
  // 6.72:1 hover). `--color-accent` stays reserved for non-text fills/live states.
  accent:
    "bg-primary-container text-white border border-transparent hover:bg-primary",
  outline: "bg-surface text-ink border border-hairline hover:border-ink/40",
  ghost: "bg-transparent text-ink-muted border border-transparent hover:text-ink",
};

const SIZES: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
};

/**
 * Tactile button. `accent` is reserved for conversion actions only
 * (design system rule: orange = primary focal CTA).
 */
export const Button: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean; variant?: Variant; size?: Size }
> = ({ children, className = "", loading, disabled, variant = "ink", size = "md", ...props }) => (
  <button
    className={`press inline-flex items-center justify-center gap-1.5 rounded-lg font-medium disabled:opacity-60 disabled:cursor-not-allowed ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
    disabled={disabled || loading}
    {...props}
  >
    {loading ? "…" : children}
  </button>
);
