import { makeRouteHandler } from '@keystatic/next/route-handler'
import { revalidatePath } from 'next/cache'
import config from '../../../../../keystatic.config'

const { GET, POST: keystaticPOST } = makeRouteHandler({ config })

export { GET }

/** Revalidate the site shell after CMS saves so pages pick up content changes. */
export async function POST(request: Request) {
  const response = await keystaticPOST(request)
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
