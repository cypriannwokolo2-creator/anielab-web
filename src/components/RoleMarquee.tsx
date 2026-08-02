'use client'

import { useRef, useState } from 'react'
import { ArrowUpRight, Brush, HandCoins, Mic, Music, PenLine } from 'lucide-react'

interface Role {
  icon: typeof PenLine
  title: string
  line: string
  tag: string
}

const roles: Role[] = [
  {
    icon: PenLine,
    title: 'Writer',
    line: 'Scripts, story, and world-building — credited in every draft, paid on every payout.',
    tag: 'Your % on-chain',
  },
  {
    icon: Brush,
    title: 'Illustrator',
    line: 'Character sheets to key frames. Every file pinned to IPFS with your name on it.',
    tag: 'Your % on-chain',
  },
  {
    icon: Music,
    title: 'Composer',
    line: 'Score and sound design, split from the same pot as everyone else. Automatically.',
    tag: 'Your % on-chain',
  },
  {
    icon: Mic,
    title: 'Voice Actor',
    line: 'Lines, takes, and direction tracked per episode — never lost in a group chat.',
    tag: 'Your % on-chain',
  },
  {
    icon: HandCoins,
    title: 'Backer',
    line: 'Fund projects you believe in, then watch every payout land — in public.',
    tag: 'Verify it yourself',
  },
]

function RoleCard({ role, index }: { role: Role; index: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [tilt, setTilt] = useState('')

  function onMove(e: React.MouseEvent) {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    setTilt(`perspective(900px) rotateY(${x * 12}deg) rotateX(${-y * 12}deg) scale(1.03)`)
  }

  function onLeave() {
    setTilt('')
  }

  const Icon = role.icon

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className="w-72 shrink-0 transition-transform duration-200 ease-out will-change-transform"
      style={{ transform: tilt }}
    >
      <div
        className="h-full rounded-3xl bg-gradient-to-b from-amber-500/50 via-stone-700/60 to-stone-800/60 p-px shadow-lg shadow-amber-950/30 transition hover:shadow-amber-500/20"
        style={{ rotate: index % 2 === 0 ? '-1.5deg' : '1.5deg' }}
      >
        <div className="flex h-64 flex-col justify-between rounded-[calc(1.5rem-1px)] bg-stone-950/95 p-6">
          <div className="flex items-start justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-b from-amber-300 to-amber-500 text-stone-950">
              <Icon className="h-5 w-5" />
            </div>
            <ArrowUpRight className="h-4 w-4 text-amber-400/60" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">{role.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-stone-400">{role.line}</p>
            <span className="mt-4 inline-flex rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[11px] font-medium text-amber-300">
              {role.tag}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function RoleMarquee() {
  return (
    <section className="pb-20">
      <div className="mx-auto max-w-6xl px-6 text-center">
        <h2 className="text-3xl font-bold">Built for the whole crew</h2>
        <p className="mx-auto mt-3 max-w-2xl text-stone-400">
          One project, five kinds of people, one shared ledger. Whoever you are,
          your percentage is on it.
        </p>
      </div>

      <div className="marquee relative mt-10 overflow-hidden py-4 [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
        <div className="marquee-track flex w-max gap-6 pr-6">
          {[...roles, ...roles].map((role, i) => (
            <RoleCard key={`${role.title}-${i}`} role={role} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
