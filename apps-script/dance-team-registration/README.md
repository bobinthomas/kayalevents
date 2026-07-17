# Dance Team Performer Registration — Solution & Architecture

Accreditation intake for dance team performers ahead of a Kayal Events show.
Collects identity + documents, runs a manual approval workflow, and (once
approved) generates a printable backstage pass with a QR gate-access code.

Live at **dancers.kayalevents.com.au**. Also reachable at `/dance-team-registration`
on any branch/Worker that includes this route (e.g. staging).

## 1. User-facing flow

1. **Registrant** opens the form, fills in personal details, uploads 4 files,
   ticks the Terms & Conditions checkbox, signs digitally (typed name + date),
   ticks "I Agree and Submit".
2. On submit they get a **confirmation email** and an on-screen registration
   reference (`DTR-XXXXXXXX`).
3. **Panel** gets an email alert with links to the uploaded documents and the
   admin dashboard.
4. **Panel** reviews the submission in the admin dashboard and sets status to
   `Approved` or `Rejected`. The registrant gets a **status email** either way.
5. For `Approved` rows, the panel can **print a backstage pass** (single or
   "print all") — a mobile-ticket-style card with the performer's photo, event
   details, and a QR code encoding their registration ID for gate check-in.

## 2. High-level architecture

```
Browser
  │
  ▼
Next.js form  (src/app/(standalone)/dance-team-registration/)
  │  fetch /api/dance-team/issue-code   (freshness token)
  │  POST  /api/dance-team/submit        (JSON, base64 files)
  ▼
Next.js API routes (src/app/api/dance-team/)
  │  — honeypot / Turnstile / required-field checks happen here first
  │  — forwards a plain fetch() to the Apps Script Web App URL
  ▼
Google Apps Script Web App (this folder)
  │
  ├─▶ Google Sheet "Registrations"   — one row per submission (the DB)
  ├─▶ Google Drive folder            — one subfolder per registrant, holding
  │                                     the 4 uploaded files
  └─▶ Gmail (MailApp)                — confirmation / panel-alert / status emails
```

The Next.js side is deployed on Cloudflare Workers (via OpenNext) and rebuilds
on every `npm run deploy:*`. **The Apps Script side is a completely separate
deployment that Cloudflare knows nothing about** — see §5.

## 3. Components

### Frontend — `src/app/(standalone)/dance-team-registration/`
- `page.tsx` — route metadata (`robots: noindex`), renders the form.
- `dance-team-form.tsx` — client component. Handles:
  - Field + file validation (all fields required client-side, mirrored server-side).
  - 4 file uploads: **full-length photo, close-up photo, ID proof, entry ticket**
    (JPEG/PNG for photos; JPEG/PNG/PDF for ID proof and entry ticket), 5MB cap each.
  - Cloudflare Turnstile widget (skipped entirely if no site key is configured).
  - Hidden honeypot field (`website`) — silently "succeeds" without writing a row.
  - A short-lived HMAC-signed "freshness code" fetched on mount, sent back on
    submit as anti-replay protection.
  - Raw `XMLHttpRequest` (not `fetch`) so upload progress can be shown.

### API proxy — `src/app/api/dance-team/`
- `issue-code/route.ts` — proxies to Apps Script's `action=issueCode`.
- `submit/route.ts` — validates honeypot, Turnstile, required fields, and each
  file's MIME/size *before* forwarding to Apps Script (fails fast, avoids a
  wasted round trip for obviously-bad uploads). Reads the Apps Script URL via
  `getRuntimeEnv("DANCE_TEAM_APPS_SCRIPT_URL")` — never bare `process.env`
  (required for it to resolve on Cloudflare Workers).

### Backend — this folder (`apps-script/dance-team-registration/`)
| File | Responsibility |
|---|---|
| `Code.gs` | `doGet`/`doPost` router, submission handling, Sheet/Drive I/O, emails, admin RPCs, pass/QR generation |
| `Config.gs` | All environment-specific config: Sheet/Drive IDs, secrets, event details, MIME/size limits |
| `Admin.html` | Token-gated `HtmlService` dashboard — table, search/filter, detail panel, approve/reject, notes, CSV export, print-pass buttons |
| `QrCodeLib.gs` | Verbatim copy of the `qrcode-generator` npm package (MIT) — generates the pass QR as SVG |
| `KayalLogo.gs` | Sanitized Kayal Events logo SVG (stray white artifacts stripped, "TM" replaced with a real ® overlay) for the printed pass |
| `appsscript.json` | Manifest: OAuth scopes, web app access (`ANYONE_ANONYMOUS` so the Next.js proxy can call it unauthenticated) |

### Data model — Sheet tab `Registrations`
One row per submission, columns in this exact order (`SHEET_HEADERS` in `Code.gs`):

```
submitted_at, registration_id, dancer_first_name, dancer_last_name,
contact_number, dancer_email, full_length_photo_url, close_up_photo_url,
id_proof_url, tcs_accepted, signature_full_name, signature_date, status,
reviewer_notes, reviewed_by, reviewed_at, entry_ticket_url
```

`entry_ticket_url` is appended at the **end**, not grouped with the other
document columns — this sheet already carries live production rows, and a
new column has to be additive-only (see §6 for why).

`status` is one of `Pending` / `Approved` / `Rejected`, set via the admin panel.

