import React from "react";

export const Button: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }
> = ({ children, className = "", loading, disabled, ...props }) => (
  <button
    className={`press inline-flex items-center justify-center rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white disabled:opacity-60 ${className}`}
    disabled={disabled || loading}
    {...props}
  >
    {loading ? "…" : children}
  </button>
);

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({
  className = "",
  ...props
}) => (
  <input
    className={`w-full rounded-lg border border-hairline bg-surface px-3 py-2 text-sm outline-none focus:ring-0 ${className}`}
    {...props}
  />
);

export const Modal: React.FC<{
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}> = ({ open, title, children, onClose }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="border-hairline bg-surface rounded-xl border shadow-modal w-full max-w-sm p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button className="text-sm text-ink-muted" onClick={onClose} aria-label="Close">
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};
