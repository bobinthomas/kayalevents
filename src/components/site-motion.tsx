"use client";

import dynamic from "next/dynamic";
import { SmoothScrollInit } from "@/components/smooth-scroll";

const LoadingScreen = dynamic(() => import("@/components/LoadingScreen"), {
  ssr: false,
});

/**
 * Client-only motion layer: intro animation + smooth scroll.
 * Code-split so GSAP/Lenis do not block first paint or main layout JS.
 */
export function SiteMotion() {
  return (
    <>
      <SmoothScrollInit />
      <LoadingScreen />
    </>
  );
}
