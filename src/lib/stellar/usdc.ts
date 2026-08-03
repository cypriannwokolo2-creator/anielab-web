/** Shared USDC helpers — safe to import from both server and client code. */

export const USDC_DECIMALS = 7n
export const XLM_DECIMALS = 7n

/** Raw 7-decimal USDC units → "1,234.56" */
export function formatUsdc(raw: bigint): string {
  const value = Number(raw) / 1e7
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function usdcPercent(funded: bigint, goal: bigint): number {
  if (goal <= 0n) return 0
  const pct = (Number(funded) / Number(goal)) * 100
  return Math.min(100, Math.max(0, Math.round(pct * 10) / 10))
}

/** Human amount for a pledge input (USDC string) → raw 7-decimal units. */
export function usdcToRaw(input: string): bigint | null {
  const value = Number(input)
  if (!Number.isFinite(value) || value <= 0) return null
  return BigInt(Math.round(value * 1e7))
}

/** Human amount for a pledge input (XLM string) → raw 7-decimal units. */
export function xlmToRaw(input: string): bigint | null {
  const value = Number(input)
  if (!Number.isFinite(value) || value <= 0) return null
  return BigInt(Math.round(value * 1e7))
}

export type PledgeCurrency = 'XLM' | 'USDC'

/**
 * Converts a human pledge input (in either XLM or USDC) into raw USDC units.
 * The transaction on-chain is always USDC — if the user funds in XLM we
 * convert to its USDC equivalent at the given rate first.
 */
export function pledgeToUsdcRaw(
  input: string,
  currency: PledgeCurrency,
  xlmUsdcRate: number
): bigint | null {
  if (currency === 'USDC') return usdcToRaw(input)
  const value = Number(input)
  if (!Number.isFinite(value) || value <= 0) return null
  const usdc = value * xlmUsdcRate
  if (!Number.isFinite(usdc) || usdc <= 0) return null
  return BigInt(Math.round(usdc * 1e7))
}

/** Formats a raw XLM amount as "1,234.5678" */
export function formatXlm(raw: bigint): string {
  const value = Number(raw) / 1e7
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  })
}

/**
 * Live XLM→USDC rate. Tries the Stellar testnet DEX orderbook (best bid/ask
 * midpoint for USDC/XLM) and falls back to NEXT_PUBLIC_XLM_USDC_RATE, then a
 * fixed default. Client-safe — used by the fund dialog for instant conversion
 * previews, while the on-chain transfer always settles in USDC.
 */
export async function getXlmUsdcRate(): Promise<number> {
  const fallback = Number(process.env.NEXT_PUBLIC_XLM_USDC_RATE) || 0.12

  const issuer = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5'
  const url =
    `https://horizon-testnet.stellar.org/order_book` +
    `?selling_asset_type=native` +
    `&buying_asset_type=credit_alphanum4` +
    `&buying_asset_code=USDC` +
    `&buying_asset_issuer=${issuer}`

  try {
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) return fallback
    const data = (await res.json()) as { bids?: { price: string }[]; asks?: { price: string }[] }
    const bid = Number(data.bids?.[0]?.price)
    const ask = Number(data.asks?.[0]?.price)
    if (Number.isFinite(bid) && Number.isFinite(ask) && bid > 0 && ask > 0) {
      return (bid + ask) / 2
    }
    if (Number.isFinite(bid) && bid > 0) return bid
    return fallback
  } catch {
    return fallback
  }
}
