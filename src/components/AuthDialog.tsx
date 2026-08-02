'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2, Mail, Wallet, X } from 'lucide-react'
import { useWalletStore } from '@/lib/stellar/useWalletAuth'
import { createClient } from '@/lib/supabase/client'

type Tab = 'email' | 'wallet'

export default function AuthDialog({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const [tab, setTab] = useState<Tab>('wallet')
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)

  const { address, status, authStatus, error, signIn } = useWalletStore()

  if (!open) return null

  async function emailSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    try {
      const supabase = createClient()
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({ email, password })
        if (error) throw new Error(error.message)
        if (data.user) {
          // link this account to the users table so projects/contributions work
          await supabase
            .from('users')
            .insert({ id: data.user.id, auth_method: 'email' })
        }
        toast.success('Check your inbox to confirm your email, then sign in.')
        setMode('signin')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw new Error(error.message)
        toast.success('Signed in.')
        onClose()
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  async function walletSignIn() {
    await signIn()
  }

  const walletBusy = status === 'connecting' || authStatus === 'signing'
  const signedIn = authStatus === 'authenticated'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-stone-700 bg-stone-950 p-6 shadow-2xl shadow-black/60">
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
              className="w-full rounded-full border border-stone-700 py-2.5 text-sm font-medium text-stone-300 transition hover:border-amber-500/50 hover:text-amber-200"
            >
              Sign out
            </button>
          </div>
        ) : (
          <>
            <div className="mt-4 flex gap-1 rounded-full border border-stone-800 bg-stone-900 p-1">
              <button
                onClick={() => setTab('wallet')}
                className={`flex flex-1 items-center justify-center gap-2 rounded-full py-2 text-sm font-medium transition ${
                  tab === 'wallet'
                    ? 'bg-gradient-to-b from-amber-300 to-amber-500 text-stone-950'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                <Wallet className="h-4 w-4" /> Wallet
              </button>
              <button
                onClick={() => setTab('email')}
                className={`flex flex-1 items-center justify-center gap-2 rounded-full py-2 text-sm font-medium transition ${
                  tab === 'email'
                    ? 'bg-gradient-to-b from-amber-300 to-amber-500 text-stone-950'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                <Mail className="h-4 w-4" /> Email
              </button>
            </div>

            {tab === 'wallet' ? (
              <div className="mt-6 space-y-4">
                <p className="text-sm text-stone-400">
                  Sign in with your Stellar wallet. Freighter will ask you to
                  approve a message — that&apos;s all, no private keys leave your
                  browser.
                </p>
                <button
                  onClick={walletSignIn}
                  disabled={walletBusy}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-b from-amber-300 to-amber-500 py-3 text-sm font-semibold text-stone-950 transition hover:from-amber-200 hover:to-amber-400 disabled:opacity-60"
                >
                  {walletBusy ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Check Freighter…
                    </>
                  ) : (
                    <>
                      <Wallet className="h-4 w-4" /> Continue with wallet
                    </>
                  )}
                </button>
                {address && (
                  <p className="text-center font-mono text-[11px] text-stone-500">
                    {address.slice(0, 6)}…{address.slice(-4)}
                  </p>
                )}
                {error && <p className="text-center text-xs text-red-400">{error}</p>}
              </div>
            ) : (
              <form onSubmit={emailSubmit} className="mt-6 space-y-4">
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
                <label className="block">
                  <span className="text-sm font-medium text-stone-300">Password</span>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-stone-700 bg-stone-900 px-4 py-2.5 text-sm outline-none transition focus:border-amber-500"
                    placeholder="••••••••"
                  />
                </label>
                <button
                  type="submit"
                  disabled={busy}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-b from-amber-300 to-amber-500 py-3 text-sm font-semibold text-stone-950 transition hover:from-amber-200 hover:to-amber-400 disabled:opacity-60"
                >
                  {busy ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : mode === 'signin' ? (
                    'Sign in'
                  ) : (
                    'Create account'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
                  className="w-full text-center text-xs text-stone-500 hover:text-amber-300"
                >
                  {mode === 'signin'
                    ? "New here? Create an account"
                    : 'Already have an account? Sign in'}
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  )
}
