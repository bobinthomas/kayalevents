import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { BuyButton } from "@/components/buy-button";
import { InsiderForm } from "@/components/insider-form";
import { Poster } from "@/components/poster";
import { Reveal } from "@/components/reveal";
import { StatusBadge } from "@/components/status-badge";
import { StickyBuyBar } from "@/components/sticky-buy-bar";
import { getEvent, getEvents, getSiteSettings } from "@/lib/content";
import {
  eventCities,
  eventDateRange,
  formatShowDate,
  formatShowTime,
  priceRange,
} from "@/lib/format";
import type { KayalEvent, SiteSettings } from "@/lib/types";

export const revalidate = 60;

export async function generateStaticParams() {
  const events = await getEvents();
  return events.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEvent(slug);
  if (!event) return {};
  const description = `${event.title} — ${eventDateRange(event)} in ${eventCities(
    event
  )}. Official tickets from Kayal Events.`;
  return {
    title: event.title,
    description,
    alternates: { canonical: `/events/${event.slug}` },
    openGraph: {
      title: event.title,
      description,
      ...(event.posterImage || event.heroImage
        ? { images: [{ url: (event.posterImage ?? event.heroImage)! }] }
        : {}),
    },
  };
}

function eventJsonLd(event: KayalEvent, settings: SiteSettings) {
  const availability: Record<string, string> = {
    "on-sale": "https://schema.org/InStock",
    "selling-fast": "https://schema.org/LimitedAvailability",
    "sold-out": "https://schema.org/SoldOut",
    past: "https://schema.org/SoldOut",
  };
  return event.shows.map((show) => ({
    "@context": "https://schema.org",
    "@type": "Event",
    name: `${event.title} — ${show.city}`,
    startDate: show.start,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name: show.venue,
      address: { "@type": "PostalAddress", addressLocality: show.city, addressCountry: "AU" },
    },
    ...(event.posterImage || event.heroImage
      ? { image: [event.posterImage ?? event.heroImage] }
      : {}),
    description: event.description,
    performer: event.artists.map((name) => ({ "@type": "Person", name })),
    organizer: {
      "@type": "Organization",
      name: settings.siteName,
      url: settings.baseUrl,
    },
    ...(show.ticketUrl
      ? {
          offers: event.ticketTiers.map((tier) => ({
            "@type": "Offer",
            name: tier.name,
            price: tier.price.replace(/[^0-9.]/g, ""),
            priceCurrency: "AUD",
            url: show.ticketUrl,
            availability:
              show.soldOut === true
                ? "https://schema.org/SoldOut"
                : availability[event.status],
          })),
        }
      : {}),
  }));
}

