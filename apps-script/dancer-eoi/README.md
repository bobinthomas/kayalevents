# Dancer EOI (Expression of Interest) — Solution & Architecture

Group-level application form for dance troupes/teams wanting to perform at a
Kayal Events show — not an individual performer's accreditation (that's
[Dance Team Performer Registration](../dance-team-registration/README.md),
a separate downstream step for groups that get accepted).

Live at **eoi.kayalevents.com.au**. Also reachable at `/dancer-eoi` on the
`kayalevents-dev` staging Worker.

## 1. User-facing flow

1. **Group representative** opens the form and submits: group name, a short
   profile ("about"), achievements, number of performers, contact
   name/email/phone, location, and **at least one performance link**
   (Instagram, YouTube, or another URL) — there is no direct video upload,
   groups link to existing content instead. A declaration checkbox is
   required to submit.
2. On submit they get a **confirmation email** and an on-screen submission
   reference (`KYL-XXXXXXXX`).
3. **Panel** gets an email alert with the group's details and a link to the
   admin dashboard.
4. **Panel** reviews the submission in the admin dashboard and sets a status
   (`Pending` / `Shortlisted` / `Rejected`-style workflow — see `Admin.html`
   for the exact set). There's no further "approved → print pass" phase here;
   groups that are accepted go on to have their individual performers
   complete Dance Team Performer Registration separately.

## 2. High-level architecture

Same shape as Dance Team Performer Registration — see that project's
[README](../dance-team-registration/README.md#2-high-level-architecture) for
the general diagram. In short:

```
Browser → Next.js form (src/app/(standalone)/dancer-eoi/)
        → Next.js API routes (src/app/api/eoi/) — honeypot / Turnstile / required-field checks
        → Google Apps Script Web App (this folder)
              ├─▶ Google Sheet — one row per submission
              └─▶ Gmail (MailApp) — panel alert + applicant confirmation
```

No Google Drive folder is used here — there are no file uploads, only URLs
the applicant pastes in, so there's nothing to store beyond the Sheet row.

## 3. Components

### Frontend — `src/app/(standalone)/dancer-eoi/`
- `page.tsx` — route metadata, renders the form.
- `eoi-form.tsx` — client component: required-field + email/phone/URL
  validation, honeypot, HMAC-signed freshness code (anti-replay), Turnstile
  widget (no-ops without a site key), declaration checkbox gate.

### API proxy — `src/app/api/eoi/`
- `issue-code/route.ts` — proxies to Apps Script's `action=issueCode`.
- `submit/route.ts` — re-validates everything server-side before forwarding
  to Apps Script, reading the backend URL via
  `getRuntimeEnv("EOI_APPS_SCRIPT_URL")`.

### Backend — `apps-script/dancer-eoi/`
| File | Responsibility |
|---|---|
| `Code.gs` | `doGet`/`doPost` router, submission handling, Sheet I/O, emails, admin RPCs |
| `Config.gs` | Sheet ID, secrets, event name, deadline, admin allowlist |
| `Admin.html` | Token-gated dashboard — list, filter, status workflow, reviewer notes |
| `appsscript.json` | Manifest: OAuth scopes, `ANYONE_ANONYMOUS` web app access |

### Data model — Sheet columns (`SHEET_HEADERS` in `Code.gs`)
```
submitted_at, submission_id, group_name, profile_about, achievements,
num_performers, contact_name, contact_email, contact_phone, location,
link_instagram, link_youtube, link_other, declaration_checked, status,
reviewer_notes, reviewed_by, reviewed_at
```

## 4. Security model

Same primitives as Dance Team Performer Registration: optional Turnstile,
honeypot hidden field, HMAC-signed short-lived freshness token, and a static
`ADMIN_TOKEN` query-param gate on the admin dashboard (treat that URL as a
bearer credential).

## 5. Deployment

`eoi.kayalevents.com.au` is served by the `kayalevents-dev` Worker, built
from the `dev` branch — the same branch used for staging the rest of the
site. That branch:
- deletes `src/app/(site)/page.tsx`, and
- adds a `next.config.ts` rewrite: `"/"` → `/dancer-eoi`,

so the form loads at the domain root. Unlike `dancers.kayalevents.com.au`
(attached declaratively via `routes` in `wrangler.jsonc`), this custom domain
was attached to `kayalevents-dev` directly via the Cloudflare dashboard, so
the Worker's `workers.dev` URL is still active alongside it (both resolve to
the same deployment). Deploy with `npm run deploy:staging`.

**Apps Script side is manual, same as always** — `Code.gs`/`Config.gs`/
`Admin.html` changes require pasting into the Apps Script editor and
**Deploy → Manage deployments → Edit → New version → Deploy**. A Cloudflare
deploy of the Next.js side never touches this.

## 6. Known constraints

- **No file storage**: performance evidence is external links only. If a
  direct video upload is ever wanted, `Config.gs` already has unused
  `VIDEO_MAX_MB`/`VIDEO_ALLOWED_MIME` constants left over from an earlier
  design — `reel-contest/` (a separate, later feature) shows the working
  pattern for Drive-backed video upload if this gets revisited.
- **`noValidate` + `handleBlur`-only checks**: mirrors the same pattern as
  Dance Team Performer Registration — verify required-field enforcement
  actually happens in JS before submit, not just via the (neutralized) HTML
  `required` attribute, if you touch this form.
- **Local `.env.local` overrides Cloudflare secrets** for `EOI_APPS_SCRIPT_URL`
  on this repo's OpenNext build, same mechanism documented in the Dance Team
  Performer Registration README — keep local and deployed values in sync
  manually.
