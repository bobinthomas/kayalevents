export const runtime = 'edge'

export async function GET() {
  return Response.json({
    has_client_id: !!process.env.KEYSTATIC_GITHUB_CLIENT_ID,
    has_client_secret: !!process.env.KEYSTATIC_GITHUB_CLIENT_SECRET,
    has_keystatic_secret: !!process.env.KEYSTATIC_SECRET,
    storage_mode: process.env.KEYSTATIC_GITHUB_CLIENT_ID ? 'github' : 'local',
    node_env: process.env.NODE_ENV,
  })
}
