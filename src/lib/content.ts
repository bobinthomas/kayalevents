import * as seed from "@/data/seed";
import { sanityClient, sanityConfigured, urlFor } from "@/lib/sanity";
import type {
  CaseStudy,
  KayalEvent,
  Service,
  SiteSettings,
  Testimonial,
} from "@/lib/types";

/**
 * Content access layer. Reads from Sanity when NEXT_PUBLIC_SANITY_PROJECT_ID
 * is configured; otherwise serves seed/placeholder content so the site is
 * fully functional pre-CMS-provisioning.
 */

const REVALIDATE = 60; // seconds — meets the "live within 60s" acceptance (R3)

/* eslint-disable @typescript-eslint/no-explicit-any */

function mapEvent(doc: any): KayalEvent {
  return {
    slug: doc.slug?.current ?? doc.slug,
    title: doc.title,
    artists: doc.artists ?? [],
    tagline: doc.tagline ?? undefined,
    description: doc.description ?? "",
    status: doc.status ?? "on-sale",
    heroImage: doc.heroImage ? urlFor(doc.heroImage) : undefined,
    posterImage: doc.posterImage ? urlFor(doc.posterImage) : undefined,
    shows: (doc.shows ?? []).map((s: any) => ({
      city: s.city,
      venue: s.venue,
      start: s.start,
      ticketUrl: s.ticketUrl ?? undefined,
      soldOut: s.soldOut ?? false,
    })),
    ticketTiers: doc.ticketTiers ?? [],
    ageRestriction: doc.ageRestriction ?? undefined,
    entryConditions: doc.entryConditions ?? [],
    faqs: doc.faqs ?? [],
    featured: doc.featured ?? false,
    heroHeadline: doc.heroHeadline ?? undefined,
    heroSubcopy: doc.heroSubcopy ?? undefined,
    heroCtaLabel: doc.heroCtaLabel ?? undefined,
    heroCtaUrl: doc.heroCtaUrl ?? undefined,
    heroOrder: doc.heroOrder ?? undefined,
  };
}

function mapCaseStudy(doc: any): CaseStudy {
  return {
    slug: doc.slug?.current ?? doc.slug,
    title: doc.title,
    year: doc.year ?? "",
    summary: doc.summary ?? "",
    description: doc.description ?? "",
    heroImage: doc.heroImage ? urlFor(doc.heroImage) : undefined,
    stats: doc.stats ?? [],
    gallery: (doc.gallery ?? []).map((img: any) => ({
      src: urlFor(img),
      alt: img.alt ?? "",
    })),
    videoUrl: doc.videoUrl ?? undefined,
    testimonial: doc.testimonial?.quote ? doc.testimonial : undefined,
  };
}

async function fetchSanity<T>(query: string): Promise<T | null> {
  if (!sanityConfigured || !sanityClient) return null;
  try {
    return await sanityClient.fetch<T>(
      query,
      {},
      { next: { revalidate: REVALIDATE } }
    );
  } catch {
    return null;
  }
}

export async function getEvents(): Promise<KayalEvent[]> {
  const docs = await fetchSanity<any[]>(
    `*[_type == "event"] | order(shows[0].start asc)`
  );
  if (docs && docs.length > 0) return docs.map(mapEvent);
  return seed.events;
}

export async function getUpcomingEvents(): Promise<KayalEvent[]> {
  return (await getEvents()).filter((e) => e.status !== "past");
}

export async function getPastEvents(): Promise<KayalEvent[]> {
  return (await getEvents()).filter((e) => e.status === "past");
}

export async function getEvent(slug: string): Promise<KayalEvent | null> {
  const events = await getEvents();
  return events.find((e) => e.slug === slug) ?? null;
}

export async function getFeaturedEvent(): Promise<KayalEvent | null> {
  const upcoming = await getUpcomingEvents();
  return upcoming.find((e) => e.featured) ?? upcoming[0] ?? null;
}

export async function getCaseStudies(): Promise<CaseStudy[]> {
  const docs = await fetchSanity<any[]>(
    `*[_type == "caseStudy"] | order(year desc)`
  );
  if (docs && docs.length > 0) return docs.map(mapCaseStudy);
  return seed.caseStudies;
}

export async function getCaseStudy(slug: string): Promise<CaseStudy | null> {
  const studies = await getCaseStudies();
  return studies.find((c) => c.slug === slug) ?? null;
}

export async function getServices(): Promise<Service[]> {
  const docs = await fetchSanity<any[]>(
    `*[_type == "service"] | order(order asc)`
  );
  if (docs && docs.length > 0) {
    return docs.map((d: any) => ({
      slug: d.slug?.current ?? d.slug,
      title: d.title,
      description: d.description ?? "",
      highlights: d.highlights ?? [],
    }));
  }
  return seed.services;
}

export async function getTestimonials(): Promise<Testimonial[]> {
  const docs = await fetchSanity<any[]>(`*[_type == "testimonial"]`);
  if (docs && docs.length > 0) return docs as Testimonial[];
  return seed.testimonials;
}

export async function getSiteSettings(): Promise<SiteSettings> {
  const doc = await fetchSanity<any>(`*[_type == "siteSettings"][0]`);
  if (doc) return { ...seed.siteSettings, ...doc };
  return seed.siteSettings;
}
