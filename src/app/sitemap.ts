import type { MetadataRoute } from "next";
import { getCaseStudies, getEvents, getSiteSettings } from "@/lib/content";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [settings, events, studies] = await Promise.all([
    getSiteSettings(),
    getEvents(),
    getCaseStudies(),
  ]);
  const base = settings.baseUrl;

  const staticPages: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/events`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/portfolio`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/services`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/about`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/contact`, changeFrequency: "monthly", priority: 0.6 },
  ];

  return [
    ...staticPages,
    ...events.map((e) => ({
      url: `${base}/events/${e.slug}`,
      changeFrequency: "daily" as const,
      priority: 0.9,
    })),
    ...studies.map((s) => ({
      url: `${base}/portfolio/${s.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
