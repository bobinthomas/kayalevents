"use client";

import { useEffect, useRef, type ReactNode } from "react";

/** Scroll-reveal wrapper. CSS handles prefers-reduced-motion (no animation). */
export function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Also reveal elements already above the viewport (anchor jumps)
        if (entry.isIntersecting || entry.boundingClientRect.top < 0) {
          el.classList.add("is-revealed");
          observer.disconnect();
        }
      },
      // Top margin extends far above the viewport so content jumped past
      // (anchor links, fast scrolls) still counts as intersecting.
      { threshold: 0.05, rootMargin: "10000px 0px -40px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
