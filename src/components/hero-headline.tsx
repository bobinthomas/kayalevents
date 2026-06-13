"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { StatusBadge } from "@/components/status-badge";
import type { EventStatus } from "@/lib/types";

const WORD_VARIANTS = {
  hidden: { opacity: 0, y: 36 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.3 + i * 0.08,
      duration: 0.9,
      ease: [0.22, 1, 0.36, 1] as number[],
    },
  }),
};

const FADE_UP = (delay: number) => ({
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { delay, duration: 0.7, ease: [0.22, 1, 0.36, 1] as number[] },
  },
});

/**
 * Client-only animated hero headline.
 * Words stagger up; supporting text fades in after.
 * Falls back to instant-visible when prefers-reduced-motion is set.
 */
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
  const shouldReduce = useReducedMotion();
  const words = title.split(" ");

  const instant = shouldReduce === true;

  return (
    <div>
      {/* Status badge or eyebrow label */}
      {status ? (
        <motion.div
          variants={instant ? {} : FADE_UP(0.1)}
          initial={instant ? false : "hidden"}
          animate="visible"
        >
          <StatusBadge status={status} />
        </motion.div>
      ) : eyebrow ? (
        <motion.p
          className="eyebrow"
          variants={instant ? {} : FADE_UP(0.1)}
          initial={instant ? false : "hidden"}
          animate="visible"
        >
          {eyebrow}
        </motion.p>
      ) : null}

      {/* Staggered headline words */}
      <h1 className="headline mt-5 max-w-4xl text-5xl md:text-8xl">
        {words.map((word, i) => (
          <motion.span
            key={i}
            className={`mr-[0.22em] inline-block ${
              i === 0 ? "text-gradient" : "text-sand"
            }`}
            custom={i}
            variants={instant ? {} : WORD_VARIANTS}
            initial={instant ? false : "hidden"}
            animate="visible"
          >
            {word}
          </motion.span>
        ))}
      </h1>

      {/* Meta (date · cities) */}
      {meta && (
        <motion.p
          className="mt-5 text-sm uppercase tracking-[0.22em] text-lagoon"
          variants={instant ? {} : FADE_UP(0.85)}
          initial={instant ? false : "hidden"}
          animate="visible"
        >
          {meta}
        </motion.p>
      )}

      {/* Tagline */}
      {tagline && (
        <motion.p
          className="mt-3 max-w-xl text-lg text-sand-muted"
          variants={instant ? {} : FADE_UP(0.95)}
          initial={instant ? false : "hidden"}
          animate="visible"
        >
          {tagline}
        </motion.p>
      )}

      {/* CTAs */}
      <motion.div
        className="mt-8 flex flex-wrap gap-4"
        variants={instant ? {} : FADE_UP(1.05)}
        initial={instant ? false : "hidden"}
        animate="visible"
      >
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
      </motion.div>
    </div>
  );
}
