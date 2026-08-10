'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { toast } from 'sonner'
import { Loader2, Mail, Wallet, X, Check } from 'lucide-react'
import { useWalletStore } from '@/lib/stellar/useWalletAuth'
import { useAuthDialog } from '@/lib/useAuthDialog'
import { createClient } from '@/lib/supabase/client'
import { APP_HOST, APP_URL, DASHBOARD_PATH, LANDING_HOST } from '@/lib/hosts'
import { isAdminAccessToken } from '@/lib/admin/check'
import WalletPicker from './WalletPicker'
import PasswordField from './PasswordField'

type Tab = 'email' | 'wallet'

type View = 'main' | 'forgot' | 'otp'

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3001'

const AVAILABLE_ROLES = [
  'Writer',
  'Illustrator',
  'Composer',
  'Voice Actor',
  'Developer',
  'Producer',
  'Designer',
  'Backer',
] as const

function RolePicker({
  selected,
  onChange,
}: {
  selected: string[]
  onChange: (roles: string[]) => void
}) {
  function toggle(role: string) {
    if (selected.includes(role)) {
      onChange(selected.filter((r) => r !== role))
    } else if (selected.length < 3) {
      onChange([...selected, role])
    } else {
      toast.error('You can select up to 3 roles.')
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-stone-300">Pick your roles</span>
        <span className={`text-xs font-medium ${selected.length >= 3 ? 'text-amber-400' : 'text-stone-500'}`}>
          {selected.length}/3
        </span>
      </div>
      <p className="text-xs text-stone-500">Choose up to 3. You can change these later in your account settings.</p>
      <div className="flex flex-wrap gap-2">
        {AVAILABLE_ROLES.map((role) => {
          const active = selected.includes(role)
          return (
            <button
              key={role}
              type="button"
              onClick={() => toggle(role)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                active
                  ? 'border-amber-500 bg-amber-500/15 text-amber-300'
                  : 'border-stone-700 bg-stone-900 text-stone-400 hover:border-stone-500 hover:text-stone-300'
              } ${!active && selected.length >= 3 ? 'opacity-40 cursor-not-allowed' : ''}`}
              disabled={!active && selected.length >= 3}
            >
              {active && <Check className="h-3 w-3" />}
              {role}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// Rough client-side strength score for the signup form — length, case,
// digits, and special characters each add a point out of four.
function passwordStrength(pw: string): {
  score: number
  label: string
  color: string
} {
  if (!pw) return { score: 0, label: '', color: '' }
  let score = 0
  if (pw.length >= 8) score++
  if (pw.length >= 12) score++
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score++
  const labels = ['Weak', 'Weak', 'Okay', 'Strong', 'Very strong']
  const colors = ['#ef4444', '#ef4444', '#f59e0b', '#84cc16', '#10b981']
  return { score, label: labels[score], color: colors[score] }
}

export default function AuthDialog() {
  const open = useAuthDialog((s) => s.open)
  const initialRole = useAuthDialog((s) => s.initialRole)
  const onClose = useAuthDialog((s) => s.closeDialog)
  const [tab, setTab] = useState<Tab>('wallet')
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [view, setView] = useState<View>('main')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [otpCode, setOtpCode] = useState('')
  const [sentEmail, setSentEmail] = useState('')
  const [resendIn, setResendIn] = useState(0)
  const [selectedRoles, setSelectedRoles] = useState<string[]>([])

  const strength = passwordStrength(password)

  // Counts down the email-resend cooldown (shared by the signup-OTP and
  // forgot-password flows) so users can't spam the mailer.
  useEffect(() => {
    if (resendIn <= 0) return
    const t = setInterval(() => setResendIn((s) => s - 1), 1000)
    return () => clearInterval(t)
  }, [resendIn])

  function startCooldown() {
    setResendIn(30)
  }

  const { address, status, authStatus, error, signIn } = useWalletStore()

  // The dialog only ever renders after a user click (open=true), so this is
  // always client-side — document.body is safe here, and SSR never reaches it.
  useEffect(() => {
    if (open) {
      // Defer the reset so the effect body never sets state synchronously
      // (avoids cascading renders when the dialog opens).
      void Promise.resolve().then(() => {
        resetView()
        // Pre-select a role (e.g. from a "Who it's for" card) and jump straight
        // to the email signup form where the role picker lives.
        if (initialRole && (AVAILABLE_ROLES as readonly string[]).includes(initialRole)) {
          setSelectedRoles([initialRole])
          setMode('signup')
          setTab('email')
        }
      })
    }
  }, [open, initialRole])

  if (!open) return null

  // Kick the user back to the sign-in form whenever the dialog reopens or the
  // tab changes, so a stale "forgot password" screen never lingers around.
  function resetView() {
    setView('main')
    setMode('signin')
    setOtpCode('')
    setSentEmail('')
    setConfirmPassword('')
    setResendIn(0)
    setSelectedRoles([])
  }

  // The dialog only ever opens on the landing host (the app host redirects
  // signed-out visitors away before they reach it), so a successful sign-in
  // should always land in the app: jump to the dashboard. On the app host
  // itself this is a no-op.
  function onAuthSuccess() {
    onClose()
    const { hostname } = window.location
    if (hostname === APP_HOST) return
    if (hostname === LANDING_HOST || hostname === `www.${LANDING_HOST}`) {
      window.location.href = `${APP_URL}${DASHBOARD_PATH}`
      return
    }
    // Local dev / any other host: stay on this origin so the session cookie
    // (host-only here) is still visible on the dashboard.
    window.location.href = DASHBOARD_PATH
  }

  // Admin accounts are banned from the normal site — they authenticate only
  // through the self-contained panel at app.anielab.app/admin. Drop the
  // session immediately so nothing lingers.
  async function rejectAdminAccount(supabase: ReturnType<typeof createClient>) {
    await supabase.auth.signOut()
    throw new Error('Admin accounts cannot sign in here. Use the admin panel instead.')
  }

  // Admin status is decided by metadata OR the backend's admin_credentials
  // table, so a missing role flag can't sneak an admin past the ban.
  async function isAdminUser(
    user: { user_metadata?: Record<string, unknown> } | null | undefined,
    accessToken: string | null | undefined
  ): Promise<boolean> {
    if (user?.user_metadata?.role === 'admin') return true
    if (!accessToken) return false
    return isAdminAccessToken(accessToken)
  }

  async function emailSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    try {
      const supabase = createClient()
      if (mode === 'signup') {
        if (password !== confirmPassword) {
          toast.error('Passwords do not match.')
          return
        }
        if (strength.score < 2) {
          toast.error('Pick a stronger password — at least 8 characters with a mix of case, numbers, and symbols.')
          return
        }
        // Signup goes through the backend, which creates the account and
        // emails a Brevo verification code. The dialog then steps into the
        // OTP view to confirm the email.
        const res = await fetch(`${BACKEND}/api/auth/signup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, roles: selectedRoles }),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data.error ?? 'Could not start signup')
        setSentEmail(email)
        setView('otp')
        startCooldown()
        toast.success('Verification code sent — check your inbox to finish creating your account.')
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw new Error(error.message)
        if (await isAdminUser(data.user, data.session?.access_token)) {
          await rejectAdminAccount(supabase)
        }
        if (data.user) {
          // link this account to the users table (no-op if already linked)
          const { error: linkError } = await supabase
            .from('users')
            .upsert({ id: data.user.id, auth_method: 'email' }, { onConflict: 'id' })
          if (linkError) console.warn('users row link failed', linkError)
        }
        toast.success('Signed in.')
        onAuthSuccess()
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  // Email users who lost their password get a reset link. Supabase emails the
  // recovery link directly; the redirect target is /reset-password, which reads
  // the recovery token out of the URL and lets them choose a new password.
  async function forgotPasswordSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (error) throw new Error(error.message)
      toast.success('Reset link sent — check your inbox.')
      startCooldown()
      resetView()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not send reset link')
    } finally {
      setBusy(false)
    }
  }

  // Signup verification: confirm the Brevo email code, then exchange the
  // backend-issued magic-link token for a real Supabase session.
  async function verifyOtpCode(e: React.FormEvent) {
    e.preventDefault()
    if (!otpCode.trim()) {
      toast.error('Enter the code from your email.')
      return
    }
    setBusy(true)
    try {
      const emailAddr = sentEmail || email
      const res = await fetch(`${BACKEND}/api/auth/signup/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailAddr, code: otpCode.trim() }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error ?? 'Wrong or expired code')

      const supabase = createClient()
      const { data: sessionData, error } = await supabase.auth.verifyOtp({
        type: 'magiclink',
        token_hash: data.tokenHash,
      })
      if (error) throw new Error(error.message)
      if (await isAdminUser(sessionData.user, sessionData.session?.access_token)) {
        await rejectAdminAccount(supabase)
      }
      if (sessionData.user) {
        const { error: linkError } = await supabase
          .from('users')
          .upsert(
            { id: sessionData.user.id, auth_method: 'email' },
            { onConflict: 'id' }
          )
        if (linkError) console.warn('users row link failed', linkError)
      }
      toast.success('Welcome to AnieLab — account created!')
      onAuthSuccess()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Wrong or expired code')
    } finally {
      setBusy(false)
    }
  }

  // Resend the signup verification code (cooldown enforced server-side too).
  async function resendOtpCode() {
    if (resendIn > 0) return
    setBusy(true)
    try {
      const res = await fetch(`${BACKEND}/api/auth/signup/resend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: sentEmail || email }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error ?? 'Could not resend code')
      toast.success('New code sent — check your inbox.')
      startCooldown()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not resend code')
    } finally {
      setBusy(false)
    }
  }

  async function walletSignIn(providerId: string) {
    await signIn(providerId, selectedRoles)
    if (useWalletStore.getState().authStatus === 'authenticated') {
      toast.success('Signed in with wallet.')
      onAuthSuccess()
    }
  }

  const walletBusy = status === 'connecting' || authStatus === 'signing'
  const signedIn = authStatus === 'authenticated'

  return createPortal(
    <div
      className="dialog-overlay fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="dialog-panel max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl border border-stone-700 bg-stone-950 p-6 shadow-2xl shadow-black/60"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">
            {signedIn ? 'Signed in' : 'Join AnieLab'}
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-stone-500 transition hover:bg-stone-800 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {signedIn ? (
          <div className="mt-6 space-y-4">
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 font-mono text-xs text-amber-200">
              {address}
            </div>
            <button
              onClick={() => {
                useWalletStore.getState().signOut()
                onClose()
              }}
              className="btn-drip-ghost w-full py-2.5"
            >
              Sign out
            </button>
          </div>
        ) : (
          <>
            <div
              className="mt-4 flex gap-1 border border-stone-800 bg-stone-900 p-1"
              style={{ borderRadius: '1rem 0 1rem 0' }}
            >
              <button
                onClick={() => {
                  resetView()
                  setTab('wallet')
                }}
                className={`flex flex-1 items-center justify-center gap-2 py-2 text-sm font-medium transition ${
                  tab === 'wallet'
                    ? 'bg-gradient-to-b from-amber-300 to-amber-500 text-stone-950'
                    : 'text-stone-400 hover:text-white'
                }`}
                style={{ borderRadius: '0.75rem 0 0.75rem 0' }}
              >
                <Wallet className="h-4 w-4" /> Wallet
              </button>
              <button
                onClick={() => {
                  resetView()
                  setTab('email')
                }}
                className={`flex flex-1 items-center justify-center gap-2 py-2 text-sm font-medium transition ${
                  tab === 'email'
                    ? 'bg-gradient-to-b from-amber-300 to-amber-500 text-stone-950'
                    : 'text-stone-400 hover:text-white'
                }`}
                style={{ borderRadius: '0.75rem 0 0.75rem 0' }}
              >
                <Mail className="h-4 w-4" /> Email
              </button>
            </div>

            {tab === 'wallet' ? (
              <div className="mt-6 space-y-4">
                <p className="text-sm text-stone-400">
                  Pick a wallet to connect — Freighter, LOBSTR, xBull, Rabet,
                  Albedo, Hana, and more. Your public address is used as your
                  AnieLab account.
                </p>

                <RolePicker selected={selectedRoles} onChange={setSelectedRoles} />

                {walletBusy ? (
                  <div className="flex items-center justify-center gap-2 rounded-xl border border-stone-800 bg-stone-900/60 px-4 py-3 text-sm text-stone-400">
                    <Loader2 className="h-4 w-4 animate-spin" /> Connecting…
                  </div>
                ) : (
                  <WalletPicker onSelect={walletSignIn} />
                )}

                {error && <p className="text-center text-xs text-red-400">{error}</p>}
              </div>
            ) : view === 'forgot' ? (
              <form onSubmit={forgotPasswordSubmit} className="mt-6 space-y-4">
                <p className="text-sm leading-relaxed text-stone-400">
                  Enter the email you signed up with and we&apos;ll send a link
                  to reset your password.
                </p>
                <label className="block">
                  <span className="text-sm font-medium text-stone-300">Email</span>
                  <input
                    type="email"
                    required
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-stone-700 bg-stone-900 px-4 py-2.5 text-sm outline-none transition focus:border-amber-500"
                    placeholder="you@example.com"
                  />
                </label>
                <button
                  type="submit"
                  disabled={busy}
                  className="btn-drip flex w-full items-center justify-center gap-2 py-3 disabled:opacity-60"
                >
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send reset link'}
                </button>
                <button
                  type="button"
                  onClick={resetView}
                  className="w-full text-center text-xs text-stone-500 hover:text-amber-300"
                >
                  ← Back to sign in
                </button>
              </form>
            ) : view === 'otp' ? (
              <form onSubmit={verifyOtpCode} className="mt-6 space-y-4">
                <p className="text-sm leading-relaxed text-stone-400">
                  We sent a 6-digit code to{' '}
                  <span className="font-medium text-stone-200">{sentEmail || email}</span>.
                  Enter it below to verify your email and finish creating your account.
                </p>
                <label className="block">
                  <span className="text-sm font-medium text-stone-300">One-time code</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    required
                    autoFocus
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    className="mt-1 w-full rounded-xl border border-stone-700 bg-stone-900 px-4 py-2.5 text-center font-mono text-lg tracking-[0.4em] text-amber-200 outline-none transition focus:border-amber-500"
                    placeholder="000000"
                  />
                </label>
                <button
                  type="submit"
                  disabled={busy || otpCode.length < 6}
                  className="btn-drip flex w-full items-center justify-center gap-2 py-3 text-sm disabled:opacity-60"
                >
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Verify & create account'}
                </button>
                <button
                  type="button"
                  onClick={resendOtpCode}
                  disabled={busy || resendIn > 0}
                  className="w-full text-center text-xs text-stone-500 hover:text-amber-300 disabled:opacity-50"
                >
                  {resendIn > 0 ? `Resend code in ${resendIn}s` : 'Resend code'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup')
                    setView('main')
                  }}
                  className="w-full text-center text-xs text-stone-500 hover:text-amber-300"
                >
                  ← Back to the signup form
                </button>
              </form>
            ) : (
              <form onSubmit={emailSubmit} className="mt-6 space-y-4">
                <div
                  className="grid grid-cols-2 gap-1 rounded-2xl border border-stone-700 bg-stone-900 p-1"
                  style={{ borderRadius: '1rem 0 1rem 0' }}
                >
                  <button
                    type="button"
                    onClick={() => setMode('signin')}
                    className={`rounded-xl py-2.5 text-sm font-semibold transition ${
                      mode === 'signin'
                        ? 'bg-gradient-to-b from-amber-300 to-amber-500 text-stone-950 shadow-lg shadow-amber-500/20'
                        : 'text-stone-400 hover:text-white'
                    }`}
                    style={{ borderRadius: '0.75rem 0 0.75rem 0' }}
                  >
                    Sign in
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('signup')}
                    className={`rounded-xl py-2.5 text-sm font-semibold transition ${
                      mode === 'signup'
                        ? 'bg-gradient-to-b from-amber-300 to-amber-500 text-stone-950 shadow-lg shadow-amber-500/20'
                        : 'text-stone-400 hover:text-white'
                    }`}
                    style={{ borderRadius: '0.75rem 0 0.75rem 0' }}
                  >
                    Create account
                  </button>
                </div>
                <label className="block">
                  <span className="text-sm font-medium text-stone-300">Email</span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-stone-700 bg-stone-900 px-4 py-2.5 text-sm outline-none transition focus:border-amber-500"
                    placeholder="you@example.com"
                  />
                </label>
                <PasswordField
                  label="Password"
                  value={password}
                  onChange={setPassword}
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                />
                {mode === 'signup' && (
                  <>
                    {password && (
                      <div className="-mt-2">
                        <div className="flex gap-1.5">
                          {[1, 2, 3, 4].map((i) => (
                            <div
                              key={i}
                              className="h-1 flex-1 rounded-full bg-stone-800"
                            >
                              <div
                                className="h-full rounded-full transition-all"
                                style={{
                                  width: strength.score >= i ? '100%' : '0%',
                                  backgroundColor: strength.color,
                                }}
                              />
                            </div>
                          ))}
                        </div>
                        <p
                          className="mt-1 text-right text-[11px] font-medium"
                          style={{ color: strength.color }}
                        >
                          {strength.label}
                        </p>
                      </div>
                    )}
                    <label className="block">
                      <span className="text-sm font-medium text-stone-300">
                        Confirm password
                      </span>
                      <input
                        type="password"
                        required
                        minLength={8}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={`mt-1 w-full rounded-xl border bg-stone-900 px-4 py-2.5 text-sm outline-none transition ${
                          confirmPassword && confirmPassword !== password
                            ? 'border-red-500/60 focus:border-red-500'
                            : 'border-stone-700 focus:border-amber-500'
                        }`}
                        placeholder="Repeat your password"
                      />
                      {confirmPassword && confirmPassword !== password && (
                        <span className="mt-1 block text-[11px] text-red-400">
                          Passwords don&apos;t match.
                        </span>
                      )}
                    </label>
                    <RolePicker selected={selectedRoles} onChange={setSelectedRoles} />
                  </>
                )}
                <button
                  type="submit"
                  disabled={busy}
                  className="btn-drip flex w-full items-center justify-center gap-2 py-3 disabled:opacity-60"
                >
                  {busy ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : mode === 'signin' ? (
                    'Sign in'
                  ) : (
                    'Create account'
                  )}
                </button>
                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signin')
                      setView('forgot')
                    }}
                    className="w-full text-center text-xs text-stone-500 hover:text-amber-300"
                  >
                    Forgot your password?
                  </button>
                )}
              </form>
            )}
          </>
        )}
      </div>
    </div>,
    document.body
  )
}
