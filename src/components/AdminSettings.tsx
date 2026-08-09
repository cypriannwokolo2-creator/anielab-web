'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3001'

interface Settings {
  id: number
  platform_fee_bps: number
  platform_wallet: string | null
  updated_at: string
}

export default function AdminSettings() {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [feeBps, setFeeBps] = useState('')
  const [wallet, setWallet] = useState('')
  const [adminPw, setAdminPw] = useState('')

  useEffect(() => {
    loadSettings()
  }, [])

  async function loadSettings() {
    try {
      const res = await fetch(`${BACKEND}/api/admin/settings`)
      const data = await res.json()
      setSettings(data.settings)
      setFeeBps(String(data.settings?.platform_fee_bps ?? 500))
      setWallet(data.settings?.platform_wallet ?? '')
    } catch {
      toast.error('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    try {
      // Get admin password from cookie or input.
      const password = adminPw || getCookie('admin_password')
      if (!password) {
        toast.error('Enter admin password')
        return
      }

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
          'X-Admin-Password': password,
        },
        body: JSON.stringify({
          platform_fee_bps: Number(feeBps),
          platform_wallet: wallet || undefined,
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        toast.error(err.error || 'Failed to save')
        return
      }

      const data = await res.json()
      setSettings(data.settings)
      toast.success('Settings saved')
    } catch {
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="text-stone-500">Loading settings…</p>

  return (
    <div className="rounded-2xl border border-stone-800 bg-stone-900/60 p-6">
      <h3 className="text-lg font-semibold">Platform Settings</h3>
      <p className="mt-1 text-sm text-stone-500">
        Controls the platform fee on every pledge and the platform wallet address.
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm text-stone-400">Platform Fee (basis points)</span>
          <input
            type="number"
            min={0}
            max={2000}
            value={feeBps}
            onChange={(e) => setFeeBps(e.target.value)}
            className="mt-1 w-full rounded-xl border border-stone-700 bg-stone-800 px-4 py-2 text-sm outline-none focus:border-amber-500"
          />
          <p className="mt-1 text-xs text-stone-500">
            {Number(feeBps) / 100}% — 500 = 5%, max 2000 = 20%
          </p>
        </label>
        <label className="block">
          <span className="text-sm text-stone-400">Platform Wallet</span>
          <input
            value={wallet}
            onChange={(e) => setWallet(e.target.value)}
            placeholder="G…"
            className="mt-1 w-full rounded-xl border border-stone-700 bg-stone-800 px-4 py-2 font-mono text-sm outline-none focus:border-amber-500"
          />
        </label>
      </div>

      <details className="mt-4">
        <summary className="cursor-pointer text-xs text-stone-500 hover:text-stone-300">
          Admin password (if not using cookie)
        </summary>
        <input
          type="password"
          value={adminPw}
          onChange={(e) => setAdminPw(e.target.value)}
          placeholder="Admin password"
          className="mt-2 w-full rounded-xl border border-stone-700 bg-stone-800 px-4 py-2 text-sm outline-none focus:border-amber-500"
        />
      </details>

      <button
        onClick={handleSave}
        disabled={saving}
        className="mt-4 rounded-full bg-gradient-to-b from-amber-300 to-amber-500 px-6 py-2 text-sm font-semibold text-stone-950 transition hover:from-amber-200 hover:to-amber-400 disabled:opacity-50"
      >
        {saving ? 'Saving…' : 'Save Settings'}
      </button>

      {settings?.updated_at && (
        <p className="mt-3 text-xs text-stone-600">
          Last updated: {new Date(settings.updated_at).toLocaleString()}
        </p>
      )}
    </div>
  )
}

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}
