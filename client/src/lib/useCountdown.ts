import { useEffect, useMemo, useState } from "react";

export type Countdown = {
  /** Signed ms remaining (negative once past the deadline). */
  ms: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  expired: boolean;
  /** True when < 24h remain — drives the amber, pulsing badge. */
  urgent: boolean;
  /** "06D 14H 22M 09S" — JetBrains Mono countdown per the Stitch screens. */
  label: string;
};

const pad = (n: number) => String(Math.max(0, n)).padStart(2, "0");

export function computeCountdown(target: string | number | Date, now: number = Date.now()): Countdown {
  const at = new Date(target).getTime();
  const diff = Number.isFinite(at) ? at - now : 0;
  const abs = Math.abs(diff);

  return {
    ms: diff,
    days: Math.floor(abs / 86400000),
    hours: Math.floor((abs % 86400000) / 3600000),
    minutes: Math.floor((abs % 3600000) / 60000),
    seconds: Math.floor((abs % 60000) / 1000),
    expired: diff <= 0,
    urgent: diff > 0 && diff < 24 * 3600 * 1000,
    label: `${pad(Math.floor(abs / 86400000))}D ${pad(Math.floor((abs % 86400000) / 3600000))}H ${pad(
      Math.floor((abs % 3600000) / 60000),
    )}M ${pad(Math.floor((abs % 60000) / 1000))}S`,
  };
}

/**
 * Live 1s countdown. `enabled=false` freezes the value (used for past deadlines
 * so we don't run a timer that can never change anything).
 */
export function useCountdown(target: string | undefined, enabled = true): Countdown | null {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!enabled || !target) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [enabled, target]);

  return useMemo(() => (target ? computeCountdown(target, now) : null), [target, now]);
}
