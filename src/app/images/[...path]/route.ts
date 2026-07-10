import { NextResponse } from 'next/server'
import { MEDIA_URL_PREFIX } from '@/lib/media-url'

/** 301 legacy `/images/*` URLs to the backend media API. */
export async function GET(
  request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path: segments } = await context.params
  const target = new URL(
    `${MEDIA_URL_PREFIX}${segments.join('/')}`,
    request.url,
  )
  return NextResponse.redirect(target, 301)
}
