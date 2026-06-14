import { type SchemaTypeDefinition } from 'sanity'

import { caseStudyType } from '../../../sanity/schemaTypes/caseStudy'
import { eventType } from '../../../sanity/schemaTypes/event'
import { serviceType } from '../../../sanity/schemaTypes/service'
import { siteSettingsType } from '../../../sanity/schemaTypes/siteSettings'
import { testimonialType } from '../../../sanity/schemaTypes/testimonial'

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [eventType, caseStudyType, serviceType, testimonialType, siteSettingsType],
}
