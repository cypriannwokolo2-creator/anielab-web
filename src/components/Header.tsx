'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ChevronDown, LogOut, Menu, Settings, Wallet, X } from 'lucide-react'
import Logo from './Logo'
import AuthDialog from './AuthDialog'
import { useWalletStore } from '@/lib/stellar/useWalletAuth'
import { useAuthDialog } from '@/lib/useAuthDialog'
import { APP_HOST, APP_URL } from '@/lib/hosts'

const exploreItems = [
  {
    href: '/#projects',
    title: 'Co-create',
    description:
      'Anime, comics, games, music — build original IP with a crew. Credits tracked on-chain, revenue split by percentage.',
    soon: false,
  },
  {
    href: '/fund',
    title: 'Fund projects',
    description:
      'Back projects directly. Money goes to the contract, not the platform; every payout is public.',
    soon: false,
  },
  {
    href: '/challenges',
    title: 'Creative sprints',
    description:
      'Run a time-boxed creative sprint for your IP — or apply to join one. Rewards split automatically.',
    soon: false,
  },
  {
    href: '/fund',
    title: 'Fan voting',
    description: 'Backers vote on what the community funds next.',
    soon: true,
  },
  {
    href: '/fund',
    title: 'Monthly support',
    description: "Ongoing support that pays a crew's split every month.",
    soon: true,
  },
]

const topLinks = [
  { href: '/#how', label: 'How it works' },
  { href: '/#contract', label: 'Needs funding' },
]

