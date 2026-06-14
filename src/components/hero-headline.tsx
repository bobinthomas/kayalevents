"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { StatusBadge } from "@/components/status-badge";
import type { EventStatus } from "@/lib/types";

function subscribeMotion(cb: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

function fadeUp(delay: number): React.CSSProperties {
  return { animation: `kayal-fade-in 0.7s cubic-bezier(0.22,1,0.36,1) ${delay}s both` };
}

export function HeroHeadline({
  eyebrow,
  title,
  tagline,
  meta,
  status,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
}: {
  eyebrow?: string;
  title: string;
  tagline?: string;
  meta?: string;
  status?: EventStatus;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
}) {
  const shouldReduce = useSyncExternalStore(
    subscribeMotion,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => true,
  );

  const words = title.split(" ");
  const a = shouldReduce ? undefined : fadeUp;

  return (
    <div>
      {status ? (
        <div className="kayal-anim" style={a ? a(0.1) : undefined}>
          <StatusBadge status={status} />
        </div>
      ) : eyebrow ? (
        <p className="eyebrow kayal-anim" style={a ? a(0.1) : undefined}>
          {eyebrow}
        </p>
      ) : null}

      <h1 className="headline mt-5 max-w-4xl text-5xl md:text-8xl">
        {words.map((word, i) => (
          <span
            key={i}
            className={`mr-[0.22em] inline-block kayal-anim${i === 0 ? " text-gradient" : " text-sand"}`}
            style={
              shouldReduce
                ? undefined
                : {
                    animation: `kayal-fade-up 0.9s cubic-bezier(0.22,1,0.36,1) ${0.3 + i * 0.08}s both`,
                  }
            }
          >
            {word}
          </span>
        ))}
      </h1>

      {meta && (
        <p
          className="mt-5 text-sm uppercase tracking-[0.22em] text-lagoon kayal-anim"
          style={a ? a(0.85) : undefined}
        >
          {meta}
        </p>
      )}

      {tagline && (
        <p className="mt-3 max-w-xl text-lg text-sand-muted kayal-anim" style={a ? a(0.95) : undefined}>
          {tagline}
        </p>
      )}

      <div className="mt-8 flex flex-wrap gap-4 kayal-anim" style={a ? a(1.05) : undefined}>
        <Link
          href={primaryHref}
          className="coral-glow inline-flex items-center justify-center rounded-full bg-coral px-8 py-3.5 text-sm font-semibold tracking-wide text-sand transition-all duration-200 hover:scale-[1.03] hover:bg-coral-bright"
        >
          {primaryLabel}
        </Link>
        {secondaryHref && secondaryLabel && (
          <Link
            href={secondaryHref}
            className="inline-flex items-center justify-center rounded-full border border-sand/20 px-8 py-3.5 text-sm font-semibold text-sand transition-all duration-200 hover:border-lagoon hover:text-lagoon"
          >
            {secondaryLabel}
          </Link>
        )}
      </div>
    </div>
  );
}
