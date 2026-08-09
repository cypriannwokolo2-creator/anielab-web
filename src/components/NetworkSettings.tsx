'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { getAdminToken } from '@/lib/admin/token'
import { invalidateNetworkConfig } from '@/lib/stellar/network'

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3001'

type NetworkId = 'TESTNET' | 'PUBLIC'

export default function NetworkSettings() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [network, setNetwork] = useState<NetworkId>('TESTNET')
  const [rpcUrl, setRpcUrl] = useState('')
  const [usdcAsset, setUsdcAsset] = useState('')
  const [deployerKey, setDeployerKey] = useState('')
  const [deployerKeySet, setDeployerKeySet] = useState(false)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    try {
      const res = await fetch(`${BACKEND}/api/admin/settings`)
      const data = await res.json()
      const s = data.settings ?? {}
      setNetwork(s.stellar_network === 'PUBLIC' ? 'PUBLIC' : 'TESTNET')
      setRpcUrl(s.soroban_rpc_url ?? '')
      setUsdcAsset(s.usdc_asset ?? '')
      setDeployerKeySet(Boolean(s.deployer_key_set))
    } catch {
      toast.error('Failed to load network settings')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    const adminToken = getAdminToken()
    if (!adminToken) {
      toast.error('Admin session expired — unlock the panel again')
      return
    }

    if (network === 'PUBLIC') {
      if (!usdcAsset.trim()) {
        toast.error('Live network needs the mainnet USDC asset id before you save')
        return
      }
      if (!deployerKeySet && !deployerKey.trim()) {
        toast.error('Live network needs a mainnet deployer secret key before you save')
        return
      }
    }

    setSaving(true)
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        toast.error('Sign in first')
        return
      }

      const res = await fetch(`${BACKEND}/api/admin/settings`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
          'X-Admin-Token': adminToken,
        },
        body: JSON.stringify({
          stellar_network: network,
          soroban_rpc_url: rpcUrl.trim() || undefined,
          usdc_asset: usdcAsset.trim() || undefined,
          deployer_secret_key: deployerKey.trim() || undefined,
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        toast.error(err.error || 'Failed to save network settings')
        return
      }

      if (deployerKey.trim()) {
        setDeployerKeySet(true)
        setDeployerKey('')
      }
      // Drop the cached config so the site picks up the change right away.
      invalidateNetworkConfig()
      toast.success(
        network === 'PUBLIC' ? 'Switched to the live Stellar network' : 'Switched to testnet'
      )
    } catch {
      toast.error('Failed to save network settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="text-stone-500">Loading network settings…</p>

  return (
    <div className="rounded-2xl border border-stone-800 bg-stone-900/60 p-6">
      <h3 className="text-lg font-semibold">Stellar Network</h3>
      <p className="mt-1 text-sm text-stone-500">
        Flip between testnet and the live network. Saved here — no env vars, no redeploy.
      </p>

      {/* network toggle */}
      <div className="mt-4 inline-flex rounded-full border border-stone-700 bg-stone-800 p-1">
        {(['TESTNET', 'PUBLIC'] as NetworkId[]).map((n) => (
          <button
            key={n}
            onClick={() => setNetwork(n)}
            className={`rounded-full px-5 py-1.5 text-sm font-semibold transition ${
              network === n
                ? 'bg-gradient-to-b from-amber-300 to-amber-500 text-stone-950'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            {n === 'TESTNET' ? 'Testnet' : 'Live'}
          </button>
        ))}
      </div>

      {network === 'PUBLIC' && (
        <p className="mt-3 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-xs text-amber-200">
          Going live is real money. Fill in your mainnet RPC URL, the mainnet USDC
          asset id and a funded mainnet deployer key below — only you set these.
        </p>
      )}

      <div className="mt-4 grid gap-4">
        <label className="block">
          <span className="text-sm text-stone-400">Soroban RPC URL</span>
          <input
            value={rpcUrl}
            onChange={(e) => setRpcUrl(e.target.value)}
            placeholder={
              network === 'PUBLIC'
                ? 'https://soroban-rpc.publicnode.com (or your provider)'
                : 'https://soroban-testnet.stellar.org'
            }
            className="mt-1 w-full rounded-xl border border-stone-700 bg-stone-800 px-4 py-2 font-mono text-sm outline-none focus:border-amber-500"
          />
        </label>

        <label className="block">
          <span className="text-sm text-stone-400">USDC asset (SAC contract id)</span>
          <input
            value={usdcAsset}
            onChange={(e) => setUsdcAsset(e.target.value)}
            placeholder={network === 'PUBLIC' ? 'C… (mainnet USDC)' : 'C… (testnet USDC)'}
            className="mt-1 w-full rounded-xl border border-stone-700 bg-stone-800 px-4 py-2 font-mono text-sm outline-none focus:border-amber-500"
          />
        </label>

        <label className="block">
          <span className="flex items-center gap-2 text-sm text-stone-400">
            Deployer secret key
            {deployerKeySet && (
              <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-300">
                configured
              </span>
            )}
          </span>
          <input
            type="password"
            value={deployerKey}
            onChange={(e) => setDeployerKey(e.target.value)}
            placeholder={deployerKeySet ? '•••••• — leave blank to keep' : 'S…'}
            autoComplete="off"
            className="mt-1 w-full rounded-xl border border-stone-700 bg-stone-800 px-4 py-2 font-mono text-sm outline-none focus:border-amber-500"
          />
          <p className="mt-1 text-xs text-stone-500">
            Only used to deploy per-project contracts. Never shown back after saving.
          </p>
        </label>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="mt-4 rounded-full bg-gradient-to-b from-amber-300 to-amber-500 px-6 py-2 text-sm font-semibold text-stone-950 transition hover:from-amber-200 hover:to-amber-400 disabled:opacity-50"
      >
        {saving ? 'Saving…' : 'Save Network Settings'}
      </button>
    </div>
  )
}
