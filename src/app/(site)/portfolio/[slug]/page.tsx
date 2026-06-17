import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Poster } from "@/components/poster";
import { Reveal } from "@/components/reveal";
import { getCaseStudies, getCaseStudy } from "@/lib/content";
import { resolveMediaUrl } from "@/lib/media-url";

export const revalidate = 60;

export async function generateStaticParams() {
  const studies = await getCaseStudies();
  return studies.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const study = await getCaseStudy(slug);
  if (!study) return {};
  const image = resolveMediaUrl(study.heroImage);
  return {
    title: `${study.title} — Case Study`,
    description: study.summary,
    alternates: { canonical: `/portfolio/${study.slug}` },
    openGraph: {
      title: `${study.title} — Case Study`,
      description: study.summary,
      ...(image ? { images: [{ url: image }] } : {}),
    },
  };
}

export default async function CaseStudyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const study = await getCaseStudy(slug);
  if (!study) notFound();

  return (
    <article>
      {/* Hero */}
      <section className="relative">
        <Poster
          src={study.heroImage}
          alt={`${study.title} — hero image`}
          className="absolute inset-0"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />
        <div className="relative mx-auto flex min-h-[60vh] max-w-6xl flex-col justify-end px-5 pb-14 pt-28 md:px-8 md:pb-20">
          <p className="eyebrow">{study.year} · Case study</p>
          <h1 className="headline mt-3 max-w-3xl text-5xl md:text-7xl">{study.title}</h1>
          <p className="mt-4 max-w-xl text-lg text-ivory-muted">{study.summary}</p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-5 md:px-8">
        {/* Stat strip */}
        <Reveal>
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-ink-border bg-ink-border md:grid-cols-4 -mt-10 relative z-10">
            {study.stats.map((stat) => (
              <div key={stat.label} className="bg-ink-raised p-6 text-center">
                <p className="font-display text-3xl text-gold md:text-4xl">{stat.value}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.18em] text-ivory-muted">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </Reveal>

        {/* Story */}
        <section className="mx-auto max-w-3xl py-14 md:py-20">
          <Reveal>
            <p className="whitespace-pre-line text-lg leading-relaxed text-ivory-muted">
              {study.description}
            </p>
          </Reveal>
        </section>

        {/* Highlight video */}
        {study.videoUrl && (
          <Reveal className="pb-14">
            <div className="aspect-video overflow-hidden rounded-2xl border border-ink-border">
              <iframe
                src={study.videoUrl}
                title={`${study.title} highlight video`}
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                loading="lazy"
              />
            </div>
          </Reveal>
        )}

        {/* Gallery */}
        {study.gallery.length > 0 && (
          <section className="pb-14 md:pb-20">
            <Reveal>
              <p className="eyebrow">Gallery</p>
              <h2 className="headline mt-3 text-3xl md:text-4xl">The night in pictures</h2>
            </Reveal>
            <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
              {study.gallery.map((img, i) => (
                <Reveal key={`${img.alt}-${i}`} delay={(i % 3) * 60}>
                  <Poster
                    src={img.src}
                    alt={img.alt}
                    className={`rounded-xl ${i % 5 === 0 ? "aspect-[4/5]" : "aspect-square"}`}
                    sizes="(min-width: 768px) 33vw, 50vw"
                  />
                </Reveal>
              ))}
            </div>
          </section>
        )}

        {/* Testimonial */}
        {study.testimonial && (
          <Reveal className="pb-14 md:pb-20">
            <figure className="mx-auto max-w-3xl border-l-2 border-gold py-2 pl-8">
              <blockquote className="font-display text-2xl leading-snug text-ivory md:text-3xl">
                “{study.testimonial.quote}”
              </blockquote>
              <figcaption className="mt-5 text-sm text-ivory-muted">
                <span className="font-semibold text-gold">{study.testimonial.author}</span>
                {study.testimonial.role && <> — {study.testimonial.role}</>}
              </figcaption>
            </figure>
          </Reveal>
        )}

        {/* CTA */}
        <div className="hairline" />
        <section className="py-14 text-center md:py-20">
          <Reveal>
            <h2 className="headline text-3xl md:text-4xl">
              Planning something of this scale?
            </h2>
            <p className="mx-auto mt-3 max-w-md text-ivory-muted">
              Concerts, corporate galas, festivals and private events — produced
              end-to-end by Kayal Events.
            </p>
            <Link
              href="/contact"
              className="mt-7 inline-flex items-center justify-center rounded-full bg-gold px-8 py-3.5 text-sm font-semibold text-ink transition hover:bg-gold-bright"
            >
              Start an Inquiry
            </Link>
          </Reveal>
        </section>
      </div>
    </article>
  );
}
