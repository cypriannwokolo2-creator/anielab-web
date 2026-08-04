import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Mail, Wallet } from 'lucide-react'
import { createClient, getUser } from '@/lib/supabase/server'
import AccountForm from '@/components/AccountForm'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Account | AnieLab',
  description: 'Manage your AnieLab profile.',
}

type ProfileRow = {
  display_name: string | null
  stellar_address: string | null
  auth_method: string | null
  created_at: string | null
}

export default async function AccountPage() {
  const user = await getUser()
  if (!user) redirect('/')

  let profile: ProfileRow | null = null

  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    const supabase = await createClient()
    const { data } = await supabase
      .from('users')
      .select('display_name, stellar_address, auth_method, created_at')
      .eq('id', user.id)
      .single()
    profile = data as ProfileRow | null
  }

  const authMethod = profile?.auth_method ?? 'email'
  const joined = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
      })
    : null

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <Link href="/" className="text-sm text-amber-400 hover:text-amber-300">
        ← Back to site
      </Link>

      <div className="mt-6 flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-b from-amber-300 to-amber-500 text-xl font-bold text-stone-950">
          {(profile?.display_name ?? user.email ?? '?')[0].toUpperCase()}
        </div>
        <div>
          <h1 className="text-3xl font-bold">
            {profile?.display_name || 'Your account'}
          </h1>
          <p className="mt-1 flex items-center gap-2 text-sm text-stone-400">
            <Mail className="h-3.5 w-3.5" /> {user.email}
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-stone-800 bg-stone-900/60 p-4">
          <p className="text-[11px] uppercase tracking-wider text-stone-500">
            Sign-in method
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-sm font-medium">
            <Wallet className="h-4 w-4 text-amber-400" />
            {authMethod === 'wallet' ? 'Stellar wallet' : 'Email'}
          </p>
        </div>
        <div className="rounded-xl border border-stone-800 bg-stone-900/60 p-4">
          <p className="text-[11px] uppercase tracking-wider text-stone-500">
            Member since
          </p>
          <p className="mt-1 text-sm font-medium">{joined ?? '—'}</p>
        </div>
      </div>

      {profile?.stellar_address ? (
        <div className="mt-4 rounded-xl border border-stone-800 bg-stone-900/60 px-4 py-3">
          <p className="text-[11px] uppercase tracking-wider text-stone-500">
            Stellar address
          </p>
          <p className="mt-1 break-all font-mono text-xs text-amber-200">
            {profile.stellar_address}
          </p>
        </div>
      ) : null}

      <AccountForm
        userId={user.id}
        displayName={profile?.display_name ?? null}
        authMethod={authMethod}
      />
    </div>
  )
}
