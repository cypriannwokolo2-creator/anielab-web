import { notFound } from 'next/navigation'
import Image from 'next/image'
import { Coins, Users, Flag } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { blurFor } from '@/lib/coverBlur'
import { formatUsdc, usdcPercent } from '@/lib/stellar/usdc'
import ShareButton from '@/components/ShareButton'
import ProjectManagement from '@/components/ProjectManagement'

export const revalidate = 60

const MEDIA_BASE = process.env.NEXT_PUBLIC_MEDIA_BASE_URL || 'https://minio.anielab.app'

interface Milestone {
  id: string
  title: string
  pct_bps: number
  released: boolean
  sort_order: number
  released_at: string | null
}

interface Contribution {
  id: string
  role: string
  share_pct: number
  users?: { id: string; display_name: string | null; stellar_address: string | null } | null
}

interface ProjectDetail {
  id: string
  title: string
  description: string | null
  status: string
  contract_id: string | null
  funding_goal: number | null
  total_pledged: number
  cover_ipfs_cid: string | null
  owner_id: string
  contributions: Contribution[] | null
  milestones: Milestone[] | null
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
        '*, contributions(*, users(id, display_name, stellar_address)), milestones(*)'
      )
      .eq('id', id)
      .single()
    project = data as ProjectDetail | null
  }

  if (!project) notFound()

  const goal = project.funding_goal != null ? BigInt(project.funding_goal) : null
  const pledged = BigInt(project.total_pledged)
  const pct = usdcPercent(pledged, goal ?? 0n)
  const remaining = goal != null && goal > pledged ? goal - pledged : 0n
  const complete = goal != null && pledged >= goal

  const milestones = (project.milestones ?? []).sort(
    (a: Milestone, b: Milestone) => a.sort_order - b.sort_order
  )

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      {/* Cover image */}
      {project.cover_ipfs_cid && (
        <div className="relative mb-8 aspect-[3/1] w-full overflow-hidden rounded-2xl">
          <Image
            src={`${MEDIA_BASE}/anielab-media/${project.cover_ipfs_cid}`}
            alt={project.title}
            fill
            className="object-cover"
            placeholder="blur"
            blurDataURL={blurFor(project.cover_ipfs_cid)}
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 to-transparent" />
        </div>
      )}

      <div className="flex flex-wrap items-start justify-between gap-3">
        <h1 className="text-3xl font-bold">{project.title}</h1>
        <ShareButton
          className="btn-drip-ghost inline-flex items-center gap-1.5 bg-stone-900/60 px-4 py-2 text-xs"
        />
      </div>
      {project.description && (
        <p className="mt-3 text-lg text-stone-400">{project.description}</p>
      )}

      {/* Funding panel */}
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
                : project.status === 'active'
                  ? 'border-amber-500/40 bg-amber-500/10 text-amber-300'
                  : project.status === 'cancelled'
                    ? 'border-red-500/40 bg-red-500/10 text-red-300'
                    : 'border-stone-500/40 bg-stone-500/10 text-stone-300'
            }`}
          >
            {complete ? 'fully funded' : project.status}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3 text-center">
          <div className="rounded-xl border border-stone-800 bg-stone-950/60 px-3 py-4">
            <p className="text-[10px] uppercase tracking-wider text-stone-500">Raised</p>
            <p className="mt-1 font-mono text-lg text-amber-300">${formatUsdc(pledged)}</p>
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
            <span className="font-mono">${formatUsdc(pledged)} pledged</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-stone-800">
            <div
              className="bar-grow h-full rounded-full bg-gradient-to-r from-amber-300 to-amber-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Milestones */}
      {milestones.length > 0 && (
        <section className="mt-10">
          <h2 className="flex items-center gap-2 text-xl font-semibold">
            <Flag className="h-5 w-5 text-amber-400" /> Milestones
          </h2>
          <div className="mt-4 space-y-3">
            {milestones.map((m: Milestone, i: number) => (
              <div
                key={m.id}
                className={`flex items-center gap-4 rounded-xl border p-4 ${
                  m.released
                    ? 'border-emerald-500/30 bg-emerald-500/5'
                    : 'border-stone-800 bg-stone-900'
                }`}
              >
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                    m.released
                      ? 'bg-emerald-500 text-stone-950'
                      : 'bg-stone-800 text-stone-500'
                  }`}
                >
                  {m.released ? '✓' : i + 1}
                </div>
                <div className="flex-1">
                  <h3 className={`font-medium ${m.released ? 'text-emerald-300' : ''}`}>
                    {m.title}
                  </h3>
                  {m.released_at && (
                    <p className="text-xs text-stone-500">
                      Released {new Date(m.released_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <span className={`font-mono text-sm ${m.released ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {(m.pct_bps / 100).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Contributors */}
      <section className="mt-10">
        <h2 className="flex items-center gap-2 text-xl font-semibold">
          <Users className="h-5 w-5 text-amber-400" /> Contributors
        </h2>
        {project.contributions && project.contributions.length > 0 ? (
          <ul className="mt-4 space-y-2">
            {project.contributions.map((c) => (
              <li
                key={c.id}
                className="flex justify-between rounded-xl border border-stone-800 bg-stone-900 px-4 py-3"
              >
                <div>
                  <span className="font-medium">{c.role}</span>
                  {c.users?.display_name && (
                    <span className="ml-2 text-sm text-stone-400">
                      — {c.users.display_name}
                    </span>
                  )}
                </div>
                <span className="font-mono text-sm text-amber-400">{c.share_pct}%</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-stone-500">No contributors listed yet.</p>
        )}
      </section>

      {/* Management panel (for project owner) */}
      <ProjectManagement projectId={project.id} />
    </div>
  )
}
