"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { Countdown } from "@/components/countdown";
import { Poster } from "@/components/poster";
import { StatusBadge } from "@/components/status-badge";
import { eventCities, eventDateRange, priceRange } from "@/lib/format";
import type { KayalEvent } from "@/lib/types";

function subscribeMotion(cb: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

export function EventCard({ event }: { event: KayalEvent }) {
  const prices = priceRange(event);
  const shouldReduce = useSyncExternalStore(
    subscribeMotion,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => true,
  );

  return (
    <div className={`h-full${shouldReduce ? "" : " transition-transform duration-300 ease-out hover:-translate-y-2"}`}>
      <Link
        href={`/events/${event.slug}`}
        className="gradient-border group block h-full overflow-hidden rounded-2xl border border-border bg-surface transition-colors duration-300 hover:border-lagoon/40"
      >
        {/* Poster with Ken Burns */}
        <div className="relative overflow-hidden">
          <Poster
            src={event.heroImage ?? event.posterImage}
            alt={event.title}
            className="relative aspect-[4/3]"
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 384px"
          />
          {/* Gradient */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-surface/80 via-transparent to-transparent" />
          {/* Status badge */}
          {event.status && (
            <div className="absolute left-4 top-4">
              <StatusBadge status={event.status} />
            </div>
          )}
        </div>

        {/* Body */}
        <div className="flex flex-col gap-3 p-5">
          <h3 className="font-display text-xl leading-snug text-sand group-hover:text-lagoon transition-colors duration-200">
            {event.title}
          </h3>

          {event.tagline && (
            <p className="text-sm text-sand-muted line-clamp-2">{event.tagline}</p>
          )}

          <div className="mt-auto flex flex-col gap-1.5 pt-2">
            {event.shows.length > 0 && (
              <p className="text-xs uppercase tracking-wide text-lagoon">
                {eventDateRange(event)} · {eventCities(event)}
              </p>
            )}

            {prices && (
              <p className="text-xs text-sand-muted">{prices}</p>
            )}
          </div>

          {event.shows[0]?.start && (
            <Countdown target={event.shows[0].start} size="sm" className="mt-1" />
          )}
        </div>
      </Link>
    </div>
  );
}
