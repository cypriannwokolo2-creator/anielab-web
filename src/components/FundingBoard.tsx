import { Coins, Users } from 'lucide-react'
import { getContractUsdcBalance } from '@/lib/stellar/funding'
import { formatUsdc, usdcPercent } from '@/lib/stellar/usdc'
import { CONTRACT_ID, getContractState } from '@/lib/stellar/contractState'
import { createClient } from '@/lib/supabase/server'
import FundProjectDialog from './FundProjectDialog'

export const dynamic = 'force-dynamic'

export interface FundingProject {
  id: string
  title: string
  description: string | null
  coverIpfsCid?: string | null
  contractId: string | null
  fundingGoal: bigint | null
  status: string
  contributorCount: number
  funded: bigint
}

export interface RawFundingProject {
  id: string
  title: string
  description: string | null
  cover_ipfs_cid?: string | null
  contract_id?: string | null
  funding_goal?: number | string | null
  status: string
}

/** Demo goal used in dev, backed by the live testnet contract. */
const DEMO_GOAL = 250_000_000_000n // 25,000 USDC

export default async function FundingBoard({
  projects,
}: {
  projects: RawFundingProject[] | null
}) {
  const items = await buildProjects(projects)
  if (items.length === 0) return null

  return (
    <section className="mx-auto w-full max-w-6xl px-6">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((p) => {
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
    </section>
  )
}

async function buildProjects(
  projects: RawFundingProject[] | null
): Promise<FundingProject[]> {
  const supabaseReady =
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (projects && projects.length > 0) {
    const supabase = supabaseReady ? await createClient() : null
    const counts = new Map<string, number>()
    if (supabase) {
      const { data } = await supabase.from('contributions').select('project_id')
      data?.forEach((c) => counts.set(c.project_id, (counts.get(c.project_id) ?? 0) + 1))
    }
    const items: Omit<FundingProject, 'funded'>[] = projects.map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      coverIpfsCid: p.cover_ipfs_cid,
      contractId: p.contract_id ?? null,
      fundingGoal: p.funding_goal != null ? BigInt(p.funding_goal) : null,
      status: p.status,
      contributorCount: counts.get(p.id) ?? 0,
    }))
    return enrichWithBalances(items)
  }

  // Dev fallback — the live testnet RevenueSplitter as a demo project.
  const state = await getContractState()
  return enrichWithBalances([
    {
      id: 'demo-live-contract',
      title: 'Stellar Sakura — OVA',
      description:
        'A 24-minute anime short: original story, character design, and a full original soundtrack. The demo project reads live from the RevenueSplitter contract on testnet.',
      contractId: CONTRACT_ID,
      fundingGoal: DEMO_GOAL,
      status: 'active',
      contributorCount: state?.contributors.length ?? 0,
    },
  ])
}

async function enrichWithBalances(
  items: Omit<FundingProject, 'funded'>[]
): Promise<FundingProject[]> {
  return Promise.all(
    items.map(async (item) => ({
      ...item,
      funded: item.contractId ? await getContractUsdcBalance(item.contractId) : 0n,
    }))
  )
}
