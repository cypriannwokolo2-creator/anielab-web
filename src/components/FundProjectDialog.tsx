'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { toast } from 'sonner'
import {
  HandCoins,
  Loader2,
  QrCode,
  RefreshCw,
  Smartphone,
  X,
} from 'lucide-react'
import { useWalletStore } from '@/lib/stellar/useWalletAuth'
import {
  formatUsdc,
  pledgeToUsdcRaw,
  type PledgeCurrency,
} from '@/lib/stellar/usdc'
import { useLiveRate } from '@/lib/stellar/useLiveRate'
import { sendUsdcPledge } from '@/lib/stellar/pledge'
import WalletPicker from './WalletPicker'
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
  const [submitting, setSubmitting] = useState(false)
  const { address, status, authStatus, provider, signIn, signOut } = useWalletStore()

  // Live XLM→USDC quote with a 60s expiry clock while the dialog is open
  // in XLM mode — a stale quote can never be pledged with.
  const live = useLiveRate(open && currency === 'XLM')
  const rate = live.rate

  const mobile = isMobile()
  const walletBusy = status === 'connecting' || authStatus === 'signing'
  const connected = status === 'connected' && authStatus === 'authenticated'
  const goal = project.fundingGoal ?? 0n
  const remaining = goal > project.funded ? goal - project.funded : 0n

  const rawUsdc = pledgeToUsdcRaw(amount, currency, rate ?? 0)

  // Connect + sign-in in one step, straight from the shared wallet picker.
  async function handleWalletSelected(providerId: string) {
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
    if (currency === 'XLM' && live.error && rate == null) {
      toast.error('No live XLM→USDC rate available — refresh and try again.')
      return
    }

    // An expired or missing quote gets refreshed right before building the
    // transaction, so the on-chain USDC amount always uses a live price.
    let quoteRate = rate
    if (currency === 'XLM' && (quoteRate == null || live.stale)) {
      quoteRate = await live.refresh()
      if (quoteRate == null) {
        toast.error('Could not fetch a live XLM→USDC rate — check your connection and retry.')
        return
      }
    }

    const raw = pledgeToUsdcRaw(amount, currency, quoteRate ?? 0)
    if (raw == null || raw <= 0n) {
      toast.error(`Enter a valid ${currency} amount.`)
      return
    }

    setSubmitting(true)
    try {
      const providerId = provider ?? 'freighter'
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
                  <p className="text-sm text-stone-400">
                    Connect a wallet to pledge. Your address signs the transfer
                    into the project contract — the site never touches your keys.
                  </p>

                  {walletBusy ? (
                    <div className="flex items-center justify-center gap-2 rounded-xl border border-stone-800 bg-stone-900/60 px-4 py-3 text-sm text-stone-400">
                      <Loader2 className="h-4 w-4 animate-spin" /> Connecting…
                    </div>
                  ) : (
                    <WalletPicker onSelect={handleWalletSelected} />
                  )}

                  {mobile ? (
                    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
                      <p className="flex items-center gap-2 text-xs font-medium text-amber-300">
                        <Smartphone className="h-3.5 w-3.5" /> On mobile?
                      </p>
                      <p className="mt-1 text-[11px] leading-relaxed text-stone-400">
                        Pick LOBSTR or xBull from the list and your wallet app
                        will open automatically.
                      </p>
                    </div>
                  ) : null}

                  <div className="flex items-center gap-3 py-1">
                    <span className="h-px flex-1 bg-stone-800" />
                    <span className="text-[11px] uppercase tracking-wider text-stone-500">
                      New to Stellar?
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
                      live.error && rate == null ? (
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-red-400">
                            Couldn&apos;t fetch a live XLM→USDC rate.
                          </p>
                          <button
                            type="button"
                            onClick={() => void live.refresh()}
                            disabled={live.refreshing}
                            className="inline-flex items-center gap-1 rounded-full border border-stone-700 px-2.5 py-1 text-[11px] text-stone-300 transition hover:border-amber-500/60 hover:text-amber-300 disabled:opacity-50"
                          >
                            {live.refreshing ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <RefreshCw className="h-3 w-3" />
                            )}
                            Retry
                          </button>
                        </div>
                      ) : rate == null ? (
                        <p className="text-stone-500">Loading live XLM→USDC rate…</p>
                      ) : live.stale ? (
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-amber-300">Rate expired — refresh to continue.</p>
                          <button
                            type="button"
                            onClick={() => void live.refresh()}
                            disabled={live.refreshing}
                            className="inline-flex items-center gap-1 rounded-full border border-amber-500/50 px-2.5 py-1 text-[11px] text-amber-300 transition hover:bg-amber-500/10 disabled:opacity-50"
                          >
                            {live.refreshing ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <RefreshCw className="h-3 w-3" />
                            )}
                            Refresh
                          </button>
                        </div>
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
                    {currency === 'XLM' && rate != null && !live.error && (
                      <p className="mt-1 text-[11px] text-stone-600">
                        1 XLM ≈ ${rate.toFixed(4)} USDC (live)
                        {live.ttlSec != null && !live.stale && <> · expires in {live.ttlSec}s</>}
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
