import { getRuntimeEnv } from '@/lib/runtime-env'

/** Constant-time string compare to avoid leaking match length via timing. */
async function timingSafeEqual(a: string, b: string): Promise<boolean> {
  const enc = new TextEncoder()
  const [digestA, digestB] = await Promise.all([
    crypto.subtle.digest('SHA-256', enc.encode(a)),
    crypto.subtle.digest('SHA-256', enc.encode(b)),
  ])
  const bytesA = new Uint8Array(digestA)
  const bytesB = new Uint8Array(digestB)
  let diff = 0
  for (let i = 0; i < bytesA.length; i++) {
    diff |= bytesA[i] ^ bytesB[i]
  }
  return diff === 0 && a.length === b.length
}

export async function POST(request: Request) {
  const adminUsername = getRuntimeEnv('ADMIN_USERNAME')
  const adminPassword = getRuntimeEnv('ADMIN_PASSWORD')
  const botToken = getRuntimeEnv('KEYSTATIC_BOT_TOKEN')

  if (!adminUsername || !adminPassword || !botToken) {
    return Response.json(
      { error: 'Username/password sign-in is not configured on this environment.' },
      { status: 503 },
    )
  }

  const body = await request.json().catch(() => null)
  const username = typeof body?.username === 'string' ? body.username : ''
  const password = typeof body?.password === 'string' ? body.password : ''

  const [usernameOk, passwordOk] = await Promise.all([
    timingSafeEqual(username, adminUsername),
    timingSafeEqual(password, adminPassword),
  ])

  if (!usernameOk || !passwordOk) {
    return Response.json({ error: 'Invalid username or password.' }, { status: 401 })
  }

  // Same cookie Keystatic's own GitHub OAuth callback sets — the Keystatic UI and
  // API routes don't distinguish where the token came from, they just use it as
  // a GitHub bearer token. Saves made in this session commit as the bot account.
  const maxAge = 60 * 60 * 24 * 7 // 7 days
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  return new Response(null, {
    status: 204,
    headers: {
      'Set-Cookie': `keystatic-gh-access-token=${botToken}; Path=/; SameSite=Lax; Max-Age=${maxAge}${secure}`,
    },
  })
}
