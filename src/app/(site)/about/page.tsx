import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/reveal";
import { getPastEvents, getSiteSettings } from "@/lib/content";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "About",
  description:
    "Kayal Events is an Australian promoter of large-scale South Indian live entertainment — bringing Malayalam cinema's biggest names and Kerala's festival spirit to stages across the country.",
  alternates: { canonical: "/about" },
};

export default async function AboutPage() {
  const [settings, pastEvents] = await Promise.all([
    getSiteSettings(),
    getPastEvents(),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-5 py-16 md:px-8 md:py-24">
      <Reveal>
        <p className="eyebrow">Our story</p>
        <h1 className="headline mt-3 max-w-3xl text-4xl leading-tight md:text-6xl">
          Built from the community. Produced for the world stage.
        </h1>
      </Reveal>

      <div className="mt-12 grid gap-12 md:grid-cols-[2fr_1fr]">
        <Reveal>
          <div className="space-y-6 text-lg leading-relaxed text-ivory-muted">
            <p>
              Kayal Events began with a simple frustration: the Malayali
              community in Australia deserved live entertainment at the same
              standard as any major international tour — not function-hall
              compromises.
            </p>
            <p>
              Today we promote and produce some of the largest South Indian
              live events in the country: headline concerts, multi-city
              national tours, corporate galas, and the community festivals that
              keep Kerala&apos;s culture alive across Melbourne, Sydney,
              Brisbane, Perth and Adelaide.
            </p>
            <p>
              We work directly with artist management in India, contract major
              Australian venues, and run full concert-grade production —
              staging, sound, lighting and show calling — with our own team.
              When you see the Kayal name on a poster, the night is ours from
              first announcement to final encore.
            </p>
          </div>
        </Reveal>

        <Reveal delay={100}>
          <div className="gradient-border space-y-6 rounded-2xl border border-ink-border bg-ink-raised p-7">
            <div>
              <p className="eyebrow">At a glance</p>
              <dl className="mt-4 space-y-4">
                {[
                  ["Cities", "5 + national tours"],
                  ["Largest production", "2,400 attendance"],
                  ["Tour record", "4 cities in 10 days"],
                  ["Past events", `${pastEvents.length} and counting`],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-xs uppercase tracking-[0.18em] text-ivory-muted">
                      {label}
                    </dt>
                    <dd className="font-display text-2xl text-gold">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="hairline" />
            <div className="text-sm">
              <p className="eyebrow">Talk to us</p>
              <a
                href={`tel:${settings.phone}`}
                className="mt-3 block text-ivory-muted hover:text-gold"
              >
                {settings.phoneDisplay}
              </a>
              <a
                href={`mailto:${settings.email}`}
                className="mt-1 block break-all text-ivory-muted hover:text-gold"
              >
                {settings.email}
              </a>
            </div>
          </div>
        </Reveal>
      </div>

      <Reveal className="mt-20 text-center">
        <h2 className="headline text-3xl md:text-4xl">See the work</h2>
        <Link
          href="/portfolio"
          className="gradient-border mt-6 inline-flex items-center justify-center rounded-full bg-gold px-8 py-3.5 text-sm font-semibold text-ink transition hover:bg-gold-bright"
        >
          View Portfolio
        </Link>
      </Reveal>
    </div>
  );
}
