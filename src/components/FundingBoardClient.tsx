'use client'

import { useMemo, useState } from 'react'
import { Coins, Search, Users } from 'lucide-react'
import { formatUsdc, usdcPercent } from '@/lib/stellar/usdc'
import FundProjectDialog from './FundProjectDialog'
import type { SerializableFundingProject } from './FundingBoard'
import type { FundingProject } from './FundingBoard'

const STATUSES = ['all', 'active', 'funded', 'draft', 'archived']

export default function FundingBoardClient({
  items,
}: {
  items: SerializableFundingProject[]
}) {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')

  const projects: FundingProject[] = useMemo(
    () =>
      items.map((p) => ({
        ...p,
        fundingGoal: p.fundingGoal != null ? BigInt(p.fundingGoal) : null,
        funded: BigInt(p.funded),
      })),
    [items]
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return projects.filter((p) => {
      const matchesStatus = status === 'all' || p.status === status
      const matchesQuery =
        !q ||
        p.title.toLowerCase().includes(q) ||
        (p.description ?? '').toLowerCase().includes(q)
      return matchesStatus && matchesQuery
    })
  }, [projects, query, status])

  return (
    <section className="mx-auto w-full max-w-6xl px-6">
      {/* search + filter */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search projects by title or pitch…"
            className="w-full rounded-[1.25rem_0_1.25rem_0] border border-stone-800 bg-stone-950/90 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-amber-500"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-medium capitalize transition ${
                status === s
                  ? 'border-amber-500/60 bg-amber-500/15 text-amber-300'
                  : 'border-stone-800 text-stone-400 hover:border-stone-700 hover:text-stone-200'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-700 bg-stone-900/40 p-12 text-center">
          <p className="text-stone-400">
            {projects.length === 0
              ? 'No projects on the board yet — the first one gets to set the trend.'
              : 'Nothing matches that search or filter.'}
          </p>
          {projects.length > 0 && (
            <button
              onClick={() => {
                setQuery('')
                setStatus('all')
              }}
              className="mt-4 inline-block rounded-full px-4 py-1.5 text-sm font-medium text-amber-400 transition hover:bg-amber-500/10 hover:text-amber-300"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => {
            const goal = p.fundingGoal ?? 0n
            const remaining = goal > p.funded ? goal - p.funded : 0n
            const pct = usdcPercent(p.funded, goal)
            const complete = goal > 0n && p.funded >= goal

            return (
              <div
                key={p.id}
                className="flex flex-col overflow-hidden rounded-[2.5rem_0_2.5rem_0] border border-stone-800 bg-stone-950/90 shadow-2xl shadow-black/40 transition hover:border-amber-500/50"
              >
                <div className="flex items-center justify-between gap-3 border-b border-stone-800 px-6 py-4">
                  <h3 className="font-bold leading-snug">{p.title}</h3>
                  <span
                    className={`shrink-0 rounded-full border px-3 py-1 text-[11px] font-medium ${
                      complete
                        ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                        : 'border-amber-500/40 bg-amber-500/10 text-amber-300'
                    }`}
                  >
                    {complete ? 'funded' : p.status === 'active' ? 'needs funding' : p.status}
                  </span>
                </div>

                <div className="flex flex-1 flex-col px-6 py-5">
                  {p.description ? (
                    <p className="line-clamp-3 text-sm leading-relaxed text-stone-400">
                      {p.description}
                    </p>
                  ) : (
                    <p className="text-sm text-stone-600">No description yet.</p>
                  )}

                  <div className="mt-5 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-xl border border-stone-800 bg-stone-900/50 px-2 py-3">
                      <p className="text-[10px] uppercase tracking-wider text-stone-500">
                        Funded
                      </p>
                      <p className="mt-1 font-mono text-sm text-amber-300">
                        ${formatUsdc(p.funded)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-stone-800 bg-stone-900/50 px-2 py-3">
                      <p className="text-[10px] uppercase tracking-wider text-stone-500">
                        Goal
                      </p>
                      <p className="mt-1 font-mono text-sm text-stone-200">
                        ${formatUsdc(goal)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-stone-800 bg-stone-900/50 px-2 py-3">
                      <p className="text-[10px] uppercase tracking-wider text-stone-500">
                        Remaining
                      </p>
                      <p className="mt-1 font-mono text-sm text-stone-400">
                        ${formatUsdc(remaining)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="mb-1.5 flex items-center justify-between text-[11px] text-stone-500">
                      <span className="flex items-center gap-1.5">
                        <Users className="h-3 w-3" />
                        {p.contributorCount}{' '}
                        {p.contributorCount === 1 ? 'contributor' : 'contributors'}
                      </span>
                      <span className="font-mono">{pct}%</span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-stone-800">
                      <div
                        className="bar-grow h-full rounded-full bg-gradient-to-r from-amber-300 to-amber-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 border-t border-stone-800 px-6 py-4">
                  <FundProjectDialog project={p} />
                  {p.contractId ? (
                    <a
                      href={`https://stellar.expert/explorer/testnet/contract/${p.contractId}`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-drip-ghost inline-flex flex-1 items-center justify-center gap-1.5 bg-stone-900/60 px-3 py-2.5 text-xs"
                    >
                      <Coins className="h-3.5 w-3.5" /> On-chain
                    </a>
                  ) : null}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
