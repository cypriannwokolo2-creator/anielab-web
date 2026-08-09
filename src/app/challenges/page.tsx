'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useWalletStore } from '@/lib/stellar/useWalletAuth'

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3001'

interface Challenge {
  id: string
  title: string
  description: string | null
  theme: string | null
  prize_pool: number
  starts_at: string
  ends_at: string
  status: string
  cover_image_key: string | null
}

interface ChallengeEntry {
  id: string
  title: string
  description: string | null
  submission_url: string | null
  votes: number
  rank: number | null
  users: { id: string; display_name: string | null } | null
}

function timeLeft(end: string): string {
  const diff = new Date(end).getTime() - Date.now()
  if (diff <= 0) return 'Ended'
  const days = Math.floor(diff / 86400000)
  const hours = Math.floor((diff % 86400000) / 3600000)
  if (days > 0) return `${days}d ${hours}h left`
  const mins = Math.floor((diff % 3600000) / 60000)
  return `${hours}h ${mins}m left`
}

export default function ChallengesPage() {
  const { address, status: walletStatus } = useWalletStore()
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null)
  const [entries, setEntries] = useState<ChallengeEntry[]>([])
  const [entriesLoading, setEntriesLoading] = useState(false)

  // Submit form state
  const [showSubmit, setShowSubmit] = useState(false)
  const [entryTitle, setEntryTitle] = useState('')
  const [entryDescription, setEntryDescription] = useState('')
  const [entryUrl, setEntryUrl] = useState('')

  // Admin create form
  const [showCreate, setShowCreate] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newTheme, setNewTheme] = useState('')
  const [newPrize, setNewPrize] = useState('')
  const [newStarts, setNewStarts] = useState('')
  const [newEnds, setNewEnds] = useState('')

  async function getAccessToken(): Promise<string | null> {
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token ?? null
  }

  useEffect(() => {
    loadChallenges()
  }, [])

  async function loadChallenges() {
    try {
      const res = await fetch(`${BACKEND}/api/challenges`)
      const data = await res.json()
      setChallenges(data.challenges ?? [])
    } catch {
      toast.error('Failed to load challenges')
    } finally {
      setLoading(false)
    }
  }

  async function loadEntries(challengeId: string) {
    setEntriesLoading(true)
    try {
      const res = await fetch(`${BACKEND}/api/challenges/${challengeId}/entries`)
      const data = await res.json()
      setEntries(data.entries ?? [])
    } catch {
      toast.error('Failed to load entries')
    } finally {
      setEntriesLoading(false)
    }
  }

  function selectChallenge(c: Challenge) {
    setSelectedChallenge(c)
    loadEntries(c.id)
  }

  async function handleSubmitEntry() {
    if (!entryTitle.trim()) {
      toast.error('Entry title is required')
      return
    }
    const token = await getAccessToken()
    if (!token) {
      toast.error('Sign in first')
      return
    }

    try {
      const res = await fetch(`${BACKEND}/api/challenges/${selectedChallenge!.id}/entries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: entryTitle,
          description: entryDescription || undefined,
          submission_url: entryUrl || undefined,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        toast.error(err.error || 'Failed to submit')
        return
      }
      toast.success('Entry submitted!')
      setShowSubmit(false)
      setEntryTitle('')
      setEntryDescription('')
      setEntryUrl('')
      loadEntries(selectedChallenge!.id)
    } catch {
      toast.error('Failed to submit entry')
    }
  }

  async function handleVote(entryId: string, direction: 'up' | 'down') {
    const token = await getAccessToken()
    if (!token) {
      toast.error('Sign in to vote')
      return
    }

    try {
      await fetch(`${BACKEND}/api/challenges/${selectedChallenge!.id}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ entry_id: entryId, direction }),
      })
      loadEntries(selectedChallenge!.id)
    } catch {
      toast.error('Vote failed')
    }
  }

  async function handleCreateChallenge() {
    if (!newTitle.trim() || !newStarts || !newEnds) {
      toast.error('Title, start, and end dates are required')
      return
    }
    const token = await getAccessToken()
    if (!token) {
      toast.error('Sign in first')
      return
    }
    const { getAdminToken } = await import('@/lib/admin/token')
    const adminToken = getAdminToken()
    if (!adminToken) {
      toast.error('Unlock the admin panel at /admin first')
      return
    }

    try {
      const res = await fetch(`${BACKEND}/api/challenges`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'X-Admin-Token': adminToken,
        },
        body: JSON.stringify({
          title: newTitle,
          description: newDescription || undefined,
          theme: newTheme || undefined,
          prize_pool: newPrize ? Math.round(Number(newPrize) * 1e7) : 0,
          starts_at: new Date(newStarts).toISOString(),
          ends_at: new Date(newEnds).toISOString(),
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        toast.error(err.error || 'Failed to create')
        return
      }
      toast.success('Challenge created!')
      setShowCreate(false)
      setNewTitle('')
      setNewDescription('')
      setNewTheme('')
      setNewPrize('')
      loadChallenges()
    } catch {
      toast.error('Failed to create challenge')
    }
  }

  const activeChallenges = challenges.filter((c) => c.status === 'active')
  const upcomingChallenges = challenges.filter((c) => c.status === 'upcoming')

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-amber-400/80">
            Creative Sprints
          </p>
          <h1 className="mt-3 text-4xl font-bold sm:text-5xl">Challenges</h1>
          <p className="mt-3 max-w-xl text-stone-400">
            Time-boxed creative competitions. Submit your work, get voted on by the
            community, win prizes from the pool.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="rounded-full border border-amber-500/40 px-4 py-2 text-sm font-medium text-amber-300 transition hover:border-amber-500"
        >
          {showCreate ? 'Cancel' : '+ Create Challenge'}
        </button>
      </div>

      {/* Create Challenge Form (admin) */}
      {showCreate && (
        <div className="mt-6 rounded-2xl border border-amber-500/30 bg-stone-900/80 p-6">
          <h3 className="text-lg font-semibold">New Challenge</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Challenge title" className="rounded-xl border border-stone-700 bg-stone-800 px-4 py-2 text-sm outline-none focus:border-amber-500" />
            <input value={newTheme} onChange={(e) => setNewTheme(e.target.value)} placeholder="Theme (e.g. Design a rival mech)" className="rounded-xl border border-stone-700 bg-stone-800 px-4 py-2 text-sm outline-none focus:border-amber-500" />
            <input value={newPrize} onChange={(e) => setNewPrize(e.target.value)} placeholder="Prize pool (USDC)" type="number" className="rounded-xl border border-stone-700 bg-stone-800 px-4 py-2 text-sm outline-none focus:border-amber-500" />
            <label className="text-xs text-stone-500">
              Start date
              <input type="datetime-local" value={newStarts} onChange={(e) => setNewStarts(e.target.value)} className="mt-1 w-full rounded-xl border border-stone-700 bg-stone-800 px-4 py-2 text-sm outline-none focus:border-amber-500" />
            </label>
            <label className="text-xs text-stone-500">
              End date
              <input type="datetime-local" value={newEnds} onChange={(e) => setNewEnds(e.target.value)} className="mt-1 w-full rounded-xl border border-stone-700 bg-stone-800 px-4 py-2 text-sm outline-none focus:border-amber-500" />
            </label>
            <textarea value={newDescription} onChange={(e) => setNewDescription(e.target.value)} placeholder="Description" rows={3} className="col-span-2 rounded-xl border border-stone-700 bg-stone-800 px-4 py-2 text-sm outline-none focus:border-amber-500" />
          </div>
          <button onClick={handleCreateChallenge} className="mt-4 rounded-full bg-gradient-to-b from-amber-300 to-amber-500 px-6 py-2.5 text-sm font-semibold text-stone-950 transition hover:from-amber-200 hover:to-amber-400">
            Create Challenge
          </button>
        </div>
      )}

      {/* Challenge list */}
      {loading ? (
        <p className="mt-8 text-stone-500">Loading challenges…</p>
      ) : challenges.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-stone-800 bg-stone-900/60 p-8 text-center">
          <p className="text-stone-400">No challenges yet.</p>
          <p className="mt-2 text-sm text-stone-500">Admins can create the first one using the button above.</p>
        </div>
      ) : (
        <>
          {/* Active challenges */}
          {activeChallenges.length > 0 && (
            <div className="mt-10">
              <h2 className="text-lg font-semibold text-emerald-400">Active</h2>
              <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {activeChallenges.map((c) => (
                  <ChallengeCard key={c.id} challenge={c} onSelect={selectChallenge} />
                ))}
              </div>
            </div>
          )}

          {/* Upcoming challenges */}
          {upcomingChallenges.length > 0 && (
            <div className="mt-10">
              <h2 className="text-lg font-semibold text-stone-400">Upcoming</h2>
              <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {upcomingChallenges.map((c) => (
                  <ChallengeCard key={c.id} challenge={c} onSelect={selectChallenge} />
                ))}
              </div>
            </div>
          )}

          {/* Other challenges */}
          {challenges.filter((c) => !['active', 'upcoming'].includes(c.status)).length > 0 && (
            <div className="mt-10">
              <h2 className="text-lg font-semibold text-stone-500">Past</h2>
              <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {challenges
                  .filter((c) => !['active', 'upcoming'].includes(c.status))
                  .map((c) => (
                    <ChallengeCard key={c.id} challenge={c} onSelect={selectChallenge} />
                  ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Challenge detail panel */}
      {selectedChallenge && (
        <div className="mt-12 rounded-2xl border border-stone-800 bg-stone-900/80 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">{selectedChallenge.title}</h2>
            <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-300">
              {selectedChallenge.status} · {timeLeft(selectedChallenge.ends_at)}
            </span>
          </div>
          {selectedChallenge.theme && (
            <p className="mt-2 text-sm font-medium text-amber-400">Theme: {selectedChallenge.theme}</p>
          )}
          {selectedChallenge.description && (
            <p className="mt-2 text-sm text-stone-400">{selectedChallenge.description}</p>
          )}
          {selectedChallenge.prize_pool > 0 && (
            <p className="mt-2 text-sm text-stone-300">
              Prize pool: <strong>{(selectedChallenge.prize_pool / 1e7).toFixed(0)} USDC</strong>
            </p>
          )}

          {/* Submit entry button */}
          {selectedChallenge.status === 'active' && walletStatus === 'connected' && (
            <button
              onClick={() => setShowSubmit(!showSubmit)}
              className="mt-4 rounded-full bg-gradient-to-b from-amber-300 to-amber-500 px-5 py-2 text-sm font-semibold text-stone-950 transition hover:from-amber-200 hover:to-amber-400"
            >
              {showSubmit ? 'Cancel' : 'Submit Entry'}
            </button>
          )}

          {/* Submit form */}
          {showSubmit && (
            <div className="mt-4 space-y-3 rounded-xl border border-stone-700 bg-stone-800/50 p-4">
              <input value={entryTitle} onChange={(e) => setEntryTitle(e.target.value)} placeholder="Entry title" className="w-full rounded-lg border border-stone-700 bg-stone-900 px-4 py-2 text-sm outline-none focus:border-amber-500" />
              <textarea value={entryDescription} onChange={(e) => setEntryDescription(e.target.value)} placeholder="Description (optional)" rows={2} className="w-full rounded-lg border border-stone-700 bg-stone-900 px-4 py-2 text-sm outline-none focus:border-amber-500" />
              <input value={entryUrl} onChange={(e) => setEntryUrl(e.target.value)} placeholder="Submission URL (optional)" className="w-full rounded-lg border border-stone-700 bg-stone-900 px-4 py-2 text-sm outline-none focus:border-amber-500" />
              <button onClick={handleSubmitEntry} className="rounded-full bg-amber-500 px-5 py-2 text-sm font-semibold text-stone-950 hover:bg-amber-400">
                Submit
              </button>
            </div>
          )}

          {/* Entries */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold">Entries</h3>
            {entriesLoading ? (
              <p className="mt-2 text-stone-500">Loading entries…</p>
            ) : entries.length === 0 ? (
              <p className="mt-2 text-stone-500">No entries yet.</p>
            ) : (
              <div className="mt-3 space-y-3">
                {entries.map((entry) => (
                  <div key={entry.id} className="flex items-center gap-4 rounded-xl border border-stone-800 bg-stone-800/30 p-4">
                    <div className="flex flex-col items-center gap-1">
                      <button onClick={() => handleVote(entry.id, 'up')} className="text-stone-500 transition hover:text-emerald-400">▲</button>
                      <span className="text-lg font-bold text-amber-300">{entry.votes}</span>
                      <button onClick={() => handleVote(entry.id, 'down')} className="text-stone-500 transition hover:text-red-400">▼</button>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold">{entry.title}</h4>
                      {entry.description && <p className="mt-0.5 text-sm text-stone-400">{entry.description}</p>}
                      {entry.submission_url && (
                        <a href={entry.submission_url} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-xs text-amber-400 hover:underline">
                          View submission →
                        </a>
                      )}
                      <p className="mt-1 text-xs text-stone-500">
                        by {entry.users?.display_name || 'Anonymous'}
                        {entry.rank && <span className="ml-2 text-amber-400">#{entry.rank}</span>}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Sub-components ──────────────────────────────────────────────────── */

function ChallengeCard({ challenge, onSelect }: { challenge: Challenge; onSelect: (c: Challenge) => void }) {
  const prizeUsdc = challenge.prize_pool > 0 ? (challenge.prize_pool / 1e7).toFixed(0) : '0'
  return (
    <button
      onClick={() => onSelect(challenge)}
      className="flex flex-col gap-3 rounded-2xl border border-stone-800 bg-stone-900 p-5 text-left transition hover:border-amber-500/50"
    >
      <h3 className="font-semibold">{challenge.title}</h3>
      {challenge.theme && (
        <span className="inline-block self-start rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs text-amber-300">
          {challenge.theme}
        </span>
      )}
      <div className="flex items-center justify-between text-xs text-stone-500">
        <span>{prizeUsdc} USDC prize</span>
        <span>{timeLeft(challenge.ends_at)}</span>
      </div>
    </button>
  )
}
