import { getContractUsdcBalance } from '@/lib/stellar/funding'
import { createClient } from '@/lib/supabase/server'
import FundingBoardClient from './FundingBoardClient'

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

/** Serializable form of FundingProject — bigint values become decimal strings. */
export interface SerializableFundingProject {
  id: string
  title: string
  description: string | null
  coverIpfsCid?: string | null
  contractId: string | null
  fundingGoal: string | null
  status: string
  contributorCount: number
  funded: string
}

export default async function FundingBoard({
  projects,
}: {
  projects: RawFundingProject[] | null
}) {
  const items = await buildProjects(projects)
  if (items.length === 0) return null

  return <FundingBoardClient items={toSerializable(items)} />
}

function toSerializable(items: FundingProject[]): SerializableFundingProject[] {
  return items.map((p) => ({
    ...p,
    fundingGoal: p.fundingGoal != null ? p.fundingGoal.toString() : null,
    funded: p.funded.toString(),
  }))
}

async function buildProjects(
  projects: RawFundingProject[] | null
): Promise<FundingProject[]> {
  if (!projects || projects.length === 0) return []

  const supabaseReady =
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
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
