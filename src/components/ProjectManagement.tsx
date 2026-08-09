'use client'

import { useState } from 'react'
import { toast } from 'sonner'

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3001'

interface Props {
  projectId: string
}

/**
 * Project management panel for the project owner.
 * Renders actions: release milestone, add contributor, cancel project.
 * Only shows if the current user is the project owner (checked server-side
 * via the session).
 */
export default function ProjectManagement({ projectId }: Props) {
  const [releasing, setReleasing] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [showAddContributor, setShowAddContributor] = useState(false)
  const [newAddress, setNewAddress] = useState('')
  const [newRole, setNewRole] = useState('')
  const [newShare, setNewShare] = useState('')

  async function getAccessToken(): Promise<string | null> {
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token ?? null
  }

  async function handleReleaseMilestone() {
    setReleasing(true)
    try {
      const token = await getAccessToken()
      if (!token) {
        toast.error('Sign in first')
        return
      }
      const res = await fetch(`${BACKEND}/api/projects/${projectId}/release`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Release failed')
        return
      }
      toast.success(`Milestone "${data.released.title}" released!`)
      // Reload page to show updated state.
      window.location.reload()
    } catch {
      toast.error('Release failed')
    } finally {
      setReleasing(false)
    }
  }

  async function handleCancel() {
    if (!confirm('Cancel this project? Remaining escrowed funds will be returned to you.')) return
    setCancelling(true)
    try {
      const token = await getAccessToken()
      if (!token) {
        toast.error('Sign in first')
        return
      }
      const res = await fetch(`${BACKEND}/api/projects/${projectId}/cancel`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Cancel failed')
        return
      }
      toast.success('Project cancelled')
      window.location.reload()
    } catch {
      toast.error('Cancel failed')
    } finally {
      setCancelling(false)
    }
  }

  async function handleAddContributor() {
    if (!newAddress || !newRole || !newShare) {
      toast.error('All fields are required')
      return
    }
    const token = await getAccessToken()
    if (!token) {
      toast.error('Sign in first')
      return
    }

    try {
      const res = await fetch(`${BACKEND}/api/projects/${projectId}/contributors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          stellar_address: newAddress,
          role: newRole,
          share_pct: Number(newShare),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Failed to add contributor')
        return
      }
      toast.success('Contributor added!')
      setShowAddContributor(false)
      setNewAddress('')
      setNewRole('')
      setNewShare('')
      window.location.reload()
    } catch {
      toast.error('Failed to add contributor')
    }
  }

  return (
    <section className="mt-10 rounded-2xl border border-stone-800 bg-stone-900/60 p-6">
      <h2 className="text-lg font-semibold">Manage Project</h2>
      <p className="mt-1 text-sm text-stone-500">
        Actions available to the project owner. Sign in with the wallet used to create this project.
      </p>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          onClick={handleReleaseMilestone}
          disabled={releasing}
          className="rounded-full bg-gradient-to-b from-amber-300 to-amber-500 px-5 py-2 text-sm font-semibold text-stone-950 transition hover:from-amber-200 hover:to-amber-400 disabled:opacity-50"
        >
          {releasing ? 'Releasing…' : 'Release Next Milestone'}
        </button>

        <button
          onClick={() => setShowAddContributor(!showAddContributor)}
          className="rounded-full border border-stone-700 px-4 py-2 text-sm font-medium text-stone-300 transition hover:border-stone-500"
        >
          {showAddContributor ? 'Cancel' : '+ Add Contributor'}
        </button>

        <button
          onClick={handleCancel}
          disabled={cancelling}
          className="rounded-full border border-red-900/60 px-4 py-2 text-sm font-medium text-red-400 transition hover:border-red-700 disabled:opacity-50"
        >
          {cancelling ? 'Cancelling…' : 'Cancel Project'}
        </button>
      </div>

      {/* Add contributor form */}
      {showAddContributor && (
        <div className="mt-4 space-y-3 rounded-xl border border-stone-700 bg-stone-800/50 p-4">
          <input
            value={newAddress}
            onChange={(e) => setNewAddress(e.target.value)}
            placeholder="Stellar address (G…)"
            className="w-full rounded-lg border border-stone-700 bg-stone-900 px-4 py-2 text-sm outline-none focus:border-amber-500"
          />
          <input
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
            placeholder="Role (e.g. Artist)"
            className="w-full rounded-lg border border-stone-700 bg-stone-900 px-4 py-2 text-sm outline-none focus:border-amber-500"
          />
          <input
            value={newShare}
            onChange={(e) => setNewShare(e.target.value)}
            placeholder="Share % (e.g. 15)"
            type="number"
            min={0.01}
            max={100}
            className="w-full rounded-lg border border-stone-700 bg-stone-900 px-4 py-2 text-sm outline-none focus:border-amber-500"
          />
          <button
            onClick={handleAddContributor}
            className="rounded-full bg-amber-500 px-5 py-2 text-sm font-semibold text-stone-950 hover:bg-amber-400"
          >
            Add
          </button>
        </div>
      )}
    </section>
  )
}
