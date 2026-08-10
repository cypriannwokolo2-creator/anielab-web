'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { setAdminToken } from '@/lib/admin/token'
import { isAdminAccessToken } from '@/lib/admin/check'
import { LANDING_URL } from '@/lib/hosts'

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3001'

/**
 * Three-step admin unlock, fully self-contained on /admin (admins never use
 * the normal site): Supabase sign-in → panel password → emailed OTP. On
 * success the signed admin token is stored in a cookie and the page
 * re-renders server-side.
 */
export default function AdminLogin() {
  const router = useRouter()
  const [step, setStep] = useState<'supabase' | 'password' | 'otp'>('supabase')
  const [sbEmail, setSbEmail] = useState('')
  const [sbPassword, setSbPassword] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [maskedEmail, setMaskedEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function getAccessToken(): Promise<string | null> {
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token ?? null
  }

  // Admin eligibility is decided by metadata OR the backend's
  // admin_credentials table, so a missing role flag can't lock an admin out.
  async function isAdminSession(): Promise<boolean> {
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return false
    if (session.user.user_metadata?.role === 'admin') return true
    return isAdminAccessToken(session.access_token)
  }

  // If an admin session already exists (e.g. page revisited within its TTL),
  // skip straight to the panel password step.
  useEffect(() => {
    (async () => {
      if (await isAdminSession()) setStep('password')
    })()
  }, [])

  async function handleSupabaseSignIn() {
    setError('')
    setBusy(true)
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { data, error: err } = await supabase.auth.signInWithPassword({
        email: sbEmail,
        password: sbPassword,
      })
      if (err) throw new Error(err.message)
      const admin =
        data.user?.user_metadata?.role === 'admin' ||
        (data.session ? await isAdminAccessToken(data.session.access_token) : false)
      if (!admin) {
        await supabase.auth.signOut()
        setError('This account is not an admin account.')
        return
      }
      setStep('password')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed')
    } finally {
      setBusy(false)
    }
  }

  async function handlePassword() {
    setError('')
    setBusy(true)
    try {
      const token = await getAccessToken()
      if (!token) {
        setError('Sign in with your admin account first.')
        return
      }
      const res = await fetch(`${BACKEND}/api/admin/auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ password }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || 'Authentication failed')
        return
      }
      setMaskedEmail(data.email ?? '')
      setStep('otp')
      toast.success('Verification code sent to your email')
    } catch {
      setError('Network error — try again')
    } finally {
      setBusy(false)
    }
  }

  async function handleVerify() {
    setError('')
    setBusy(true)
    try {
      const token = await getAccessToken()
      if (!token) {
        setError('Sign in with your admin account first.')
        return
      }
      const res = await fetch(`${BACKEND}/api/admin/otp/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ code }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || 'Verification failed')
        return
      }
      setAdminToken(data.token)
      toast.success('Admin panel unlocked')
      router.refresh()
    } catch {
      setError('Network error — try again')
    } finally {
      setBusy(false)
    }
  }

  async function handleResend() {
    setError('')
    setBusy(true)
    try {
      const token = await getAccessToken()
      if (!token) return
      const res = await fetch(`${BACKEND}/api/admin/otp/resend`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || 'Resend failed')
        return
      }
      toast.success('New code sent')
    } catch {
      setError('Network error — try again')
    } finally {
      setBusy(false)
    }
  }

  // Admin sessions are locked to /admin by the middleware, so the lock
  // screen is the only place an admin can sign out and start over.
  async function handleSignOut() {
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = LANDING_URL
  }

  return (
    <div className="mx-auto max-w-md px-6 py-24">
      <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-amber-400/80">
        Admin
      </p>
      <h1 className="mt-2 text-3xl font-bold">Unlock the panel</h1>
      <p className="mt-2 text-sm text-stone-500">
        {step === 'supabase'
          ? 'Sign in with your admin account to continue.'
          : step === 'password'
            ? 'Enter your admin password. We will email you a one-time code to finish.'
            : `Enter the 6-digit code we sent to ${maskedEmail || 'your email'}.`}
      </p>

      {step === 'supabase' ? (
        <div className="mt-8 space-y-4">
          <input
            type="email"
            value={sbEmail}
            onChange={(e) => setSbEmail(e.target.value)}
            placeholder="Admin email"
            autoComplete="username"
            className="w-full rounded-xl border border-stone-700 bg-stone-800 px-4 py-3 text-sm outline-none focus:border-amber-500"
          />
          <input
            type="password"
            value={sbPassword}
            onChange={(e) => setSbPassword(e.target.value)}
            placeholder="Password"
            autoComplete="current-password"
            className="w-full rounded-xl border border-stone-700 bg-stone-800 px-4 py-3 text-sm outline-none focus:border-amber-500"
          />
          <button
            onClick={handleSupabaseSignIn}
            disabled={busy || !sbEmail || !sbPassword}
            className="w-full rounded-full bg-gradient-to-b from-amber-300 to-amber-500 px-6 py-3 text-sm font-semibold text-stone-950 transition hover:from-amber-200 hover:to-amber-400 disabled:opacity-50"
          >
            {busy ? 'Signing in…' : 'Continue'}
          </button>
        </div>
      ) : step === 'password' ? (
        <div className="mt-8 space-y-4">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Admin password"
            autoComplete="current-password"
            className="w-full rounded-xl border border-stone-700 bg-stone-800 px-4 py-3 text-sm outline-none focus:border-amber-500"
          />
          <button
            onClick={handlePassword}
            disabled={busy || !password}
            className="w-full rounded-full bg-gradient-to-b from-amber-300 to-amber-500 px-6 py-3 text-sm font-semibold text-stone-950 transition hover:from-amber-200 hover:to-amber-400 disabled:opacity-50"
          >
            {busy ? 'Checking…' : 'Continue'}
          </button>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="••••••"
            inputMode="numeric"
            autoComplete="one-time-code"
            className="w-full rounded-xl border border-stone-700 bg-stone-800 px-4 py-3 text-center font-mono text-xl tracking-[0.5em] outline-none focus:border-amber-500"
          />
          <button
            onClick={handleVerify}
            disabled={busy || code.length !== 6}
            className="w-full rounded-full bg-gradient-to-b from-amber-300 to-amber-500 px-6 py-3 text-sm font-semibold text-stone-950 transition hover:from-amber-200 hover:to-amber-400 disabled:opacity-50"
          >
            {busy ? 'Verifying…' : 'Verify code'}
          </button>
          <div className="flex items-center justify-between text-xs text-stone-500">
            <button onClick={handleResend} disabled={busy} className="hover:text-amber-300 disabled:opacity-50">
              Resend code
            </button>
            <button
              onClick={() => {
                setStep('password')
                setCode('')
                setError('')
              }}
              className="hover:text-amber-300"
            >
              ← Back
            </button>
          </div>
        </div>
      )}

      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

      <button
        onClick={handleSignOut}
        className="mt-8 text-xs text-stone-500 transition hover:text-amber-300"
      >
        Sign out and use a different account
      </button>
    </div>
  )
}
