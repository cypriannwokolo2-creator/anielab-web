'use client'

import { useState } from 'react'
import { Wallet } from 'lucide-react'
import AuthDialog from './AuthDialog'
import { useWalletStore } from '@/lib/stellar/useWalletAuth'

/**
 * Primary signup CTA — opens the wallet-first auth dialog so users can create
 * an account by connecting any Stellar wallet. Once signed in, falls back to
 * "Start a project".
 */
export default function ConnectWalletButton({
  variant = 'primary',
}: {
  variant?: 'primary' | 'ghost'
}) {
  const [open, setOpen] = useState(false)
  const authStatus = useWalletStore((s) => s.authStatus)
  const signedIn = authStatus === 'authenticated'

  const className =
    variant === 'ghost'
      ? 'btn-drip-ghost bg-stone-900/60 px-7 py-3'
      : 'btn-drip px-7 py-3 shadow-lg shadow-amber-950/50'

  return (
    <>
      {signedIn ? (
        <a href="/create" className={className}>
          Start a project
        </a>
      ) : (
        <button onClick={() => setOpen(true)} className={className}>
          <span className="flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            Connect wallet
          </span>
        </button>
      )}
      <AuthDialog open={open} onClose={() => setOpen(false)} />
    </>
  )
}
