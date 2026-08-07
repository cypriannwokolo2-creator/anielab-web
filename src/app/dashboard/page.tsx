import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowRight, FolderKanban, Settings, Users } from 'lucide-react'
import { createClient, getUser } from '@/lib/supabase/server'
import { LANDING_URL } from '@/lib/hosts'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Dashboard | AnieLab',
  description: 'Your AnieLab projects and crews.',
}

type OwnedProject = {
  id: string
  title: string
  status: string
  created_at: string
}

type JoinedProject = {
  role: string
  share_pct: number
  projects: { id: string; title: string; status: string }[] | null
}

type Profile = {
  display_name: string | null
  stellar_address: string | null
}

const statusStyles: Record<string, string> = {
  draft: 'border-stone-700 bg-stone-900 text-stone-400',
  active: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
  funded: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
  archived: 'border-stone-700 bg-stone-900 text-stone-500',
}

function StatusChip({ status }: { status: string }) {
  return (
    <span
      className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium capitalize ${
        statusStyles[status] ?? statusStyles.draft
      }`}
    >
      {status}
    </span>
  )
}

export default async function DashboardPage() {
  const user = await getUser()

  // Middleware gates the app host by session cookie, but the page stays
  // self-sufficient: a stale session that slipped through must never render
  // the dashboard.
  if (!user) redirect(LANDING_URL)

  let profile: Profile | null = null
  let owned: OwnedProject[] = []
  let joined: JoinedProject[] = []

  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    const supabase = await createClient()
    const [profileRes, ownedRes, joinedRes] = await Promise.all([
      supabase
        .from('users')
        .select('display_name, stellar_address')
        .eq('id', user.id)
        .maybeSingle(),
      supabase
        .from('projects')
        .select('id, title, status, created_at')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('contributions')
        .select('role, share_pct, projects(id, title, status)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
    ])
    profile = (profileRes.data as Profile | null) ?? null
    owned = (ownedRes.data as OwnedProject[]) ?? []
    joined = (joinedRes.data as JoinedProject[]) ?? []
  }

  const displayName = profile?.display_name ?? user.email?.split('@')[0] ?? 'Member'
  const firstName = displayName.split(' ')[0]

  return (
    <div className="mx-auto max-w-5xl px-6 pt-24 pb-16">
      {/* greeting */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-amber-400/80">
            Dashboard
          </p>
          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
            Hey, {firstName} 👋
          </h1>
          <p className="mt-2 max-w-xl text-sm text-stone-400">
            {owned.length > 0 || joined.length > 0
              ? 'Here’s what your crews are working on.'
              : 'No projects yet — start one and bring your crew along.'}
          </p>
        </div>
        <Link
          href="/create"
          className="relative block rounded-[1.25rem_0_1.25rem_0] bg-gradient-to-b from-amber-300 to-amber-500 px-5 py-2.5 text-sm font-semibold text-stone-950 transition hover:from-amber-200 hover:to-amber-400"
        >
          Start a project
        </Link>
      </div>

      {/* stats */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="flex items-center gap-4 rounded-2xl border border-stone-800 bg-stone-900/60 p-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-[1rem_0_1rem_0] bg-amber-500/15 text-amber-300">
            <FolderKanban className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold">{owned.length}</p>
            <p className="text-xs text-stone-400">
              {owned.length === 1 ? 'Project you own' : 'Projects you own'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-2xl border border-stone-800 bg-stone-900/60 p-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-[1rem_0_1rem_0] bg-amber-500/15 text-amber-300">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold">{joined.length}</p>
            <p className="text-xs text-stone-400">
              {joined.length === 1 ? 'Crew you’re on' : 'Crews you’re on'}
            </p>
          </div>
        </div>
      </div>

      {/* owned projects */}
      <section className="mt-10">
        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-lg font-semibold">Your projects</h2>
          <Link href="/create" className="text-sm text-amber-400 hover:text-amber-300">
            New project →
          </Link>
        </div>
        {owned.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {owned.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="group rounded-2xl border border-stone-800 bg-stone-900/60 p-5 transition hover:border-amber-500/50"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-semibold transition group-hover:text-amber-300">
                    {project.title}
                  </h3>
                  <StatusChip status={project.status} />
                </div>
                <p className="mt-1 text-xs text-stone-500">
                  Started{' '}
                  {new Date(project.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
                <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-amber-400">
                  View project <ArrowRight className="h-3 w-3" />
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-stone-700 bg-stone-900/40 p-8 text-center">
            <p className="text-sm text-stone-400">
              Nothing here yet — your project’s contract, crew, and funding
              board will show up once you create one.
            </p>
          </div>
        )}
      </section>

      {/* crews */}
      <section className="mt-10">
        <h2 className="mb-4 text-lg font-semibold">Crews you’re on</h2>
        {joined.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {joined.map((row, i) => (
              <Link
                key={i}
                href={`/projects/${row.projects?.[0]?.id ?? '#'}`}
                className="group rounded-2xl border border-stone-800 bg-stone-900/60 p-5 transition hover:border-amber-500/50"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-semibold transition group-hover:text-amber-300">
                    {row.projects?.[0]?.title ?? 'Unknown project'}
                  </h3>
                  {row.projects?.[0] && <StatusChip status={row.projects[0].status} />}
                </div>
                <p className="mt-1 text-xs text-stone-500">
                  {row.role} · {row.share_pct}% share
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-stone-700 bg-stone-900/40 p-8 text-center">
            <p className="text-sm text-stone-400">
              You’re not on any crew yet. When someone adds you to their
              project, your role and split will appear here.
            </p>
          </div>
        )}
      </section>

      {/* footer actions */}
      <div className="mt-12 flex flex-wrap items-center gap-3 border-t border-stone-800 pt-6">
        <Link
          href="/fund"
          className="rounded-[1rem_0_1rem_0] border border-stone-800 px-4 py-2 text-sm text-stone-300 transition hover:border-amber-500/40 hover:text-amber-300"
        >
          Browse projects to fund
        </Link>
        <Link
          href="/challenges"
          className="rounded-[1rem_0_1rem_0] border border-stone-800 px-4 py-2 text-sm text-stone-300 transition hover:border-amber-500/40 hover:text-amber-300"
        >
          Creative sprints
        </Link>
        <Link
          href="/account"
          className="inline-flex items-center gap-2 rounded-[1rem_0_1rem_0] border border-stone-800 px-4 py-2 text-sm text-stone-300 transition hover:border-amber-500/40 hover:text-amber-300"
        >
          <Settings className="h-3.5 w-3.5" /> Account settings
        </Link>
      </div>
    </div>
  )
}
