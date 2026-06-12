# Kayal Events — kayalevents.com.au

Luxury, cinematic web presence for Kayal Events: Australia's home of South
Indian live entertainment. Built per the v1.0 PRD (June 2026).

## Stack

- **Next.js (App Router) + TypeScript + Tailwind CSS 4** — static generation with 60s ISR
- **Sanity** headless CMS (embedded studio at `/studio`) with automatic fallback to seed content until provisioned
- **Vercel** deployment target (preview deployments = staging)

## Getting started

```bash
npm install
npm run dev
```

The site runs fully on placeholder seed content (`src/data/seed.ts`) with zero
configuration. Copy `.env.example` to `.env.local` and fill values to enable:

| Integration | Env vars | Effect |
|---|---|---|
| Sanity CMS | `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET` | Content served from CMS; `/studio` becomes the editor |
| Revalidation webhook | `REVALIDATE_SECRET` | Sanity publish → instant revalidate via `POST /api/revalidate?secret=…` |
| GA4 | `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Loads after cookie consent |
| Meta Pixel | `NEXT_PUBLIC_META_PIXEL_ID` | Loads after cookie consent |
| Kayal Insider list | `BREVO_API_KEY`, `BREVO_LIST_ID` | Form submissions sync to Brevo (swap provider in `src/app/api/insider/route.ts`) |
| Inquiry email | `RESEND_API_KEY`, `INQUIRY_EMAIL` | Inquiries emailed to the team |

## Architecture notes

- `src/lib/content.ts` — single content access layer. Reads Sanity when
  configured, otherwise seed data. All pages depend only on this module.
- `sanity/schemaTypes/` — CMS models: Event, Portfolio Case Study, Service,
  Testimonial, Site Settings (R3).
- Event detail pages emit Schema.org `Event` JSON-LD per city/show (R8) and
  support status states: On Sale / Selling Fast / Sold Out (waitlist) / Past.
- Conversion events (R9): `buy_ticket_click`, `insider_signup`,
  `inquiry_submit`, `whatsapp_click` — fired to GA4 + Meta Pixel via
  `src/lib/analytics.ts`.
- Old GoDaddy URLs (`/our-portfolio`, `/upcoming-events`, `/contact-us`)
  301-redirect in `next.config.ts` (R1).
- `prefers-reduced-motion` disables scroll reveals and the hero video loop.

## Outstanding (PRD open questions)

1. **Ticketing platform** — ticket URLs are per-show CMS fields; set real
   TryBooking/Humanitix/Eventbrite links when decided.
2. **Photography/video** — `Poster`/`HeroMedia` render cinematic gradient
   placeholders until rights-cleared assets are loaded into the CMS.
3. **Email platform** — Brevo wired by default; adapter lives in one file.
4. **Privacy policy page** — required before Insider list goes live (AU
   Privacy Act); add as a CMS-driven page.
5. **Turnstile/reCAPTCHA** — honeypot in place; add Turnstile keys before
   launch if spam volume warrants.
