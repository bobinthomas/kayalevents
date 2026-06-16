"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * Wraps the site in Lenis smooth scroll and wires it to GSAP ScrollTrigger
 * so scroll-triggered animations stay in sync with the smooth scroll offset.
 * Destroyed on unmount; respects prefers-reduced-motion at the OS level.
 */
export function SmoothScroll({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) return;

    const lenis = new Lenis({
      lerp: 0.11,
      smoothWheel: true,
      syncTouch: false,
    });

    // Keep a stable reference to the ticker callback so we can remove it later
    const tickerCallback = (time: number) => {
      lenis.raf(time * 1000);
    };

    // Sync Lenis RAF with GSAP ticker so ScrollTrigger positions are correct
    gsap.ticker.add(tickerCallback);
    gsap.ticker.lagSmoothing(0);

    // Destroy Lenis if the user enables reduced-motion while the page is open
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onMotionChange = () => {
      if (mq.matches) {
        gsap.ticker.remove(tickerCallback);
        lenis.destroy();
      }
    };
    mq.addEventListener("change", onMotionChange);

    return () => {
      mq.removeEventListener("change", onMotionChange);
      gsap.ticker.remove(tickerCallback);
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
