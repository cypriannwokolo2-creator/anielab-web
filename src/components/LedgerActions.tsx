'use client'

import { HandCoins, UserPlus } from 'lucide-react'
import AuthDialog from './AuthDialog'
import { useAuthDialog } from '@/lib/useAuthDialog'

/** CTA strip for the live ledger — both actions need a connected wallet. */
export default function LedgerActions() {
  const openDialog = useAuthDialog((s) => s.openDialog)

  return (
    <>
      <div className="mt-6 flex flex-col items-center justify-between gap-4 border-t border-stone-800 pt-5 lg:flex-row">
        <p className="text-xs leading-relaxed text-stone-500">
          Fund this project or apply to join the crew — connect any wallet
          (Freighter · LOBSTR · xBull · WalletConnect) to take part.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <button
            onClick={() => openDialog()}
            className="btn-drip inline-flex items-center gap-2 px-5 py-2.5 text-sm"
          >
            <HandCoins className="h-4 w-4" />
            Fund this project
          </button>
          <button
            onClick={() => openDialog()}
            className="btn-drip-ghost inline-flex items-center gap-2 bg-stone-900/60 px-5 py-2.5 text-sm"
          >
            <UserPlus className="h-4 w-4" />
            Apply to be part
          </button>
        </div>
      </div>
      <AuthDialog />
    </>
  )
}
