'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { toast } from 'sonner'
import { Camera, Check, Loader2, Save, Wallet, Unlink } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useWalletStore } from '@/lib/stellar/useWalletAuth'
import WalletPicker from './WalletPicker'

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3001'
const MEDIA_BASE = process.env.NEXT_PUBLIC_MEDIA_BASE_URL ?? 'https://minio.anielab.app'

interface Props {
  userId: string
  displayName: string | null
  stellarAddress: string | null
  avatarCid: string | null
  authMethod: string
  initialRoles?: string[]
}

const AVAILABLE_ROLES = [
  'Writer',
  'Illustrator',
  'Composer',
  'Voice Actor',
  'Developer',
  'Producer',
  'Designer',
  'Backer',
] as const

export default function AccountSettings({
  userId,
  displayName,
  stellarAddress,
  avatarCid,
  authMethod,
  initialRoles = [],
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [name, setName] = useState(displayName ?? '')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [avatar, setAvatar] = useState<string | null>(
    avatarCid ? `${MEDIA_BASE}/anielab-media/${avatarCid}` : null
  )
  const [avatarCidValue, setAvatarCidValue] = useState<string | null>(avatarCid)
  const [roles, setRoles] = useState<string[]>(initialRoles)

  // Wallet linking state
  const [showWalletPicker, setShowWalletPicker] = useState(false)
  const [linking, setLinking] = useState(false)
  const { address, status, authStatus, signIn, signOut } = useWalletStore()

  const walletConnected = status === 'connected' && authStatus === 'authenticated'

  async function getAccessToken(): Promise<string | null> {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token ?? null
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5 MB')
      return
    }

    setUploading(true)
    try {
      const token = await getAccessToken()
      if (!token) {
        toast.error('Session expired — sign in again')
        return
      }

      const form = new FormData()
      form.append('file', file)
      const res = await fetch(`${BACKEND}/api/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      })
      if (!res.ok) {
        toast.error('Upload failed')
        return
      }
      const data = await res.json()
      const cid = data.key as string
      setAvatarCidValue(cid)
      setAvatar(`${MEDIA_BASE}/anielab-media/${cid}`)
      toast.success('Avatar uploaded — save profile to apply.')
    } catch {
      toast.error('Upload failed')
    } finally {
      setUploading(false)
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const supabase = createClient()
      const updates: Record<string, unknown> = {
        display_name: name.trim() || null,
      }
      if (avatarCidValue !== avatarCid) {
        updates.avatar_ipfs_cid = avatarCidValue
      }
      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId)
      if (error) throw new Error(error.message)

      // Roles live in auth user_metadata (works even before the users.roles
      // migration is applied); mirror into the users table once it exists.
      const { error: metaError } = await supabase.auth.updateUser({ data: { roles } })
      if (metaError) throw new Error(metaError.message)
      const { error: rolesError } = await supabase
        .from('users')
        .update({ roles })
        .eq('id', userId)
      if (rolesError) console.warn('users.roles write skipped:', rolesError.message)
      toast.success('Profile updated.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save profile')
    } finally {
      setSaving(false)
    }
  }

  async function handleLinkWallet(providerId: string) {
    setLinking(true)
    try {
      await signIn(providerId)
      const state = useWalletStore.getState()
      if (state.authStatus === 'authenticated' && state.address) {
        // Update the user's stellar_address in the DB.
        const supabase = createClient()
        const { error } = await supabase
          .from('users')
          .update({ stellar_address: state.address })
          .eq('id', userId)
        if (error) {
          toast.error('Wallet connected but failed to save address: ' + error.message)
          return
        }
        toast.success(`Wallet linked: ${state.address.slice(0, 6)}…${state.address.slice(-4)}`)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Wallet linking failed')
    } finally {
      setLinking(false)
      setShowWalletPicker(false)
    }
  }

  async function handleUnlinkWallet() {
    if (!confirm('Unlink your wallet? You can link it again later.')) return
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('users')
        .update({ stellar_address: null })
        .eq('id', userId)
      if (error) throw new Error(error.message)
      await signOut()
      toast.success('Wallet unlinked.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to unlink')
    }
  }

  async function sendResetEmail() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email) {
      toast.error('No email on this account.')
      return
    }
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (error) throw new Error(error.message)
      toast.success('Password reset link sent.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not send reset link')
    }
  }

  return (
    <section className="mt-10 space-y-8">
      {/* Avatar + display name */}
      <div>
        <h2 className="text-lg font-semibold">Profile</h2>
        <form onSubmit={handleSave} className="mt-4 space-y-5">
          {/* Avatar */}
          <div className="flex items-center gap-5">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="group relative h-20 w-20 overflow-hidden rounded-full border-2 border-stone-700 bg-stone-800 transition hover:border-amber-500 disabled:opacity-50"
            >
              {avatar ? (
                <Image
                  src={avatar}
                  alt="Avatar"
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-stone-500">
                  {(name || '?')[0].toUpperCase()}
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition group-hover:opacity-100">
                {uploading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-white" />
                ) : (
                  <Camera className="h-5 w-5 text-white" />
                )}
              </div>
            </button>
            <div>
              <p className="text-sm font-medium text-stone-300">Profile picture</p>
              <p className="text-xs text-stone-500">Click to upload. JPG, PNG, or WebP (max 5 MB).</p>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </div>

          {/* Display name */}
          <label className="block">
            <span className="text-sm font-medium text-stone-300">Display name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-stone-700 bg-stone-900 px-4 py-2.5 text-sm outline-none transition focus:border-amber-500"
              placeholder="How you want to be known on AnieLab"
              maxLength={40}
            />
          </label>

          <button
            type="submit"
            disabled={saving}
            className="btn-drip flex items-center justify-center gap-2 px-6 py-2.5 text-sm disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save profile
          </button>

          {/* Roles — inside the profile form so "Save profile" persists them */}
          <div>
            <h3 className="text-sm font-semibold text-stone-200">Your roles</h3>
            <p className="mt-1 text-xs text-stone-500">Choose up to 3 roles that describe you best.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {AVAILABLE_ROLES.map((role) => {
                const active = roles.includes(role)
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => {
                      if (active) {
                        setRoles(roles.filter((r) => r !== role))
                      } else if (roles.length < 3) {
                        setRoles([...roles, role])
                      } else {
                        toast.error('You can select up to 3 roles.')
                      }
                    }}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                      active
                        ? 'border-amber-500 bg-amber-500/15 text-amber-300'
                        : 'border-stone-700 bg-stone-900 text-stone-400 hover:border-stone-500 hover:text-stone-300'
                    } ${!active && roles.length >= 3 ? 'opacity-40 cursor-not-allowed' : ''}`}
                    disabled={!active && roles.length >= 3}
                  >
                    {active && <Check className="h-3 w-3" />}
                    {role}
                  </button>
                )
              })}
            </div>
            <p className="mt-2 text-right text-xs text-stone-500">{roles.length}/3 selected</p>
          </div>
        </form>
      </div>

      {/* Wallet linking */}
      <div className="rounded-2xl border border-stone-800 bg-stone-900/40 p-5">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-stone-200">
          <Wallet className="h-4 w-4 text-amber-400" />
          Linked wallet
        </h3>
        {stellarAddress ? (
          <div className="mt-3 space-y-3">
            <p className="break-all font-mono text-xs text-amber-200">{stellarAddress}</p>
            {walletConnected && address === stellarAddress ? (
              <p className="text-xs text-emerald-400">Wallet connected and verified.</p>
            ) : (
              <p className="text-xs text-stone-500">
                This address is linked to your account. Connect it to pledge or manage projects.
              </p>
            )}
            <div className="flex gap-2">
              {!walletConnected && (
                <button
                  onClick={() => setShowWalletPicker(!showWalletPicker)}
                  className="rounded-full border border-stone-700 px-4 py-2 text-xs font-medium text-stone-300 transition hover:border-amber-500"
                >
                  Connect wallet
                </button>
              )}
              <button
                onClick={handleUnlinkWallet}
                className="inline-flex items-center gap-1.5 rounded-full border border-red-900/60 px-4 py-2 text-xs font-medium text-red-400 transition hover:border-red-700"
              >
                <Unlink className="h-3 w-3" /> Unlink
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            <p className="text-xs text-stone-500">
              No wallet linked yet. Link a Stellar wallet to pledge to projects
              and receive milestone payouts.
            </p>
            <button
              onClick={() => setShowWalletPicker(!showWalletPicker)}
              className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-b from-amber-300 to-amber-500 px-5 py-2 text-xs font-semibold text-stone-950 transition hover:from-amber-200 hover:to-amber-400"
            >
              <Wallet className="h-3.5 w-3.5" /> Link a wallet
            </button>
          </div>
        )}

        {showWalletPicker && (
          <div className="mt-4 rounded-xl border border-stone-700 bg-stone-800/50 p-4">
            {linking ? (
              <div className="flex items-center gap-2 text-sm text-stone-400">
                <Loader2 className="h-4 w-4 animate-spin" /> Connecting…
              </div>
            ) : (
              <WalletPicker onSelect={handleLinkWallet} />
            )}
          </div>
        )}
      </div>

      {/* Password reset (email users) */}
      {authMethod === 'email' && (
        <div className="rounded-2xl border border-stone-800 bg-stone-900/40 p-5">
          <p className="text-sm font-medium text-stone-200">Change your password</p>
          <p className="mt-1 text-xs leading-relaxed text-stone-500">
            We&apos;ll email you a link to choose a new password.
          </p>
          <button
            type="button"
            onClick={sendResetEmail}
            className="btn-drip-ghost mt-3 inline-flex items-center gap-2 bg-stone-900/60 px-4 py-2 text-xs disabled:opacity-60"
          >
            Send password reset email
          </button>
        </div>
      )}
    </section>
  )
}
