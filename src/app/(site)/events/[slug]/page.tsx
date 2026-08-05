import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { BuyButton } from "@/components/buy-button";
import { Countdown } from "@/components/countdown";
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
import { resolveMediaUrl } from "@/lib/media-url";
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
  const image = resolveMediaUrl(event.posterImage ?? event.heroImage);
  return {
    title: event.title,
    description,
    alternates: { canonical: `/events/${event.slug}` },
    openGraph: {
      title: event.title,
      description,
      ...(image ? { images: [{ url: image }] } : {}),
    },
  };
}

/* ── Schema.org Event JSON-LD (one object per show/city) ───── */
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
      address: {
        "@type": "PostalAddress",
        addressLocality: show.city,
        addressCountry: "AU",
      },
    },
    ...(resolveMediaUrl(event.posterImage ?? event.heroImage)
      ? {
          image: [
            new URL(
              resolveMediaUrl(event.posterImage ?? event.heroImage)!,
              settings.baseUrl,
            ).href,
          ],
        }
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
  const [event, settings] = await Promise.all([
    getEvent(slug),
    getSiteSettings(),
  ]);
  if (!event) notFound();

  const prices = priceRange(event);
  const isSoldOut = event.status === "sold-out";
  const isPast = event.status === "past";
  const singleTicketUrl =
    event.shows.length === 1 ? event.shows[0].ticketUrl : undefined;

  return (
    <article>
      {/* Schema.org Event JSON-LD — one entry per show/city */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(eventJsonLd(event, settings)),
        }}
      />

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="relative -mt-16 md:-mt-20" aria-label={`${event.title} hero`}>
        <Poster
          src={event.heroImage ?? event.posterImage}
          alt={`${event.title} — hero image`}
          className="absolute inset-0"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-marine-black from-0% via-marine-black/85 via-45% to-transparent to-100%" />
        {/* Lagoon ambient ripple */}
        <div className="hero-ripple pointer-events-none absolute inset-0" aria-hidden="true" />

        <div className="relative mx-auto flex min-h-[70vh] max-w-6xl flex-col items-start justify-end px-5 pb-14 pt-28 md:px-8 md:pb-20">
          <StatusBadge status={event.status} />
          <h1 className="headline mt-4 max-w-3xl text-5xl md:text-7xl">
            {event.title}
          </h1>
          {event.tagline && (
            <p className="mt-3 max-w-xl text-lg text-sand-muted">
              {event.tagline}
            </p>
          )}
          <p className="mt-5 text-sm uppercase tracking-[0.2em] text-lagoon">
            {eventDateRange(event)} · {eventCities(event)}
          </p>
          {!isPast && (
            <Countdown
              target={
                [...event.shows].sort((a, b) =>
                  a.start.localeCompare(b.start)
                )[0]?.start ?? ""
              }
              size="lg"
              className="mt-5"
            />
          )}
          {prices && !isPast && (
            <p className="mt-2 text-sm text-sand-muted">Tickets {prices}</p>
          )}

          {/* Status-driven primary CTA */}
          <div className="mt-7 flex flex-wrap gap-4">
            {isSoldOut ? (
              <a
                href="#waitlist"
                className="gradient-border inline-flex items-center justify-center rounded-full border border-lagoon/40 bg-lagoon/10 px-7 py-3.5 text-sm font-semibold text-lagoon transition-all hover:bg-lagoon/20"
              >
                Join Waitlist
              </a>
            ) : isPast ? (
              <Link
                href="/portfolio"
                className="gradient-border inline-flex items-center justify-center rounded-full border border-border px-7 py-3.5 text-sm font-semibold text-sand-muted transition hover:border-lagoon hover:text-lagoon"
              >
                View Gallery
              </Link>
            ) : singleTicketUrl ? (
              <BuyButton href={singleTicketUrl} eventName={event.title} />
            ) : (
              <a
                href="#tickets"
                className="gradient-border coral-glow inline-flex items-center justify-center rounded-full bg-coral px-7 py-3.5 text-sm font-semibold tracking-wide text-sand transition-all hover:scale-[1.03] hover:bg-coral-bright"
              >
                Buy Tickets
              </a>
            )}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-5 md:px-8">
        {/* ── SHOWS / TICKETS ──────────────────────────────────── */}
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
                <div className="gradient-border flex flex-col gap-4 rounded-2xl border border-border bg-surface p-6 transition-colors hover:border-lagoon/30 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="headline text-2xl text-sand">{show.city}</p>
                    <p className="mt-1 text-sm text-sand-muted">{show.venue}</p>
                    <p className="mt-1 text-sm text-lagoon">
                      {formatShowDate(show.start)} · {formatShowTime(show.start)}
                    </p>
                  </div>
                  {isPast ? null : show.soldOut || isSoldOut ? (
                    <a
                      href="#waitlist"
                      className="gradient-border inline-flex shrink-0 items-center justify-center rounded-full border border-border px-7 py-3 text-sm font-semibold text-sand-muted transition hover:border-lagoon hover:text-lagoon"
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
                    <span className="text-sm text-sand-muted">On sale soon</span>
                  )}
                </div>
              </Reveal>
            ))}
          </div>

          {/* Ticket tier pricing table */}
          {event.ticketTiers.length > 0 && !isPast && (
            <Reveal className="mt-8">
              <div className="gradient-border overflow-hidden rounded-2xl border border-border">
                <table className="w-full text-sm">
                  <caption className="sr-only">Ticket tiers and prices</caption>
                  <thead>
                    <tr className="border-b border-border bg-surface text-left">
                      <th
                        scope="col"
                        className="px-6 py-3 font-medium text-sand-muted"
                      >
                        Tier
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-right font-medium text-sand-muted"
                      >
                        Price
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {event.ticketTiers.map((tier) => (
                      <tr
                        key={tier.name}
                        className="border-b border-border/50 last:border-0"
                      >
                        <td className="px-6 py-3.5 text-sand">{tier.name}</td>
                        <td className="px-6 py-3.5 text-right font-semibold text-lagoon">
                          {tier.price}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Reveal>
          )}
        </section>

        <div className="hairline" />

        {/* ── ABOUT ─────────────────────────────────────────────── */}
        <section className="grid gap-10 py-14 md:grid-cols-[2fr_1fr] md:py-20">
          <Reveal>
            <p className="eyebrow">About the event</p>
            <h2 className="headline mt-3 text-3xl md:text-4xl">
              {event.artists.join(" · ")}
            </h2>
            <p className="mt-6 whitespace-pre-line leading-relaxed text-sand-muted">
              {event.description}
            </p>
          </Reveal>
          <Reveal delay={100}>
            <div className="gradient-border space-y-6 rounded-2xl border border-border bg-surface p-6 text-sm">
              {event.ageRestriction && (
                <div>
                  <p className="eyebrow">Age &amp; entry</p>
                  <p className="mt-2 text-sand-muted">{event.ageRestriction}</p>
                </div>
              )}
              {event.entryConditions && event.entryConditions.length > 0 && (
                <ul className="space-y-2 text-sand-muted">
                  {event.entryConditions.map((c) => (
                    <li key={c} className="flex gap-2">
                      <span aria-hidden="true" className="text-lagoon">—</span>
                      {c}
                    </li>
                  ))}
                </ul>
              )}
              <div>
                <p className="eyebrow">Organiser</p>
                <p className="mt-2 text-sand-muted">
                  {settings.siteName} ·{" "}
                  <a
                    href={`tel:${settings.phone}`}
                    className="text-lagoon hover:text-lagoon-bright"
                  >
                    {settings.phoneDisplay}
                  </a>
                </p>
                <a
                  href={`mailto:${settings.email}`}
                  className="mt-1 block break-all text-sand-muted hover:text-lagoon"
                >
                  {settings.email}
                </a>
              </div>
            </div>
          </Reveal>
        </section>

        {/* ── FAQ ───────────────────────────────────────────────── */}
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
                    <details className="gradient-border group rounded-xl border border-border bg-surface transition-colors hover:border-lagoon/30">
                      <summary className="flex cursor-pointer list-none items-center justify-between px-6 py-4 font-medium text-sand transition hover:text-lagoon [&::-webkit-details-marker]:hidden">
                        {faq.question}
                        <svg
                          className="ml-4 h-4 w-4 shrink-0 text-sand-muted transition-transform duration-300 group-open:rotate-180"
                          viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <path d="M4 6l4 4 4-4" />
                        </svg>
                      </summary>
                      <p className="px-6 pb-5 text-sm leading-relaxed text-sand-muted [details[open]_&]:animate-[kayal-fade-in_0.3s_cubic-bezier(0.22,1,0.36,1)]">
                        {faq.answer}
                      </p>
                    </details>
                  </Reveal>
                ))}
              </div>
            </section>
          </>
        )}

        {/* ── TERMS & CONDITIONS ───────────────────────────────── */}
        {event.termsAndConditions && (
          <>
            <div className="hairline" />
            <section className="py-14 md:py-20">
              <Reveal>
                <p className="eyebrow">Fine print</p>
                <h2 className="headline mt-3 text-3xl md:text-4xl">
                  Terms &amp; Conditions
                </h2>
                <p className="mt-6 max-w-3xl whitespace-pre-line text-sm leading-relaxed text-sand-muted">
                  {event.termsAndConditions}
                </p>
              </Reveal>
            </section>
          </>
        )}

        {/* ── WAITLIST / INSIDER ───────────────────────────────── */}
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
