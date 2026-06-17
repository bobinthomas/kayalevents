import { createReader } from '@keystatic/core/reader'
import { createGitHubReader } from '@keystatic/core/reader/github'
import keystaticConfig from '../../keystatic.config'
import { getRuntimeEnv } from '@/lib/runtime-env'
import { getGitHubContentRef } from '@/lib/github-content-ref'

const REPO = 'bobinthomas/kayalevents' as const

/** GitHub API requires User-Agent; Cloudflare Workers omit it by default. */
function patchFetchForGitHubApi() {
  if (typeof globalThis.fetch !== 'function') return
  const originalFetch = globalThis.fetch.bind(globalThis)
  if ((originalFetch as { __keystaticPatched?: boolean }).__keystaticPatched) return

  const patched = (input: RequestInfo | URL, init?: RequestInit) => {
    const headers = new Headers(init?.headers)
    if (!headers.has('User-Agent')) {
      headers.set('User-Agent', 'kayalevents/1.0 (Keystatic GitHub reader)')
    }
    return originalFetch(input, { ...init, headers })
  }
  ;(patched as { __keystaticPatched?: boolean }).__keystaticPatched = true
  globalThis.fetch = patched
}

function createContentReader() {
  const token = getRuntimeEnv('KEYSTATIC_GITHUB_TOKEN')

  if (token) {
    patchFetchForGitHubApi()
    const ref = getGitHubContentRef()
    return createGitHubReader(keystaticConfig, {
      repo: REPO,
      token,
      ...(ref ? { ref } : {}),
    })
  }

  if (getRuntimeEnv('KEYSTATIC_GITHUB_CLIENT_ID')) {
    console.warn(
      '[content] KEYSTATIC_GITHUB_TOKEN is not set — CMS saves go to GitHub but the site reads local content/*.json. Add a read-only GitHub PAT to .env.local and Cloudflare secrets.',
    )
  }

  try {
    return createReader(process.cwd(), keystaticConfig)
  } catch {
    return null
  }
}

let cachedReader: ReturnType<typeof createContentReader> | undefined

/** Lazy reader — env bindings are only guaranteed at request time on Workers. */
export function getKeystaticReader() {
  if (cachedReader === undefined) {
    cachedReader = createContentReader()
  }
  return cachedReader
}
