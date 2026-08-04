import { notFound } from 'next/navigation'
import { Coins, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getContractUsdcBalance } from '@/lib/stellar/funding'
import { formatUsdc, usdcPercent } from '@/lib/stellar/usdc'

export const revalidate = 60

interface Contribution {
  id: string
  role: string
  share_pct: number
}

interface ProjectDetail {
  title: string
  description: string | null
  status: string
  contract_id: string | null
  funding_goal: number | null
  contributions: Contribution[] | null
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  let project: ProjectDetail | null = null
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    const supabase = await createClient()
    const { data } = await supabase
      .from('projects')
      .select(
        'title, description, status, contract_id, funding_goal, contributions(role, share_pct)'
      )
      .eq('id', id)
      .single()
    project = data as ProjectDetail | null
  }

  if (!project) notFound()

  const goal = project.funding_goal != null ? BigInt(project.funding_goal) : null
  const funded = project.contract_id ? await getContractUsdcBalance(project.contract_id) : 0n
  const pct = usdcPercent(funded, goal ?? 0n)
  const remaining = goal != null && goal > funded ? goal - funded : 0n
  const complete = goal != null && funded >= goal

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="text-3xl font-bold">{project.title}</h1>
      {project.description && (
        <p className="mt-3 text-lg text-stone-400">{project.description}</p>
      )}

      {/* live funding panel — read straight from the on-chain contract */}
      {project.contract_id ? (
        <div className="mt-8 rounded-3xl border border-amber-500/30 bg-stone-900/60 p-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-amber-400" />
              <h2 className="text-lg font-semibold">Funding progress</h2>
            </div>
            <span
              className={`rounded-full border px-3 py-1 text-[11px] font-medium ${
                complete
                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                  : 'border-amber-500/40 bg-amber-500/10 text-amber-300'
              }`}
            >
              {complete ? 'fully funded' : project.status === 'active' ? 'needs funding' : project.status}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            <div className="rounded-xl border border-stone-800 bg-stone-950/60 px-3 py-4">
              <p className="text-[10px] uppercase tracking-wider text-stone-500">Funded</p>
              <p className="mt-1 font-mono text-lg text-amber-300">${formatUsdc(funded)}</p>
            </div>
            <div className="rounded-xl border border-stone-800 bg-stone-950/60 px-3 py-4">
              <p className="text-[10px] uppercase tracking-wider text-stone-500">Goal</p>
              <p className="mt-1 font-mono text-lg text-stone-200">
                ${goal != null ? formatUsdc(goal) : '—'}
              </p>
            </div>
            <div className="rounded-xl border border-stone-800 bg-stone-950/60 px-3 py-4">
              <p className="text-[10px] uppercase tracking-wider text-stone-500">To go</p>
              <p className="mt-1 font-mono text-lg text-stone-400">${formatUsdc(remaining)}</p>
            </div>
          </div>

          <div className="mt-4">
            <div className="mb-1.5 flex items-center justify-between text-[11px] text-stone-500">
              <span>{pct}% of goal</span>
              <span className="font-mono">${formatUsdc(funded)} raised on-chain</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-stone-800">
              <div
                className="bar-grow h-full rounded-full bg-gradient-to-r from-amber-300 to-amber-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </div>
      ) : null}

      <dl className="mt-8 grid grid-cols-2 gap-4 text-sm">
        <div className="rounded-xl border border-stone-800 bg-stone-900 p-4">
          <dt className="text-stone-500">Status</dt>
          <dd className="mt-1 font-medium">{project.status}</dd>
        </div>
        <div className="rounded-xl border border-stone-800 bg-stone-900 p-4">
          <dt className="text-stone-500">Contract</dt>
          <dd className="mt-1 font-mono text-xs text-stone-300">
            {project.contract_id ?? 'not deployed'}
          </dd>
        </div>
      </dl>

      <section className="mt-10">
        <h2 className="flex items-center gap-2 text-xl font-semibold">
          <Users className="h-5 w-5 text-amber-400" /> Contributors
        </h2>
        {project.contributions && project.contributions.length > 0 ? (
          <ul className="mt-4 space-y-2">
            {project.contributions.map((c: { id: string; role: string; share_pct: number }) => (
              <li
                key={c.id}
                className="flex justify-between rounded-xl border border-stone-800 bg-stone-900 px-4 py-3"
              >
                <span>{c.role}</span>
                <span className="font-mono text-sm text-amber-400">{c.share_pct}%</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-stone-500">No contributors listed yet.</p>
        )}
      </section>
    </div>
  )
}
