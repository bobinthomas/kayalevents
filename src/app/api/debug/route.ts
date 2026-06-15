export async function GET() {
  const githubMode = Boolean(process.env.KEYSTATIC_GITHUB_CLIENT_ID)
  const hasToken = Boolean(process.env.KEYSTATIC_GITHUB_TOKEN)

  return Response.json({
    has_client_id: githubMode,
    has_client_secret: Boolean(process.env.KEYSTATIC_GITHUB_CLIENT_SECRET),
    has_keystatic_secret: Boolean(process.env.KEYSTATIC_SECRET),
    has_github_token: hasToken,
    storage_mode: githubMode ? 'github' : 'local',
    reader_mode: hasToken ? 'github-api' : githubMode ? 'local-fs (mismatch — add KEYSTATIC_GITHUB_TOKEN)' : 'local-fs',
    node_env: process.env.NODE_ENV,
  })
}
