/**
 * "Built on" tech strip for the landing page — official brand marks
 * (simple-icons paths) rendered inline so they inherit the site palette:
 * muted stone by default, amber on hover.
 */

type Tech = {
  name: string
  href: string
  path: React.ReactNode
}

const TECH: Tech[] = [
  {
    name: 'Stellar',
    href: 'https://stellar.org',
    path: (
      <path d="M12.283 1.851A10.154 10.154 0 001.846 12.002c0 .259.01.516.03.773A1.847 1.847 0 01.872 14.56L0 15.005v2.074l2.568-1.309.832-.424.82-.417 14.71-7.496 1.653-.842L24 4.85V2.776l-3.387 1.728-2.89 1.473-13.955 7.108a8.376 8.376 0 01-.07-1.086 8.313 8.313 0 0112.366-7.247l1.654-.843.247-.126a10.154 10.154 0 00-5.682-1.932zM24 6.925L5.055 16.571l-1.653.844L0 19.15v2.072L3.378 19.5l2.89-1.473 13.97-7.117a8.474 8.474 0 01.07 1.092A8.313 8.313 0 017.93 19.248l-.101.054-1.793.914a10.154 10.154 0 0016.119-8.214c0-.26-.01-.522-.03-.78a1.848 1.848 0 011.003-1.785L24 8.992Z" />
    ),
  },
  {
    name: 'Soroban',
    href: 'https://stellar.org/soroban',
    // Abacus mark — Soroban is Stellar's smart-contract platform.
    path: (
      <>
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M4 1.5A2.5 2.5 0 001.5 4v16A2.5 2.5 0 004 22.5h16a2.5 2.5 0 002.5-2.5V4A2.5 2.5 0 0020 1.5H4zM3 4a1 1 0 011-1h16a1 1 0 011 1v16a1 1 0 01-1 1H4a1 1 0 01-1-1V4z"
        />
        <circle cx="8.2" cy="7" r="1.9" />
        <circle cx="15.8" cy="12" r="1.9" />
        <circle cx="9.8" cy="17" r="1.9" />
        <rect x="2.6" y="6.4" width="18.8" height="1.2" rx="0.6" />
        <rect x="2.6" y="11.4" width="18.8" height="1.2" rx="0.6" />
        <rect x="2.6" y="16.4" width="18.8" height="1.2" rx="0.6" />
      </>
    ),
  },
  {
    name: 'Supabase',
    href: 'https://supabase.com',
    path: (
      <path d="M11.9 1.036c-.015-.986-1.26-1.41-1.874-.637L.764 12.05C-.33 13.427.65 15.455 2.409 15.455h9.579l.113 7.51c.014.985 1.259 1.408 1.873.636l9.262-11.653c1.093-1.375.113-3.403-1.645-3.403h-9.642z" />
    ),
  },
  {
    name: 'IPFS',
    href: 'https://ipfs.tech',
    path: (
      <path d="M12 0L1.608 6v12L12 24l10.392-6V6zm-1.073 1.445h.001a1.8 1.8 0 002.138 0l7.534 4.35a1.794 1.794 0 000 .403l-7.535 4.35a1.8 1.8 0 00-2.137 0l-7.536-4.35a1.795 1.795 0 000-.402zM21.324 7.4c.109.08.226.147.349.201v8.7a1.8 1.8 0 00-1.069 1.852l-7.535 4.35a1.8 1.8 0 00-.349-.2l-.009-8.653a1.8 1.8 0 001.07-1.851zm-18.648.048l7.535 4.35a1.8 1.8 0 001.069 1.852v8.7c-.124.054-.24.122-.349.202l-7.535-4.35a1.8 1.8 0 00-1.069-1.852v-8.7c.124-.054.24-.122.35-.202z" />
    ),
  },
  {
    name: 'WalletConnect',
    href: 'https://walletconnect.com',
    path: (
      <path d="M4.913 7.519c3.915-3.831 10.26-3.831 14.174 0l.471.461a.483.483 0 0 1 0 .694l-1.611 1.577a.252.252 0 0 1-.354 0l-.649-.634c-2.73-2.673-7.157-2.673-9.887 0l-.694.68a.255.255 0 0 1-.355 0L4.397 8.719a.482.482 0 0 1 0-.693l.516-.507Zm17.506 3.263 1.434 1.404a.483.483 0 0 1 0 .694l-6.466 6.331a.508.508 0 0 1-.709 0l-4.588-4.493a.126.126 0 0 0-.178 0l-4.589 4.493a.508.508 0 0 1-.709 0L.147 12.88a.483.483 0 0 1 0-.694l1.434-1.404a.508.508 0 0 1 .709 0l4.589 4.493c.05.048.129.048.178 0l4.589-4.493a.508.508 0 0 1 .709 0l4.589 4.493c.05.048.128.048.178 0l4.589-4.493a.507.507 0 0 1 .708 0Z" />
    ),
  },
]

export default function BuiltOn() {
  return (
    <section className="border-y border-stone-800/60 bg-stone-900/30 py-8">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-10 gap-y-4 px-6">
        <span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-stone-500">
          Built on
        </span>
        {TECH.map((tech) => (
          <a
            key={tech.name}
            href={tech.href}
            target="_blank"
            rel="noopener noreferrer"
            title={tech.name}
            className="group flex items-center gap-2 text-stone-500 transition hover:text-amber-300"
          >
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
              className="h-5 w-5 shrink-0 opacity-80 transition group-hover:opacity-100"
            >
              {tech.path}
            </svg>
            <span className="font-mono text-xs">{tech.name}</span>
          </a>
        ))}
      </div>
    </section>
  )
}