export default function Header() {
  const [raised, setRaised] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [exploreOpen, setExploreOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const openDialog = useAuthDialog((s) => s.openDialog)
  // Which public host this header renders on. Kept in state (not read straight
  // from window) so SSR and the first client render agree, then the mount
  // effect flips it — no hydration mismatch.
  const [host, setHost] = useState<string | null>(null)
  const exploreRef = useRef<HTMLDivElement>(null)
  const accountRef = useRef<HTMLDivElement>(null)

  const { address, authStatus, session, signOut, restoreSession } = useWalletStore()
  const signedIn = authStatus === 'authenticated'

  const isApp = host === APP_HOST
  // On the landing host every app link must jump hosts — relative links would
  // bounce off the middleware back to the landing page. On the app host they
  // stay relative.
  const appHref = (path: string) => (isApp ? path : `${APP_URL}${path}`)

  const accountLabel = session?.user?.email ?? address ?? ''
  const initials = (accountLabel.trim()[0] ?? '').toUpperCase()

  useEffect(() => {
    void restoreSession()
  }, [restoreSession])

  useEffect(() => {
    setHost(window.location.hostname)
  }, [])

  useEffect(() => {
    const onScroll = () => setRaised(window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!exploreOpen) return
    const onDocClick = (e: MouseEvent) => {
      if (exploreRef.current && !exploreRef.current.contains(e.target as Node)) {
        setExploreOpen(false)
      }
    }
    document.addEventListener('click', onDocClick)
    return () => document.removeEventListener('click', onDocClick)
  }, [exploreOpen])

  useEffect(() => {
    if (!accountOpen) return
    const onDocClick = (e: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setAccountOpen(false)
      }
    }
    document.addEventListener('click', onDocClick)
    return () => document.removeEventListener('click', onDocClick)
  }, [accountOpen])

  return (
    <header
      className={`fixed left-1/2 top-4 z-40 w-[calc(100vw-1.25rem)] -translate-x-1/2 border bg-stone-950/95 transition-all duration-300 ${
        raised ? 'border-amber-500/20 shadow-2xl shadow-black/50' : 'border-stone-800'
      }`}
      style={{
        // Rounded top-left + bottom-right only
        borderRadius: menuOpen ? '2.5rem 0 0 0' : '2.5rem 0 2.5rem 0',
      }}
    >
      <div className="flex items-center justify-between px-4 py-3 sm:px-5">
        <div className="flex items-center gap-6">
          <Link href={isApp ? '/dashboard' : '/'} className="flex items-center gap-2.5">
            <Logo className="h-8 w-8" />
            <span className="text-lg font-bold tracking-tight sm:text-xl">
              <span className="bg-gradient-to-b from-amber-200 to-amber-500 bg-clip-text text-transparent">
                AnieLab
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-5 md:flex">
            {/* Explore dropdown */}
            <div className="relative" ref={exploreRef}>
              <button
                onClick={() => setExploreOpen(!exploreOpen)}
                aria-expanded={exploreOpen}
                className="flex items-center gap-1 text-sm text-stone-300 underline-offset-4 transition hover:text-amber-300 hover:underline"
              >
                Explore
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform duration-200 ${
                    exploreOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {exploreOpen && (
                <div
                  className="dialog-panel absolute left-0 top-full mt-3 w-80 border border-stone-800 bg-stone-950/95 p-2 shadow-2xl shadow-black/50 backdrop-blur"
                  style={{ borderRadius: '1.5rem 0 1.5rem 0' }}
                >
                  {exploreItems.map((item) => (
                    <Link
                      key={item.title}
                      href={appHref(item.href)}
                      onClick={(e) => {
                        // Signed-out landing visitors would just bounce off
                        // the app host's auth wall — open the dialog instead.
                        if (!isApp && !signedIn) {
                          e.preventDefault()
                          openDialog()
                        }
                        setExploreOpen(false)
                      }}
                      className={`group flex flex-col gap-0.5 rounded-[0.9rem_0_0.9rem_0.9rem] px-3.5 py-3 transition hover:bg-stone-900 ${
                        item.soon ? 'pointer-events-none opacity-50' : ''
                      }`}
                    >
                      <span className="flex items-center gap-2 text-sm font-medium text-stone-200 transition group-hover:text-amber-300">
                        {item.title}
                        {item.soon && (
                          <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-300">
                            soon
                          </span>
                        )}
                      </span>
                      <span className="text-xs leading-relaxed text-stone-500">
                        {item.description}
                      </span>
                    </Link>
                  ))}

                  <div className="my-1 h-px bg-stone-800" />

                  <button
                    onClick={() => {
                      setExploreOpen(false)
                      openDialog()
                    }}
                    className="flex w-full items-center justify-between rounded-[0.9rem_0_0.9rem_0.9rem] px-3.5 py-3 text-sm font-medium text-amber-300 transition hover:bg-stone-900"
                  >
                    {signedIn && address
                      ? `Signed in · ${address.slice(0, 6)}…${address.slice(-4)}`
                      : 'Sign in / Join AnieLab'}
                  </button>
                </div>
              )}
            </div>

            {!isApp &&
              topLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="text-sm text-stone-300 underline-offset-4 transition hover:text-amber-300 hover:underline"
                >
                  {link.label}
                </Link>
              ))}
          </nav>
        </div>

        {/* single CTA — connect wallet to sign up; signed-in users get Start a project */}
        <div
          className="relative hidden items-center gap-3 md:flex"
          style={{ borderRadius: '1.5rem 0 1.5rem 0' }}
        >
          <div className="wave-glow" />
          {signedIn ? (
            <>
              <Link
                href={appHref('/create')}
                className="relative block rounded-[1.25rem_0_1.25rem_0] bg-gradient-to-b from-amber-300 to-amber-500 px-5 py-2 text-sm font-semibold text-stone-950 transition hover:from-amber-200 hover:to-amber-400"
              >
                Start a project
              </Link>

              {/* account menu */}
              <div className="relative" ref={accountRef}>
                <button
                  onClick={() => setAccountOpen(!accountOpen)}
                  aria-expanded={accountOpen}
                  aria-label="Account menu"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-amber-500/40 bg-gradient-to-b from-amber-300 to-amber-500 text-sm font-bold text-stone-950 transition hover:from-amber-200 hover:to-amber-400"
                >
                  {initials || <Wallet className="h-4 w-4" />}
                </button>

                {accountOpen && (
                  <div
                    className="dialog-panel absolute right-0 top-full mt-3 w-72 border border-stone-800 bg-stone-950/95 p-2 shadow-2xl shadow-black/50 backdrop-blur"
                    style={{ borderRadius: '1.5rem 0 1.5rem 0' }}
                  >
                    <div className="border-b border-stone-800 px-3.5 py-3">
                      <p className="text-sm font-medium text-stone-200">
                        {session?.user?.display_name || 'AnieLab member'}
                      </p>
                      <p className="mt-0.5 truncate font-mono text-xs text-stone-500">
                        {session?.user?.email || address}
                      </p>
                    </div>
                    <div className="py-1">
                      <Link
                        href={appHref('/account')}
                        onClick={() => setAccountOpen(false)}
                        className="flex items-center gap-2.5 rounded-[0.9rem_0_0.9rem_0.9rem] px-3.5 py-2.5 text-sm text-stone-300 transition hover:bg-stone-900 hover:text-amber-300"
                      >
                        <Settings className="h-4 w-4" /> Account settings
                      </Link>
                      <button
                        onClick={() => {
                          setAccountOpen(false)
                          void signOut()
                        }}
                        className="flex w-full items-center gap-2.5 rounded-[0.9rem_0_0.9rem_0.9rem] px-3.5 py-2.5 text-sm text-stone-400 transition hover:bg-stone-900 hover:text-red-400"
                      >
                        <LogOut className="h-4 w-4" /> Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <button
              onClick={() => openDialog()}
              className="relative flex items-center gap-2 rounded-[1.25rem_0_1.25rem_0] bg-gradient-to-b from-amber-300 to-amber-500 px-5 py-2 text-sm font-semibold text-stone-950 transition hover:from-amber-200 hover:to-amber-400"
            >
              <Wallet className="h-4 w-4" />
              Connect wallet
            </button>
          )}
        </div>

        <button
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
          className="flex h-10 w-10 items-center justify-center rounded-[0.75rem_0_0.75rem_0] border border-stone-800 text-stone-300 transition hover:border-amber-500/40 hover:text-amber-300 md:hidden"
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* mobile menu */}
      {menuOpen && (
        <div className="border-t border-stone-800 px-5 pb-5 pt-3 md:hidden">
          <nav className="flex flex-col gap-1">
            {topLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="rounded-xl px-3 py-2.5 text-sm text-stone-300 transition hover:bg-stone-900 hover:text-amber-300"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <p className="px-3 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-500">
            Explore
          </p>
          <nav className="flex flex-col gap-1">
            {exploreItems.map((item) => (
              <Link
                key={item.title}
                href={appHref(item.href)}
                onClick={(e) => {
                  if (!isApp && !signedIn) {
                    e.preventDefault()
                    openDialog()
                  }
                  setMenuOpen(false)
                }}
                className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-stone-300 transition hover:bg-stone-900 hover:text-amber-300 ${
                  item.soon ? 'pointer-events-none opacity-50' : ''
                }`}
              >
                {item.title}
                {item.soon && (
                  <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-300">
                    soon
                  </span>
                )}
              </Link>
            ))}
          </nav>

          <button
            onClick={() => {
              setMenuOpen(false)
              openDialog()
            }}
            className="mt-3 w-full rounded-[1.25rem_0_1.25rem_0] border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm font-medium text-amber-300"
          >
            {signedIn && address
              ? `Signed in · ${address.slice(0, 6)}…${address.slice(-4)}`
              : 'Sign in / Join AnieLab'}
          </button>

          {signedIn ? (
            <Link
              href={appHref('/create')}
              onClick={() => setMenuOpen(false)}
              className="mt-2 block rounded-[1.25rem_0_1.25rem_0] bg-gradient-to-b from-amber-300 to-amber-500 px-4 py-3 text-center text-sm font-semibold text-stone-950"
            >
              Start a project
            </Link>
          ) : (
            <button
              onClick={() => {
                setMenuOpen(false)
                openDialog()
              }}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-[1.25rem_0_1.25rem_0] bg-gradient-to-b from-amber-300 to-amber-500 px-4 py-3 text-center text-sm font-semibold text-stone-950"
            >
              <Wallet className="h-4 w-4" /> Connect wallet
            </button>
          )}

          {signedIn && (
            <Link
              href={appHref('/account')}
              onClick={() => setMenuOpen(false)}
              className="mt-2 block rounded-[1.25rem_0_1.25rem_0] border border-stone-800 px-4 py-3 text-center text-sm font-medium text-stone-300 hover:text-amber-300"
            >
              Account settings
            </Link>
          )}

          {signedIn && (
            <button
              onClick={() => {
                signOut()
                setMenuOpen(false)
              }}
              className="mt-2 w-full rounded-[1.25rem_0_1.25rem_0] border border-stone-800 px-4 py-3 text-sm font-medium text-stone-400 hover:text-stone-200"
            >
              Sign out
            </button>
          )}
        </div>
      )}

      <AuthDialog />
    </header>
  )
}
