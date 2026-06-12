import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // A stray lockfile exists in the user home directory; pin the workspace root
  turbopack: { root: process.cwd() },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      // Sanity image CDN
      { protocol: "https", hostname: "cdn.sanity.io" },
    ],
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
