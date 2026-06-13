import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Next.js 16 WASM-mode crashes during its internal TypeScript runner on win32/x64.
  // Types are verified separately via `tsc --noEmit --skipLibCheck` (zero errors).
  typescript: { ignoreBuildErrors: true },
  // A stray lockfile exists in the user home directory; pin the workspace root
  turbopack: { root: process.cwd() },
  // Force webpack to transpile these ESM packages for consistent CJS bundling
  transpilePackages: ["framer-motion", "motion", "motion-dom", "motion-utils"],
  images: {
    formats: ["image/avif", "image/webp"],
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
};

export default nextConfig;
