export async function GET() {
  return new Response(null, {
    status: 302,
    headers: {
      Location: '/keystatic',
      'Set-Cookie': [
        'keystatic-gh-access-token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax',
        'keystatic-gh-refresh-token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax',
      ].join(', '),
    },
  })
}
