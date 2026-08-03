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
import {
  formatUsdc,
  getXlmUsdcRate,
  pledgeToUsdcRaw,
  type PledgeCurrency,
} from '@/lib/stellar/usdc'
import { sendUsdcPledge } from '@/lib/stellar/pledge'
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
  const [currency, setCurrency] = useState<PledgeCurrency>('USDC')
  const [rate, setRate] = useState<number | null>(null)
  const [available, setAvailable] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const { address, status, authStatus, provider, connect, signIn, signOut } =
    useWalletStore()

  const mobile = isMobile()
  const walletBusy = status === 'connecting' || authStatus === 'signing'
  const connected = status === 'connected' && authStatus === 'authenticated'
  const goal = project.fundingGoal ?? 0n
  const remaining = goal > project.funded ? goal - project.funded : 0n

  const rawUsdc = pledgeToUsdcRaw(amount, currency, rate ?? 0)

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

  // Refresh the XLM→USDC rate whenever the dialog opens or the currency flips
  // to XLM, so the conversion preview (and the final USDC amount) is current.
  useEffect(() => {
    if (!open || currency !== 'XLM') return
    let cancelled = false
    getXlmUsdcRate().then((r) => {
      if (!cancelled) setRate(r)
    })
    return () => {
      cancelled = true
    }
  }, [open, currency])

  async function handleConnect() {
    await connect(stellarKitId)
    if (useWalletStore.getState().status === 'connected') {
      toast.success('Wallet connected.')
    }
  }

  async function handleSignIn() {
    const providerId = useWalletStore.getState().provider ?? stellarKitId
    await signIn(providerId)
    if (useWalletStore.getState().authStatus === 'authenticated') {
      toast.success('Signed in with wallet.')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!project.contractId) {
      toast.error('This project has no live contract to receive funding yet.')
      return
    }
    if (!address) {
      toast.error('Connect a wallet first.')
      return
    }
    if (currency === 'XLM' && rate == null) {
      toast.error('Fetching the XLM→USDC rate — try again in a second.')
      return
    }

    const raw = pledgeToUsdcRaw(amount, currency, rate ?? 0)
    if (raw == null || raw <= 0n) {
      toast.error(`Enter a valid ${currency} amount.`)
      return
    }

    setSubmitting(true)
    try {
      const providerId = provider ?? stellarKitId
      const { hash, toXdr } = await sendUsdcPledge({
        providerId,
        publicKey: address,
        toContractId: project.contractId,
        amountUsdc: raw,
      })
      const label = currency === 'XLM' ? `${amount} XLM (≈$${formatUsdc(raw)} USDC)` : `$${formatUsdc(raw)}`
      toast.success(`Pledged ${label} to ${project.title} — on-chain!`)
      if (hash) {
        toast.info(`Tx: ${hash.slice(0, 16)}… · verify on stellar.expert`, {
          duration: 9000,
        })
      } else if (toXdr) {
        console.info('Pledge submitted, awaiting confirmation:', toXdr.slice(0, 40))
      }
      setAmount('')
      setOpen(false)
    } catch (err) {
      toast.error(
        err instanceof Error && err.message ? err.message : 'Pledge failed — check your wallet and try again.'
      )
    } finally {
      setSubmitting(false)
    }
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

                  {/* currency toggle */}
                  <div>
                    <span className="text-sm font-medium text-stone-300">Amount</span>
                    <div
                      className="mt-1 flex items-center gap-2 rounded-xl border border-stone-700 bg-stone-900 p-1 focus-within:border-amber-500"
                      style={{ borderRadius: '0.9rem 0 0.9rem 0.9rem' }}
                    >
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        required
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full bg-transparent px-3 py-2 text-sm outline-none"
                        placeholder={currency === 'XLM' ? '25.00' : '10.00'}
                      />
                      <div className="flex shrink-0 gap-1">
                        {(['USDC', 'XLM'] as const).map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setCurrency(c)}
                            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                              currency === c
                                ? 'bg-gradient-to-b from-amber-300 to-amber-500 text-stone-950'
                                : 'text-stone-400 hover:text-white'
                            }`}
                          >
                            {c}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* conversion preview — the on-chain transfer is always USDC */}
                  <div className="rounded-xl border border-stone-800 bg-stone-900/60 px-4 py-3 text-xs">
                    {currency === 'XLM' ? (
                      rate == null ? (
                        <p className="text-stone-500">Loading XLM→USDC rate…</p>
                      ) : rawUsdc != null ? (
                        <p className="text-stone-400">
                          {amount} XLM ≈ <span className="font-mono text-amber-300">${formatUsdc(rawUsdc)} USDC</span>
                        </p>
                      ) : (
                        <p className="text-stone-500">Enter an amount to see the USDC value.</p>
                      )
                    ) : (
                      <p className="text-stone-400">
                        Paid as <span className="font-mono text-amber-300">USDC</span> — the
                        project contract only accepts USDC, so every pledge settles on-chain in
                        USDC.
                      </p>
                    )}
                    {currency === 'XLM' && rate != null && (
                      <p className="mt-1 text-[11px] text-stone-600">
                        1 XLM ≈ ${rate.toFixed(4)} USDC (live orderbook rate)
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-drip flex w-full items-center justify-center gap-2 py-3 text-sm disabled:opacity-60"
                  >
                    {submitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <HandCoins className="h-4 w-4" />
                    )}
                    Pledge {amount ? `${amount} ${currency}` : '…'} to {project.title}
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
