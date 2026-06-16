import { getRuntimeEnv, hasRuntimeEnv } from '@/lib/runtime-env'

export async function GET() {
  if (process.env.NODE_ENV !== 'development') {
    return new Response('Not Found', { status: 404 })
  }

  const token = getRuntimeEnv('KEYSTATIC_GITHUB_TOKEN')
  const githubMode = hasRuntimeEnv('KEYSTATIC_GITHUB_CLIENT_ID')

  let workerEnvKeys: string[] = []
  try {
    const { getCloudflareContext } = await import('@opennextjs/cloudflare')
    const env = getCloudflareContext().env as Record<string, unknown>
    workerEnvKeys = Object.keys(env).filter((k) => k.startsWith('KEYSTATIC_'))
  } catch {
    workerEnvKeys = []
  }

  return Response.json({
    has_client_id: githubMode,
    has_client_secret: hasRuntimeEnv('KEYSTATIC_GITHUB_CLIENT_SECRET'),
    has_keystatic_secret: hasRuntimeEnv('KEYSTATIC_SECRET'),
    has_github_token: Boolean(token),
    token_length: token?.length ?? 0,
    storage_mode: githubMode ? 'github' : 'local',
    reader_mode: token
      ? 'github-api'
      : githubMode
        ? 'local-fs (mismatch — add KEYSTATIC_GITHUB_TOKEN)'
        : 'local-fs',
    keystatic_keys_on_worker: workerEnvKeys,
    node_env: process.env.NODE_ENV,
  })
}
