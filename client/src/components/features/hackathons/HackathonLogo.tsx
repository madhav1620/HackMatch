import { useEffect, useState } from "react";
import { initials } from "../../../lib/format";

export function HackathonLogo({ name, url, size = "md" }: { name: string; url: string | null; size?: "sm" | "md" }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [url]);
  return (
    <div className={`border-hairline bg-surface-sunk flex shrink-0 items-center justify-center overflow-hidden rounded-lg border ${size === "sm" ? "h-11 w-11" : "h-14 w-14"}`}>
      {url && !failed ? (
        <img src={url} alt="" className="h-full w-full object-contain" onError={() => setFailed(true)} />
      ) : (
        <span className="label-code text-ink-muted" aria-hidden>{initials(name)}</span>
      )}
    </div>
  );
}
