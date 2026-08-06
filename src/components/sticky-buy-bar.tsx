"use client";

import { useEffect, useState } from "react";
import { track } from "@/lib/analytics";
import { priceRange } from "@/lib/format";
import type { KayalEvent } from "@/lib/types";

/**
 * Persistent Buy Tickets bar on event pages. Appears after the user
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

  const hasAnyTicketUrl = event.shows.some((s) => s.ticketUrl);

  let label = hasAnyTicketUrl ? "Buy Tickets" : "Contact for Details";
  let href = hasAnyTicketUrl
    ? (event.shows.find((s) => s.ticketUrl)?.ticketUrl ?? "#tickets")
    : "/contact";
  let isExternal = href.startsWith("http");

  if (event.status === "sold-out") {
    label = "Join Waitlist";
    href = "#waitlist";
    isExternal = false;
  } else if (event.status === "past") {
    label = "View Gallery";
    href = "/portfolio";
    isExternal = false;
  } else if (hasAnyTicketUrl && event.shows.length > 1) {
    href = "#tickets";
    isExternal = false;
  }

  return (
    <div
      inert={!visible}
      className={`fixed inset-x-0 bottom-0 z-30 border-t border-border/60 bg-marine-black/92 backdrop-blur-xl transition-transform duration-300 ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3 pr-20 md:px-8">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-sand">
            {event.title}
          </p>
          {prices && event.status !== "past" && (
            <p className="text-xs text-sand-muted">Tickets {prices}</p>
          )}
        </div>
        <a
          href={href}
          target={isExternal ? "_blank" : undefined}
          rel={isExternal ? "noopener noreferrer" : undefined}
          onClick={() =>
            isExternal &&
            track("buy_ticket_click", {
              event_name: event.title,
              placement: "sticky",
            })
          }
          className="gradient-border coral-glow shrink-0 rounded-full bg-coral px-6 py-2.5 text-sm font-semibold tracking-wide text-sand transition-all hover:bg-coral-bright"
        >
          {label}
        </a>
      </div>
    </div>
  );
}
