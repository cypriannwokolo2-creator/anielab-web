'use client'

import { useEffect, useState } from 'react'
import { ExternalLink, Loader2 } from 'lucide-react'
import { getKitWallets, type WalletOption } from '@/lib/stellar/wallets'

/**
 * The single, site-styled wallet chooser. Lists every wallet the Stellar
 * Wallets Kit supports with real availability + install links, and connects
 * directly to the chosen wallet (no kit modal). Used by the auth dialog and
 * the fund dialog so "connect wallet" looks identical everywhere.
 */
export default function WalletPicker({
  onSelect,
  busy,
}: {
  onSelect: (walletId: string) => void
  busy?: boolean
}) {
  const [wallets, setWallets] = useState<WalletOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    getKitWallets()
      .then((list) => {
        if (!cancelled) setWallets(list)
      })
      .catch(() => {
        if (!cancelled) setError('Could not load wallets.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-8 text-sm text-stone-500">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading wallets…
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
        {error}
      </div>
    )
  }

  const available = wallets.filter((w) => w.isAvailable)
  const rest = wallets.filter((w) => !w.isAvailable)

  return (
    <div className="space-y-4">
      {available.length > 0 ? (
        <div className="grid grid-cols-2 gap-2">
          {available.map((w) => (
            <button
              key={w.id}
              onClick={() => onSelect(w.id)}
              disabled={busy}
              className="flex items-center gap-2.5 rounded-[1rem_0_1rem_0] border border-stone-700 bg-stone-900 px-3 py-3 text-left transition hover:border-amber-500/60 hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- remote wallet icons */}
              <img
                src={w.icon}
                alt={w.name}
                className="h-6 w-6 rounded-full object-contain"
              />
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">{w.name}</span>
                <span className="block text-[10px] text-amber-400">Connect →</span>
              </span>
            </button>
          ))}
        </div>
      ) : (
        <p className="text-sm text-stone-400">
          No wallets detected on this device. Install one below, or connect from
          your phone.
        </p>
      )}

      {rest.length > 0 && (
        <>
          <div className="flex items-center gap-3 py-1">
            <span className="h-px flex-1 bg-stone-800" />
            <span className="text-[11px] uppercase tracking-wider text-stone-500">
              Install a wallet
            </span>
            <span className="h-px flex-1 bg-stone-800" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            {rest.map((w) => (
              <a
                key={w.id}
                href={w.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2.5 rounded-[1rem_0_1rem_0] border border-stone-700/60 bg-stone-900/50 px-3 py-3 text-left text-sm text-stone-400 transition hover:border-amber-500/40 hover:text-stone-200"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- remote wallet icons */}
                <img
                  src={w.icon}
                  alt={w.name}
                  className="h-6 w-6 rounded-full object-contain opacity-70"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{w.name}</span>
                  <span className="block text-[10px] text-stone-600">
                    Install wallet
                  </span>
                </span>
                <ExternalLink className="h-3 w-3 shrink-0 text-stone-600" />
              </a>
            ))}
          </div>
        </>
      )}

      <p className="text-center text-[11px] text-stone-600">
        No private keys leave your browser. Transactions are signed and sent
        straight from your wallet.
      </p>
    </div>
  )
}
