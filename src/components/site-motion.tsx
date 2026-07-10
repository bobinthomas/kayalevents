"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { SmoothScrollInit } from "@/components/smooth-scroll";

const LoadingScreen = dynamic(() => import("@/components/LoadingScreen"), {
  ssr: false,
});

/**
 * Client-only motion layer: intro animation + smooth scroll.
 * Code-split so GSAP/Lenis do not block first paint or main layout JS.
 * The intro only plays on the homepage — direct/refreshed loads of inner
 * pages skip it entirely rather than replaying the brand animation.
 */
export function SiteMotion() {
  const pathname = usePathname();
  return (
    <>
      <SmoothScrollInit />
      {pathname === "/" && <LoadingScreen />}
    </>
  );
}
