'use client'

import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

/**
 * Labeled password input with a show/hide toggle. Used anywhere a password is
 * collected so the reveal button (and its aria label) stays consistent.
 */
export default function PasswordField({
  label,
  value,
  onChange,
  placeholder = '••••••••',
  autoComplete = 'current-password',
  required = true,
  minLength = 8,
  id,
}: {
  label?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  autoComplete?: string
  required?: boolean
  minLength?: number
  id?: string
}) {
  const [show, setShow] = useState(false)

  return (
    <label className="block">
      {label ? (
        <span className="text-sm font-medium text-stone-300">{label}</span>
      ) : null}
      <div className="relative mt-1">
        <input
          id={id}
          type={show ? 'text' : 'password'}
          required={required}
          minLength={minLength}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-xl border border-stone-700 bg-stone-900 px-4 py-2.5 pr-11 text-sm outline-none transition focus:border-amber-500"
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? 'Hide password' : 'Show password'}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 transition hover:text-amber-300"
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </label>
  )
}
