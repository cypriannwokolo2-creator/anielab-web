'use client'

import { useState } from 'react'
import { Loader2, LogOut, Wallet } from 'lucide-react'
import { useWalletStore } from '@/lib/stellar/useWalletAuth'
import AuthDialog from './AuthDialog'

export default function ConnectWalletButton() {
  const { address, status, authStatus, provider, error, signOut } = useWalletStore()
  const [dialogOpen, setDialogOpen] = useState(false)

  const walletBusy = status === 'connecting' || authStatus === 'signing'
  const signedIn = authStatus === 'authenticated'

  return (
    <div className="flex flex-col items-end gap-1">
      {walletBusy ? (
        <button
          disabled
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-b from-amber-300 to-amber-500 px-5 py-2 text-sm font-semibold text-stone-950 opacity-70"
        >
          <Loader2 className="h-4 w-4 animate-spin" />
          {authStatus === 'signing' ? 'Signing…' : 'Connecting…'}
        </button>
      ) : signedIn && address ? (
        <div className="flex items-center gap-2">
          <span
            className="cursor-pointer rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-2 font-mono text-xs text-amber-200"
            onClick={() => setDialogOpen(true)}
            title={`Signed in with ${provider ?? 'wallet'}`}
          >
            {address.slice(0, 6)}…{address.slice(-4)}
          </span>
          <button
            onClick={signOut}
            title="Sign out"
            className="rounded-full border border-stone-700 p-2 text-stone-400 transition hover:border-amber-500/50 hover:text-amber-200"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <>
          <button
            onClick={() => setDialogOpen(true)}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-b from-amber-300 to-amber-500 px-5 py-2 text-sm font-semibold text-stone-950 shadow-md shadow-amber-950/40 transition hover:from-amber-200 hover:to-amber-400"
          >
            <Wallet className="h-4 w-4" />
            Sign in
          </button>
          {error && <span className="text-xs text-red-400">{error}</span>}
        </>
      )}

      <AuthDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </div>
  )
}
