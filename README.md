# Kayal Events — kayalevents.com.au

Luxury, cinematic web presence for Kayal Events: Australia's home of South
Indian live entertainment. Built per the v1.0 PRD (June 2026).

**Staging (dev branch):** https://kayalevents-dev.bobinthomas.workers.dev  
**Production (main branch):** https://kayalevents.bobinthomas.workers.dev (→ kayalevents.com.au at DNS cutover)

## Stack

- **Next.js 16** (App Router) + **TypeScript** + **Tailwind CSS 4**
- **Keystatic** — Git-backed CMS; content in `content/` as JSON; images in `content/media/images/` served via `GET /api/media/images/…` (not bundled in the Worker deploy)
- **OpenNext + Cloudflare Workers** — production deployment (`npm run deploy`)
- **GSAP + Lenis** — intro animation and smooth scroll (code-split, deferred after first paint)

## Getting started

```bash
npm install
cp .env.example .env.local   # optional — see env table below
npm run dev
```

Open http://localhost:3000. The site reads from `content/` via the Keystatic
reader. If the reader fails, it falls back to seed data in `src/data/seed.ts`.

### CMS admin

- **Local (GitHub mode):** http://localhost:3000/keystatic — sign in with GitHub; edits commit to the repo
- **Local (offline):** set `KEYSTATIC_STORAGE=local` in `.env.local` — edits write directly to `content/` on disk
- **Staging:** https://kayalevents-dev.bobinthomas.workers.dev/keystatic
- **Production:** https://kayalevents.bobinthomas.workers.dev/keystatic

Collections: Events, Case Studies, Services, Testimonials, Site Settings
(defined in `keystatic.config.ts`).

## Environment variables

Copy `.env.example` to `.env.local` for local development.

| Integration | Env vars | Effect |
|---|---|---|
| Keystatic CMS | `KEYSTATIC_GITHUB_CLIENT_ID`, `KEYSTATIC_GITHUB_CLIENT_SECRET`, `KEYSTATIC_SECRET`, `NEXT_PUBLIC_KEYSTATIC_GITHUB_CLIENT_ID` | GitHub OAuth for `/keystatic` admin |
| Site content reader | `KEYSTATIC_GITHUB_TOKEN` | Read-only GitHub PAT — **required on Workers** so the live site reads `content/` from the repo (no local filesystem on Cloudflare) |
| Local-only CMS | `KEYSTATIC_STORAGE=local` | Skip GitHub; read/write `content/` from disk |
| Revalidation | `REVALIDATE_SECRET` | On-demand cache bust via `POST /api/revalidate?secret=…` |
| GA4 | `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Loads after cookie consent |
| Meta Pixel | `NEXT_PUBLIC_META_PIXEL_ID` | Loads after cookie consent |
| Kayal Insider list | `BREVO_API_KEY`, `BREVO_LIST_ID` | Form submissions sync to Brevo |
| Inquiry email | `RESEND_API_KEY`, `INQUIRY_EMAIL` | Inquiries emailed to the team |

On Cloudflare Workers, set secrets via the dashboard or `wrangler secret put`
(see comments in `wrangler.jsonc`). `NEXT_PUBLIC_KEYSTATIC_GITHUB_CLIENT_ID`
is baked at build time.

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Local dev server (webpack) |
| `npm run build` | Next.js production build |
| `npm run preview` | Build + preview on Cloudflare Workers locally |
| `npm run deploy` | Build + deploy to Cloudflare Workers |
| `npm run images:migrate` | Copy `public/images/` → `content/media/images/` and rewrite content JSON paths |

## Architecture notes

- `src/lib/content.ts` — **single content access layer**. All pages read only
  through this module. Never bypass it.
- `src/lib/keystatic-reader.ts` — lazy reader singleton; uses GitHub API on
  Workers, local filesystem when `KEYSTATIC_STORAGE=local`.
- `src/lib/runtime-env.ts` — reads env from `process.env` and Cloudflare
  `getCloudflareContext().env` on Workers.
- `src/lib/media.ts` + `src/lib/media-url.ts` — CMS images live in
  `content/media/images/`; served at `/api/media/images/…` (GitHub API on
  Workers, disk in dev). Legacy `/images/*` 301-redirects. See
  `docs/media-storage.md`.
- Event detail pages emit Schema.org `Event` JSON-LD per city/show and support
  status states: On Sale / Selling Fast / Sold Out (waitlist) / Past.
- Conversion events: `buy_ticket_click`, `insider_signup`, `inquiry_submit`,
  `whatsapp_click` — fired to GA4 + Meta Pixel via `src/lib/analytics.ts`
  (only after cookie consent).
- Old GoDaddy URLs (`/our-portfolio`, `/upcoming-events`, `/contact-us`) 301
  redirect in `next.config.ts`.
- `prefers-reduced-motion` disables scroll reveals, smooth scroll, intro
  animation, and hero video autoplay.

## Deploy to Cloudflare Workers

Requires `CLOUDFLARE_API_TOKEN` (or `wrangler login`) and secrets configured
in the Cloudflare dashboard.

| Branch | Command | Worker | URL |
|---|---|---|---|
| `dev` | `npm run deploy:staging` | `kayalevents-dev` | https://kayalevents-dev.bobinthomas.workers.dev |
| `main` | `npm run deploy` | `kayalevents` | https://kayalevents.bobinthomas.workers.dev |

**Workflow:** merge to `dev` → deploy staging → test → merge to `main` → `npm run deploy` for production.

### Staging CMS (separate GitHub OAuth App)

GitHub **OAuth Apps only allow one callback URL**. Keep your existing app on production; create a **second** OAuth app for staging:

1. https://github.com/settings/developers → **New OAuth App**
2. **Application name:** `Kayal Events CMS (Staging)`
3. **Homepage URL:** `https://kayalevents-dev.bobinthomas.workers.dev`
4. **Authorization callback URL:**
   `https://kayalevents-dev.bobinthomas.workers.dev/api/keystatic/github/oauth/callback`
5. Copy the new **Client ID** and **Client secret**, then:

```bash
KEYSTATIC_GITHUB_CLIENT_ID=<staging-client-id> \
KEYSTATIC_GITHUB_CLIENT_SECRET=<staging-client-secret> \
npm run setup:staging-secrets
npm run deploy:staging
```

Also set `KEYSTATIC_SECRET` and `KEYSTATIC_GITHUB_TOKEN` on staging if not already done (same values as production are fine).

Verify the content reader after deploy:

```bash
curl https://kayalevents-dev.bobinthomas.workers.dev/api/debug
```

Expect `reader_mode: "github-api"` and `has_github_token: true`.

## Outstanding before launch

1. **Ticketing platform** — replace placeholder per-show ticket URLs in CMS.
2. **Photography/video** — upload rights-cleared assets via Keystatic; placeholders
   auto-replace.
3. **Privacy policy page** — required before the Insider list goes live (AU Privacy Act).
4. **Real GA4 / Meta Pixel IDs** — verify events in DebugView / Events Manager.
5. **Turnstile/reCAPTCHA** — honeypot in place; add if spam volume warrants.
6. **DNS cutover** — point kayalevents.com.au to Cloudflare Workers.
