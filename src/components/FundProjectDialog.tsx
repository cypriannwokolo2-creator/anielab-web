'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { toast } from 'sonner'
import {
  HandCoins,
  Loader2,
  Lock,
  QrCode,
  Smartphone,
  Wallet,
  X,
} from 'lucide-react'
import { useWalletStore } from '@/lib/stellar/useWalletAuth'
import { detectAvailableWallets, stellarKitId, wallets } from '@/lib/stellar/wallets'
import { formatUsdc, usdcToRaw } from '@/lib/stellar/usdc'
import type { FundingProject } from './FundingBoard'

const walletApps = [
  { name: 'Freighter', url: 'https://freighter.app' },
  { name: 'LOBSTR', url: 'https://lobstr.co' },
  { name: 'xBull', url: 'https://xbull.app' },
  { name: 'Albedo', url: 'https://albedo.link' },
]

function isMobile() {
  if (typeof window === 'undefined') return false
  return /Android|iPhone|iPad|iPod|Mobile|webOS|BlackBerry/i.test(navigator.userAgent)
}

export default function FundProjectDialog({ project }: { project: FundingProject }) {
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState('')
  const [available, setAvailable] = useState<string[]>([])
  const { address, status, authStatus, connect, signIn, signOut } = useWalletStore()

  const mobile = isMobile()
  const walletBusy = status === 'connecting' || authStatus === 'signing'
  const connected = status === 'connected' && authStatus === 'authenticated'
  const goal = project.fundingGoal ?? 0n
  const remaining = goal > project.funded ? goal - project.funded : 0n

  useEffect(() => {
    if (!open) return
    let cancelled = false
    detectAvailableWallets().then((found) => {
      if (!cancelled) setAvailable(found.map((w) => w.id))
    })
    return () => {
      cancelled = true
    }
  }, [open])

  async function handleConnect() {
    await connect(stellarKitId)
    if (useWalletStore.getState().status === 'connected') {
      toast.success('Wallet connected.')
    }
  }

  async function handleSignIn() {
    const provider = useWalletStore.getState().provider ?? stellarKitId
    await signIn(provider)
    if (useWalletStore.getState().authStatus === 'authenticated') {
      toast.success('Signed in with wallet.')
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const raw = usdcToRaw(amount)
    if (raw == null) {
      toast.error('Enter a valid USDC amount.')
      return
    }
    toast.info('Pledge flow coming next — this will sign a USDC transfer from your wallet into the project contract.')
    setOpen(false)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="btn-drip inline-flex flex-1 items-center justify-center gap-1.5 px-3 py-2.5 text-xs"
      >
        <HandCoins className="h-3.5 w-3.5" /> Fund this project
      </button>

      {open &&
        createPortal(
          <div
            className="dialog-overlay fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          >
            <div
              className="dialog-panel max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl border border-stone-700 bg-stone-950 p-6 shadow-2xl shadow-black/60"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-amber-400/80">
                    Fund this project
                  </p>
                  <h2 className="mt-1 text-lg font-bold leading-snug">{project.title}</h2>
                  <p className="mt-1 font-mono text-xs text-stone-400">
                    ${formatUsdc(project.funded)} funded · ${formatUsdc(remaining)} to go
                  </p>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="rounded-full p-1.5 text-stone-500 transition hover:bg-stone-800 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {!connected ? (
                <div className="mt-6 space-y-4">
                  <button
                    onClick={handleConnect}
                    disabled={walletBusy}
                    className="btn-drip flex w-full items-center justify-center gap-2 px-4 py-3.5 text-sm disabled:opacity-60"
                  >
                    {walletBusy ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Wallet className="h-4 w-4" />
                    )}
                    Connect wallet to fund
                  </button>
                  <p className="text-center text-[11px] leading-relaxed text-stone-500">
                    Detects your installed wallets on desktop, and shows a QR /
                    deep link on mobile to open the wallet app.
                  </p>

                  {available.length > 0 && (
                    <div className="rounded-xl border border-stone-800 bg-stone-900/60 px-4 py-3 text-xs text-stone-400">
                      Detected:{' '}
                      {available
                        .map((id) => wallets.find((w) => w.id === id)?.name ?? id)
                        .join(' · ')}
                    </div>
                  )}

                  {mobile ? (
                    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
                      <p className="flex items-center gap-2 text-xs font-medium text-amber-300">
                        <Smartphone className="h-3.5 w-3.5" /> On mobile?
                      </p>
                      <p className="mt-1 text-[11px] leading-relaxed text-stone-400">
                        Pick LOBSTR or xBull in the wallet chooser and your wallet
                        app will open automatically.
                      </p>
                    </div>
                  ) : null}

                  <div className="flex items-center gap-3 py-1">
                    <span className="h-px flex-1 bg-stone-800" />
                    <span className="text-[11px] uppercase tracking-wider text-stone-500">
                      {mobile ? 'Or get a wallet app' : 'No wallet yet?'}
                    </span>
                    <span className="h-px flex-1 bg-stone-800" />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {walletApps.map((app) => (
                      <a
                        key={app.name}
                        href={app.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center rounded-xl border border-stone-700 bg-stone-900 px-3 py-2.5 text-xs font-medium text-stone-300 transition hover:border-amber-500/60 hover:text-amber-300"
                      >
                        <QrCode className="mr-1.5 h-3.5 w-3.5" /> {app.name}
                      </a>
                    ))}
                  </div>

                  {status === 'connected' && authStatus !== 'authenticated' ? (
                    <button
                      onClick={handleSignIn}
                      disabled={walletBusy}
                      className="btn-drip-ghost flex w-full items-center justify-center gap-2 bg-stone-900/60 px-4 py-2.5 text-sm"
                    >
                      {walletBusy ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Lock className="h-4 w-4" />
                      )}
                      Wallet connected — sign in to continue
                    </button>
                  ) : null}

                  {address && (
                    <p className="text-center font-mono text-[11px] text-stone-500">
                      {address.slice(0, 6)}…{address.slice(-4)}
                    </p>
                  )}
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                  <div className="rounded-xl border border-stone-800 bg-stone-900/60 px-4 py-3 text-xs text-stone-400">
                    Connected as{' '}
                    <span className="font-mono text-stone-300">
                      {address?.slice(0, 6)}…{address?.slice(-4)}
                    </span>
                  </div>
                  <label className="block">
                    <span className="text-sm font-medium text-stone-300">
                      Amount (USDC)
                    </span>
                    <div className="mt-1 flex items-center rounded-xl border border-stone-700 bg-stone-900 focus-within:border-amber-500">
                      <span className="pl-4 text-sm text-stone-500">$</span>
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        required
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full rounded-xl bg-transparent px-2 py-2.5 text-sm outline-none"
                        placeholder="10.00"
                      />
                    </div>
                  </label>
                  <button
                    type="submit"
                    className="btn-drip flex w-full items-center justify-center gap-2 py-3 text-sm"
                  >
                    <HandCoins className="h-4 w-4" /> Pledge ${amount || '0'} to {project.title}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      signOut()
                      setOpen(false)
                    }}
                    className="w-full text-center text-xs text-stone-500 hover:text-amber-300"
                  >
                    Sign out
                  </button>
                </form>
              )}
            </div>
          </div>,
          document.body
        )}
    </>
  )
}
