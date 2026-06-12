export type EventStatus = "on-sale" | "selling-fast" | "sold-out" | "past";

export interface ShowDate {
  city: string;
  venue: string;
  /** ISO 8601 with timezone, e.g. 2026-09-12T19:00:00+10:00 */
  start: string;
  ticketUrl?: string;
  soldOut?: boolean;
}

export interface TicketTier {
  name: string;
  price: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface KayalEvent {
  slug: string;
  title: string;
  artists: string[];
  tagline?: string;
  description: string;
  status: EventStatus;
  /** Absolute URL or path to poster/hero image; placeholder gradient used when absent */
  heroImage?: string;
  posterImage?: string;
  shows: ShowDate[];
  ticketTiers: TicketTier[];
  ageRestriction?: string;
  entryConditions?: string[];
  faqs: FaqItem[];
  featured?: boolean;
}

export interface CaseStudyStat {
  label: string;
  value: string;
}

export interface CaseStudy {
  slug: string;
  title: string;
  year: string;
  summary: string;
  description: string;
  stats: CaseStudyStat[];
  heroImage?: string;
  gallery: { src?: string; alt: string }[];
  videoUrl?: string;
  testimonial?: Testimonial;
}

export interface Service {
  slug: string;
  title: string;
  description: string;
  highlights: string[];
}

export interface Testimonial {
  quote: string;
  author: string;
  role: string;
}

export interface SiteSettings {
  siteName: string;
  tagline: string;
  email: string;
  phone: string;
  phoneDisplay: string;
  whatsapp: string;
  instagram: string;
  facebook?: string;
  baseUrl: string;
  /** Optional muted hero video loop for the home page (R4) */
  heroVideo?: string;
  heroImage?: string;
}
