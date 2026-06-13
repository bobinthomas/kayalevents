import { defineField, defineType } from "sanity";

export const siteSettingsType = defineType({
  name: "siteSettings",
  title: "Site Settings",
  type: "document",
  fields: [
    defineField({ name: "siteName", type: "string" }),
    defineField({ name: "tagline", type: "string" }),
    defineField({ name: "email", type: "string" }),
    defineField({ name: "phone", title: "Phone (E.164, e.g. +61450250111)", type: "string" }),
    defineField({ name: "phoneDisplay", type: "string" }),
    defineField({ name: "whatsapp", title: "WhatsApp number (digits only)", type: "string" }),
    defineField({ name: "instagram", type: "url" }),
    defineField({ name: "facebook", type: "url" }),
    defineField({ name: "baseUrl", title: "Site base URL (for canonical links, e.g. https://kayalevents.com.au)", type: "url" }),
    // Fallback hero slide — shown when there are zero active (non-past) events
    defineField({
      name: "heroImage",
      title: "Fallback hero background image URL",
      description: "Used as the hero background when no active events are configured",
      type: "url",
    }),
    defineField({
      name: "heroVideo",
      title: "Fallback hero background video URL",
      description: "Muted video loop (overrides image when supported and prefers-reduced-motion is off)",
      type: "url",
    }),
    defineField({
      name: "fallbackHeroHeadline",
      title: "Fallback hero headline",
      description: "Hero headline when there are no active events; defaults to site tagline",
      type: "string",
    }),
    defineField({
      name: "fallbackHeroSubcopy",
      title: "Fallback hero subcopy",
      type: "text",
      rows: 2,
    }),
    defineField({
      name: "fallbackHeroCtaLabel",
      title: "Fallback hero CTA label",
      type: "string",
      initialValue: "Explore Events",
    }),
    defineField({
      name: "fallbackHeroCtaUrl",
      title: "Fallback hero CTA URL",
      type: "string",
      initialValue: "/events",
    }),
  ],
});