export default async function EventPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [event, settings] = await Promise.all([getEvent(slug), getSiteSettings()]);
  if (!event) notFound();

  const prices = priceRange(event);
  const isSoldOut = event.status === "sold-out";
  const isPast = event.status === "past";
  const singleTicketUrl =
    event.shows.length === 1 ? event.shows[0].ticketUrl : undefined;

  return (
    <article>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(eventJsonLd(event, settings)) }}
      />

      {/* Hero */}
      <section className="relative">
        <Poster
          src={event.heroImage ?? event.posterImage}
          alt={`${event.title} — hero image`}
          className="absolute inset-0"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />
        <div className="relative mx-auto flex min-h-[70vh] max-w-6xl flex-col justify-end px-5 pb-14 pt-28 md:px-8 md:pb-20">
          <div>
            <StatusBadge status={event.status} />
          </div>
          <h1 className="headline mt-4 max-w-3xl text-5xl md:text-7xl">{event.title}</h1>
          {event.tagline && (
            <p className="mt-3 max-w-xl text-lg text-ivory-muted">{event.tagline}</p>
          )}
          <p className="mt-5 text-sm uppercase tracking-[0.2em] text-gold">
            {eventDateRange(event)} · {eventCities(event)}
          </p>
          {prices && !isPast && (
            <p className="mt-2 text-sm text-ivory-muted">Tickets {prices}</p>
          )}
          <div className="mt-7 flex flex-wrap gap-4">
            {isSoldOut ? (
              <a
                href="#waitlist"
                className="inline-flex items-center justify-center rounded-full bg-gold px-7 py-3.5 text-sm font-semibold text-ink transition hover:bg-gold-bright"
              >
                Join Waitlist
              </a>
            ) : isPast ? (
              <Link
                href="/portfolio"
                className="inline-flex items-center justify-center rounded-full bg-gold px-7 py-3.5 text-sm font-semibold text-ink transition hover:bg-gold-bright"
              >
                View Gallery
              </Link>
            ) : singleTicketUrl ? (
              <BuyButton href={singleTicketUrl} eventName={event.title} />
            ) : (
              <a
                href="#tickets"
                className="inline-flex items-center justify-center rounded-full bg-gold px-7 py-3.5 text-sm font-semibold text-ink transition hover:bg-gold-bright"
              >
                Buy Tickets
              </a>
            )}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-5 md:px-8">
        {/* Shows — per city/date (R2 multi-city) */}
        <section id="tickets" className="scroll-mt-24 py-14 md:py-20">
          <Reveal>
            <p className="eyebrow">Dates &amp; tickets</p>
            <h2 className="headline mt-3 text-3xl md:text-4xl">
              {event.shows.length > 1 ? "Choose your city" : "Show details"}
            </h2>
          </Reveal>
          <div className="mt-8 space-y-4">
            {event.shows.map((show, i) => (
              <Reveal key={`${show.city}-${show.start}`} delay={i * 60}>
                <div className="flex flex-col gap-4 rounded-2xl border border-ink-border bg-ink-raised p-6 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="headline text-2xl text-ivory">{show.city}</p>
                    <p className="mt-1 text-sm text-ivory-muted">{show.venue}</p>
                    <p className="mt-1 text-sm text-gold">
                      {formatShowDate(show.start)} · {formatShowTime(show.start)}
                    </p>
                  </div>
                  {isPast ? null : show.soldOut || isSoldOut ? (
                    <a
                      href="#waitlist"
                      className="inline-flex shrink-0 items-center justify-center rounded-full border border-ink-border px-7 py-3 text-sm font-semibold text-ivory-muted transition hover:border-gold hover:text-gold"
                    >
                      Sold Out — Join Waitlist
                    </a>
                  ) : show.ticketUrl ? (
                    <BuyButton
                      href={show.ticketUrl}
                      eventName={event.title}
                      city={show.city}
                      className="shrink-0"
                    />
                  ) : (
                    <span className="text-sm text-ivory-muted">On sale soon</span>
                  )}
                </div>
              </Reveal>
            ))}
          </div>

          {event.ticketTiers.length > 0 && !isPast && (
            <Reveal className="mt-8">
              <div className="overflow-hidden rounded-2xl border border-ink-border">
                <table className="w-full text-sm">
                  <caption className="sr-only">Ticket tiers and prices</caption>
                  <thead>
                    <tr className="border-b border-ink-border bg-ink-raised text-left">
                      <th scope="col" className="px-6 py-3 font-medium text-ivory-muted">
                        Tier
                      </th>
                      <th scope="col" className="px-6 py-3 text-right font-medium text-ivory-muted">
                        Price
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {event.ticketTiers.map((tier) => (
                      <tr key={tier.name} className="border-b border-ink-border/50 last:border-0">
                        <td className="px-6 py-3.5 text-ivory">{tier.name}</td>
                        <td className="px-6 py-3.5 text-right text-gold">{tier.price}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Reveal>
          )}
        </section>

        <div className="hairline" />

        {/* About */}
        <section className="grid gap-10 py-14 md:grid-cols-[2fr_1fr] md:py-20">
          <Reveal>
            <p className="eyebrow">About the event</p>
            <h2 className="headline mt-3 text-3xl md:text-4xl">
              {event.artists.join(" · ")}
            </h2>
            <p className="mt-6 whitespace-pre-line leading-relaxed text-ivory-muted">
              {event.description}
            </p>
          </Reveal>
          <Reveal delay={100}>
            <div className="space-y-6 rounded-2xl border border-ink-border bg-ink-raised p-6 text-sm">
              {event.ageRestriction && (
                <div>
                  <p className="eyebrow">Age &amp; entry</p>
                  <p className="mt-2 text-ivory-muted">{event.ageRestriction}</p>
                </div>
              )}
              {event.entryConditions && event.entryConditions.length > 0 && (
                <ul className="space-y-2 text-ivory-muted">
                  {event.entryConditions.map((c) => (
                    <li key={c} className="flex gap-2">
                      <span aria-hidden="true" className="text-gold">
                        —
                      </span>
                      {c}
                    </li>
                  ))}
                </ul>
              )}
              <div>
                <p className="eyebrow">Organiser</p>
                <p className="mt-2 text-ivory-muted">
                  {settings.siteName} ·{" "}
                  <a href={`tel:${settings.phone}`} className="text-gold hover:text-gold-bright">
                    {settings.phoneDisplay}
                  </a>
                </p>
                <a
                  href={`mailto:${settings.email}`}
                  className="mt-1 block break-all text-ivory-muted hover:text-gold"
                >
                  {settings.email}
                </a>
              </div>
            </div>
          </Reveal>
        </section>

        {/* FAQ */}
        {event.faqs.length > 0 && (
          <>
            <div className="hairline" />
            <section className="py-14 md:py-20">
              <Reveal>
                <p className="eyebrow">Good to know</p>
                <h2 className="headline mt-3 text-3xl md:text-4xl">FAQ</h2>
              </Reveal>
              <div className="mt-8 space-y-3">
                {event.faqs.map((faq, i) => (
                  <Reveal key={faq.question} delay={i * 50}>
                    <details className="group rounded-xl border border-ink-border bg-ink-raised">
                      <summary className="cursor-pointer list-none px-6 py-4 font-medium text-ivory transition hover:text-gold [&::-webkit-details-marker]:hidden">
                        {faq.question}
                      </summary>
                      <p className="px-6 pb-5 text-sm leading-relaxed text-ivory-muted">
                        {faq.answer}
                      </p>
                    </details>
                  </Reveal>
                ))}
              </div>
            </section>
          </>
        )}

        {/* Waitlist / Insider capture (R5) */}
        <div className="hairline" />
        <section id="waitlist" className="scroll-mt-24 py-14 md:py-20">
          <div className="mx-auto max-w-xl">
            <InsiderForm
              source={isSoldOut ? `waitlist:${event.slug}` : `event:${event.slug}`}
              heading={isSoldOut ? "Join the waitlist" : "Don't miss the next one"}
              subheading={
                isSoldOut
                  ? `Register for ${event.title} — if tickets are released or new shows are added, you hear first.`
                  : "Presale access and first announcements for every Kayal Events show."
              }
              buttonLabel={isSoldOut ? "Join Waitlist" : "Get Presale Access"}
            />
          </div>
        </section>
      </div>

      <StickyBuyBar event={event} />
    </article>
  );
}
