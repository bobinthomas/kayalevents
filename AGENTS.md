<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Project Memory — Kayal Events (kayalevents.com.au)

Last updated: 16 June 2026. Built from the v1.0 PRD ("Kayal Events Website Rebuild"); deployed to Cloudflare Workers with Keystatic CMS.

## What this is

Luxury, cinematic marketing + ticketing-referral site for Kayal Events, an Australian promoter of large-scale South Indian live entertainment (e.g. "Mohanlal Live in Australia", "Onam Vibes"). Replaces a GoDaddy-builder site whose event CTAs linked to Instagram.

- **Repo:** https://github.com/bobinthomas/kayalevents
- **Staging:** https://kayalevents-dev.bobinthomas.workers.dev

## Stack & architecture decisions

- **Next.js 16** (App Router) + **TypeScript** + **Tailwind CSS 4**. Dev/build use `--webpack` (not Turbopack). Pages use `revalidate = 60` where set; production renders dynamically on Workers when the Keystatic GitHub reader runs per-request.
- **Deploy:** **OpenNext + Cloudflare Workers** (`npm run deploy` = production/`main`, `npm run deploy:staging` = `dev`). Not Vercel. Env bindings read via `src/lib/runtime-env.ts` (`getRuntimeEnv()` / `hasRuntimeEnv()`).
- **CMS:** **Keystatic** — Git-backed. Schema in `keystatic.config.ts`. Content JSON in `content/`; images in `content/media/images/` (served via `GET /api/media/images/…`, not bundled in `public/`). Admin UI at `/keystatic` (API at `/api/keystatic/[...params]`).
- **Content layer pattern (load-bearing):** all pages read content ONLY through `src/lib/content.ts`. It reads via `getKeystaticReader()` in `src/lib/keystatic-reader.ts`, falling back to seed data in `src/data/seed.ts` on failure. Never bypass this module.
- **Keystatic storage modes:**
  - **Production default:** GitHub storage (`bobinthomas/kayalevents`). CMS saves commit to the repo via OAuth in the browser.
  - **Site reader on Workers:** `createGitHubReader` when `KEYSTATIC_GITHUB_TOKEN` (read-only PAT) is set — Workers have no filesystem.
  - **Local offline:** `KEYSTATIC_STORAGE=local` in `.env.local` — reader uses `createReader(process.cwd(), …)`.
- **Route groups:** `src/app/(site)/` carries site chrome (Header/Footer/WhatsApp/Consent/Analytics/SiteMotion); `/keystatic` is a separate route outside `(site)`.
- **Forms** — provider-agnostic API routes with honeypot spam protection:
  - `/api/insider` — Kayal Insider presale list; Brevo adapter activates with `BREVO_API_KEY` + `BREVO_LIST_ID`, otherwise logs.
  - `/api/inquiry` — B2B inquiries; Resend adapter activates with `RESEND_API_KEY`, destination `kayaleventsofficial@gmail.com`, otherwise logs.
- **Analytics** (`src/lib/analytics.ts` + `src/components/analytics.tsx`): GA4 + Meta Pixel load only after cookie consent (stored in localStorage under `kayal-consent`). Tracked conversion events: `buy_ticket_click`, `insider_signup`, `inquiry_submit`, `whatsapp_click`.
- **Debug:** `GET /api/debug` — diagnostics for Keystatic env bindings on Workers (token presence, reader mode).

## Design system

Theme: **"Lagoon, after dark"** — marine-black canvas, lagoon/ocean accents, coral reserved for primary CTAs.

- Tokens in `globals.css`: `--marine-black`, `--surface`, `--sand`, `--lagoon-green`, `--ocean-blue`, `--coral`, etc. Legacy aliases `--ink`, `--gold`, `--ivory` still resolve for older class names (`bg-ink`, `text-gold`, …).
- **Fonts:** Fraunces (display, `--font-display`, class `headline`/`font-display`) + DM Sans (body, `--font-body`). Montserrat (weight 300) loads only inside `LoadingScreen` for the intro animation.
- Utility classes: `eyebrow`, `hairline`, `poster-placeholder` (cinematic gradient wherever real photography is missing — intentional, NO stock imagery per PRD R4).
- **Motion:**
  - `SiteMotion` — code-split wrapper; loads `LoadingScreen` (GSAP intro) + `SmoothScrollInit` (Lenis via dynamic import) after hydration.
  - `Reveal` — IntersectionObserver scroll-reveal (CSS in `globals.css`).
  - `prefers-reduced-motion` disables reveals, smooth scroll, intro animation, and hero video autoplay.

## Domain logic worth knowing

