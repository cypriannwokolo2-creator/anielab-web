import Link from 'next/link'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import { Mail, Calendar } from 'lucide-react'
import { createClient, getUser } from '@/lib/supabase/server'
import AccountSettings from '@/components/AccountSettings'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Account | AnieLab',
  description: 'Manage your AnieLab profile.',
}

const MEDIA_BASE = process.env.NEXT_PUBLIC_MEDIA_BASE_URL || 'https://minio.anielab.app'

type ProfileRow = {
  display_name: string | null
  stellar_address: string | null
  avatar_ipfs_cid: string | null
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
      .select('display_name, stellar_address, avatar_ipfs_cid, auth_method, created_at')
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
  const avatarUrl = profile?.avatar_ipfs_cid
    ? `${MEDIA_BASE}/anielab-media/${profile.avatar_ipfs_cid}`
    : null

  // Roles are stored in auth user_metadata (available immediately) and mirrored
  // to the users table once the migration is applied — metadata wins.
  const metaRoles = user.user_metadata?.roles
  const roles = Array.isArray(metaRoles) ? metaRoles.map(String) : []

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <Link href="/" className="text-sm text-amber-400 hover:text-amber-300">
        &larr; Back to site
      </Link>

      {/* Profile header */}
      <div className="mt-6 flex items-center gap-4">
        <div className="relative h-16 w-16 overflow-hidden rounded-full border-2 border-stone-700 bg-stone-800">
          {avatarUrl ? (
            <Image src={avatarUrl} alt="Avatar" fill className="object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-b from-amber-300 to-amber-500 text-xl font-bold text-stone-950">
              {(profile?.display_name ?? user.email ?? '?')[0].toUpperCase()}
            </div>
          )}
        </div>
        <div>
          <h1 className="text-3xl font-bold">
            {profile?.display_name || 'Your account'}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-stone-400">
            <span className="flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5" /> {user.email}
            </span>
            {joined && (
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" /> Joined {joined}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stats cards */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-stone-800 bg-stone-900/60 p-4">
          <p className="text-[11px] uppercase tracking-wider text-stone-500">
            Sign-in method
          </p>
          <p className="mt-1 text-sm font-medium">
            {authMethod === 'wallet' ? 'Stellar wallet' : 'Email + password'}
          </p>
        </div>
        <div className="rounded-xl border border-stone-800 bg-stone-900/60 p-4">
          <p className="text-[11px] uppercase tracking-wider text-stone-500">
            Wallet status
          </p>
          <p className="mt-1 text-sm font-medium">
            {profile?.stellar_address ? (
              <span className="text-emerald-400">Linked</span>
            ) : (
              <span className="text-stone-500">Not linked</span>
            )}
          </p>
        </div>
      </div>

      {/* Account settings (client component with avatar upload, wallet linking) */}
      <AccountSettings
        userId={user.id}
        displayName={profile?.display_name ?? null}
        stellarAddress={profile?.stellar_address ?? null}
        avatarCid={profile?.avatar_ipfs_cid ?? null}
        authMethod={authMethod}
        initialRoles={roles}
      />
    </div>
  )
}
