<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Project Memory — Kayal Events (kayalevents.com.au)

Last updated: 12 June 2026. Built from the v1.0 PRD ("Kayal Events Website Rebuild") in a single session; all P0 requirements implemented and verified.

## What this is

Luxury, cinematic marketing + ticketing-referral site for Kayal Events, an Australian promoter of large-scale South Indian live entertainment (e.g. "Mohanlal Live in Australia", "Onam Vibes"). Replaces a GoDaddy-builder site whose event CTAs linked to Instagram. Repo: https://github.com/bobinthomas/kayalevents

## Stack & architecture decisions

- Next.js 16 (App Router, Turbopack) + TypeScript + Tailwind CSS 4, static generation with 60s ISR on every content page. Deploy target: Vercel.
- **Content layer pattern (load-bearing):** all pages read content ONLY through `src/lib/content.ts`. It fetches from Sanity when `NEXT_PUBLIC_SANITY_PROJECT_ID` is set, otherwise falls back to seed/placeholder content in `src/data/seed.ts`. Never bypass this module.
- Sanity schemas in `sanity/schemaTypes/` (Event, Portfolio Case Study, Service, Testimonial, Site Settings). Embedded studio at `/studio` (shows setup instructions until the project is provisioned). On-demand revalidation webhook: `POST /api/revalidate?secret=REVALIDATE_SECRET`.
- Route groups: `src/app/(site)/` carries the site chrome (Header/Footer/WhatsApp/Consent/Analytics); root layout is bare so `/studio` renders full-screen.
- Forms are provider-agnostic API routes with honeypot spam protection:
  - `/api/insider` — Kayal Insider presale list; Brevo adapter activates with `BREVO_API_KEY` + `BREVO_LIST_ID`, otherwise logs.
  - `/api/inquiry` — B2B inquiries; Resend adapter activates with `RESEND_API_KEY`, destination `kayaleventsofficial@gmail.com`, otherwise logs.
- Analytics (`src/lib/analytics.ts` + `src/components/analytics.tsx`): GA4 + Meta Pixel load only after cookie consent (stored in localStorage under `kayal-consent`). Tracked conversion events: `buy_ticket_click`, `insider_signup`, `inquiry_submit`, `whatsapp_click`.

## Design system

- Theme tokens in `globals.css`: near-black `--ink #0a0a0b`, champagne gold `--gold #d4af6a`, ivory `--ivory #f5f1e8`. Tailwind classes: `bg-ink`, `text-gold`, `border-ink-border`, etc.
- Fonts: Fraunces (display, `--font-display`, class `headline`/`font-display`) + Inter (body). Utility classes: `eyebrow` (gold tracking-wide label), `hairline` (gold gradient divider), `poster-placeholder` (cinematic gradient used wherever real photography is missing — intentional, NO stock imagery per PRD R4).
- Motion: `Reveal` component (IntersectionObserver scroll-reveal). `prefers-reduced-motion` disables reveals and the hero video loop (`HeroMedia`).

## Domain logic worth knowing

- Event status drives CTAs everywhere: `on-sale` / `selling-fast` → Buy Tickets; `sold-out` → Join Waitlist (anchors to `#waitlist` InsiderForm with source `waitlist:<slug>`); `past` → View Gallery (links to portfolio).
- Events are multi-city: each show in `event.shows[]` has its own city/venue/date/ticketUrl. Ticket platform is undecided (PRD OQ1) — ticket URLs are per-show CMS fields, currently placeholder trybooking.com links in seed data.
- Event detail pages emit one Schema.org `Event` JSON-LD object **per show/city** with offers per ticket tier (AUD).
- 301 redirects from old GoDaddy URLs in `next.config.ts`: `/our-portfolio` → `/portfolio`, `/upcoming-events` → `/events`, `/contact-us` → `/contact`. Use `statusCode: 301` (NOT `permanent: true`, which emits 308 — PRD requires 301).
- Services seed content (6 pillars) was rewritten from the live GoDaddy site's actual catalogue, deduplicated.

## Gotchas discovered during the build

- ESLint enforces `react-hooks/set-state-in-effect`: do NOT call setState synchronously in useEffect. Use `useSyncExternalStore` (see consent handling in `analytics.tsx` and reduced-motion in `hero-media.tsx`) or event handlers (mobile menu close in `header.tsx`).
- `Poster` component: callers that overlay it (heroes) pass `absolute inset-0`; the component skips its default `relative` when className contains "absolute" — Tailwind class conflicts otherwise made the hero invisible.
- `Reveal` observer uses `rootMargin: "10000px 0px -40px 0px"` so content jumped past (anchor links like `#tickets`, instant scrolls) still reveals. Don't shrink that top margin.
- A stray `package-lock.json` exists in the user's home directory; `turbopack.root` is pinned in `next.config.ts` to silence the workspace-root warning.
- `.gitignore` has `.env*` with `!.env.example` exception.

## Outstanding before launch (PRD open questions)

1. Ticketing platform decision → replace placeholder ticket URLs (CMS fields).
2. Rights-cleared photography/video → upload via CMS; placeholders auto-replace.
3. Provision Sanity project + set env vars; migrate seed content into CMS.
4. Privacy policy page — REQUIRED before the Insider list goes live (AU Privacy Act).
5. Real GA4 / Meta Pixel IDs; verify events in DebugView / Events Manager.
6. Turnstile/reCAPTCHA if honeypot proves insufficient.
7. Vercel project + DNS cutover for kayalevents.com.au.

All env switches documented in `.env.example` and `README.md`.
