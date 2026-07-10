/** Keystatic publicPath prefix for CMS image fields. */
export const MEDIA_URL_PREFIX = '/api/media/images/'

export function resolveMediaUrl(ref: string | undefined | null): string | undefined {
  if (!ref) return undefined
  if (ref.startsWith(MEDIA_URL_PREFIX)) return ref
  if (ref.startsWith('/images/')) {
    return ref.replace(/^\/images\//, MEDIA_URL_PREFIX)
  }
  return ref
}
