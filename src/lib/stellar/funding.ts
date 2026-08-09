import 'server-only'
import { contract } from '@stellar/stellar-sdk'
import { getNetworkConfig } from './network'

/**
 * Reads how much USDC currently sits in a project contract on-chain.
 * Uses the SDK's embedded SAC spec, so no wasm is downloaded. Network,
 * RPC URL and USDC asset all come from the admin-panel-driven config.
 */
export async function getContractUsdcBalance(contractId: string): Promise<bigint> {
  const read = async (): Promise<bigint> => {
    const net = await getNetworkConfig()
    if (!net.usdcAsset) throw new Error('USDC asset not configured for this network')
    interface SacClient {
      balance(opts: { id: string }): Promise<{ result: bigint }>
    }
    const client = await contract.Client.from<SacClient>({
      contractId: net.usdcAsset,
      rpcUrl: net.rpcUrl,
      networkPassphrase: net.networkPassphrase,
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
