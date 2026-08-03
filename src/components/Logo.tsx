import { useId } from 'react'

export default function Logo({ className = 'h-8 w-8' }: { className?: string }) {
  const id = useId()

  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fde68a" />
          <stop offset="0.55" stopColor="#fbbf24" />
          <stop offset="1" stopColor="#d97706" />
        </linearGradient>
        <linearGradient id={`${id}-shine`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.35" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect x="1.5" y="1.5" width="45" height="45" rx="14" fill={`url(#${id})`} />
      <rect x="1.5" y="1.5" width="45" height="45" rx="14" fill={`url(#${id}-shine)`} />
      <path d="M15.5 34.5 22.6 16.5" stroke="#1c1917" strokeWidth="5" strokeLinecap="round" />
      <path d="M32.5 34.5 25.4 16.5" stroke="#1c1917" strokeWidth="5" strokeLinecap="round" />
      <path d="M20 27h8" stroke="#1c1917" strokeWidth="4.2" strokeLinecap="round" />
      <path
        d="M24 5.5c1.2 3.1 3.4 5.3 6.5 6.5-3.1 1.2-5.3 3.4-6.5 6.5-1.2-3.1-3.4-5.3-6.5-6.5 3.1-1.2 5.3-3.4 6.5-6.5Z"
        fill="#fff7ed"
      />
    </svg>
  )
}
