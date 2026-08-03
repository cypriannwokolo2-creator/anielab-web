import 'server-only'
import { Client, networks } from '@/lib/stellar/bindings'

export const CONTRACT_ID = networks.testnet.contractId
export const NETWORK_PASSPHRASE = networks.testnet.networkPassphrase

export interface ContractState {
  admin: string | null
  token: string | null
  contributors: string[]
  shares: bigint[]
  totalShares: bigint
}/**
 * Reads the live on-chain state of the deployed RevenueSplitter instance
 * (testnet) using the generated typed bindings.
 */
export async function getContractState(): Promise<ContractState | null> {
  try {
    const client = new Client({
      contractId: CONTRACT_ID,
      networkPassphrase: NETWORK_PASSPHRASE,
      rpcUrl:
        process.env.NEXT_PUBLIC_SOROBAN_RPC_URL ?? 'https://soroban-testnet.stellar.org',
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
