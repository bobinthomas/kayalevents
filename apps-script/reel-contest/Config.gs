/**
 * Kayal Events — #KayalReelFest Reel Contest Backend Configuration
 *
 * SETUP STEPS (do in order):
 *
 * 1. Fill in every field marked TODO.
 * 2. Run bootstrapResources() once from the Apps Script IDE to create the
 *    Sheet (with Entries + Judging tabs) and master Drive folder, then paste
 *    their IDs back here.
 * 3. Deploy as a Web App:
 *    - Execute as: Me (the owner)
 *    - Who has access: Anyone (anonymous — required so the Next.js proxy can call it)
 * 4. Copy the deployment URL into REEL_CONTEST_APPS_SCRIPT_URL in your
 *    .env.local and Cloudflare Workers secrets.
 * 5. Rotate HMAC_SECRET periodically. All codes issued before rotation become
 *    invalid — do not rotate during an open submission window.
 */

// eslint-disable-next-line no-unused-vars
const CONFIG = {
  ORG_NAME: "Kayal Events",
  EVENT_NAME: "Mohanlal Live in Australia — Sydney",
  CAMPAIGN_NAME: "#KayalReelFest",

  // TODO: The Gmail address that owns the Drive folder and Sheet.
  OWNER_EMAIL: "kayaleventsofficial@gmail.com",

  // TODO: Run bootstrapResources() and paste IDs here. Leave blank to auto-create.
  SHEET_ID: "",
  DRIVE_PARENT_FOLDER: "",

  // TODO: Google email addresses of the three judges — share the Sheet's Judging
  // tab with these accounts directly (judges score in the Sheet, not this Config).
  // Kept here purely as a record of who should have edit access.
  PANEL_ALLOWLIST: [
    "kayaleventsofficial@gmail.com",
    // "judge2@example.com",
    // "judge3@example.com",
  ],

  // Entry window: 10 Jul 2026 00:00 AEST — 18 Jul 2026 23:59 AEST (UTC+10 — no DST in July).
  // Stored as UTC so Date parsing is unambiguous everywhere.
  ENTRY_OPEN_UTC: "2026-07-09T14:00:00Z",
  ENTRY_CLOSE_UTC: "2026-07-18T13:59:00Z",
  ENTRY_CLOSE_DISPLAY: "18 July 2026, 11:59 pm AEST",
  WINNER_ANNOUNCE_DISPLAY: "from 3 August 2026",

  CODE_PREFIX: "RC",
  CODE_TTL_MINUTES: 240,

  // TODO: Generate with: openssl rand -hex 32
  // Keep this secret. Do not share or commit to version control.
  HMAC_SECRET: "",

  // TODO: Generate with: openssl rand -hex 16
  // Protects the admin panel: visit DEPLOYMENT_URL?page=admin&token=YOUR_TOKEN
  ADMIN_TOKEN: "",

  VIDEO_MAX_MB: 10,
  VIDEO_MAX_BYTES: 10 * 1024 * 1024,
  VIDEO_ALLOWED_MIME: ["video/mp4", "video/quicktime"],
  MAX_DURATION_SECONDS: 90,

  // Short codes must match the <select> values in reel-contest-form.tsx.
  AU_STATES: ["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"],
  VOUCHER_INELIGIBLE_STATE: "NSW",

  TEAMS: ["Mohanlal", "Chithra"],

  // TODO: From Cloudflare Turnstile dashboard (server-side secret key) — same
  // widget as the dancer-EOI system (same hostname). Turnstile verification is
  // handled by the Next.js API route, so this field is only used as a backup
  // validation layer if you ever bypass the Next.js proxy.
  TURNSTILE_SECRET: "",
};
