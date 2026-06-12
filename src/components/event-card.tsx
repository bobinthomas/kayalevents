import Link from "next/link";
import { Poster } from "@/components/poster";
import { StatusBadge } from "@/components/status-badge";
import { eventCities, eventDateRange, priceRange } from "@/lib/format";
import type { KayalEvent } from "@/lib/types";

export function EventCard({ event }: { event: KayalEvent }) {
  const prices = priceRange(event);
  return (
    <Link
      href={`/events/${event.slug}`}
      className="group block overflow-hidden rounded-2xl border border-ink-border bg-ink-raised transition hover:border-gold/40"
    >
      <div className="relative">
        <Poster
          src={event.posterImage ?? event.heroImage}
          alt={`${event.title} poster`}
          title={event.title}
          className="aspect-[4/3] transition-transform duration-700 group-hover:scale-[1.02]"
          sizes="(min-width: 768px) 50vw, 100vw"
        />
        <div className="absolute left-4 top-4">
          <StatusBadge status={event.status} />
        </div>
      </div>
      <div className="space-y-2 p-6">
        <h3 className="headline text-2xl text-ivory group-hover:text-gold-bright md:text-3xl">
          {event.title}
        </h3>
        {event.tagline && (
          <p className="text-sm text-ivory-muted">{event.tagline}</p>
        )}
        <p className="text-sm text-ivory-muted">
          <span className="text-gold">{eventDateRange(event)}</span>
          {" · "}
          {eventCities(event)}
        </p>
        {prices && event.status !== "past" && (
          <p className="text-sm text-ivory-muted">Tickets {prices}</p>
        )}
      </div>
    </Link>
  );
}
