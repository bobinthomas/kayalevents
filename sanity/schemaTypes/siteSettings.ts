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
  ],
});
