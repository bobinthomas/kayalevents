import { defineField, defineType } from "sanity";

export const serviceType = defineType({
  name: "service",
  title: "Service",
  type: "document",
  fields: [
    defineField({ name: "title", type: "string", validation: (r) => r.required() }),
    defineField({
      name: "slug",
      type: "slug",
      options: { source: "title" },
      validation: (r) => r.required(),
    }),
    defineField({ name: "description", type: "text", rows: 4, validation: (r) => r.required() }),
    defineField({
      name: "highlights",
      type: "array",
      of: [{ type: "string" }],
    }),
    defineField({ name: "order", type: "number", initialValue: 0 }),
  ],
});
