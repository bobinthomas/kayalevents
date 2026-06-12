"use client";

import { useSyncExternalStore } from "react";
import { Poster } from "@/components/poster";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(callback: () => void) {
  const mq = window.matchMedia(REDUCED_MOTION_QUERY);
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}

/**
 * Full-bleed hero media (R4): muted, lazy-loaded video loop with a graceful
 * poster fallback on reduced-motion preference or when no video is provided.
 */
export function HeroMedia({
  videoSrc,
  imageSrc,
  alt,
}: {
  videoSrc?: string;
  imageSrc?: string;
  alt: string;
}) {
  const prefersReducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_MOTION_QUERY).matches,
    () => true // server: render the poster only; video mounts client-side
  );
  const showVideo = Boolean(videoSrc) && !prefersReducedMotion;

  return (
    <div className="absolute inset-0 overflow-hidden">
      <Poster src={imageSrc} alt={alt} className="absolute inset-0" priority />
      {showVideo && videoSrc && (
        <video
          className="absolute inset-0 h-full w-full object-cover"
          src={videoSrc}
          poster={imageSrc}
          autoPlay
          muted
          loop
          playsInline
          preload="none"
          aria-hidden="true"
        />
      )}
    </div>
  );
}
