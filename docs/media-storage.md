# Media storage (free, backend upload)

Kayal Events serves CMS images through a **backend media API** instead of bundling them in `public/`. This fixes Cloudflare Worker deploy size limits while keeping Keystatic's native image picker.

## How it works

```
Editor uploads in Keystatic
        ↓
Keystatic API (server-side) commits to GitHub
        ↓
content/media/images/...   (NOT in public/)
        ↓
GET /api/media/images/...    (Worker reads from GitHub API or local disk)
        ↓
Browser / next/image
```

- **Free** — uses GitHub (already provisioned) + your existing `KEYSTATIC_GITHUB_TOKEN`
- **Backend upload** — Keystatic handles uploads server-side; no browser-to-cloud SDK
- **No custom CMS field** — standard `fields.image()` picker unchanged
- **No Worker bundle bloat** — only `public/` ships as static assets; media lives in `content/media/`

## Keystatic config

```ts
fields.image({
  directory: 'content/media/images',
  publicPath: '/api/media/images/',
})
```

Content JSON stores paths like `/api/media/images/mohanlal-live-in-australia-2026/heroImage.jpg`.

## Migrate existing images

```bash
npm run images:migrate
```

This copies `public/images/` → `content/media/images/` and rewrites `/images/` → `/api/media/images/` in `content/**/*.json`.

Legacy `/images/*` URLs 301-redirect to `/api/media/images/*` until content is fully migrated.

After verifying locally:

```bash
rm -rf public/images
npm run deploy
```

## Requirements

- `KEYSTATIC_GITHUB_TOKEN` on Workers (read access) — same token used for content reader
- CMS OAuth write access for editors uploading new images (unchanged)

## Local dev

With `KEYSTATIC_STORAGE=local`, media is read from disk under `content/media/images/`.

With GitHub storage, new uploads commit to the repo; the media API reads from GitHub when the token is set.
