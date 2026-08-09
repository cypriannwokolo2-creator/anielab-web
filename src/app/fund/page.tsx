'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { toast } from 'sonner'
import { createPortal } from 'react-dom'
import { HandCoins, Loader2, X } from 'lucide-react'
import { useWalletStore } from '@/lib/stellar/useWalletAuth'
import {
  formatUsdc,
  getXlmUsdcRate,
  pledgeToUsdcRaw,
  type PledgeCurrency,
} from '@/lib/stellar/usdc'
import { sendUsdcPledge } from '@/lib/stellar/pledge'
import WalletPicker from '@/components/WalletPicker'

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3001'
const MEDIA_BASE = process.env.NEXT_PUBLIC_MEDIA_BASE_URL ?? 'https://minio.anielab.app'

interface Project {
  id: string
  title: string
  description: string | null
  cover_ipfs_cid: string | null
  contract_id: string | null
  funding_goal: number | null
  total_pledged: number
  status: string
}

function mediaUrl(key: string): string {
  return `${MEDIA_BASE}/anielab-media/${key}`
}

export default function FundPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [fundProject, setFundProject] = useState<Project | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${BACKEND}/api/projects?status=active&limit=20`)
        const data = await res.json()
        setProjects(data.projects ?? [])
      } catch {
        toast.error('Failed to load projects')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      {/* Header */}
      <div className="max-w-2xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-amber-400/80">
          For backers
        </p>
        <h1 className="mt-3 text-4xl font-bold sm:text-5xl">
          Fund projects you believe in.
        </h1>
        <p className="mt-5 text-lg text-stone-400">
          Anime, comics, games, and music get made because someone pays for them
          to exist. Back a project directly — every payout is verifiable on-chain.
        </p>
      </div>

      {/* Active projects */}
      <div className="mt-12">
        <h2 className="text-xl font-semibold">Active Projects</h2>
        {loading ? (
          <p className="mt-4 text-stone-500">Loading…</p>
        ) : projects.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-stone-800 bg-stone-900/60 p-8 text-center">
            <p className="text-stone-400">No active projects yet.</p>
            <Link
              href="/create"
              className="mt-3 inline-block text-sm text-amber-400 hover:text-amber-300"
            >
              Be the first to start a project →
            </Link>
          </div>
        ) : (
          <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => {
              const pct =
                p.funding_goal && p.funding_goal > 0
                  ? Math.min(100, Math.round((p.total_pledged / p.funding_goal) * 100))
                  : 0
              const goalUsdc = p.funding_goal ? (p.funding_goal / 1e7).toFixed(0) : '—'
              const pledgedUsdc = (p.total_pledged / 1e7).toFixed(0)

              return (
                <div
                  key={p.id}
                  className="flex flex-col overflow-hidden rounded-2xl border border-stone-800 bg-stone-900 transition-all hover:border-amber-500/50"
                >
                  {/* Cover */}
                  <div className="relative aspect-video w-full overflow-hidden bg-gradient-to-br from-stone-800 to-stone-900">
                    {p.cover_ipfs_cid ? (
                      <Image
                        src={mediaUrl(p.cover_ipfs_cid)}
                        alt={p.title}
                        fill
                        sizes="(max-width: 640px) 100vw, 50vw"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-4xl text-stone-700">
                        ✦
                      </div>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col p-4">
                    <Link href={`/projects/${p.id}`}>
                      <h3 className="font-semibold transition hover:text-amber-300">
                        {p.title}
                      </h3>
                    </Link>
                    {p.description && (
                      <p className="mt-1 line-clamp-2 text-sm text-stone-400">
                        {p.description}
                      </p>
                    )}

                    {/* Progress */}
                    <div className="mt-4">
                      <div className="flex justify-between text-xs text-stone-500">
                        <span>{pledgedUsdc} USDC raised</span>
                        <span>{goalUsdc} USDC goal</span>
                      </div>
                      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-stone-800">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-amber-300 to-amber-500 transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="mt-1 text-right text-[11px] text-stone-500">{pct}% funded</p>
                    </div>

                    <button
                      onClick={() => setFundProject(p)}
                      disabled={!p.contract_id}
                      className="mt-4 w-full rounded-full bg-gradient-to-b from-amber-300 to-amber-500 py-2.5 text-sm font-semibold text-stone-950 shadow-md shadow-amber-950/40 transition hover:from-amber-200 hover:to-amber-400 disabled:opacity-40"
                    >
                      {p.contract_id ? 'Fund this project' : 'Contract pending'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Inline pledge dialog */}
      {fundProject && (
        <PledgeDialog project={fundProject} onClose={() => setFundProject(null)} />
      )}

      {/* How it works */}
      <div className="mt-16 grid gap-6 md:grid-cols-3">
        {[
          {
            title: 'Escrow Protection',
            description:
              'Funds are held in a smart contract, not the platform. Released only when milestones are completed.',
          },
          {
            title: 'Transparent Payouts',
            description:
              'Every distribution is a public Stellar transaction. See exactly who got paid and how much.',
          },
          {
            title: 'Backer Safety',
            description:
              'If a project is cancelled, remaining funds are returned to the admin for distribution back to backers.',
          },
        ].map((f) => (
          <div
            key={f.title}
            className="rounded-2xl border border-stone-800 bg-stone-900/60 p-6"
          >
            <h3 className="text-lg font-semibold">{f.title}</h3>
            <p className="mt-2 text-sm text-stone-400">{f.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Pledge Dialog ─────────────────────────────────────────────────── */

function PledgeDialog({ project, onClose }: { project: Project; onClose: () => void }) {
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState<PledgeCurrency>('USDC')
  const [rate, setRate] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const { address, status, authStatus, provider, signIn, signOut } = useWalletStore()

  const connected = status === 'connected' && authStatus === 'authenticated'
  const walletBusy = status === 'connecting' || authStatus === 'signing'
  const goal = project.funding_goal ?? 0
  const remaining = goal > project.total_pledged ? goal - project.total_pledged : 0

  const rawUsdc = pledgeToUsdcRaw(amount, currency, rate ?? 0)

  useEffect(() => {
    if (currency !== 'XLM') return
    let cancelled = false
    getXlmUsdcRate().then((r) => {
      if (!cancelled) setRate(r)
    })
    return () => { cancelled = true }
  }, [currency])

  async function handleWalletSelected(providerId: string) {
    await signIn(providerId)
    if (useWalletStore.getState().authStatus === 'authenticated') {
      toast.success('Signed in with wallet.')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!project.contract_id) {
      toast.error('This project has no live contract yet.')
      return
    }
    if (!address) {
      toast.error('Connect a wallet first.')
      return
    }
    if (currency === 'XLM' && rate == null) {
      toast.error('Fetching XLM→USDC rate — try again in a second.')
      return
    }

    const raw = pledgeToUsdcRaw(amount, currency, rate ?? 0)
    if (raw == null || raw <= 0n) {
      toast.error(`Enter a valid ${currency} amount.`)
      return
    }

    setSubmitting(true)
    try {
      const providerId = provider ?? 'freighter'
      const { hash } = await sendUsdcPledge({
        providerId,
        publicKey: address,
        toContractId: project.contract_id,
        amountUsdc: raw,
      })
      const label = currency === 'XLM'
        ? `${amount} XLM (≈$${formatUsdc(raw)} USDC)`
        : `$${formatUsdc(raw)}`
      toast.success(`Pledged ${label} to ${project.title}!`)
      if (hash) {
        toast.info(`Tx: ${hash.slice(0, 16)}… · verify on stellar.expert`, { duration: 9000 })
      }
      setAmount('')
      onClose()
    } catch (err) {
      toast.error(
        err instanceof Error && err.message
          ? err.message
          : 'Pledge failed — check your wallet and try again.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl border border-stone-700 bg-stone-950 p-6 shadow-2xl shadow-black/60"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-amber-400/80">
              Fund this project
            </p>
            <h2 className="mt-1 text-lg font-bold leading-snug">{project.title}</h2>
            <p className="mt-1 font-mono text-xs text-stone-400">
              ${(project.total_pledged / 1e7).toFixed(0)} funded · ${(remaining / 1e7).toFixed(0)} to go
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-stone-500 transition hover:bg-stone-800 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {!connected ? (
          <div className="mt-6 space-y-4">
            <p className="text-sm text-stone-400">
              Connect a wallet to pledge. Your address signs the transfer into
              the project contract — the site never touches your keys.
            </p>
            {walletBusy ? (
              <div className="flex items-center justify-center gap-2 rounded-xl border border-stone-800 bg-stone-900/60 px-4 py-3 text-sm text-stone-400">
                <Loader2 className="h-4 w-4 animate-spin" /> Connecting…
              </div>
            ) : (
              <WalletPicker onSelect={handleWalletSelected} />
            )}
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

            {/* Amount */}
            <div>
              <span className="text-sm font-medium text-stone-300">Amount</span>
              <div className="mt-1 flex items-center gap-2 rounded-xl border border-stone-700 bg-stone-900 p-1 focus-within:border-amber-500">
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

            {/* Conversion preview */}
            <div className="rounded-xl border border-stone-800 bg-stone-900/60 px-4 py-3 text-xs">
              {currency === 'XLM' ? (
                rate == null ? (
                  <p className="text-stone-500">Loading XLM→USDC rate…</p>
                ) : rawUsdc != null ? (
                  <p className="text-stone-400">
                    {amount} XLM ≈{' '}
                    <span className="font-mono text-amber-300">${formatUsdc(rawUsdc)} USDC</span>
                  </p>
                ) : (
                  <p className="text-stone-500">Enter an amount to see the USDC value.</p>
                )
              ) : (
                <p className="text-stone-400">
                  Paid as <span className="font-mono text-amber-300">USDC</span> — the
                  project contract only accepts USDC.
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
              className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-b from-amber-300 to-amber-500 py-3 text-sm font-semibold text-stone-950 transition hover:from-amber-200 hover:to-amber-400 disabled:opacity-60"
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
              onClick={() => { signOut(); onClose() }}
              className="w-full text-center text-xs text-stone-500 hover:text-amber-300"
            >
              Sign out
            </button>
          </form>
        )}
      </div>
    </div>,
    document.body
  )
}
