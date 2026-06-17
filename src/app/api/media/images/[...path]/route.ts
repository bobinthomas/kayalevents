import {
  contentTypeFor,
  mediaContentPath,
  readMediaBytes,
} from '@/lib/media'

export async function GET(
  _request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path: segments } = await context.params
  const urlPath = `/api/media/images/${segments.join('/')}`

  let repoPath: string
  try {
    repoPath = mediaContentPath(urlPath)
  } catch {
    return new Response('Not found', { status: 404 })
  }

  try {
    const bytes = await readMediaBytes(repoPath)
    return new Response(bytes, {
      headers: {
        'Content-Type': contentTypeFor(repoPath),
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
      },
    })
  } catch (err) {
    console.error('[api/media] miss:', repoPath, err)
    return new Response('Not found', { status: 404 })
  }
}

/** Redirect old `/images/*` URLs saved before migration. */
export async function HEAD(
  request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  return GET(request, context)
}
