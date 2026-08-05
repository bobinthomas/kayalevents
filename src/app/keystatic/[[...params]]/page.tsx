import { cookies } from 'next/headers'
import { AdminLoginForm } from '@/components/admin-login-form'
import KeystaticApp from './keystatic-app'

export default async function KeystaticPage() {
  const cookieStore = await cookies()
  const hasSession = Boolean(cookieStore.get('keystatic-gh-access-token')?.value)

  if (!hasSession) {
    return <AdminLoginForm />
  }

  return <KeystaticApp />
}
