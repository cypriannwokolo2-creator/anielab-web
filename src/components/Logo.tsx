import { useId } from 'react'

export default function Logo({ className = 'h-7 w-7' }: { className?: string }) {
  const id = useId()

  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fcd34d" />
          <stop offset="1" stopColor="#f59e0b" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="44" height="44" rx="14" fill={`url(#${id})`} />
      <path
        d="M14.5 34 24 13l9.5 21"
        fill="none"
        stroke="#0c0a09"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M19.5 26.5h9" stroke="#0c0a09" strokeWidth="4.2" strokeLinecap="round" />
      <path
        d="M35.5 8.5l1.1 2.9 2.9 1.1-2.9 1.1-1.1 2.9-1.1-2.9-2.9-1.1 2.9-1.1z"
        fill="#fff7ed"
      />
    </svg>
  )
}
