import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

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
      .select('title, description, status, contract_id, contributions(role, share_pct)')
      .eq('id', id)
      .single()
    project = data as ProjectDetail | null
  }

  if (!project) notFound()

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="text-3xl font-bold">{project.title}</h1>
      {project.description && (
        <p className="mt-3 text-lg text-stone-400">{project.description}</p>
      )}

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
        <h2 className="text-xl font-semibold">Contributors</h2>
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
