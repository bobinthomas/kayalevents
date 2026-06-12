import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/reveal";
import { getServices } from "@/lib/content";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Services",
  description:
    "Concert promotion, national tours, corporate events, community festivals and private celebrations — produced end-to-end by Kayal Events across Australia.",
  alternates: { canonical: "/services" },
};

export default async function ServicesPage() {
  const services = await getServices();

  return (
    <div className="mx-auto max-w-6xl px-5 py-16 md:px-8 md:py-24">
      <Reveal>
        <p className="eyebrow">What we do</p>
        <h1 className="headline mt-3 text-4xl md:text-6xl">Services</h1>
        <p className="mt-4 max-w-xl text-ivory-muted">
          One team, end to end — artist negotiation, production design, staging,
          ticketing and the show itself.
        </p>
      </Reveal>

      <div className="mt-12 grid gap-6 md:grid-cols-2">
        {services.map((service, i) => (
          <Reveal key={service.slug} delay={i * 60}>
            <div className="flex h-full flex-col rounded-2xl border border-ink-border bg-ink-raised p-8">
              <h2 className="headline text-2xl text-ivory md:text-3xl">
                {service.title}
              </h2>
              <p className="mt-3 flex-1 text-ivory-muted">{service.description}</p>
              {service.highlights.length > 0 && (
                <ul className="mt-6 space-y-2 text-sm text-ivory-muted">
                  {service.highlights.map((h) => (
                    <li key={h} className="flex gap-2">
                      <span aria-hidden="true" className="text-gold">
                        —
                      </span>
                      {h}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal className="mt-16 text-center">
        <Link
          href="/contact"
          className="inline-flex items-center justify-center rounded-full bg-gold px-8 py-3.5 text-sm font-semibold text-ink transition hover:bg-gold-bright"
        >
          Discuss Your Event
        </Link>
      </Reveal>
    </div>
  );
}
