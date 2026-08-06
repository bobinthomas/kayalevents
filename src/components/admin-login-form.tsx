'use client'

import Link from 'next/link'
import { useState, type FormEvent } from 'react'

export function AdminLoginForm() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [error, setError] = useState('')

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    setStatus('loading')
    setError('')
    try {
      const res = await fetch('/api/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: data.get('username'),
          password: data.get('password'),
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        setError(body?.error ?? 'Something went wrong — please try again.')
        setStatus('error')
        return
      }
      // Full navigation so the server component re-reads the new session cookie.
      window.location.assign('/keystatic')
    } catch {
      setError('Something went wrong — please try again.')
      setStatus('error')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-marine-black px-4">
      <div className="gradient-border w-full max-w-sm rounded-2xl border border-border bg-surface p-8">
        <p className="eyebrow text-lagoon">Kayal Events</p>
        <h1 className="mt-1 font-display text-2xl text-sand">Admin sign in</h1>
        <form onSubmit={onSubmit} className="mt-6 space-y-3">
          <label className="block">
            <span className="mb-1 block text-xs text-sand-muted">Username</span>
            <input
              type="text"
              name="username"
              required
              autoComplete="username"
              className="w-full rounded-lg border border-border bg-marine-black px-4 py-2.5 text-sm text-sand transition-colors focus:border-lagoon focus:outline-none focus:ring-2 focus:ring-lagoon/50 focus:ring-offset-1 focus:ring-offset-marine-black"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-sand-muted">Password</span>
            <input
              type="password"
              name="password"
              required
              autoComplete="current-password"
              className="w-full rounded-lg border border-border bg-marine-black px-4 py-2.5 text-sm text-sand transition-colors focus:border-lagoon focus:outline-none focus:ring-2 focus:ring-lagoon/50 focus:ring-offset-1 focus:ring-offset-marine-black"
            />
          </label>
          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full rounded-full border border-lagoon/40 bg-lagoon/12 px-6 py-2.5 text-sm font-semibold text-lagoon transition-all hover:bg-lagoon/20 disabled:opacity-60"
          >
            {status === 'loading' ? 'Signing in…' : 'Sign in'}
          </button>
          {status === 'error' && (
            <p role="alert" className="text-sm text-coral">
              {error}
            </p>
          )}
        </form>
        <div className="mt-6 flex items-center gap-3">
          <div className="hairline h-px flex-1" />
          <span className="text-xs text-sand-muted">or</span>
          <div className="hairline h-px flex-1" />
        </div>
        <Link
          href="/api/keystatic/github/login"
          className="mt-6 block w-full rounded-full border border-border px-6 py-2.5 text-center text-sm font-semibold text-sand transition-colors hover:border-lagoon/50 hover:text-lagoon"
        >
          Sign in with GitHub
        </Link>
      </div>
    </div>
  )
}
