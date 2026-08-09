import 'server-only'
import { Client, networks } from '@/lib/stellar/bindings'
import { getNetworkConfig } from './network'

export const CONTRACT_ID = networks.testnet.contractId

export interface ContractState {
  admin: string | null
  token: string | null
  contributors: string[]
  shares: bigint[]
  totalShares: bigint
}/**
 * Reads the live on-chain state of the deployed RevenueSplitter instance
 * using the generated typed bindings. RPC URL and network passphrase come
 * from the admin-panel-driven network config.
 */
export async function getContractState(): Promise<ContractState | null> {
  try {
    const net = await getNetworkConfig()
    const client = new Client({
      contractId: CONTRACT_ID,
      networkPassphrase: net.networkPassphrase,
      rpcUrl: net.rpcUrl,
    })

    const [admin, token, contributors, shares, totalShares] = await Promise.all([
      client.get_admin(),
      client.get_token(),
      client.get_contributors(),
      client.get_shares(),
      client.get_total_shares(),
    ])

    return {
      admin: admin.result ?? null,
      token: token.result ?? null,
      contributors: contributors.result,
      shares: shares.result,
      totalShares: totalShares.result,
    }
  } catch (err) {
    console.error('Failed to read contract state:', err)
    return null
  }
}

export function shortenAddress(address: string, chars = 6) {
  if (address.length <= chars * 2 + 3) return address
  return `${address.slice(0, chars)}…${address.slice(-chars)}`
}

/** Privacy-masked address — first char + last 4, e.g. G••••••D3EG */
export function maskAddress(address: string) {
  if (address.length <= 10) return address
  return `${address.slice(0, 1)}${'•'.repeat(6)}${address.slice(-4)}`
}

export function sharePct(share: bigint, total: bigint): string {
  if (total <= 0n) return '0%'
  return `${((share * 10000n) / total / 100n).toString()}%`
}