Each registrant's 4 files live in Drive under
`<DRIVE_PARENT_FOLDER>/<registrationId>_<lastName>/`.

### Backstage pass (Phase 2)
- QR payload is just `KAYAL-PASS:<registrationId>` — deliberately minimal; a
  future check-in scanner is expected to look the ID up against the Sheet
  rather than trust anything else encoded in the QR.
- The pass photo is the registrant's own **close-up photo**, embedded as a
  base64 data URI (not a Drive link) so it doesn't depend on Drive sharing
  settings and exposes no Drive links on the printed card.
- Reachable only through the admin dashboard's "Print Pass" (`?page=pass&id=…`)
  / "Print All Approved" (`?page=passes`) buttons, both gated by `ADMIN_TOKEN`.

## 4. Security model

- **Turnstile** (optional — no-ops if `TURNSTILE_SITE_KEY`/`TURNSTILE_SECRET` unset).
- **Honeypot** hidden field.
- **HMAC-signed freshness token**: issued per page load, checked for both
  validity and age (`CODE_TTL_MINUTES`) on submit — blocks stale/replayed
  submissions.
- **Admin dashboard + pass pages**: gated by a static `ADMIN_TOKEN` query
  parameter, not real auth. Treat the admin URL as a bearer credential — don't
  post it anywhere public.
- All server-side validation in `Code.gs` re-checks everything the Next.js
  proxy already checked (required fields, MIME, size) — Apps Script never
  trusts the proxy layer alone.

## 5. Deployment

### Next.js / Cloudflare side
`dancers.kayalevents.com.au` is served by a dedicated Cloudflare Worker
(`kayalevents-dancers`) built from the `dancers` git branch, which:
- deletes `src/app/(site)/page.tsx`, and
- adds a `next.config.ts` rewrite: `"/"` → `/dance-team-registration`,

so the form loads at the bare domain root. The custom domain is attached
declaratively via `routes` in `wrangler.jsonc` (`env.dancers`). Deploy with
`npm run deploy:dancers`.

This feature also exists on the `dev` branch (staging) but has **not** been
merged into `main`; the two branches are kept in sync for this feature via
targeted `git cherry-pick`, not `git merge`, because `dev` and `dancers` have
unrelated historical divergence elsewhere in the repo.

### Apps Script side — manual, every time
**There is no CI/CD for this folder.** Whenever `Code.gs`, `Config.gs`,
`Admin.html`, `QrCodeLib.gs`, or `KayalLogo.gs` change:

1. Open the Apps Script project at script.google.com.
2. Paste the updated file contents in (same filenames).
3. **Deploy → Manage deployments → ✏️ Edit → New version → Deploy.**

A Cloudflare deploy of the Next.js side does **not** touch this — the two are
only connected by the `DANCE_TEAM_APPS_SCRIPT_URL` env var the proxy routes
call.

### One-time setup (fresh environment)
1. Fill in `Config.gs` (`OWNER_EMAIL`, `PANEL_ALLOWLIST`, event details).
2. Run `bootstrapResources()` once from the Apps Script IDE — creates the
   Sheet and Drive folder, logs their IDs. Paste those IDs into
   `SHEET_ID` / `DRIVE_PARENT_FOLDER`.
3. Generate `HMAC_SECRET` (`openssl rand -hex 32`) and `ADMIN_TOKEN`
   (`openssl rand -hex 16`). Never commit real values to a public repo.
4. Deploy as a Web App — **Execute as: Me**, **Who has access: Anyone**
   (anonymous access is required for the Next.js proxy to call it).
5. Put the deployment URL in `.env.local` (`DANCE_TEAM_APPS_SCRIPT_URL`) and
   as a Cloudflare secret on every Worker environment that serves this form
   (`wrangler secret put DANCE_TEAM_APPS_SCRIPT_URL --env <env>`).

Admin dashboard: `<deployment-url>?page=admin&token=<ADMIN_TOKEN>`.

## 6. Known constraints / gotchas

- **Sheet schema changes must be additive-only.** This sheet has live
  production data with a fixed physical column order; `Code.gs` maps columns
  by *array position*, not by matching header text. A new field must be
  appended at the end of `SHEET_HEADERS` (and the matching `appendRow` call),
  never inserted mid-schema — otherwise every column after the insertion
  point silently shifts for new rows.
- **Rows written before a schema change** (e.g. before `dancer_email` or
  `entry_ticket_url` existed) read back with missing/misaligned trailing
  columns. `sendStatusUpdateEmail` already guards for this (`if
  (!row.dancer_email) return;`) — new code reading old rows should too.
- **Local `.env.local` beats Cloudflare secrets.** This repo's OpenNext build
  bakes local `.env*` files into the deployed Worker bundle, and
  `getRuntimeEnv()` checks `process.env` before the real Cloudflare binding —
  so whatever `DANCE_TEAM_APPS_SCRIPT_URL` is set locally wins over
  `wrangler secret put`, for any Worker built from a machine with
  `.env.local` present. Keep local and deployed values in sync manually.
- **`noValidate` is set on the `<form>`** (for custom-styled inline errors),
  so the HTML `required` attribute alone enforces nothing — every required
  field needs an explicit JS check in `handleSubmit`/`handleBlur`, mirrored
  by the required-field check in the Next.js API route and in `handleSubmit`
  in `Code.gs`.
