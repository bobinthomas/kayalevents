/**
 * Kayal Events — Dance Team Performer Registration Backend Configuration
 *
 * SETUP STEPS (do in order):
 *
 * 1. Fill in every field marked TODO.
 * 2. Run bootstrapResources() once from the Apps Script IDE to create the
 *    Sheet and master Drive folder, then paste their IDs back here.
 * 3. Deploy as a Web App:
 *    - Execute as: Me (the owner)
 *    - Who has access: Anyone (anonymous — required so the Next.js proxy can call it)
 * 4. Copy the deployment URL into DANCE_TEAM_APPS_SCRIPT_URL in your
 *    .env.local and Cloudflare Workers secrets.
 * 5. Rotate HMAC_SECRET periodically. All codes issued before rotation become
 *    invalid — do not rotate during an open registration window.
 */

// eslint-disable-next-line no-unused-vars
const CONFIG = {
  ORG_NAME: "Kayal Events",
  CAMPAIGN_NAME: "Dance Team Performer Registration",

  // Printed on approved performers' backstage passes.
  EVENT_TITLE: "Vaikittu Entha Paripadi",
  EVENT_SUBTITLE: "Mohanlal Live in Sydney",
  EVENT_DATE_DISPLAY: "8 August 2026",
  EVENT_VENUE: "Norwest Convention Centre Sydney",

  // TODO: The Gmail address that owns the Drive folder and Sheet.
  OWNER_EMAIL: "kayaleventsofficial@gmail.com",

  // TODO: Run bootstrapResources() and paste IDs here. Leave blank to auto-create.
  SHEET_ID: "",
  DRIVE_PARENT_FOLDER: "",

  // TODO: Google email addresses for the admin panel. Owner is always included.
  PANEL_ALLOWLIST: [
    "kayaleventsofficial@gmail.com",
    // "panelist2@gmail.com",
  ],

  // Registration window is intentionally open-ended (no fixed deadline) —
  // leave blank to accept submissions indefinitely. Set to close it.
  CLOSE_UTC: "",
  CLOSE_DISPLAY: "",

  CODE_PREFIX: "DTR",
  CODE_TTL_MINUTES: 240,

  // Generated with: openssl rand -hex 32
  // Keep this secret. Do not share or commit to version control.
  HMAC_SECRET: "ee11146a21986dd1fa3106420469e2dfca756602a9a97b7d12af975f1bd2d17c",

  // Generated with: openssl rand -hex 16
  // Protects the admin panel: visit DEPLOYMENT_URL?page=admin&token=YOUR_TOKEN
  ADMIN_TOKEN: "39fbf6eca09193fdda2f060037a2af94",

  PHOTO_MAX_MB: 5,
  PHOTO_MAX_BYTES: 5 * 1024 * 1024,
  PHOTO_ALLOWED_MIME: ["image/jpeg", "image/png"],
  // ID proof is sometimes a scanned document rather than a photo.
  ID_ALLOWED_MIME: ["image/jpeg", "image/png", "application/pdf"],

  // TODO: From Cloudflare Turnstile dashboard (server-side secret key).
  // Turnstile verification is handled by the Next.js API route, so this
  // field is only used as a backup validation layer if you ever bypass the
  // Next.js proxy and call Apps Script directly.
  TURNSTILE_SECRET: "",
};
