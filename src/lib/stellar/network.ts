import { Networks } from '@stellar/stellar-sdk'

export type StellarNetworkId = 'TESTNET' | 'PUBLIC'

export interface NetworkConfig {
  network: StellarNetworkId
  networkPassphrase: string
  rpcUrl: string
  horizonUrl: string
  /** USDC Stellar Asset Contract id for the active network. */
  usdcAsset: string
}

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3001'

const DEFAULTS: Record<StellarNetworkId, Omit<NetworkConfig, 'network' | 'networkPassphrase'>> = {
  TESTNET: {
    rpcUrl: 'https://soroban-testnet.stellar.org',
    horizonUrl: 'https://horizon-testnet.stellar.org',
    usdcAsset: 'CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA',
  },
  PUBLIC: {
    rpcUrl: 'https://soroban-rpc.publicnode.com',
    horizonUrl: 'https://horizon.stellar.org',
    // Mainnet USDC asset id has no default — the admin must set it in the
    // panel when switching to live.
    usdcAsset: '',
  },
}

const CACHE_TTL_MS = 60_000

let cached: { config: NetworkConfig; at: number } | null = null

/**
 * Live Stellar network configuration, driven by the admin panel (stored in
 * platform_settings, served by GET /api/admin/settings). The NEXT_PUBLIC_*
 * env vars are only a fallback for when the API is unreachable, so flipping
 * TESTNET↔PUBLIC from the panel needs no redeploys.
 */
export async function getNetworkConfig(): Promise<NetworkConfig> {
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.config

  let config: NetworkConfig | null = null
  try {
    const res = await fetch(`${BACKEND}/api/admin/settings`, { cache: 'no-store' })
    if (res.ok) {
      const data = (await res.json()) as {
        settings?: {
          stellar_network?: string
          soroban_rpc_url?: string | null
          usdc_asset?: string | null
        }
      }
      const s = data.settings
      if (s) {
        const network: StellarNetworkId = s.stellar_network === 'PUBLIC' ? 'PUBLIC' : 'TESTNET'
        const d = DEFAULTS[network]
        config = {
          network,
          networkPassphrase: network === 'PUBLIC' ? Networks.PUBLIC : Networks.TESTNET,
          rpcUrl: s.soroban_rpc_url || d.rpcUrl,
          horizonUrl: d.horizonUrl,
          usdcAsset: s.usdc_asset || d.usdcAsset,
        }
      }
    }
  } catch {
    // Fall through to env defaults below.
  }

  if (!config) config = envFallbackConfig()
  cached = { config, at: Date.now() }
  return config
}

/** Drop the cache (e.g. right after the admin panel saves network changes). */
export function invalidateNetworkConfig(): void {
  cached = null
}

function envFallbackConfig(): NetworkConfig {
  const network: StellarNetworkId =
    process.env.NEXT_PUBLIC_STELLAR_NETWORK === 'PUBLIC' ? 'PUBLIC' : 'TESTNET'
  const d = DEFAULTS[network]
  return {
    network,
    networkPassphrase: network === 'PUBLIC' ? Networks.PUBLIC : Networks.TESTNET,
    rpcUrl: process.env.NEXT_PUBLIC_SOROBAN_RPC_URL || d.rpcUrl,
    horizonUrl: d.horizonUrl,
    usdcAsset:
      process.env.NEXT_PUBLIC_USDC_SAC_TESTNET || d.usdcAsset,
  }
}
