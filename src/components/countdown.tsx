"use client";

import { useEffect, useState } from "react";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  ended: boolean;
}

function compute(target: string): TimeLeft {
  const t = new Date(target).getTime();
  if (isNaN(t)) return { days: 0, hours: 0, minutes: 0, seconds: 0, ended: true };
  const ms = t - Date.now();
  if (ms <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, ended: true };
  const s = Math.floor(ms / 1000);
  return {
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
    ended: false,
  };
}

/**
 * Live countdown to a future ISO 8601 datetime.
 * Hydration-safe: initial state is null (no markup), client sets the real value
 * after mount — avoids server/client timestamp mismatch.
 * Returns null when the target has passed (callers do not need to guard this).
 */
export function Countdown({
  target,
  className = "",
  size = "lg",
}: {
  target: string;
  className?: string;
  /** lg — large numbered boxes for heroes/detail pages; sm — compact inline for cards */
  size?: "lg" | "sm";
}) {
  const [time, setTime] = useState<TimeLeft | null>(null);

  useEffect(() => {
    if (!target) return;
    const tick = () => setTime(compute(target));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);

  if (!target || time === null) {
    // Reserve space on first render to avoid layout shift once value appears
    return <div className={`${size === "lg" ? "h-11" : "h-5"} ${className}`} aria-hidden="true" />;
  }
  if (time.ended) return null;

  if (size === "sm") {
    // Compact: "3d 14h 22m" — no seconds to keep cards uncluttered
    const parts = [
      time.days > 0 ? `${time.days}d` : null,
      time.days > 0 || time.hours > 0 ? `${time.hours}h` : null,
      `${String(time.minutes).padStart(2, "0")}m`,
    ].filter(Boolean);
    return (
      <p
        className={`text-xs tabular-nums text-sand-muted ${className}`}
        aria-label={`${time.days} days ${time.hours} hours ${time.minutes} minutes remaining`}
      >
        {parts.join(" ")} to go
      </p>
    );
  }

  // Large: four labelled boxes
  const units = [
    { v: time.days, l: "days" },
    { v: time.hours, l: "hrs" },
    { v: time.minutes, l: "min" },
    { v: time.seconds, l: "sec" },
  ] as const;

  return (
    <div
      className={`flex items-end gap-4 ${className}`}
      aria-label={`${time.days} days, ${time.hours} hours, ${time.minutes} minutes, ${time.seconds} seconds until the event`}
    >
      {units.map(({ v, l }) => (
        <div key={l} className="text-center">
          <div className="tabular-nums font-display text-2xl leading-none text-sand">
            {String(v).padStart(2, "0")}
          </div>
          <div className="mt-0.5 text-[10px] uppercase tracking-[0.15em] text-sand-muted">
            {l}
          </div>
        </div>
      ))}
    </div>
  );
}
