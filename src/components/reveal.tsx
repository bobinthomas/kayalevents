"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Scroll-reveal wrapper (CSS-based for SSR safety).
 * IntersectionObserver adds `.is-revealed` when the element enters the viewport.
 * CSS in globals.css handles the transition — prefers-reduced-motion disables it.
 * Pass variant="wave" for a clip-path wipe-up reveal instead of fade-rise.
 */
export function Reveal({
  children,
  className = "",
  delay = 0,
  variant = "fade",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  variant?: "fade" | "wave";
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.classList.add("is-revealed");
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting || entry.boundingClientRect.top < 0) {
          el.classList.add("is-revealed");
          observer.disconnect();
        }
      },
      // Large top margin ensures content jumped past by anchor links still reveals.
      { threshold: 0.05, rootMargin: "10000px 0px -40px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const baseClass = variant === "wave" ? "reveal-wave" : "reveal";

  return (
    <div
      ref={ref}
      className={`${baseClass} ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
