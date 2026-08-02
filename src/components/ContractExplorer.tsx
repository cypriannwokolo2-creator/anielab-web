import { ExternalLink } from 'lucide-react'
import CopyButton from './CopyButton'
import {
  CONTRACT_ID,
  NETWORK_PASSPHRASE,
  getContractState,
  sharePct,
  shortenAddress,
} from '@/lib/stellar/contractState'

export const dynamic = 'force-dynamic'

const explorerLink = (id: string) =>
  `https://stellar.expert/explorer/testnet/contract/${id}`

export default async function ContractExplorer() {
  const state = await getContractState()

  return (
    <section className="mx-auto w-full max-w-6xl px-6">
      <div className="overflow-hidden rounded-3xl border border-amber-500/30 bg-stone-900/60 shadow-2xl shadow-amber-950/40 backdrop-blur">
        <div className="flex items-center justify-between border-b border-stone-800 px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-400" />
            </span>
            <h2 className="font-semibold">RevenueSplitter — live on testnet</h2>
          </div>
          <a
            href={explorerLink(CONTRACT_ID)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-sm text-amber-300 transition hover:bg-amber-500/20"
          >
            explorer <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>

        {state ? (
          <div className="grid gap-6 p-6 md:grid-cols-2">
            <div className="space-y-4 text-sm">
              <div>
                <div className="text-xs uppercase tracking-wider text-stone-500">
                  Contract ID
                </div>
                <div className="mt-1 flex items-center gap-2 font-mono text-xs text-stone-200">
                  {shortenAddress(CONTRACT_ID, 12)}
                  <CopyButton value={CONTRACT_ID} />
                </div>
              </div>

              <div>
                <div className="text-xs uppercase tracking-wider text-stone-500">
                  Admin
                </div>
                <div className="mt-1 font-mono text-xs text-stone-200">
                  {state.admin ? (
                    <a
                      href={`https://stellar.expert/explorer/testnet/account/${state.admin}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-amber-300 hover:text-amber-200"
                    >
                      {shortenAddress(state.admin, 10)}
                    </a>
                  ) : (
                    <span className="text-stone-400">not set</span>
                  )}
                </div>
              </div>

              <div>
                <div className="text-xs uppercase tracking-wider text-stone-500">
                  Payout token
                </div>
                <div className="mt-1 font-mono text-xs text-stone-200">
                  {state.token ? (
                    <a
                      href={explorerLink(state.token)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-amber-300 hover:text-amber-200"
                    >
                      {shortenAddress(state.token, 10)}
                    </a>
                  ) : (
                    <span className="text-stone-400">not set</span>
                  )}
                </div>
              </div>

              <div>
                <div className="text-xs uppercase tracking-wider text-stone-500">
                  Network
                </div>
                <div className="mt-1 font-mono text-xs text-stone-200">
                  testnet — {NETWORK_PASSPHRASE}
                </div>
              </div>
            </div>

            <div>
              <div className="text-xs uppercase tracking-wider text-stone-500">
                Contributors ({state.contributors.length})
              </div>
              {state.contributors.length > 0 ? (
                <ul className="mt-2 space-y-2">
                  {state.contributors.map((address, i) => (
                    <li
                      key={address}
                      className="flex items-center justify-between gap-3 rounded-xl border border-stone-800 bg-stone-950/60 px-3 py-2"
                    >
                      <span className="font-mono text-xs text-stone-300">
                        {shortenAddress(address, 10)}
                      </span>
                      <span className="flex items-center gap-3">
                        <span className="font-mono text-xs text-stone-500">
                          {state.shares[i]?.toString() ?? '?'} /{' '}
                          {state.totalShares.toString()}
                        </span>
                        <span className="w-12 text-right font-mono text-xs text-amber-400">
                          {state.shares[i]
                            ? sharePct(state.shares[i], state.totalShares)
                            : '?'}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-stone-500">
                  No contributors configured yet.
                </p>
              )}
              <p className="mt-4 text-xs text-stone-500">
                Live state read from the Soroban testnet RPC via the generated
                TypeScript bindings.
              </p>
            </div>
          </div>
        ) : (
          <div className="p-6 text-sm text-stone-400">
            Could not reach the testnet RPC. Check{' '}
            <code className="text-stone-300">NEXT_PUBLIC_SOROBAN_RPC_URL</code>.
          </div>
        )}
      </div>
    </section>
  )
}
