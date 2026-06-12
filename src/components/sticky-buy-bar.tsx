"use client";

import { useEffect, useState } from "react";
import { track } from "@/lib/analytics";
import { priceRange } from "@/lib/format";
import type { KayalEvent } from "@/lib/types";

/**
 * Persistent Buy Tickets bar on event pages (R2). Appears after the user
 * scrolls past the hero so it never covers the primary CTA at load.
 */
export function StickyBuyBar({ event }: { event: KayalEvent }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 480);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const prices = priceRange(event);

  let label = "Buy Tickets";
  let href = event.shows.find((s) => s.ticketUrl)?.ticketUrl ?? "#tickets";
  let isExternal = href.startsWith("http");

  if (event.status === "sold-out") {
    label = "Join Waitlist";
    href = "#waitlist";
    isExternal = false;
  } else if (event.status === "past") {
    label = "View Gallery";
    href = "/portfolio";
    isExternal = false;
  } else if (event.shows.length > 1) {
    // Multi-city: send to the per-city ticket section rather than one link
    href = "#tickets";
    isExternal = false;
  }

  return (
    <div
      aria-hidden={!visible}
      className={`fixed inset-x-0 bottom-0 z-30 border-t border-ink-border bg-ink/95 backdrop-blur transition-transform duration-300 ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3 pr-20 md:px-8">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ivory">{event.title}</p>
          {prices && event.status !== "past" && (
            <p className="text-xs text-ivory-muted">Tickets {prices}</p>
          )}
        </div>
        <a
          href={href}
          target={isExternal ? "_blank" : undefined}
          rel={isExternal ? "noopener noreferrer" : undefined}
          tabIndex={visible ? 0 : -1}
          onClick={() =>
            isExternal &&
            track("buy_ticket_click", { event_name: event.title, placement: "sticky" })
          }
          className="shrink-0 rounded-full bg-gold px-6 py-2.5 text-sm font-semibold text-ink transition hover:bg-gold-bright"
        >
          {label}
        </a>
      </div>
    </div>
  );
}
