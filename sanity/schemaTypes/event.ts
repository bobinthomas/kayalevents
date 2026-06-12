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
      title: "Feature on home hero",
      type: "boolean",
      initialValue: false,
    }),
  ],
  preview: {
    select: { title: "title", subtitle: "status", media: "posterImage" },
  },
});
