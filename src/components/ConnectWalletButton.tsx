'use client'

import { useState, useEffect } from 'react'
import { Wallet } from 'lucide-react'
import AuthDialog from './AuthDialog'
import { useWalletStore } from '@/lib/stellar/useWalletAuth'
import { APP_HOST, APP_URL } from '@/lib/hosts'

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

  // Only ever read after mount (signedIn itself flips post-mount when the
  // session restores), so SSR and first client render stay in sync.
  const [host, setHost] = useState<string | null>(null)
  useEffect(() => {
    setHost(window.location.hostname)
  }, [])
  const createHref = host === APP_HOST ? '/create' : `${APP_URL}/create`

  const className =
    variant === 'ghost'
      ? 'btn-drip-ghost bg-stone-900/60 px-7 py-3'
      : 'btn-drip px-7 py-3 shadow-lg shadow-amber-950/50'

  return (
    <>
      {signedIn ? (
        <a href={createHref} className={className}>
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
