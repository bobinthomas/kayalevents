"use client";

import { useEffect } from "react";

/**
 * Initializes Lenis smooth scroll after hydration. Returns nothing — keeps
 * the layout tree flat so this can be code-split without blocking SSR.
 * Respects prefers-reduced-motion; uses native rAF (no GSAP dependency).
 */
export function SmoothScrollInit() {
  useEffect(() => {
    // Belt-and-suspenders against the browser restoring the previous scroll
    // position on a fresh load (the boot script in app/layout.tsx already
    // does this as early as possible, but some browsers re-apply scroll
    // restoration again after layout settles — e.g. once images/fonts load
    // and the page's real height is known — which can override an earlier
    // reset). Re-asserting here (mount) and on `load` covers both cases.
    // Skipped when the URL has a real #hash, since that's an intentional
    // in-page anchor link.
    const resetScroll = () => {
      if (!location.hash) window.scrollTo(0, 0);
    };
    resetScroll();
    window.addEventListener("load", resetScroll, { once: true });

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) {
      return () => window.removeEventListener("load", resetScroll);
    }

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
      window.removeEventListener("load", resetScroll);
      cancelled = true;
      removeMotionListener?.();
      cancelAnimationFrame(rafId);
      lenis?.destroy();
    };
  }, []);

  return null;
}
