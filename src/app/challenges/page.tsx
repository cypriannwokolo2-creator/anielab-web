import Link from 'next/link'
import { CalendarDays, Medal, MousePointerClick } from 'lucide-react'

export const metadata = {
  title: 'Challenges & Hackathons | AnieLab',
  description:
    'Run themed creation challenges — like hackathons for your IP. Submissions pinned to IPFS, rewards split on-chain automatically.',
}

const steps = [
  {
    icon: CalendarDays,
    title: 'Set the challenge',
    description:
      'Pick a theme from your IP — “design the rival mech”, “compose the boss-fight theme”, “write the festival episode”. Set a deadline and a reward pot.',
  },
  {
    icon: MousePointerClick,
    title: 'Creators submit on-chain',
    description:
      'Every entry is pinned to IPFS with its creator’s name attached. No lost files, no anonymous submissions — the credit list builds itself.',
  },
  {
    icon: Medal,
    title: 'Rewards split automatically',
    description:
      'When the challenge closes, the pot is distributed to the winners — or split across ranked entries — by the contract. Public, automatic, no payout drama.',
  },
]

export default function ChallengesPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <div className="max-w-2xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-amber-400/80">
          Launching soon
        </p>
        <h1 className="mt-3 text-4xl font-bold sm:text-5xl">
          Run a challenge — a hackathon for your IP.
        </h1>
        <p className="mt-5 text-lg text-stone-400">
          Open a themed call to your community — fan art, boss music, a new
          ending for episode three — and let the contract handle the prizes.
          The same infrastructure that splits project revenue powers challenges,
          so rewards land automatically and nobody has to chase a payout.
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          <Link
            href="/create"
            className="rounded-full bg-gradient-to-b from-amber-300 to-amber-500 px-7 py-3 font-semibold text-stone-950 shadow-lg shadow-amber-950/50 transition hover:from-amber-200 hover:to-amber-400"
          >
            Start a project first
          </Link>
          <Link
            href="/fund"
            className="rounded-full border border-stone-700 bg-stone-900/60 px-7 py-3 font-medium text-stone-200 transition hover:border-amber-500/60 hover:text-amber-200"
          >
            See how funding works
          </Link>
        </div>
      </div>

      <div className="mt-16 grid gap-6 md:grid-cols-3">
        {steps.map((s, i) => (
          <div
            key={s.title}
            className="rounded-2xl border border-stone-800 bg-stone-900/60 p-6 transition hover:border-amber-500/50"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-b from-amber-300 to-amber-500 font-mono text-sm font-bold text-stone-950">
              {i + 1}
            </div>
            <div className="mt-4 flex items-center gap-2">
              <s.icon className="h-4 w-4 text-amber-400" />
              <h2 className="text-lg font-semibold">{s.title}</h2>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-stone-400">
              {s.description}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-16 rounded-3xl border border-amber-500/30 bg-stone-900/60 p-8 text-center">
        <h2 className="text-2xl font-bold">Challenges are in the works</h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-stone-400">
          We&apos;re building challenges on top of the revenue-splitting
          contract, so the payout logic gets tested by real projects first.
          The fastest way to be ready: start a project, grow a crew, and
          you&apos;ll have a community to challenge.
        </p>
      </div>
    </div>
  )
}
