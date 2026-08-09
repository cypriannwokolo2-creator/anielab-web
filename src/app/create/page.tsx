'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useWalletStore } from '@/lib/stellar/useWalletAuth'

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3001'

interface MilestoneInput {
  title: string
  pct: number // percentage 0-100
}
interface ContributorInput {
  stellar_address: string
  role: string
  share_pct: number // percentage 0-100
}

const STEPS = ['Project Info', 'Milestones', 'Team', 'Deploy'] as const

// Map the ?role= param (from the landing "Who it's for" cards) to a display
// role name so arriving creators start with their role pre-filled.
const ROLE_FROM_PARAM: Record<string, string> = {
  writer: 'Writer',
  illustrator: 'Illustrator',
  composer: 'Composer',
  'voice-actor': 'Voice Actor',
  developer: 'Developer',
  producer: 'Producer',
  designer: 'Designer',
}

export default function CreateProjectPage() {
  const router = useRouter()
  const { address, status } = useWalletStore()
  const fileRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)

  // Step 1: Project info
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [fundingGoal, setFundingGoal] = useState('')
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)

  // Step 2: Milestones
  const [milestones, setMilestones] = useState<MilestoneInput[]>([
    { title: 'Concept & Planning', pct: 20 },
    { title: 'Production', pct: 50 },
    { title: 'Final Delivery', pct: 30 },
  ])

  // Step 3: Contributors
  const [contributors, setContributors] = useState<ContributorInput[]>([
    { stellar_address: '', role: 'Creator', share_pct: 100 },
  ])

  // Pre-fill the first contributor's role from the ?role= query param (only if
  // it's still the default, so we never clobber user edits).
  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get('role')
    const mapped = param ? ROLE_FROM_PARAM[param] : undefined
    if (!mapped) return
    setContributors((prev) =>
      prev.map((c, i) => (i === 0 && c.role === 'Creator' ? { ...c, role: mapped } : c))
    )
  }, [])

  function addMilestone() {
    setMilestones([...milestones, { title: '', pct: 0 }])
  }
  function removeMilestone(i: number) {
    setMilestones(milestones.filter((_, idx) => idx !== i))
  }
  function updateMilestone(i: number, field: keyof MilestoneInput, value: string | number) {
    const updated = [...milestones]
    updated[i] = { ...updated[i], [field]: value }
    setMilestones(updated)
  }
  const milestoneTotal = milestones.reduce((s, m) => s + (Number(m.pct) || 0), 0)

  function addContributor() {
    setContributors([...contributors, { stellar_address: '', role: '', share_pct: 0 }])
  }
  function removeContributor(i: number) {
    setContributors(contributors.filter((_, idx) => idx !== i))
  }
  function updateContributor(i: number, field: keyof ContributorInput, value: string | number) {
    const updated = [...contributors]
    updated[i] = { ...updated[i], [field]: value }
    setContributors(updated)
  }
  const shareTotal = contributors.reduce((s, c) => s + (Number(c.share_pct) || 0), 0)

  function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setCoverFile(file)
    setCoverPreview(URL.createObjectURL(file))
  }

  async function getAccessToken(): Promise<string | null> {
    // Get the Supabase session token from the cookie-stored session.
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token ?? null
  }

  async function uploadCover(token: string): Promise<string | null> {
    if (!coverFile) return null
    const form = new FormData()
    form.append('file', coverFile)
    const res = await fetch(`${BACKEND}/api/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    })
    if (!res.ok) {
      toast.error('Cover upload failed')
      return null
    }
    const data = await res.json()
    return data.key
  }

  async function handleCreate() {
    if (!address) {
      toast.error('Connect your wallet first')
      return
    }
    if (milestoneTotal !== 100) {
      toast.error(`Milestone percentages must total 100% (currently ${milestoneTotal}%)`)
      return
    }
    if (shareTotal !== 100) {
      toast.error(`Share percentages must total 100% (currently ${shareTotal}%)`)
      return
    }

    setLoading(true)
    try {
      const token = await getAccessToken()
      if (!token) {
        toast.error('Session expired — sign in again')
        return
      }

      // 1. Upload cover art.
      const coverKey = await uploadCover(token)

      // 2. Create project in DB.
      const createRes = await fetch(`${BACKEND}/api/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          description: description || undefined,
          cover_ipfs_cid: coverKey || undefined,
          funding_goal: fundingGoal ? Math.round(Number(fundingGoal) * 1e7) : undefined,
        }),
      })
      if (!createRes.ok) {
        const err = await createRes.json().catch(() => ({}))
        toast.error(err.error || 'Failed to create project')
        return
      }
      const { project } = await createRes.json()

      // 3. Set milestones.
      if (milestones.length > 0) {
        await fetch(`${BACKEND}/api/projects/${project.id}/milestones`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            milestones: milestones.map((m) => ({
              title: m.title,
              pct_bps: Math.round(Number(m.pct) * 100), // convert % to bps
            })),
          }),
        })
      }

      // 4. Add contributors.
      for (const c of contributors) {
        if (!c.stellar_address || !c.role) continue
        await fetch(`${BACKEND}/api/projects/${project.id}/contributors`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            stellar_address: c.stellar_address,
            role: c.role,
            share_pct: c.share_pct,
          }),
        })
      }

      toast.success('Project created!')
      router.push(`/projects/${project.id}`)
    } catch (err) {
      console.error(err)
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  function canProceed(): boolean {
    switch (step) {
      case 0:
        return title.trim().length > 0
      case 1:
        return milestoneTotal === 100 && milestones.every((m) => m.title.trim())
      case 2:
        return shareTotal === 100 && contributors.every((c) => c.stellar_address && c.role)
      default:
        return true
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-3xl font-bold">Start a Project</h1>
      <p className="mt-2 text-stone-400">
        {status === 'connected'
          ? `Creating as ${address?.slice(0, 6)}…${address?.slice(-4)}`
          : 'Connect your wallet to begin.'}
      </p>

      {/* Step indicator */}
      <div className="mt-8 flex gap-2">
        {STEPS.map((label, i) => (
          <div
            key={label}
            className={`flex-1 rounded-full py-1.5 text-center text-xs font-medium transition ${
              i === step
                ? 'bg-amber-500 text-stone-950'
                : i < step
                  ? 'bg-amber-900/40 text-amber-300'
                  : 'bg-stone-800 text-stone-500'
            }`}
          >
            {label}
          </div>
        ))}
      </div>

      <div className="mt-8 space-y-6">
        {/* ── Step 0: Project Info ─────────────────────────────────────── */}
        {step === 0 && (
          <>
            <label className="block">
              <span className="text-sm font-medium text-stone-300">Project Title</span>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 w-full rounded-xl border border-stone-700 bg-stone-900 px-4 py-2.5 outline-none transition focus:border-amber-500"
                placeholder="e.g. Stellar Sakura — OVA"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-stone-300">Description</span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="mt-1 w-full rounded-xl border border-stone-700 bg-stone-900 px-4 py-2.5 outline-none transition focus:border-amber-500"
                placeholder="Tell backers about your project…"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-stone-300">Funding Goal (USDC)</span>
              <input
                type="number"
                min={0}
                step={1}
                value={fundingGoal}
                onChange={(e) => setFundingGoal(e.target.value)}
                className="mt-1 w-full rounded-xl border border-stone-700 bg-stone-900 px-4 py-2.5 outline-none transition focus:border-amber-500"
                placeholder="1000"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-stone-300">Cover Art</span>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleCoverChange}
                className="mt-1 block w-full text-sm text-stone-400 file:mr-4 file:rounded-lg file:border-0 file:bg-amber-900/40 file:px-4 file:py-2 file:text-sm file:font-medium file:text-amber-300 hover:file:bg-amber-900/60"
              />
              {coverPreview && (
                <img
                  src={coverPreview}
                  alt="Preview"
                  className="mt-2 h-32 w-full rounded-lg object-cover"
                />
              )}
            </label>
          </>
        )}

        {/* ── Step 1: Milestones ───────────────────────────────────────── */}
        {step === 1 && (
          <>
            <p className="text-sm text-stone-400">
              Define milestones that represent your project&apos;s deliverables. Each milestone
              has a percentage of total funding released when completed.
              <strong className="text-amber-300"> Must total 100%.</strong>
            </p>
            {milestones.map((m, i) => (
              <div key={i} className="flex items-center gap-3">
                <input
                  value={m.title}
                  onChange={(e) => updateMilestone(i, 'title', e.target.value)}
                  className="flex-1 rounded-xl border border-stone-700 bg-stone-900 px-4 py-2 text-sm outline-none focus:border-amber-500"
                  placeholder="Milestone title"
                />
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={m.pct || ''}
                  onChange={(e) => updateMilestone(i, 'pct', Number(e.target.value))}
                  className="w-20 rounded-xl border border-stone-700 bg-stone-900 px-3 py-2 text-center text-sm outline-none focus:border-amber-500"
                  placeholder="%"
                />
                <span className="text-xs text-stone-500">%</span>
                {milestones.length > 1 && (
                  <button
                    onClick={() => removeMilestone(i)}
                    className="text-stone-500 hover:text-red-400"
                    type="button"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={addMilestone}
              className="text-sm text-amber-400 hover:text-amber-300"
              type="button"
            >
              + Add milestone
            </button>
            <div
              className={`text-sm font-medium ${
                milestoneTotal === 100 ? 'text-emerald-400' : 'text-red-400'
              }`}
            >
              Total: {milestoneTotal}% {milestoneTotal !== 100 && '(must be 100%)'}
            </div>
          </>
        )}

        {/* ── Step 2: Contributors ─────────────────────────────────────── */}
        {step === 2 && (
          <>
            <p className="text-sm text-stone-400">
              Add your team members. Each contributor gets a share of milestone
              payouts based on their percentage.
              <strong className="text-amber-300"> Must total 100%.</strong>
            </p>
            {contributors.map((c, i) => (
              <div key={i} className="space-y-2 rounded-xl border border-stone-800 bg-stone-900/50 p-3">
                <div className="flex items-center gap-3">
                  <input
                    value={c.stellar_address}
                    onChange={(e) => updateContributor(i, 'stellar_address', e.target.value)}
                    className="flex-1 rounded-lg border border-stone-700 bg-stone-800 px-3 py-2 text-sm outline-none focus:border-amber-500"
                    placeholder="Stellar address (G…)"
                  />
                  {contributors.length > 1 && (
                    <button
                      onClick={() => removeContributor(i)}
                      className="text-stone-500 hover:text-red-400"
                      type="button"
                    >
                      ✕
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <input
                    value={c.role}
                    onChange={(e) => updateContributor(i, 'role', e.target.value)}
                    className="flex-1 rounded-lg border border-stone-700 bg-stone-800 px-3 py-2 text-sm outline-none focus:border-amber-500"
                    placeholder="Role (e.g. Artist, Developer)"
                  />
                  <input
                    type="number"
                    min={0.01}
                    max={100}
                    step={0.01}
                    value={c.share_pct || ''}
                    onChange={(e) => updateContributor(i, 'share_pct', Number(e.target.value))}
                    className="w-20 rounded-lg border border-stone-700 bg-stone-800 px-3 py-2 text-center text-sm outline-none focus:border-amber-500"
                    placeholder="%"
                  />
                </div>
              </div>
            ))}
            <button
              onClick={addContributor}
              className="text-sm text-amber-400 hover:text-amber-300"
              type="button"
            >
              + Add contributor
            </button>
            <div
              className={`text-sm font-medium ${
                shareTotal === 100 ? 'text-emerald-400' : 'text-red-400'
              }`}
            >
              Total: {shareTotal}% {shareTotal !== 100 && '(must be 100%)'}
            </div>
          </>
        )}

        {/* ── Step 3: Review & Deploy ──────────────────────────────────── */}
        {step === 3 && (
          <div className="space-y-4 rounded-xl border border-stone-800 bg-stone-900/50 p-6">
            <h3 className="text-lg font-semibold">Review Your Project</h3>
            <div className="space-y-2 text-sm text-stone-300">
              <p><span className="text-stone-500">Title:</span> {title}</p>
              {description && <p><span className="text-stone-500">Description:</span> {description}</p>}
              {fundingGoal && <p><span className="text-stone-500">Funding Goal:</span> {fundingGoal} USDC</p>}
              <p><span className="text-stone-500">Cover:</span> {coverFile ? coverFile.name : 'None'}</p>
            </div>
            <div>
              <h4 className="mt-2 text-sm font-medium text-stone-400">Milestones ({milestones.length})</h4>
              <ul className="mt-1 space-y-1 text-sm">
                {milestones.map((m, i) => (
                  <li key={i} className="text-stone-300">
                    {i + 1}. {m.title} — <span className="text-amber-300">{m.pct}%</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="mt-2 text-sm font-medium text-stone-400">Team ({contributors.length})</h4>
              <ul className="mt-1 space-y-1 text-sm">
                {contributors.map((c, i) => (
                  <li key={i} className="text-stone-300">
                    {c.role} — {c.stellar_address.slice(0, 6)}…{c.stellar_address.slice(-4)} ({c.share_pct}%)
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Navigation buttons */}
      <div className="mt-8 flex items-center justify-between">
        <button
          onClick={() => setStep(Math.max(0, step - 1))}
          disabled={step === 0}
          className="rounded-full border border-stone-700 px-5 py-2 text-sm font-medium text-stone-400 transition hover:border-stone-500 disabled:opacity-30"
          type="button"
        >
          Back
        </button>
        {step < STEPS.length - 1 ? (
          <button
            onClick={() => setStep(step + 1)}
            disabled={!canProceed()}
            className="rounded-full bg-gradient-to-b from-amber-300 to-amber-500 px-6 py-2.5 text-sm font-semibold text-stone-950 shadow-md shadow-amber-950/40 transition hover:from-amber-200 hover:to-amber-400 disabled:opacity-40"
            type="button"
          >
            Next
          </button>
        ) : (
          <button
            onClick={handleCreate}
            disabled={loading || status !== 'connected'}
            className="rounded-full bg-gradient-to-b from-amber-300 to-amber-500 px-6 py-2.5 text-sm font-semibold text-stone-950 shadow-md shadow-amber-950/40 transition hover:from-amber-200 hover:to-amber-400 disabled:opacity-40"
            type="button"
          >
            {loading ? 'Creating…' : 'Create Project'}
          </button>
        )}
      </div>
    </div>
  )
}
