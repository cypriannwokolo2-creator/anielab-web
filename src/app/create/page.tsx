'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { useWalletStore } from '@/lib/stellar/useWalletAuth'

// Scaffold for the full Create Project flow (Step 5 in the build order):
// 1. upload cover art via backend /api/upload
// 2. deploy per-project contract via backend /api/projects/deploy-contract
// 3. initialize the contract from the owner's wallet (Freighter)
// 4. save project + contributions rows in Supabase
export default function CreateProjectPage() {
  const { address, status } = useWalletStore()
  const [title, setTitle] = useState('')

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!address) {
      toast.error('Connect your Freighter wallet first')
      return
    }
    toast.info('Create flow not wired up yet — next build step.')
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-3xl font-bold">Start a project</h1>
      <p className="mt-2 text-stone-400">
        {status === 'connected'
          ? `Creating as ${address?.slice(0, 6)}…${address?.slice(-4)}`
          : 'Connect your wallet to begin.'}
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <label className="block">
          <span className="text-sm font-medium text-stone-300">Title</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="mt-1 w-full rounded-xl border border-stone-700 bg-stone-900 px-4 py-2.5 outline-none transition focus:border-amber-500"
            placeholder="e.g. Stellar Sakura — OVA"
          />
        </label>
        <button
          type="submit"
          className="rounded-full bg-gradient-to-b from-amber-300 to-amber-500 px-6 py-2.5 text-sm font-semibold text-stone-950 shadow-md shadow-amber-950/40 transition hover:from-amber-200 hover:to-amber-400"
        >
          Create project
        </button>
      </form>
    </div>
  )
}
