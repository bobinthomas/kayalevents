import type { Metadata } from "next";
import { EventCard } from "@/components/event-card";
import { Reveal } from "@/components/reveal";
import { getPastEvents, getUpcomingEvents } from "@/lib/content";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Upcoming Events",
  description:
    "Upcoming Malayalam and South Indian concerts, festivals and live events across Melbourne, Sydney, Brisbane, Perth and Adelaide — presented by Kayal Events.",
  alternates: { canonical: "/events" },
};

export default async function EventsPage() {
  const [upcoming, past] = await Promise.all([
    getUpcomingEvents(),
    getPastEvents(),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-5 py-16 md:px-8 md:py-24">
      <Reveal>
        <p className="eyebrow">What&apos;s on</p>
        <h1 className="headline mt-3 text-4xl md:text-6xl">Upcoming Events</h1>
        <p className="mt-4 max-w-xl text-ivory-muted">
          South India&apos;s biggest names, live in Australia. Tickets sell
          fast — join Kayal Insider for presale access.
        </p>
      </Reveal>

      {upcoming.length > 0 ? (
        <div className="mt-12 grid gap-8 md:grid-cols-2">
          {upcoming.map((event, i) => (
            <Reveal key={event.slug} delay={i * 80}>
              <EventCard event={event} />
            </Reveal>
          ))}
        </div>
      ) : (
        <div className="mt-12 rounded-2xl border border-ink-border bg-ink-raised p-10 text-center">
          <p className="headline text-2xl">The next announcement is coming.</p>
          <p className="mt-2 text-ivory-muted">
            Join Kayal Insider below to hear it first.
          </p>
        </div>
      )}

      {past.length > 0 && (
        <section className="mt-24">
          <Reveal>
            <p className="eyebrow">Previously</p>
            <h2 className="headline mt-3 text-3xl md:text-4xl">Past Events</h2>
          </Reveal>
          <div className="mt-10 grid gap-8 md:grid-cols-2">
            {past.map((event, i) => (
              <Reveal key={event.slug} delay={i * 80}>
                <EventCard event={event} />
              </Reveal>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
