import Link from 'next/link'
import { Eye, ShieldCheck, TrendingUp } from 'lucide-react'

export const metadata = {
  title: 'Fund Projects | AnieLab',
  description:
    'Back anime, comics, games, and music projects directly — every payout is a public transaction on Stellar.',
}

const features = [
  {
    icon: ShieldCheck,
    title: 'Your money goes to the contract, not the platform',
    description:
      'You pledge directly into the project’s smart contract. AnieLab never holds, touches, or withdraws funds — and neither can anyone else.',
  },
  {
    icon: Eye,
    title: 'Watch every payout land, in public',
    description:
      'Every distribution is a transaction on the Stellar network. Open the project’s contract any time and see exactly which amounts went to which contributors.',
  },
  {
    icon: TrendingUp,
    title: 'Fund what you want to exist',
    description:
      'A short film, a webtoon, an album, a game. Your pledge is the difference between an idea in a folder and a finished project in the world.',
  },
]

export default function FundPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <div className="max-w-2xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-amber-400/80">
          For backers
        </p>
        <h1 className="mt-3 text-4xl font-bold sm:text-5xl">
          Fund projects you believe in.
        </h1>
        <p className="mt-5 text-lg text-stone-400">
          Anime, comics, games, and music get made because someone pays for them
          to exist. Back a project directly, and watch your contribution turn
          into finished episodes, pages, and tracks — with every payout
          verifiable on-chain.
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          <Link
            href="/#projects"
            className="btn-drip px-7 py-3 shadow-lg shadow-amber-950/50"
          >
            Browse projects
          </Link>
          <Link
            href="/create"
            className="btn-drip-ghost bg-stone-900/60 px-7 py-3"
          >
            Have an idea? Start a project
          </Link>
        </div>
      </div>

      <div className="mt-16 grid gap-6 md:grid-cols-3">
        {features.map((f) => (
          <div
            key={f.title}
            className="rounded-2xl border border-stone-800 bg-stone-900/60 p-6 transition hover:border-amber-500/50"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-b from-amber-300 to-amber-500 text-stone-950">
              <f.icon className="h-5 w-5" />
            </div>
            <h2 className="mt-4 text-lg font-semibold">{f.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-stone-400">
              {f.description}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-16 rounded-3xl border border-amber-500/30 bg-stone-900/60 p-8 text-center">
        <h2 className="text-2xl font-bold">
          What a backer&apos;s board looks like
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-stone-400">
          The funding board on our landing page shows it already: real projects
          with a goal, the amount funded, what&apos;s still needed, and every
          transfer recorded on the Stellar testnet. That&apos;s the same
          transparency your pledges get — just with real projects.
        </p>
        <Link
          href="/#contract"
          className="btn-drip-ghost bg-stone-900/60 px-6 py-2.5 text-sm"
        >
          See projects needing funding →
        </Link>
      </div>
    </div>
  )
}
