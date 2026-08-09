'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { getAdminToken } from '@/lib/admin/token'

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3001'

/**
 * Change the admin panel password. The backend verifies the current
 * password, stores the new one hashed, and syncs it to the Supabase
 * auth user so email sign-in keeps working.
 */
export default function AdminChangePassword() {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleChange() {
    if (!current || !next) {
      toast.error('Fill in all fields')
      return
    }
    if (next !== confirm) {
      toast.error('New passwords do not match')
      return
    }
    if (next.length < 8) {
      toast.error('New password must be at least 8 characters')
      return
    }

    setBusy(true)
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        toast.error('Sign in first')
        return
      }
      const adminToken = getAdminToken()
      if (!adminToken) {
        toast.error('Admin session expired — unlock the panel again')
        return
      }

      const res = await fetch(`${BACKEND}/api/admin/password`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
          'X-Admin-Token': adminToken,
        },
        body: JSON.stringify({ current_password: current, new_password: next }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data.error || 'Failed to change password')
        return
      }
      toast.success('Password updated')
      setCurrent('')
      setNext('')
      setConfirm('')
    } catch {
      toast.error('Failed to change password')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="rounded-2xl border border-stone-800 bg-stone-900/60 p-6">
      <h3 className="text-lg font-semibold">Change Admin Password</h3>
      <p className="mt-1 text-sm text-stone-500">
        Updates your panel password (stored hashed) and your email sign-in password.
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <input
          type="password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          placeholder="Current password"
          autoComplete="current-password"
          className="rounded-xl border border-stone-700 bg-stone-800 px-4 py-2 text-sm outline-none focus:border-amber-500"
        />
        <input
          type="password"
          value={next}
          onChange={(e) => setNext(e.target.value)}
          placeholder="New password"
          autoComplete="new-password"
          className="rounded-xl border border-stone-700 bg-stone-800 px-4 py-2 text-sm outline-none focus:border-amber-500"
        />
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Confirm new password"
          autoComplete="new-password"
          className="rounded-xl border border-stone-700 bg-stone-800 px-4 py-2 text-sm outline-none focus:border-amber-500"
        />
      </div>

      <button
        onClick={handleChange}
        disabled={busy}
        className="mt-4 rounded-full bg-gradient-to-b from-amber-300 to-amber-500 px-6 py-2 text-sm font-semibold text-stone-950 transition hover:from-amber-200 hover:to-amber-400 disabled:opacity-50"
      >
        {busy ? 'Updating…' : 'Update Password'}
      </button>
    </div>
  )
}
