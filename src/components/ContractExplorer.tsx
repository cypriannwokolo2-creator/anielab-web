import { ExternalLink } from 'lucide-react'
import CopyButton from './CopyButton'
import LedgerActions from './LedgerActions'
import {
  CONTRACT_ID,
  NETWORK_PASSPHRASE,
  getContractState,
  maskAddress,
  sharePct,
  shortenAddress,
} from '@/lib/stellar/contractState'

export const dynamic = 'force-dynamic'

const explorerLink = (id: string) =>
  `https://stellar.expert/explorer/testnet/contract/${id}`

export default async function ContractExplorer() {
  const state = await getContractState()

  const live = state && state.admin && state.contributors.length > 0

  return (
    <section className="mx-auto w-full max-w-6xl px-6">
      <div
        className="relative overflow-hidden bg-gradient-to-b from-amber-500/50 via-stone-800/50 to-stone-900 p-px shadow-2xl shadow-amber-950/40"
        style={{ borderRadius: '2.5rem 0 2.5rem 0' }}
      >
        <div className="pointer-events-none absolute -top-24 right-10 h-64 w-64 rounded-full bg-amber-500/15 blur-3xl" />
        <div
          className="relative bg-stone-950/95 px-6 py-6 sm:px-8 sm:py-7"
          style={{ borderRadius: 'calc(2.5rem - 1px) 0 calc(2.5rem - 1px) 0' }}
        >
          {/* ledger header */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-800 pb-5">
            <div className="flex items-center gap-3">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-60" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-400" />
              </span>
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-amber-400/80">
                  Revenue Splitter · Live Ledger
                </p>
                <h2 className="mt-1 text-xl font-bold">
                  The contract that pays the crew
                </h2>
              </div>
            </div>
            <a
              href={explorerLink(CONTRACT_ID)}
              target="_blank"
              rel="noreferrer"
              className="btn-drip-ghost inline-flex items-center gap-1.5 bg-stone-900/60 px-4 py-2 text-sm"
            >
              Open on explorer <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>

          {state ? (
            <div className="mt-6 grid gap-8 lg:grid-cols-2">
              {/* clauses */}
              <div className="space-y-4">
                <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-stone-500">
                  The contract
                </p>

                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-stone-800 bg-stone-900/50 px-4 py-3">
                    <span className="text-xs uppercase tracking-wider text-stone-500">
                      ID
                    </span>
                    <span className="flex items-center gap-2 font-mono text-xs text-stone-200">
                      {shortenAddress(CONTRACT_ID, 14)}
                      <CopyButton value={CONTRACT_ID} />
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3 rounded-xl border border-stone-800 bg-stone-900/50 px-4 py-3">
                    <span className="text-xs uppercase tracking-wider text-stone-500">
                      Admin
                    </span>
                    <span className="font-mono text-xs text-stone-300" title="Address hidden for privacy">
                      {state.admin ? maskAddress(state.admin) : 'not set'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3 rounded-xl border border-stone-800 bg-stone-900/50 px-4 py-3">
                    <span className="text-xs uppercase tracking-wider text-stone-500">
                      Payout token
                    </span>
                    {state.token ? (
                      <a
                        href={explorerLink(state.token)}
                        target="_blank"
                        rel="noreferrer"
                        className="font-mono text-xs text-amber-300 hover:text-amber-200"
                      >
                        {shortenAddress(state.token, 12)}
                      </a>
                    ) : (
                      <span className="font-mono text-xs text-stone-500">not set</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-3 rounded-xl border border-stone-800 bg-stone-900/50 px-4 py-3">
                    <span className="text-xs uppercase tracking-wider text-stone-500">
                      Network
                    </span>
                    <span className="font-mono text-xs text-stone-300">
                      testnet · {NETWORK_PASSPHRASE}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3 rounded-xl border border-stone-800 bg-stone-900/50 px-4 py-3">
                    <span className="text-xs uppercase tracking-wider text-stone-500">
                      Status
                    </span>
                    <span
                      className={`rounded-[0.6rem_0_0.6rem_0] border px-3 py-1 font-mono text-[11px] ${
                        live
                          ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                          : 'border-amber-500/40 bg-amber-500/10 text-amber-300'
                      }`}
                    >
                      {live ? '● initialized · live' : '○ awaiting setup'}
                    </span>
                  </div>
                </div>
              </div>

              {/* the split */}
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-stone-500">
                  Top contributors ({state.contributors.length})
                </p>
                <p className="mt-1 text-xs text-stone-500">
                  Ranked by share. Identities are kept private — connect a
                  wallet to fund the project or apply to join the crew.
                </p>

                {state.contributors.length > 0 ? (
                  <div className="mt-4 space-y-4">
                    {state.contributors
                      .map((address, i) => ({ address, share: state.shares[i] ?? 0n }))
                      .sort((a, b) => (a.share < b.share ? 1 : a.share > b.share ? -1 : 0))
                      .map(({ address, share }, i) => {
                        const pct = sharePct(share, state.totalShares)
                        const first = i === 0
                        return (
                          <div key={address}>
                            <div className="mb-1.5 flex items-center justify-between gap-3 font-mono text-xs">
                              <span className="flex items-center gap-2.5">
                                <span
                                  className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${
                                    first
                                      ? 'bg-gradient-to-b from-amber-300 to-amber-500 text-stone-950'
                                      : 'bg-stone-800 text-stone-300'
                                  }`}
                                >
                                  {i + 1}
                                </span>
                                <span
                                  className={first ? 'text-amber-200' : 'text-stone-300'}
                                  title="Identity hidden for privacy"
                                >
                                  Member {String(i + 1).padStart(2, '0')}
                                </span>
                              </span>
                              <span className="text-amber-400">
                                {pct} · {share.toString()} / {state.totalShares.toString()}w
                              </span>
                            </div>
                            <div className="h-2.5 overflow-hidden rounded-full bg-stone-800">
                              <div
                                className="bar-grow h-full rounded-full bg-gradient-to-r from-amber-300 to-amber-500"
                                style={{ width: pct }}
                              />
                            </div>
                          </div>
                        )
                      })}
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-stone-500">
                    No contributors configured yet.
                  </p>
                )}

                <p className="mt-6 border-t border-stone-800 pt-4 font-mono text-[11px] text-stone-500">
                  reads: soroban-testnet.stellar.org · typed via the generated
                  revenue-splitter bindings · identities kept private
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-6 text-sm text-stone-400">
              Could not reach the testnet RPC. Check{' '}
              <code className="text-stone-300">NEXT_PUBLIC_SOROBAN_RPC_URL</code>.
            </div>
          )}

          {/* wallet-gated CTAs */}
          <LedgerActions />
        </div>
      </div>
    </section>
  )
}
