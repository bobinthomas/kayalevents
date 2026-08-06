import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Keystatic rewrites localhost → 127.0.0.1 for API calls; allow both in dev.
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  // Next.js 16 WASM-mode crashes during its internal TypeScript runner on win32/x64.
  // Types are verified separately via `tsc --noEmit --skipLibCheck` (zero errors).
  typescript: { ignoreBuildErrors: true },
  // A stray lockfile exists in the user home directory; pin the workspace root
  turbopack: { root: process.cwd() },
  // Force webpack to transpile these ESM packages for consistent CJS bundling
  transpilePackages: ["framer-motion", "motion", "motion-dom", "motion-utils"],
  // OpenNext's /_next/image proxy on Cloudflare Workers serves relative URLs
  // only via the static-assets binding, which can't reach our dynamic
  // /api/media/images route (images come from GitHub/disk at request time,
  // not the build-time asset manifest) — every request 404s there. There's
  // also no Cloudflare Images binding configured, so optimization was a
  // no-op passthrough anyway. Skip the proxy and serve images directly.
  images: {
    unoptimized: true,
    remotePatterns: [
      // Sanity image CDN
      { protocol: "https", hostname: "cdn.sanity.io" },
    ],
  },
  webpack(config) {
    // Explicit alias so webpack can locate these packages regardless of
    // how the resolver walks the directory tree in this WSL/Windows setup
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      "framer-motion": path.resolve("node_modules/framer-motion"),
      "motion": path.resolve("node_modules/motion"),
      "gsap": path.resolve("node_modules/gsap"),
      "lenis": path.resolve("node_modules/lenis"),
    };
    return config;
  },
  async redirects() {
    // 301s from the old GoDaddy-builder URLs (R1)
    return [
      { source: "/our-portfolio", destination: "/portfolio", statusCode: 301 },
      { source: "/upcoming-events", destination: "/events", statusCode: 301 },
      { source: "/contact-us", destination: "/contact", statusCode: 301 },
    ];
  },
  async headers() {
    // Set at the app level so these don't depend on Cloudflare zone config
    // surviving the DNS cutover from the old GoDaddy-proxied domain.
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
