import type { Metadata } from "next";
import Link from "next/link";
import { EventCard } from "@/components/event-card";
import { HeroHeadline } from "@/components/hero-headline";
import { HeroMedia } from "@/components/hero-media";
import { Marquee } from "@/components/marquee";
import { Reveal } from "@/components/reveal";
import { StatCounter } from "@/components/stat-counter";
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

  // Derive marquee items from content — no hardcoded strings
  const marqueeItems = Array.from(
    new Set([
      ...upcoming.flatMap((e) => e.artists),
      ...upcoming.flatMap((e) => e.shows.map((s) => s.city)),
      ...studies.map((s) => s.title),
    ])
  );

  // Stats derived from content
  const uniqueCities = new Set(
    upcoming.flatMap((e) => e.shows.map((s) => s.city))
  ).size;

  return (
    <div>
      {/* ── HERO ────────────────────────────────────────────── */}
      <section className="relative -mt-16 md:-mt-20" aria-label="Hero">
        <HeroMedia
          videoSrc={settings.heroVideo}
          imageSrc={
            featured?.heroImage ?? featured?.posterImage ?? settings.heroImage
          }
          alt={featured ? `${featured.title} — hero` : "Kayal Events live show"}
        />
        {/* Gradient scrim */}
        <div className="absolute inset-0 bg-gradient-to-t from-marine-black via-marine-black/45 to-transparent" />
        {/* Lagoon ambient ripple */}
        <div className="hero-ripple pointer-events-none absolute inset-0" aria-hidden="true" />

        <div className="relative mx-auto flex min-h-dvh max-w-6xl flex-col justify-end px-5 pb-20 pt-36 md:px-8 md:pb-28">
          {featured ? (
            <HeroHeadline
              title={featured.title}
              tagline={featured.tagline}
              meta={`${eventDateRange(featured)} · ${eventCities(featured)}`}
              status={featured.status}
              primaryHref={`/events/${featured.slug}`}
              primaryLabel={
                featured.status === "sold-out" ? "Join Waitlist" : "Buy Tickets"
              }
              secondaryHref="/events"
              secondaryLabel="All Events"
            />
          ) : (
            <HeroHeadline
              eyebrow="Kayal Events"
              title={settings.tagline}
              primaryHref="/events"
              primaryLabel="Upcoming Events"
            />
          )}
        </div>
      </section>

      {/* ── MARQUEE STRIP ────────────────────────────────────── */}
      {marqueeItems.length > 0 && (
        <div className="border-y border-border/40 bg-surface/60 py-5">
          <Marquee items={marqueeItems} />
        </div>
      )}

      {/* ── STATS BAR ────────────────────────────────────────── */}
      {(upcoming.length > 0 || studies.length > 0) && (
        <section
          className="relative overflow-hidden border-b border-border/40 bg-surface py-10"
          aria-label="At a glance"
        >
          <div className="lagoon-wash pointer-events-none absolute inset-0" aria-hidden="true" />
          <div className="relative mx-auto max-w-6xl px-5 md:px-8">
            <dl className="grid grid-cols-2 gap-6 md:grid-cols-4">
              {[
                {
                  value: upcoming.length,
                  suffix: "+",
                  label: "Upcoming shows",
                },
                {
                  value: Math.max(uniqueCities, upcoming.length > 0 ? 1 : 0),
                  suffix: "",
                  label: "Cities on tour",
                },
                {
                  value: studies.length,
                  suffix: "+",
                  label: "Productions delivered",
                },
                {
                  value:
                    upcoming.flatMap((e) => e.artists).length +
                    studies.length * 2,
                  suffix: "+",
                  label: "Artists brought to AU",
                },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <dt className="sr-only">{stat.label}</dt>
                  <dd
                    className="headline text-4xl text-gradient md:text-5xl"
                    aria-label={`${stat.value}${stat.suffix} ${stat.label}`}
                  >
                    <StatCounter value={stat.value} suffix={stat.suffix} />
                  </dd>
                  <p className="mt-2 text-xs uppercase tracking-widest text-sand-muted">
                    {stat.label}
                  </p>
                </div>
              ))}
            </dl>
          </div>
        </section>
      )}

      <div className="mx-auto max-w-6xl px-5 md:px-8">
        {/* ── POSITIONING STATEMENT ────────────────────────────── */}
        <section className="py-20 md:py-28">
          <Reveal>
            <p className="eyebrow">Who we are</p>
            <h2 className="headline mt-4 max-w-3xl text-3xl leading-tight md:text-5xl">
              We bring South India&apos;s biggest stages to Australia — and
              produce every night like a film premiere.
            </h2>
            <p className="mt-6 max-w-xl text-sand-muted">
              Concerts and national tours. Corporate galas and community
              festivals. From artist negotiation in Kochi to the final lighting
              cue in Melbourne, Kayal Events delivers end to end.
            </p>
          </Reveal>
        </section>

        {/* ── UPCOMING EVENTS ──────────────────────────────────── */}
        {otherUpcoming.length > 0 && (
          <section className="pb-20 md:pb-28">
            <Reveal className="flex items-end justify-between gap-6">
              <div>
                <p className="eyebrow">What&apos;s on</p>
                <h2 className="headline mt-3 text-3xl md:text-4xl">
                  More events
                </h2>
              </div>
              <Link
                href="/events"
                className="shrink-0 text-sm font-semibold text-lagoon transition hover:text-lagoon-bright"
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

        {/* ── PORTFOLIO TEASER ──────────────────────────────────── */}
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
              className="shrink-0 text-sm font-semibold text-lagoon transition hover:text-lagoon-bright"
            >
              All case studies →
            </Link>
          </Reveal>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {studies.slice(0, 3).map((study, i) => (
              <Reveal key={study.slug} delay={i * 80}>
                <Link
                  href={`/portfolio/${study.slug}`}
                  className="group block overflow-hidden rounded-2xl border border-border bg-surface transition-all duration-300 hover:border-lagoon/40"
                >
                  <div
                    className="poster-placeholder aspect-[4/3] transition-transform duration-700 group-hover:scale-[1.02]"
                    aria-hidden="true"
                  />
                  <div className="p-6">
                    <p className="eyebrow">{study.year}</p>
                    <h3 className="headline mt-2 text-2xl text-sand transition-colors duration-200 group-hover:text-lagoon-bright">
                      {study.title}
                    </h3>
                    <p className="mt-2 line-clamp-2 text-sm text-sand-muted">
                      {study.summary}
                    </p>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </section>

        <div className="hairline" />

        {/* ── TESTIMONIALS ──────────────────────────────────────── */}
        {testimonials.length > 0 && (
          <section className="py-20 md:py-28">
            <Reveal>
              <p className="eyebrow text-center">What they say</p>
            </Reveal>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {testimonials.slice(0, 3).map((t, i) => (
                <Reveal key={t.author} delay={i * 80}>
                  <figure className="flex h-full flex-col justify-between rounded-2xl border border-border bg-surface p-7 transition-colors hover:border-lagoon/30">
                    <blockquote className="font-display text-lg leading-snug text-sand">
                      &ldquo;{t.quote}&rdquo;
                    </blockquote>
                    <figcaption className="mt-5 text-sm text-sand-muted">
                      <span className="font-semibold text-lagoon">{t.author}</span>
                      {t.role && <> — {t.role}</>}
                    </figcaption>
                  </figure>
                </Reveal>
              ))}
            </div>
          </section>
        )}

        {/* ── B2B CTA ───────────────────────────────────────────── */}
        <section className="pb-24 md:pb-32">
          <Reveal>
            <div className="relative overflow-hidden rounded-3xl border border-lagoon/20 bg-surface p-10 text-center md:p-16">
              {/* Lagoon glow accent */}
              <div
                className="pointer-events-none absolute inset-0 lagoon-wash"
                aria-hidden="true"
              />
              <div className="relative">
                <p className="eyebrow">Corporate · Community · Private</p>
                <h2 className="headline mx-auto mt-4 max-w-2xl text-3xl md:text-5xl">
                  Planning an event worth remembering?
                </h2>
                <p className="mx-auto mt-4 max-w-md text-sand-muted">
                  Tell us the occasion — we&apos;ll bring the production.
                </p>
                <Link
                  href="/contact"
                  className="coral-glow mt-8 inline-flex items-center justify-center rounded-full bg-coral px-8 py-3.5 text-sm font-semibold tracking-wide text-sand transition-all duration-200 hover:scale-[1.03] hover:bg-coral-bright"
                >
                  Start an Inquiry
                </Link>
              </div>
            </div>
          </Reveal>
        </section>
      </div>
    </div>
  );
}
