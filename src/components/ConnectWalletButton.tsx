'use client'

import { useWalletStore } from '@/lib/stellar/useWalletAuth'
import { Loader2, Wallet, LogOut } from 'lucide-react'

export default function ConnectWalletButton() {
  const { address, status, error, connect, disconnect } = useWalletStore()

  if (status === 'connecting') {
    return (
      <button
        disabled
        className="inline-flex items-center gap-2 rounded-full bg-gradient-to-b from-amber-300 to-amber-500 px-5 py-2 text-sm font-semibold text-stone-950 opacity-70"
      >
        <Loader2 className="h-4 w-4 animate-spin" />
        Connecting…
      </button>
    )
  }

  if (address) {
    return (
      <div className="flex items-center gap-3">
        <span className="rounded-full border border-amber-500/30 bg-stone-900 px-3 py-2 font-mono text-xs text-amber-200">
          {address.slice(0, 6)}…{address.slice(-4)}
        </span>
        <button
          onClick={disconnect}
          className="inline-flex items-center gap-2 rounded-full border border-stone-700 px-4 py-2 text-sm font-medium text-stone-300 transition hover:border-amber-500/50 hover:text-amber-200"
        >
          <LogOut className="h-4 w-4" />
          Disconnect
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={connect}
        className="inline-flex items-center gap-2 rounded-full bg-gradient-to-b from-amber-300 to-amber-500 px-5 py-2 text-sm font-semibold text-stone-950 shadow-md shadow-amber-950/40 transition hover:from-amber-200 hover:to-amber-400"
      >
        <Wallet className="h-4 w-4" />
        Connect Wallet
      </button>
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  )
}
