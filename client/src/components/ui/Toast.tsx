import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { CheckCircle2, Info, TriangleAlert, X } from "lucide-react";

/**
 * Toast — mirrors the Stitch `Toast Notification Overlay` in
 * `design-reference/profile-light.html`: inverse surface, rounded-xl,
 * mint check glyph, dismiss affordance, slide-up settle (DESIGN.md §6,
 * 240ms via Animotion MI22).
 */

type Kind = "success" | "error" | "info";
type ToastItem = { id: number; message: string; kind: Kind };

type Ctx = { push: (message: string, kind?: Kind) => void };

const ToastCtx = createContext<Ctx | null>(null);

/** Read the nearest toast channel. Throws outside <ToastProvider>. */
export function useToast(): Ctx {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
}

const TONE = {
  success: { Icon: CheckCircle2, glyph: "text-mint-bg", label: "Success" },
  error: { Icon: TriangleAlert, glyph: "text-error-container", label: "Error" },
  info: { Icon: Info, glyph: "text-canvas/70", label: "Notice" },
} as const;

const LIFETIME = 3600;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (message: string, kind: Kind = "success") => {
      const id = nextId.current++;
      setItems((prev) => [...prev.slice(-2), { id, message, kind }]);
    },
    [],
  );

  return (
    <ToastCtx.Provider value={{ push }}>
      {children}

      {items.length > 0 && (
        <div
          className="animate-slide-up fixed inset-x-0 bottom-20 z-[60] flex flex-col items-center gap-2 px-4 md:bottom-6 md:items-end md:px-6"
          role="status"
          aria-live="polite"
        >
          {items.map((t) => (
            <ToastCard key={t.id} item={t} onDismiss={dismiss} />
          ))}
        </div>
      )}
    </ToastCtx.Provider>
  );
}

function ToastCard({ item, onDismiss }: { item: ToastItem; onDismiss: (id: number) => void }) {
  const { Icon, glyph, label } = TONE[item.kind];

  useEffect(() => {
    const timer = window.setTimeout(() => onDismiss(item.id), LIFETIME);
    return () => window.clearTimeout(timer);
  }, [item.id, onDismiss]);

  return (
    <div className="shadow-modal flex w-full max-w-sm items-center gap-3 rounded-xl bg-ink px-4 py-3 text-canvas">
      <span className="shrink-0" aria-hidden>
        <Icon className={`h-4 w-4 ${glyph}`} />
      </span>
      <p className="label-mono-sm min-w-0 flex-1 leading-5">
        <span className="sr-only">{label}: </span>
        {item.message}
      </p>
      <button
        type="button"
        className="press -mr-1 p-1 text-canvas/70 transition-colors hover:text-canvas focus-visible:text-canvas"
        onClick={() => onDismiss(item.id)}
        aria-label="Dismiss notification"
      >
        <X className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}
