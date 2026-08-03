import 'server-only'
import { contract } from '@stellar/stellar-sdk'
import { NETWORK_PASSPHRASE } from './contractState'

const RPC_URL =
  process.env.NEXT_PUBLIC_SOROBAN_RPC_URL || 'https://soroban-testnet.stellar.org'

/**
 * USDC Stellar Asset Contract on testnet.
 * Deterministic SAC id for issuer GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5
 * (derived via `stellar contract id asset`).
 */
const USDC_SAC =
  process.env.NEXT_PUBLIC_USDC_SAC_TESTNET ||
  'CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA'

/**
 * Reads how much USDC currently sits in a project contract on-chain.
 * Uses the SDK's embedded SAC spec, so no wasm is downloaded.
 */
export async function getContractUsdcBalance(contractId: string): Promise<bigint> {
  const read = async (): Promise<bigint> => {
    interface SacClient {
      balance(opts: { id: string }): Promise<{ result: bigint }>
    }
    const client = await contract.Client.from<SacClient>({
      contractId: USDC_SAC,
      rpcUrl: RPC_URL,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
    const res = await client.balance({ id: contractId })
    return BigInt(res.result)
  }
  try {
    // A slow/unreachable RPC must never hang the page — bail out to 0.
    return await Promise.race([
      read(),
      new Promise<bigint>((resolve) => setTimeout(() => resolve(0n), 8000)),
    ])
  } catch (err) {
    console.error(`Failed to read USDC balance for ${contractId}:`, err)
    return 0n
  }
}
