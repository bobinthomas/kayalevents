import type { Metadata } from "next";
import Link from "next/link";
import { EventCard } from "@/components/event-card";
import { HeroMedia } from "@/components/hero-media";
import { Reveal } from "@/components/reveal";
import { StatusBadge } from "@/components/status-badge";
import {
  getCaseStudies,
  getFeaturedEvent,
  getSiteSettings,
  getTestimonials,
  getUpcomingEvents,
} from "@/lib/content";
import { eventCities, eventDateRange } from "@/lib/format";

export const revalidate = 60;

export const metadata: Metadata = {
  description:
    "Australia's home of South Indian live entertainment. Mohanlal Live, Onam Vibes and more — concerts, national tours, corporate galas and festivals in Melbourne, Sydney, Brisbane, Perth and Adelaide.",
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  const [featured, upcoming, studies, testimonials, settings] =
    await Promise.all([
      getFeaturedEvent(),
      getUpcomingEvents(),
      getCaseStudies(),
      getTestimonials(),
      getSiteSettings(),
    ]);

  const otherUpcoming = upcoming.filter((e) => e.slug !== featured?.slug);

  return (
    <div>
      {/* Full-bleed cinematic hero (R4) */}
      <section className="relative -mt-16 md:-mt-20">
        <HeroMedia
          videoSrc={settings.heroVideo}
          imageSrc={featured?.heroImage ?? featured?.posterImage ?? settings.heroImage}
          alt={featured ? `${featured.title} — hero` : "Kayal Events live show"}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />
        <div className="relative mx-auto flex min-h-dvh max-w-6xl flex-col justify-end px-5 pb-20 pt-36 md:px-8 md:pb-28">
          {featured ? (
            <>
              <div>
                <StatusBadge status={featured.status} />
              </div>
              <h1 className="headline mt-5 max-w-4xl text-5xl md:text-8xl">
                {featured.title}
              </h1>
              <p className="mt-5 text-sm uppercase tracking-[0.22em] text-gold">
                {eventDateRange(featured)} · {eventCities(featured)}
              </p>
              {featured.tagline && (
                <p className="mt-3 max-w-xl text-lg text-ivory-muted">
                  {featured.tagline}
                </p>
              )}
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href={`/events/${featured.slug}`}
                  className="rounded-full bg-gold px-8 py-3.5 text-sm font-semibold text-ink transition hover:bg-gold-bright"
                >
                  {featured.status === "sold-out" ? "Join Waitlist" : "Buy Tickets"}
                </Link>
                <Link
                  href="/events"
                  className="rounded-full border border-ivory/30 px-8 py-3.5 text-sm font-semibold text-ivory transition hover:border-gold hover:text-gold"
                >
                  All Events
                </Link>
              </div>
            </>
          ) : (
            <>
              <p className="eyebrow">Kayal Events</p>
              <h1 className="headline mt-5 max-w-4xl text-5xl md:text-8xl">
                {settings.tagline}
              </h1>
              <div className="mt-8">
                <Link
                  href="/events"
                  className="rounded-full bg-gold px-8 py-3.5 text-sm font-semibold text-ink transition hover:bg-gold-bright"
                >
                  Upcoming Events
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-5 md:px-8">
        {/* Positioning statement */}
        <section className="py-20 md:py-28">
          <Reveal>
            <p className="eyebrow">Who we are</p>
            <h2 className="headline mt-4 max-w-3xl text-3xl leading-tight md:text-5xl">
              We bring South India&apos;s biggest stages to Australia — and
              produce every night like a film premiere.
            </h2>
            <p className="mt-6 max-w-xl text-ivory-muted">
              Concerts and national tours. Corporate galas and community
              festivals. From artist negotiation in Kochi to the final lighting
              cue in Melbourne, Kayal Events delivers end to end.
            </p>
          </Reveal>
        </section>

        {/* Upcoming events */}
        {otherUpcoming.length > 0 && (
          <section className="pb-20 md:pb-28">
            <Reveal className="flex items-end justify-between gap-6">
              <div>
                <p className="eyebrow">What&apos;s on</p>
                <h2 className="headline mt-3 text-3xl md:text-4xl">More events</h2>
              </div>
              <Link
                href="/events"
                className="shrink-0 text-sm font-semibold text-gold transition hover:text-gold-bright"
              >
                View all →
              </Link>
            </Reveal>
            <div className="mt-10 grid gap-8 md:grid-cols-2">
              {otherUpcoming.slice(0, 2).map((event, i) => (
                <Reveal key={event.slug} delay={i * 80}>
                  <EventCard event={event} />
                </Reveal>
              ))}
            </div>
          </section>
        )}

        <div className="hairline" />

        {/* Portfolio teaser */}
        <section className="py-20 md:py-28">
          <Reveal className="flex items-end justify-between gap-6">
            <div>
              <p className="eyebrow">Our work</p>
              <h2 className="headline mt-3 text-3xl md:text-4xl">
                Productions, not functions
              </h2>
            </div>
            <Link
              href="/portfolio"
              className="shrink-0 text-sm font-semibold text-gold transition hover:text-gold-bright"
            >
              All case studies →
            </Link>
          </Reveal>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {studies.slice(0, 3).map((study, i) => (
              <Reveal key={study.slug} delay={i * 80}>
                <Link
                  href={`/portfolio/${study.slug}`}
                  className="group block overflow-hidden rounded-2xl border border-ink-border bg-ink-raised transition hover:border-gold/40"
                >
                  <div className="poster-placeholder aspect-[4/3]" aria-hidden="true" />
                  <div className="p-6">
                    <p className="eyebrow">{study.year}</p>
                    <h3 className="headline mt-2 text-2xl text-ivory group-hover:text-gold-bright">
                      {study.title}
                    </h3>
                    <p className="mt-2 line-clamp-2 text-sm text-ivory-muted">
                      {study.summary}
                    </p>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </section>

        <div className="hairline" />

        {/* Testimonials (prestige layer) */}
        <section className="py-20 md:py-28">
          <Reveal>
            <p className="eyebrow text-center">What they say</p>
          </Reveal>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {testimonials.slice(0, 3).map((t, i) => (
              <Reveal key={t.author} delay={i * 80}>
                <figure className="flex h-full flex-col justify-between rounded-2xl border border-ink-border bg-ink-raised p-7">
                  <blockquote className="font-display text-lg leading-snug text-ivory">
                    “{t.quote}”
                  </blockquote>
                  <figcaption className="mt-5 text-sm text-ivory-muted">
                    <span className="font-semibold text-gold">{t.author}</span>
                    {t.role && <> — {t.role}</>}
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </section>

        {/* B2B CTA */}
        <section className="pb-24 md:pb-32">
          <Reveal>
            <div className="rounded-3xl border border-gold/20 bg-gradient-to-br from-ink-raised to-ink p-10 text-center md:p-16">
              <p className="eyebrow">Corporate · Community · Private</p>
              <h2 className="headline mx-auto mt-4 max-w-2xl text-3xl md:text-5xl">
                Planning an event worth remembering?
              </h2>
              <p className="mx-auto mt-4 max-w-md text-ivory-muted">
                Tell us the occasion — we&apos;ll bring the production.
              </p>
              <Link
                href="/contact"
                className="mt-8 inline-flex items-center justify-center rounded-full bg-gold px-8 py-3.5 text-sm font-semibold text-ink transition hover:bg-gold-bright"
              >
                Start an Inquiry
              </Link>
            </div>
          </Reveal>
        </section>
      </div>
    </div>
  );
}
