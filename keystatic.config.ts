import { config, collection, singleton, fields } from '@keystatic/core'

/** CMS images live outside public/ so they are not bundled into the Worker deploy. */
const imageField = (label: string) =>
  fields.image({
    label,
    directory: 'content/media/images',
    publicPath: '/api/media/images/',
    validation: { isRequired: false },
  })

/**
 * GitHub storage is the production default (Cloudflare Workers has no filesystem).
 * Local mode is dev-only (`next dev`) — never bake it into Workers builds.
 * Set KEYSTATIC_STORAGE=local + NEXT_PUBLIC_KEYSTATIC_STORAGE=local in .env.local.
 */
const isLocalStorage =
  process.env.NODE_ENV === 'development' &&
  (process.env.KEYSTATIC_STORAGE === 'local' ||
    process.env.NEXT_PUBLIC_KEYSTATIC_STORAGE === 'local')

const storage = isLocalStorage
  ? ({ kind: 'local' } as const)
  : ({
      kind: 'github',
      repo: 'bobinthomas/kayalevents',
    } as const)

export default config({
  storage,

  collections: {
    events: collection({
      label: 'Events',
      slugField: 'slug',
      path: 'content/events/*',
      format: { data: 'json' },
      schema: {
        slug: fields.text({ label: 'URL Slug', description: 'URL-safe identifier, e.g. mohanlal-live-2026' }),
        title: fields.text({ label: 'Title' }),
        artists: fields.array(
          fields.text({ label: 'Artist' }),
          { label: 'Artists', itemLabel: (props) => props.value }
        ),
        tagline: fields.text({ label: 'Tagline', validation: { isRequired: false } }),
        description: fields.text({ label: 'Description', multiline: true }),
        status: fields.select({
          label: 'Status',
          options: [
            { label: 'On Sale', value: 'on-sale' },
            { label: 'Selling Fast', value: 'selling-fast' },
            { label: 'Sold Out', value: 'sold-out' },
            { label: 'Past', value: 'past' },
          ],
          defaultValue: 'on-sale',
        }),
        heroImage: imageField('Hero Image'),
        posterImage: imageField('Poster Image'),
        shows: fields.array(
          fields.object({
            city: fields.text({ label: 'City' }),
            venue: fields.text({ label: 'Venue' }),
            start: fields.text({ label: 'Date/Time (ISO 8601)' }),
            ticketUrl: fields.text({ label: 'Ticket URL', validation: { isRequired: false } }),
            soldOut: fields.checkbox({ label: 'Sold Out', defaultValue: false }),
          }),
          { label: 'Shows' }
        ),
        ticketTiers: fields.array(
          fields.object({
            name: fields.text({ label: 'Tier Name' }),
            price: fields.text({ label: 'Price' }),
          }),
          { label: 'Ticket Tiers' }
        ),
        ageRestriction: fields.text({ label: 'Age Restriction', validation: { isRequired: false } }),
        entryConditions: fields.array(
          fields.text({ label: 'Condition' }),
          { label: 'Entry Conditions', itemLabel: (props) => props.value }
        ),
        termsAndConditions: fields.text({
          label: 'Terms & Conditions',
          multiline: true,
          validation: { isRequired: false },
          description: 'Shown in its own section on the event page, below the FAQ.',
        }),
        faqs: fields.array(
          fields.object({
            question: fields.text({ label: 'Question' }),
            answer: fields.text({ label: 'Answer', multiline: true }),
          }),
          { label: 'FAQs' }
        ),
        featured: fields.checkbox({ label: 'Featured on Homepage', defaultValue: false }),
        heroHeadline: fields.text({ label: 'Hero Headline', validation: { isRequired: false } }),
        heroSubcopy: fields.text({ label: 'Hero Subcopy', validation: { isRequired: false } }),
        heroCtaLabel: fields.text({ label: 'Hero CTA Label', validation: { isRequired: false } }),
        heroCtaUrl: fields.text({ label: 'Hero CTA URL', validation: { isRequired: false } }),
        heroOrder: fields.integer({ label: 'Hero Order' }),
      },
    }),

    caseStudies: collection({
      label: 'Portfolio / Case Studies',
      slugField: 'slug',
      path: 'content/case-studies/*',
      format: { data: 'json' },
      schema: {
        slug: fields.text({ label: 'URL Slug', description: 'URL-safe identifier, e.g. vismayam-2025' }),
        title: fields.text({ label: 'Title' }),
        year: fields.text({ label: 'Year' }),
        summary: fields.text({ label: 'Summary', multiline: true }),
        description: fields.text({ label: 'Description', multiline: true }),
        heroImage: imageField('Hero Image'),
        stats: fields.array(
          fields.object({
            label: fields.text({ label: 'Label' }),
            value: fields.text({ label: 'Value' }),
          }),
          { label: 'Stats' }
        ),
        gallery: fields.array(
          fields.object({
            src: imageField('Image'),
            alt: fields.text({ label: 'Alt Text' }),
          }),
          { label: 'Gallery' }
        ),
        videoUrl: fields.text({ label: 'Video URL', validation: { isRequired: false } }),
        testimonial: fields.object({
          quote: fields.text({ label: 'Quote', multiline: true }),
          author: fields.text({ label: 'Author' }),
          role: fields.text({ label: 'Role' }),
        }),
      },
    }),

    services: collection({
      label: 'Services',
      slugField: 'slug',
      path: 'content/services/*',
      format: { data: 'json' },
      schema: {
        slug: fields.text({ label: 'URL Slug', description: 'URL-safe identifier, e.g. live-concerts' }),
        title: fields.text({ label: 'Title' }),
        order: fields.integer({ label: 'Display Order', description: 'Lower numbers appear first' }),
        description: fields.text({ label: 'Description', multiline: true }),
        highlights: fields.array(
          fields.text({ label: 'Highlight' }),
          { label: 'Highlights', itemLabel: (props) => props.value }
        ),
      },
    }),

    testimonials: collection({
      label: 'Testimonials',
      slugField: 'slug',
      path: 'content/testimonials/*',
      format: { data: 'json' },
      schema: {
        slug: fields.text({ label: 'Identifier', description: 'URL-safe identifier, e.g. anoop-krishnan' }),
        author: fields.text({ label: 'Author' }),
        quote: fields.text({ label: 'Quote', multiline: true }),
        role: fields.text({ label: 'Role' }),
      },
    }),
  },

  singletons: {
    siteSettings: singleton({
      label: 'Site Settings',
      path: 'content/site-settings/',
      format: { data: 'json' },
      schema: {
        siteName: fields.text({ label: 'Site Name' }),
        tagline: fields.text({ label: 'Tagline' }),
        email: fields.text({ label: 'Email' }),
        phone: fields.text({ label: 'Phone' }),
        phoneDisplay: fields.text({ label: 'Phone Display' }),
        whatsapp: fields.text({ label: 'WhatsApp Number' }),
        instagram: fields.text({ label: 'Instagram URL' }),
        facebook: fields.text({ label: 'Facebook URL', validation: { isRequired: false } }),
        baseUrl: fields.text({ label: 'Base URL' }),
        heroImage: imageField('Hero Image'),
        heroVideo: fields.text({ label: 'Hero Video Path', validation: { isRequired: false } }),
        fallbackHeroHeadline: fields.text({ label: 'Fallback Hero Headline', validation: { isRequired: false } }),
        fallbackHeroSubcopy: fields.text({ label: 'Fallback Hero Subcopy', validation: { isRequired: false } }),
        fallbackHeroCtaLabel: fields.text({ label: 'Fallback Hero CTA Label', validation: { isRequired: false } }),
        fallbackHeroCtaUrl: fields.text({ label: 'Fallback Hero CTA URL', validation: { isRequired: false } }),
      },
    }),
  },
})
