import Link from 'next/link'
import Logo from './Logo'

const exploreLinks = [
  { href: '/#projects', label: 'Co-create' },
  { href: '/fund', label: 'Fund projects' },
  { href: '/challenges', label: 'Creative sprints' },
  { href: '/create', label: 'Start a project' },
]

const learnLinks = [
  { href: '/#how', label: 'How it works' },
  { href: '/#contract', label: 'Live contract' },
  { href: '/#faq', label: 'FAQ' },
]

const codeLinks = [
  {
    href: 'https://github.com/cypriannwokolo2-creator/anielab-contracts',
    label: 'Smart contracts',
  },
  {
    href: 'https://github.com/cypriannwokolo2-creator/anielab-backend',
    label: 'Backend',
  },
  {
    href: 'https://github.com/cypriannwokolo2-creator/anielab-web',
    label: 'Frontend',
  },
]

function FooterColumn({
  title,
  links,
}: {
  title: string
  links: { href: string; label: string }[]
}) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-500">
        {title}
      </p>
      <ul className="mt-4 space-y-2.5">
        {links.map((link) => (
          <li key={link.label}>
            <Link
              href={link.href}
              className="text-sm text-stone-400 transition hover:text-amber-300"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function Footer() {
  return (
    <footer className="border-t border-stone-800 bg-stone-900/30">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2.5">
            <Logo className="h-8 w-8" />
            <span className="text-lg font-bold tracking-tight">
              <span className="bg-gradient-to-b from-amber-200 to-amber-500 bg-clip-text text-transparent">
                AnieLab
              </span>
            </span>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-stone-500">
            Web3 co-creation for indie creators — anime, comics, games, music.
            Credits tracked on-chain, payouts split automatically by percentage.
          </p>
          <span className="mt-4 inline-flex rounded-[0.6rem_0_0.6rem_0] border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[11px] font-medium text-amber-300">
            early days · built in public
          </span>
        </div>

        <FooterColumn title="Explore" links={exploreLinks} />
        <FooterColumn title="Learn" links={learnLinks} />
        <FooterColumn title="Code" links={codeLinks} />
      </div>

      <div className="border-t border-stone-800">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-6 text-xs text-stone-600 sm:flex-row">
          <span>© 2026 AnieLab — built on Stellar &amp; Soroban</span>
          <span className="font-mono">testnet · early days · built in public</span>
        </div>
      </div>
    </footer>
  )
}
