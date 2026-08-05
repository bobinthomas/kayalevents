import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { AdminLoginForm } from '@/components/admin-login-form'
import KeystaticApp from './keystatic-app'

/** Only "main" holds real content — lock out Keystatic's branch switcher so saves can't silently land elsewhere. */
const ALLOWED_BRANCH = 'main'

export default async function KeystaticPage({
  params,
}: {
  params: Promise<{ params?: string[] }>
}) {
  const cookieStore = await cookies()
  const hasSession = Boolean(cookieStore.get('keystatic-gh-access-token')?.value)

  if (!hasSession) {
    return <AdminLoginForm />
  }

  const { params: segments = [] } = await params
  if (segments[0] === 'branch' && segments[1] && segments[1] !== ALLOWED_BRANCH) {
    const rest = segments.slice(2).join('/')
    redirect(`/keystatic/branch/${ALLOWED_BRANCH}${rest ? `/${rest}` : ''}`)
  }

  return <KeystaticApp />
}
