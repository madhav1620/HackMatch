import React from "react";

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({
  className = "",
  ...props
}) => (
  <input
    className={`w-full rounded-lg border border-hairline bg-surface px-3 py-2 text-sm outline-none focus:ring-0 ${className}`}
    {...props}
  />
);
