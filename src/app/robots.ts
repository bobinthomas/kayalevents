import type { MetadataRoute } from "next";
import { getSiteSettings } from "@/lib/content";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const settings = await getSiteSettings();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/keystatic", "/api/"],
      },
    ],
    sitemap: `${settings.baseUrl}/sitemap.xml`,
  };
}
