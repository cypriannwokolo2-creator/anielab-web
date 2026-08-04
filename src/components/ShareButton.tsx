'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Check, Link2 } from 'lucide-react'

/**
 * Copies the current page URL so a project (or any page) can be shared.
 * Uses the native share sheet when available, falling back to clipboard.
 */
export default function ShareButton({
  className = '',
  label = 'Share',
}: {
  className?: string
  label?: string
}) {
  const [copied, setCopied] = useState(false)

  async function share() {
    const url = window.location.href
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ url })
        return
      } catch {
        // user cancelled or share unsupported — fall through to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      toast.success('Link copied to clipboard.')
      setTimeout(() => setCopied(false), 1500)
    } catch {
      toast.error('Could not copy the link.')
    }
  }

  return (
    <button onClick={share} className={className}>
      {copied ? (
        <Check className="h-4 w-4 text-emerald-400" />
      ) : (
        <Link2 className="h-4 w-4" />
      )}
      {label ? <span>{copied ? 'Copied' : label}</span> : null}
    </button>
  )
}
