'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Check, Loader2, LockKeyhole } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

/**
 * Landing page for the Supabase password-recovery email. The email links here
 * with `#access_token=…&type=recovery`, so this page swaps the token for a
 * session and lets the user pick a brand-new password.
 */
export default function ResetPasswordPage() {
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'ready' | 'done'>('loading')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)

  // Recover the session from the URL hash. Supabase appends the recovery
  // tokens to the redirect URL as a hash fragment, so we read it client-side
  // once the page is hydrated.
  useEffect(() => {
    async function recover() {
      const supabase = createClient()
      const hash = window.location.hash.substring(1)
      const params = new URLSearchParams(hash)
      const accessToken = params.get('access_token')
      const refreshToken = params.get('refresh_token')

      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
        if (!error) {
          setStatus('ready')
          return
        }
      }

      // Fallback: the recovery email may have already opened a session via a
      // deep link; ask Supabase about the current session before giving up.
      const { data } = await supabase.auth.getSession()
      if (data.session) {
        setStatus('ready')
      } else {
        toast.error('Invalid or expired reset link — request a new one.')
        router.replace('/')
      }
    }
    void recover()
  }, [router])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      toast.error('Passwords do not match.')
      return
    }
    setBusy(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw new Error(error.message)
      setStatus('done')
      toast.success('Password updated — you can sign in now.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not update password')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="dialog-panel w-full max-w-md rounded-3xl border border-stone-700 bg-stone-950 p-6 shadow-2xl shadow-black/60">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-amber-400/80">
              Recover your account
            </p>
            <h1 className="mt-1 text-xl font-bold">
              {status === 'done' ? 'Password updated' : 'Choose a new password'}
            </h1>
          </div>
          <LockKeyhole className="h-5 w-5 text-amber-400" />
        </div>

        {status === 'loading' ? (
          <div className="mt-6 flex items-center justify-center gap-2 rounded-xl border border-stone-800 bg-stone-900/60 px-4 py-4 text-sm text-stone-400">
            <Loader2 className="h-4 w-4 animate-spin" /> Checking your reset link…
          </div>
        ) : status === 'done' ? (
          <div className="mt-6 space-y-4">
            <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
              <Check className="h-4 w-4" /> Your password has been reset.
            </div>
            <button
              onClick={() => router.push('/')}
              className="btn-drip w-full py-3 text-sm"
            >
              Back to AnieLab
            </button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-stone-300">New password</span>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-xl border border-stone-700 bg-stone-900 px-4 py-2.5 text-sm outline-none transition focus:border-amber-500"
                placeholder="At least 8 characters"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-stone-300">Confirm password</span>
              <input
                type="password"
                required
                minLength={8}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="mt-1 w-full rounded-xl border border-stone-700 bg-stone-900 px-4 py-2.5 text-sm outline-none transition focus:border-amber-500"
                placeholder="Repeat your new password"
              />
            </label>
            <button
              type="submit"
              disabled={busy}
              className="btn-drip flex w-full items-center justify-center gap-2 py-3 text-sm disabled:opacity-60"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save new password'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
