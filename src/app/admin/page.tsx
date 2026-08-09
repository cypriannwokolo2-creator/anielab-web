import Link from 'next/link'
import { Coins, FolderOpen, UserRound, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { formatUsdc } from '@/lib/stellar/usdc'
import { requireAdmin } from '@/lib/admin/guard'
import AdminSettings from '@/components/AdminSettings'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Admin | AnieLab',
  description: 'AnieLab admin dashboard.',
}

export default async function AdminPage() {
  await requireAdmin()

  const supabase = await createClient()

  const [users, projects, contributions] = await Promise.all([
    supabase.from('users').select('*').order('created_at', { ascending: false }),
    supabase.from('projects').select('*').order('created_at', { ascending: false }),
    supabase.from('contributions').select('*').order('created_at', { ascending: false }),
  ])

  const userRows = users.data ?? []
  const projectRows = projects.data ?? []
  const contributionRows = contributions.data ?? []

  const active = projectRows.filter((p) => p.status === 'active').length
  const totalGoal = projectRows.reduce((sum, p) => {
    if (typeof p.funding_goal === 'number') return sum + p.funding_goal
    if (typeof p.funding_goal === 'string') return sum + Number(p.funding_goal || 0)
    return sum
  }, 0)

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-amber-400/80">
            Admin
          </p>
          <h1 className="mt-2 text-3xl font-bold">AnieLab dashboard</h1>
          <p className="mt-2 text-sm text-stone-500">
            Manage the platform — view users, projects, contributions,
            and configure platform-wide settings.
          </p>
        </div>
        <Link href="/" className="text-sm text-amber-400 hover:text-amber-300">
          ← Back to site
        </Link>
      </div>

      {/* stats */}
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={Users} label="Users" value={userRows.length} />
        <Stat icon={FolderOpen} label="Projects" value={projectRows.length} />
        <Stat icon={UserRound} label="Active" value={active} />
        <Stat icon={Coins} label="Combined goals" value={`$${formatUsdc(BigInt(totalGoal))}`} />
      </div>

      {/* users */}
      <Section title="Users">
        <Table
          head={['ID', 'Stellar address', 'Display name', 'Method', 'Created']}
          rows={userRows.map((u) => [
            shortId(u.id),
            <code key={u.id} className="font-mono text-[11px] text-amber-200">
              {u.stellar_address}
            </code>,
            u.display_name ?? '—',
            u.auth_method ?? 'email',
            new Date(u.created_at).toLocaleDateString(),
          ])}
        />
      </Section>

      {/* projects */}
      <Section title="Projects">
        <Table
          head={['Title', 'Status', 'Goal (USDC)', 'Contract', 'Owner', 'Created']}
          rows={projectRows.map((p) => [
            p.title,
            p.status,
            typeof p.funding_goal === 'number' || typeof p.funding_goal === 'string'
              ? formatUsdc(BigInt(Number(p.funding_goal)))
              : '—',
            p.contract_id ? (
              <code key={p.id} className="font-mono text-[11px] text-stone-400">
                {shortId(p.contract_id)}
              </code>
            ) : (
              '—'
            ),
            shortId(p.owner_id),
            new Date(p.created_at).toLocaleDateString(),
          ])}
        />
      </Section>

      {/* contributions */}
      <Section title="Contributions">
        <Table
          head={['Project', 'Role', 'Share %', 'Contributor', 'Created']}
          rows={contributionRows.map((c) => [
            projectRows.find((p) => p.id === c.project_id)?.title ?? shortId(c.project_id),
            c.role,
            `${c.share_pct}%`,
            shortId(c.user_id),
            new Date(c.created_at).toLocaleDateString(),
          ])}
        />
      </Section>

      {/* Platform settings */}
      <section className="mt-12">
        <h2 className="text-lg font-semibold">Platform Settings</h2>
        <div className="mt-4">
          <AdminSettings />
        </div>
      </section>
    </div>
  )
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users
  label: string
  value: string | number
}) {
  return (
    <div className="rounded-2xl border border-stone-800 bg-stone-900/60 p-5">
      <Icon className="h-4 w-4 text-amber-400" />
      <p className="mt-3 text-2xl font-bold">{value}</p>
      <p className="text-xs uppercase tracking-wider text-stone-500">{label}</p>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-12">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="mt-4 overflow-x-auto rounded-2xl border border-stone-800 bg-stone-900/40">
        {children}
      </div>
    </section>
  )
}

function Table({ head, rows }: { head: string[]; rows: React.ReactNode[][] }) {
  return (
    <table className="w-full text-left text-sm">
      <thead>
        <tr className="border-b border-stone-800 text-[11px] uppercase tracking-wider text-stone-500">
          {head.map((h) => (
            <th key={h} className="px-4 py-3 font-medium">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i} className="border-b border-stone-800/60 last:border-0">
            {row.map((cell, j) => (
              <td key={j} className="px-4 py-3 text-stone-300">
                {cell}
              </td>
            ))}
          </tr>
        ))}
        {rows.length === 0 && (
          <tr>
            <td colSpan={head.length} className="px-4 py-6 text-stone-500">
              Nothing here yet.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  )
}

function shortId(id: string | null | undefined): string {
  if (!id) return '—'
  if (id.length <= 13) return id
  return `${id.slice(0, 6)}…${id.slice(-4)}`
}
