'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { toast } from 'sonner'
import {
  Loader2,
  Mail,
  Rabbit,
  Rocket,
  Wallet,
  X,
} from 'lucide-react'
import { useWalletStore } from '@/lib/stellar/useWalletAuth'
import { detectAvailableWallets, WalletAdapter } from '@/lib/stellar/wallets'
import { createClient } from '@/lib/supabase/client'

type Tab = 'email' | 'wallet'

const walletIcons: Record<string, typeof Wallet> = {
  freighter: Wallet,
  rabet: Rabbit,
  lobstr: Rocket,
}

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
  const [availableWallets, setAvailableWallets] = useState<WalletAdapter[]>([])
  const [checkingWallets, setCheckingWallets] = useState(true)

  const { address, status, authStatus, error, signIn } = useWalletStore()

  useEffect(() => {
    if (!open) return
    let cancelled = false
    detectAvailableWallets()
      .then((found) => {
        if (!cancelled) setAvailableWallets(found)
      })
      .finally(() => {
        if (!cancelled) setCheckingWallets(false)
      })
    return () => {
      cancelled = true
    }
  }, [open])

  // The dialog only ever renders after a user click (open=true), so this is
  // always client-side — document.body is safe here, and SSR never reaches it.
  if (!open) return null

  async function emailSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    try {
      const supabase = createClient()
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw new Error(error.message)
        toast.success('Check your inbox to confirm your email, then sign in.')
        setMode('signin')
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw new Error(error.message)
        if (data.user) {
          // link this account to the users table (no-op if already linked)
          const { error: linkError } = await supabase
            .from('users')
            .upsert({ id: data.user.id, auth_method: 'email' }, { onConflict: 'id' })
          if (linkError) console.warn('users row link failed', linkError)
        }
        toast.success('Signed in.')
        onClose()
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  async function walletSignIn(providerId: string) {
    await signIn(providerId)
    if (useWalletStore.getState().authStatus === 'authenticated') {
      toast.success('Signed in with wallet.')
      onClose()
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
                  Pick any wallet you have installed. It will ask you to approve
                  a message — that&apos;s all, no private keys leave your
                  browser.
                </p>

                {checkingWallets ? (
                  <div className="flex items-center justify-center gap-2 py-6 text-sm text-stone-500">
                    <Loader2 className="h-4 w-4 animate-spin" /> Looking for wallets…
                  </div>
                ) : availableWallets.length > 0 ? (
                  <div className="space-y-2">
                    {availableWallets.map((w) => {
                      const Icon = walletIcons[w.id] ?? Wallet
                      return (
                        <button
                          key={w.id}
                          onClick={() => walletSignIn(w.id)}
                          disabled={walletBusy}
                          className="flex w-full items-center justify-between rounded-2xl border border-stone-700 bg-stone-900 px-4 py-3 text-left transition hover:border-amber-500/60 hover:bg-stone-800 disabled:opacity-60"
                        >
                          <span className="flex items-center gap-3">
                            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-b from-amber-300 to-amber-500 text-stone-950">
                              <Icon className="h-4 w-4" />
                            </span>
                            <span className="font-medium">{w.name}</span>
                          </span>
                          <span className="text-sm text-amber-400">Sign in →</span>
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-stone-700 bg-stone-900/40 p-5 text-center text-sm text-stone-400">
                    No Stellar wallet detected. Install the{' '}
                    <span className="text-amber-300">Freighter</span>,{' '}
                    <span className="text-amber-300">Rabet</span>, or{' '}
                    <span className="text-amber-300">LOBSTR</span> browser
                    extension, then come back.
                  </div>
                )}

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
                    ? 'New here? Create an account'
                    : 'Already have an account? Sign in'}
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>,
    document.body
  )
}
