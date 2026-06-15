import { connection } from 'next/server'
import * as seed from '@/data/seed'
import { keystaticReader } from '@/lib/keystatic-reader'
import type {
  CaseStudy,
  KayalEvent,
  Service,
  SiteSettings,
  Testimonial,
} from '@/lib/types'

export { keystaticReader }

/* eslint-disable @typescript-eslint/no-explicit-any */
const reader: any = keystaticReader

/** Opt out of static caching in dev so ReaderRefresh picks up content/ edits. */
async function ensureFreshInDev() {
  if (process.env.NODE_ENV === 'development') {
    await connection()
  }
}

/* eslint-disable @typescript-eslint/no-explicit-any */

function mapEvent(slug: string, e: any): KayalEvent {
  return {
    slug,
    title: e.title,
    artists: e.artists ?? [],
    tagline: e.tagline || undefined,
    description: e.description ?? '',
    status: e.status ?? 'on-sale',
    heroImage: e.heroImage || undefined,
    posterImage: e.posterImage || undefined,
    shows: (e.shows ?? []).map((s: any) => ({
      city: s.city,
      venue: s.venue,
      start: s.start,
      ticketUrl: s.ticketUrl || undefined,
      soldOut: s.soldOut ?? false,
    })),
    ticketTiers: e.ticketTiers ?? [],
    ageRestriction: e.ageRestriction || undefined,
    entryConditions: e.entryConditions ?? [],
    faqs: e.faqs ?? [],
    featured: e.featured ?? false,
    heroHeadline: e.heroHeadline || undefined,
    heroSubcopy: e.heroSubcopy || undefined,
    heroCtaLabel: e.heroCtaLabel || undefined,
    heroCtaUrl: e.heroCtaUrl || undefined,
    heroOrder: e.heroOrder ?? undefined,
  }
}

function mapCaseStudy(slug: string, c: any): CaseStudy {
  return {
    slug,
    title: c.title,
    year: c.year ?? '',
    summary: c.summary ?? '',
    description: c.description ?? '',
    heroImage: c.heroImage || undefined,
    stats: c.stats ?? [],
    gallery: (c.gallery ?? []).map((img: any) => ({
      src: img.src || undefined,
      alt: img.alt ?? '',
    })),
    videoUrl: c.videoUrl || undefined,
    testimonial: c.testimonial?.quote
      ? { quote: c.testimonial.quote, author: c.testimonial.author, role: c.testimonial.role }
      : undefined,
  }
}

export async function getEvents(): Promise<KayalEvent[]> {
  await ensureFreshInDev()
  try {
    const entries = await reader?.collections.events.all()
    if (entries?.length) {
      return entries
        .map(({ slug, entry }: any) => mapEvent(slug, entry))
        .sort((a: any, b: any) => {
          const aStart = a.shows[0]?.start ?? ''
          const bStart = b.shows[0]?.start ?? ''
          return aStart.localeCompare(bStart)
        })
    }
  } catch (err) {
    console.error('[content] getEvents failed:', err)
  }
  return seed.events
}

export async function getUpcomingEvents(): Promise<KayalEvent[]> {
  return (await getEvents()).filter((e) => e.status !== 'past')
}

export async function getPastEvents(): Promise<KayalEvent[]> {
  return (await getEvents()).filter((e) => e.status === 'past')
}

export async function getEvent(slug: string): Promise<KayalEvent | null> {
  await ensureFreshInDev()
  try {
    const entry = await reader?.collections.events.read(slug)
    if (entry) return mapEvent(slug, entry)
  } catch (err) {
    console.error('[content] getEvent failed:', err)
  }
  return seed.events.find((e) => e.slug === slug) ?? null
}

export async function getFeaturedEvent(): Promise<KayalEvent | null> {
  const upcoming = await getUpcomingEvents()
  return upcoming.find((e) => e.featured) ?? upcoming[0] ?? null
}

export async function getCaseStudies(): Promise<CaseStudy[]> {
  await ensureFreshInDev()
  try {
    const entries = await reader?.collections.caseStudies.all()
    if (entries?.length) {
      return entries
        .map(({ slug, entry }: any) => mapCaseStudy(slug, entry))
        .sort((a: any, b: any) => b.year.localeCompare(a.year))
    }
  } catch (err) {
    console.error('[content] getCaseStudies failed:', err)
  }
  return seed.caseStudies
}

export async function getCaseStudy(slug: string): Promise<CaseStudy | null> {
  await ensureFreshInDev()
  try {
    const entry = await reader?.collections.caseStudies.read(slug)
    if (entry) return mapCaseStudy(slug, entry)
  } catch (err) {
    console.error('[content] getCaseStudy failed:', err)
  }
  return seed.caseStudies.find((c) => c.slug === slug) ?? null
}

export async function getServices(): Promise<Service[]> {
  await ensureFreshInDev()
  try {
    const entries = await reader?.collections.services.all()
    if (entries?.length) {
      return entries
        .map(({ slug, entry }: any) => ({
          slug,
          title: entry.title,
          description: entry.description ?? '',
          highlights: entry.highlights ?? [],
          order: entry.order ?? 999,
        }))
        .sort((a, b) => a.order - b.order)
        .map(({ slug, title, description, highlights }) => ({
          slug,
          title,
          description,
          highlights,
        }))
    }
  } catch (err) {
    console.error('[content] getServices failed:', err)
  }
  return seed.services
}

export async function getTestimonials(): Promise<Testimonial[]> {
  await ensureFreshInDev()
  try {
    const entries = await reader?.collections.testimonials.all()
    if (entries?.length) {
      return entries.map(({ entry }: any) => ({
        quote: entry.quote,
        author: entry.author,
        role: entry.role,
      }))
    }
  } catch (err) {
    console.error('[content] getTestimonials failed:', err)
  }
  return seed.testimonials
}

export async function getSiteSettings(): Promise<SiteSettings> {
  await ensureFreshInDev()
  try {
    const doc = await reader?.singletons.siteSettings.read()
    if (doc) {
      return {
        siteName: doc.siteName,
        tagline: doc.tagline,
        email: doc.email,
        phone: doc.phone,
        phoneDisplay: doc.phoneDisplay,
        whatsapp: doc.whatsapp,
        instagram: doc.instagram,
        facebook: doc.facebook || undefined,
        baseUrl: doc.baseUrl,
        heroImage: doc.heroImage || undefined,
        heroVideo: doc.heroVideo || undefined,
        fallbackHeroHeadline: doc.fallbackHeroHeadline || undefined,
        fallbackHeroSubcopy: doc.fallbackHeroSubcopy || undefined,
        fallbackHeroCtaLabel: doc.fallbackHeroCtaLabel || undefined,
        fallbackHeroCtaUrl: doc.fallbackHeroCtaUrl || undefined,
      }
    }
  } catch (err) {
    console.error('[content] getSiteSettings failed:', err)
  }
  return seed.siteSettings
}
