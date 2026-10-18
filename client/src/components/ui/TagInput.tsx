import { useState } from "react";

/**
 * Chip-style tag editor — type and press Enter (or comma) to add, click × to
 * remove. Used for required skills on squad cards and "Looking for Team" posts.
 */
export function TagInput({
  value,
  onChange,
  label,
  placeholder = "React, Figma, PyTorch…",
  max = 12,
  suggestions = [],
}: {
  value: string[];
  onChange: (next: string[]) => void;
  label?: string;
  placeholder?: string;
  max?: number;
  suggestions?: string[];
}) {
  const [draft, setDraft] = useState("");

  const add = (raw: string) => {
    const tag = raw.trim().replace(/,$/, "");
    if (!tag || value.includes(tag) || value.length >= max) return;
    onChange([...value, tag]);
  };

  const commit = () => {
    add(draft);
    setDraft("");
  };

  const unused = suggestions.filter((s) => !value.includes(s)).slice(0, 6);

  return (
    <div>
      {label && <span className="label-caps text-ink-muted mb-1.5 block">{label}</span>}
      <div className="border-hairline focus-within:border-ink flex flex-wrap items-center gap-1.5 rounded-lg border bg-surface px-2 py-2 transition-colors">
        {value.map((tag) => (
          <span key={tag} className="label-mono-sm bg-surface-sunk border-hairline inline-flex items-center gap-1 rounded-sm border px-2 py-1">
            {tag}
            <button
              type="button"
              className="press text-ink-muted hover:text-ink"
              aria-label={`Remove ${tag}`}
              onClick={() => onChange(value.filter((v) => v !== tag))}
            >
              ×
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              commit();
            } else if (e.key === "Backspace" && !draft && value.length) {
              onChange(value.slice(0, -1));
            }
          }}
          onBlur={commit}
          placeholder={value.length === 0 ? placeholder : ""}
          className="label-mono-sm min-w-[8rem] flex-1 bg-transparent px-1 py-1 outline-none"
          disabled={value.length >= max}
        />
      </div>
      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
        <span className="label-mono-sm text-ink-muted">{value.length}/{max} · Enter to add</span>
        {unused.map((s) => (
          <button
            key={s}
            type="button"
            className="press label-mono-sm border-hairline text-ink-muted hover:border-ink/40 hover:text-ink rounded-full border px-2 py-0.5"
            onClick={() => add(s)}
          >
            + {s}
          </button>
        ))}
      </div>
    </div>
  );
}
