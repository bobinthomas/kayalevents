import type { Metadata } from "next";
import Link from "next/link";
import { EventCard } from "@/components/event-card";
import { Poster } from "@/components/poster";
import { Reveal } from "@/components/reveal";
import { getCaseStudies, getPastEvents } from "@/lib/content";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Portfolio — Past Events",
  description:
    "Sold-out concerts, national tours, corporate galas and community festivals produced by Kayal Events across Australia. Explore the case studies.",
  alternates: { canonical: "/portfolio" },
};

export default async function PortfolioPage() {
  const [studies, pastEvents] = await Promise.all([
    getCaseStudies(),
    getPastEvents(),
  ]);
  const hasStudies = studies.length > 0;

  return (
    <div className="mx-auto max-w-6xl px-5 py-16 md:px-8 md:py-24">
      <Reveal>
        <p className="eyebrow">Our work</p>
        <h1 className="headline mt-3 text-4xl md:text-6xl">Past Events</h1>
        <p className="mt-4 max-w-xl text-ivory-muted">
          Every show is a production. From sold-out arenas to black-tie galas —
          this is what Kayal Events delivers.
        </p>
      </Reveal>

      {hasStudies && (
        <div className="mt-12 space-y-10">
          {studies.map((study, i) => (
            <Reveal key={study.slug} delay={i * 60}>
              <Link
                href={`/portfolio/${study.slug}`}
                className="gradient-border group grid overflow-hidden rounded-2xl border border-ink-border bg-ink-raised transition hover:border-gold/40 md:grid-cols-2"
              >
                <Poster
                  src={study.heroImage}
                  alt={`${study.title} — hero image`}
                  title={study.title}
                  className="aspect-[16/10] md:aspect-auto md:min-h-full"
                  sizes="(min-width: 768px) 50vw, 100vw"
                />
                <div className="flex flex-col justify-center gap-3 p-8 md:p-10">
                  <p className="eyebrow">{study.year}</p>
                  <h2 className="headline text-3xl text-ivory group-hover:text-gold-bright md:text-4xl">
                    {study.title}
                  </h2>
                  <p className="text-ivory-muted">{study.summary}</p>
                  <div className="mt-3 flex flex-wrap gap-x-8 gap-y-3">
                    {study.stats.slice(0, 3).map((stat) => (
                      <div key={stat.label}>
                        <p className="font-display text-2xl text-gold">{stat.value}</p>
                        <p className="text-xs uppercase tracking-[0.15em] text-ivory-muted">
                          {stat.label}
                        </p>
                      </div>
                    ))}
                  </div>
                  <span className="mt-4 text-sm font-semibold text-gold transition group-hover:text-gold-bright">
                    Read the case study →
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      )}

      {pastEvents.length > 0 && (
        <section className={hasStudies ? "mt-24" : "mt-12"}>
          {hasStudies && (
            <Reveal>
              <p className="eyebrow">The archive</p>
              <h2 className="headline mt-3 text-3xl md:text-4xl">
                More past events
              </h2>
            </Reveal>
          )}
          <div className={hasStudies ? "mt-10 grid gap-8 md:grid-cols-2" : "grid gap-8 md:grid-cols-2"}>
            {pastEvents.map((event, i) => (
              <Reveal key={event.slug} delay={i * 60}>
                <EventCard event={event} />
              </Reveal>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
