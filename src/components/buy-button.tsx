"use client";

import { track } from "@/lib/analytics";

export function BuyButton({
  href,
  eventName,
  city,
  label = "Buy Tickets",
  className = "",
}: {
  href: string;
  eventName: string;
  city?: string;
  label?: string;
  className?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => track("buy_ticket_click", { event_name: eventName, city })}
      className={`inline-flex items-center justify-center rounded-full bg-gold px-7 py-3.5 text-sm font-semibold tracking-wide text-ink transition hover:bg-gold-bright ${className}`}
    >
      {label}
    </a>
  );
}
