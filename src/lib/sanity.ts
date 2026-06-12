import { createClient } from "next-sanity";
import imageUrlBuilder from "@sanity/image-url";

type SanityImageSource = Parameters<
  ReturnType<typeof imageUrlBuilder>["image"]
>[0];

export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production";
export const apiVersion = "2026-06-01";

export const sanityConfigured = Boolean(projectId);

export const sanityClient = sanityConfigured
  ? createClient({
      projectId,
      dataset,
      apiVersion,
      useCdn: true,
    })
  : null;

const builder = sanityConfigured && sanityClient ? imageUrlBuilder(sanityClient) : null;

export function urlFor(source: SanityImageSource): string | undefined {
  return builder ? builder.image(source).auto("format").url() : undefined;
}
