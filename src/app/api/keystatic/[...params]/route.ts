import { makeRouteHandler } from '@keystatic/next/route-handler'
import { revalidatePath } from 'next/cache'
import config from '../../../../../keystatic.config'

type KeystaticHandlers = ReturnType<typeof makeRouteHandler>

/** Lazy init so `next build` does not require OAuth secrets (only runtime on Workers). */
let handlers: KeystaticHandlers | null = null
function getHandlers() {
  handlers ??= makeRouteHandler({ config })
  return handlers
}

export async function GET(request: Request) {
  return getHandlers().GET(request)
}

/** Revalidate the site shell after CMS saves so pages pick up content changes. */
export async function POST(request: Request) {
  const response = await getHandlers().POST(request)
  if (response.ok) {
    revalidatePath('/', 'layout')
    revalidatePath('/events', 'page')
    revalidatePath('/portfolio', 'page')
    revalidatePath('/services', 'page')
    revalidatePath('/about', 'page')
    revalidatePath('/contact', 'page')
  }
  return response
}
