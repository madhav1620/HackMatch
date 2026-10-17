import React from "react";

/** Hairline input. Pass `label` for the mono caps field label used across Stitch forms. */
export const Input: React.FC<
  React.InputHTMLAttributes<HTMLInputElement> & { label?: string; hint?: string; error?: string }
> = ({ className = "", label, hint, error, id, ...props }) => {
  const inputId = id ?? (label ? `f-${label.replace(/\s+/g, "-").toLowerCase()}` : undefined);
  return (
    <label className="block">
      {label && <span className="label-caps text-ink-muted mb-1.5 block">{label}</span>}
      <input
        id={inputId}
        className={`w-full rounded-lg border bg-surface px-3 py-2 text-sm outline-none transition-colors ${
          error ? "border-error" : "border-hairline focus:border-ink"
        } ${className}`}
        aria-invalid={Boolean(error)}
        {...props}
      />
      {hint && !error && <span className="label-mono-sm text-ink-muted mt-1 block">{hint}</span>}
      {error && <span className="label-mono-sm text-error mt-1 block">{error}</span>}
    </label>
  );
};