- Event status drives CTAs everywhere: `on-sale` / `selling-fast` → Buy Tickets; `sold-out` → Join Waitlist (anchors to `#waitlist` InsiderForm with source `waitlist:<slug>`); `past` → View Gallery (links to portfolio).
- Events are multi-city: each show in `event.shows[]` has its own city/venue/date/ticketUrl. Ticket platform undecided (PRD OQ1) — ticket URLs are per-show CMS fields.
- Event detail pages emit one Schema.org `Event` JSON-LD object **per show/city** with offers per ticket tier (AUD).
- 301 redirects from old GoDaddy URLs in `next.config.ts`: `/our-portfolio` → `/portfolio`, `/upcoming-events` → `/events`, `/contact-us` → `/contact`. Use `statusCode: 301` (NOT `permanent: true`, which emits 308 — PRD requires 301).
- Use `reader.collections.*.all()` not `.read(slug)` for events — WASM deserializer fails on `fields.image()` entries stored as plain string paths.

## Gotchas discovered during the build

- **ESLint `react-hooks/set-state-in-effect`:** do NOT call setState synchronously in useEffect. Use `useSyncExternalStore` (consent in `analytics.tsx`, reduced-motion in `hero-media.tsx`, `hero-carousel.tsx`) or event handlers.
- **`Poster` component:** callers that overlay it (heroes) pass `absolute inset-0`; the component skips its default `relative` when className contains "absolute" — otherwise the hero is invisible.
- **`Reveal` observer** uses `rootMargin: "10000px 0px -40px 0px"` so anchor jumps (`#tickets`, etc.) still reveal. Don't shrink that top margin.
- **`ReaderRefresh`:** only render when the reader has a `repoPath` (local filesystem mode). GitHub API reader has no `repoPath` — rendering it causes `path.join(undefined, …)` TypeError.
- **Site settings path:** singleton must be `content/site-settings/index.json` with config path `content/site-settings/` (trailing slash). A flat `site-settings.json` breaks `ReaderRefresh` scandir.
- **Keystatic API route:** lazy-init `makeRouteHandler` in `src/app/api/keystatic/[...params]/route.ts` so build doesn't require OAuth secrets. POST handler calls `revalidatePath` after successful CMS saves.
- **Keystatic storage default:** config defaults to GitHub storage unless `KEYSTATIC_STORAGE=local`. Missing `NEXT_PUBLIC_KEYSTATIC_GITHUB_CLIENT_ID` at build time previously baked local mode into the admin API — keep client ID in `wrangler.jsonc` vars.
- **`KEYSTATIC_GITHUB_TOKEN` on Workers:** must be a Cloudflare secret/variable; `process.env` alone may be empty — use `getRuntimeEnv()`. Reader is lazy-init per request for this reason.
- **GitHub API on Workers:** `patchFetchForGitHubApi()` in `keystatic-reader.ts` adds User-Agent (Cloudflare Workers omit it by default).
- **`LoadingScreen` on mobile:** `getBBox()` returns zeros when ancestors are `visibility:hidden` — unhide containers before measuring (iOS Safari).
- **`next.config.ts`:** `turbopack.root` pinned to silence stray home-directory lockfile warning. `transpilePackages` lists legacy framer-motion entries (unused — safe to remove in cleanup). Webpack aliases for `gsap` and `lenis`.
- **Images:** CMS uploads go to `content/media/images/` via Keystatic's native `fields.image()` picker (server-side commit to GitHub). Served at `/api/media/images/…` — disk in dev, GitHub raw API on Workers (`KEYSTATIC_GITHUB_TOKEN`). `resolveMediaUrl()` in `src/lib/media-url.ts` rewrites legacy `/images/` paths. Run `npm run images:migrate` once to move `public/images/`. Delete `public/images/` after verify to shrink Worker bundle. See `docs/media-storage.md`.
- `.gitignore` has `.env*` with `!.env.example` exception.

## Performance notes

- Site layout JS was reduced by code-splitting GSAP/Lenis/LoadingScreen into `SiteMotion` (layout chunk ~11 KB vs ~63 KB previously).
- Smooth scroll uses native `requestAnimationFrame` + dynamic Lenis import — no GSAP on the scroll path.
- Montserrat font scoped to intro only; not loaded on repeat visits when intro is skipped.

## Outstanding before launch (PRD open questions)

1. Ticketing platform decision → replace placeholder ticket URLs (CMS fields).
2. Rights-cleared photography/video → upload via Keystatic; placeholders auto-replace.
3. Privacy policy page — REQUIRED before the Insider list goes live (AU Privacy Act).
4. Real GA4 / Meta Pixel IDs; verify events in DebugView / Events Manager.
5. Turnstile/reCAPTCHA if honeypot proves insufficient.
6. DNS cutover — point kayalevents.com.au to Cloudflare Workers.
7. Rotate/restrict GitHub PAT if ever exposed; prefer Cloudflare Secrets over plain Variables for tokens.

All env switches documented in `.env.example` and `README.md`.
