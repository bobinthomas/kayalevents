import { defineField, defineType } from "sanity";

export const eventType = defineType({
  name: "event",
  title: "Event",
  type: "document",
  fields: [
    defineField({ name: "title", type: "string", validation: (r) => r.required() }),
    defineField({
      name: "slug",
      type: "slug",
      options: { source: "title" },
      validation: (r) => r.required(),
    }),
    defineField({
      name: "artists",
      type: "array",
      of: [{ type: "string" }],
      validation: (r) => r.required().min(1),
    }),
    defineField({ name: "tagline", type: "string" }),
    defineField({ name: "description", type: "text", rows: 6, validation: (r) => r.required() }),
    defineField({
      name: "status",
      type: "string",
      options: {
        list: [
          { title: "On Sale", value: "on-sale" },
          { title: "Selling Fast", value: "selling-fast" },
          { title: "Sold Out", value: "sold-out" },
          { title: "Past", value: "past" },
        ],
        layout: "radio",
      },
      initialValue: "on-sale",
      validation: (r) => r.required(),
    }),
    defineField({ name: "heroImage", type: "image", options: { hotspot: true } }),
    defineField({ name: "posterImage", type: "image", options: { hotspot: true } }),
    defineField({
      name: "shows",
      title: "Shows (per city/date)",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            defineField({ name: "city", type: "string", validation: (r) => r.required() }),
            defineField({ name: "venue", type: "string", validation: (r) => r.required() }),
            defineField({
              name: "start",
              title: "Date & time",
              type: "datetime",
              validation: (r) => r.required(),
            }),
            defineField({ name: "ticketUrl", title: "Ticket link", type: "url" }),
            defineField({ name: "soldOut", type: "boolean", initialValue: false }),
          ],
          preview: {
            select: { title: "city", subtitle: "venue" },
          },
        },
      ],
      validation: (r) => r.required().min(1),
    }),
    defineField({
      name: "ticketTiers",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            defineField({ name: "name", type: "string" }),
            defineField({ name: "price", type: "string" }),
          ],
        },
      ],
    }),
    defineField({ name: "ageRestriction", type: "string" }),
    defineField({
      name: "entryConditions",
      type: "array",
      of: [{ type: "string" }],
    }),
    defineField({
      name: "faqs",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            defineField({ name: "question", type: "string" }),
            defineField({ name: "answer", type: "text", rows: 3 }),
          ],
          preview: { select: { title: "question" } },
        },
      ],
    }),
    defineField({
      name: "featured",
      title: "Feature in hero carousel",
      description: "Featured events appear before non-featured ones; use heroOrder to set their sequence",
      type: "boolean",
      initialValue: false,
    }),
    // Hero carousel fields — each event supplies its own slide content
    defineField({
      name: "heroOrder",
      title: "Hero order",
      description: "Lower numbers appear earlier in the carousel (among featured events)",
      type: "number",
      initialValue: 99,
    }),
    defineField({
      name: "heroHeadline",
      title: "Hero headline",
      description: "Override the event title in the carousel slide (leave blank to use the title)",
      type: "string",
    }),
    defineField({
      name: "heroSubcopy",
      title: "Hero subcopy",
      description: "Override the tagline in the carousel slide (leave blank to use the tagline)",
      type: "text",
      rows: 2,
    }),
    defineField({
      name: "heroCtaLabel",
      title: "Hero CTA label",
      description: "Button text in the carousel slide (defaults to 'Buy Tickets' or 'Join Waitlist')",
      type: "string",
    }),
    defineField({
      name: "heroCtaUrl",
      title: "Hero CTA URL",
      description: "Button URL in the carousel slide (defaults to the first show's ticket link)",
      type: "string",
    }),
  ],
  preview: {
    select: { title: "title", subtitle: "status", media: "posterImage" },
  },
});
