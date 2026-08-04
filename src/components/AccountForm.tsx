'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { KeyRound, Loader2, Save } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function AccountForm({
  userId,
  displayName,
  authMethod,
}: {
  userId: string
  displayName: string | null
  authMethod: string
}) {
  const [name, setName] = useState(displayName ?? '')
  const [saving, setSaving] = useState(false)
  const [resetting, setResetting] = useState(false)

  async function saveName(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('users')
        .update({ display_name: name.trim() || null })
        .eq('id', userId)
      if (error) throw new Error(error.message)
      toast.success('Profile updated.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save profile')
    } finally {
      setSaving(false)
    }
  }

  async function sendResetEmail() {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user?.email) {
      toast.error('No email on this account to send a reset link to.')
      return
    }
    setResetting(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (error) throw new Error(error.message)
      toast.success('Password reset link sent to your email.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not send reset link')
    } finally {
      setResetting(false)
    }
  }

  return (
    <section className="mt-10">
      <h2 className="text-lg font-semibold">Settings</h2>

      <form onSubmit={saveName} className="mt-4 space-y-4">
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
      </form>

      {authMethod === 'email' && (
        <div className="mt-6 rounded-2xl border border-stone-800 bg-stone-900/40 p-5">
          <p className="text-sm font-medium text-stone-200">Change your password</p>
          <p className="mt-1 text-xs leading-relaxed text-stone-500">
            We&apos;ll email you a link to choose a new password. This works even
            if you&apos;ve forgotten the old one.
          </p>
          <button
            type="button"
            onClick={sendResetEmail}
            disabled={resetting}
            className="btn-drip-ghost mt-3 inline-flex items-center gap-2 bg-stone-900/60 px-4 py-2 text-xs disabled:opacity-60"
          >
            {resetting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <KeyRound className="h-3.5 w-3.5" />
            )}
            Send password reset email
          </button>
        </div>
      )}
    </section>
  )
}
