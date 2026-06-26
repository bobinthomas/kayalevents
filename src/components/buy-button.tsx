"use client";

import { track } from "@/lib/analytics";

/**
 * Primary ticket CTA — coral with glow, opens in new tab.
 * Fires the buy_ticket_click analytics event on every click.
 */
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
      className={`gradient-border coral-glow inline-flex items-center justify-center rounded-full bg-coral px-7 py-3.5 text-sm font-semibold tracking-wide text-sand transition-all duration-200 hover:scale-[1.03] hover:bg-coral-bright ${className}`}
    >
      {label}
      <span className="sr-only"> (opens in new tab)</span>
    </a>
  );
}
