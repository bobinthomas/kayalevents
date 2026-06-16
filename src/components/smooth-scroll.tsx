"use client";

import { useEffect } from "react";

/**
 * Initializes Lenis smooth scroll after hydration. Returns nothing — keeps
 * the layout tree flat so this can be code-split without blocking SSR.
 * Respects prefers-reduced-motion; uses native rAF (no GSAP dependency).
 */
export function SmoothScrollInit() {
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) return;

    let lenis: import("lenis").default | null = null;
    let rafId = 0;
    let cancelled = false;
    let removeMotionListener: (() => void) | undefined;

    void import("lenis").then(({ default: Lenis }) => {
      if (cancelled) return;

      lenis = new Lenis({
        lerp: 0.11,
        smoothWheel: true,
        syncTouch: false,
      });

      const raf = (time: number) => {
        lenis?.raf(time);
        rafId = requestAnimationFrame(raf);
      };
      rafId = requestAnimationFrame(raf);

      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      const onMotionChange = () => {
        if (mq.matches) {
          cancelAnimationFrame(rafId);
          lenis?.destroy();
          lenis = null;
        }
      };
      mq.addEventListener("change", onMotionChange);
      removeMotionListener = () => mq.removeEventListener("change", onMotionChange);
    });

    return () => {
      cancelled = true;
      removeMotionListener?.();
      cancelAnimationFrame(rafId);
      lenis?.destroy();
    };
  }, []);

  return null;
}
