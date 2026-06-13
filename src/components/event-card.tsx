"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Countdown } from "@/components/countdown";
import { Poster } from "@/components/poster";
import { StatusBadge } from "@/components/status-badge";
import { eventCities, eventDateRange, priceRange } from "@/lib/format";
import type { KayalEvent } from "@/lib/types";

/**
 * Event card with spring-physics lift on hover and Ken Burns poster animation.
 * Client component for Framer Motion interactivity.
 */
export function EventCard({ event }: { event: KayalEvent }) {
  const prices = priceRange(event);
  const shouldReduce = useReducedMotion();

  return (
    <motion.div
      whileHover={shouldReduce ? {} : { y: -8 }}
      transition={{ type: "spring", stiffness: 380, damping: 22 }}
      className="h-full"
    >
      <Link
        href={`/events/${event.slug}`}
        className="group block h-full overflow-hidden rounded-2xl border border-border bg-surface transition-colors duration-300 hover:border-lagoon/40"
      >
        {/* Poster with Ken Burns */}
        <div className="relative overflow-hidden">
          <Poster
            src={event.posterImage ?? event.heroImage}
            alt={`${event.title} poster`}
            title={event.title}
            className="aspect-[4/3]"
            sizes="(min-width: 768px) 50vw, 100vw"
            kenBurns
          />
          {/* Lagoon tint on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-lagoon/15 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100 pointer-events-none" />
          <div className="absolute left-4 top-4">
            <StatusBadge status={event.status} />
          </div>
        </div>

        {/* Card body */}
        <div className="space-y-2 p-6">
          <h3 className="headline text-2xl text-sand transition-colors duration-200 group-hover:text-lagoon-bright md:text-3xl">
            {event.title}
          </h3>
          {event.tagline && (
            <p className="text-sm text-sand-muted">{event.tagline}</p>
          )}
          <p className="text-sm text-sand-muted">
            <span className="text-lagoon">{eventDateRange(event)}</span>
            {" · "}
            {eventCities(event)}
          </p>
          {event.status !== "past" && (
            <Countdown
              target={
                [...event.shows].sort((a, b) =>
                  a.start.localeCompare(b.start)
                )[0]?.start ?? ""
              }
              size="sm"
              className="mt-1"
            />
          )}
          {prices && event.status !== "past" && (
            <p className="text-sm text-sand-muted">Tickets {prices}</p>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
