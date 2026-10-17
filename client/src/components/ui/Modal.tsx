import type { ReactNode } from "react";

/** Level-3 modal — Animotion MI24 scale-in + backdrop fade (DESIGN.md §6). */
export function Modal({
  open,
  title,
  eyebrow,
  children,
  onClose,
  wide = false,
}: {
  open: boolean;
  title: string;
  eyebrow?: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  if (!open) return null;
  return (
    <div
      className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
    >
      <div
        className={`animate-scale-in border-hairline bg-surface shadow-modal max-h-full w-full overflow-y-auto rounded-xl border p-6 ${
          wide ? "max-w-xl" : "max-w-sm"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            {eyebrow && <p className="label-caps text-ink-muted mb-1">{eyebrow}</p>}
            <h2 className="font-display text-lg font-semibold">{title}</h2>
          </div>
          <button className="press label-mono-sm text-ink-muted" onClick={onClose} aria-label="Close">
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
