/** Shared USDC helpers — safe to import from both server and client code. */

import { getNetworkConfig } from './network'

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
 * Live XLM→USDC rate. Tries, in order:
 *   1. The Stellar testnet DEX orderbook for USDC/XLM (best bid/ask midpoint)
 *      using the project's USDC issuer.
 *   2. The live XLM market price (CoinGecko) — USDC tracks $1, so the
 *      XLM→USD price is a sound XLM→USDC estimate whenever the testnet
 *      orderbook has no liquidity (which is most of the time).
 *   3. NEXT_PUBLIC_XLM_USDC_RATE, then a fixed default.
 * Client-safe — used by the fund dialog for instant conversion previews,
 * while the on-chain transfer always settles in USDC.
 *
 * The result is cached for RATE_CACHE_TTL_MS so opening the fund dialog
 * repeatedly doesn't hammer the APIs; use getXlmUsdcRateFresh() to force a
 * network read.
 */
const RATE_CACHE_TTL_MS = 60_000

let cachedRate: { value: number; at: number } | null = null

export async function getXlmUsdcRate(): Promise<number> {
  if (cachedRate && Date.now() - cachedRate.at < RATE_CACHE_TTL_MS) {
    return cachedRate.value
  }
  const value = await fetchXlmUsdcRate()
  cachedRate = { value, at: Date.now() }
  return value
}

/** Bypasses the TTL cache and re-reads the live rate. */
export async function getXlmUsdcRateFresh(): Promise<number> {
  const value = await fetchXlmUsdcRate()
  cachedRate = { value, at: Date.now() }
  return value
}

async function fetchXlmUsdcRate(): Promise<number> {
  const fallback = Number(process.env.NEXT_PUBLIC_XLM_USDC_RATE) || 0.12

  const dex = await fetchOrderbookRate()
  if (dex != null) return dex

  const market = await fetchMarketRate()
  if (market != null) return market

  return fallback
}

/** Classic-asset USDC issuers per network (the DEX orderbook is keyed by issuer). */
const USDC_ISSUER = {
  TESTNET: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
  PUBLIC: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
} as const

/** Midpoint of the live USDC/XLM orderbook, or null when there's no liquidity. */
async function fetchOrderbookRate(): Promise<number | null> {
  const net = await getNetworkConfig()
  const url =
    `${net.horizonUrl}/order_book` +
    `?selling_asset_type=native` +
    `&buying_asset_type=credit_alphanum4` +
    `&buying_asset_code=USDC` +
    `&buying_asset_issuer=${USDC_ISSUER[net.network]}`

  try {
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) return null
    const data = (await res.json()) as { bids?: { price: string }[]; asks?: { price: string }[] }
    const bid = Number(data.bids?.[0]?.price)
    const ask = Number(data.asks?.[0]?.price)
    if (Number.isFinite(bid) && Number.isFinite(ask) && bid > 0 && ask > 0) {
      return (bid + ask) / 2
    }
    if (Number.isFinite(bid) && bid > 0) return bid
    return null
  } catch {
    return null
  }
}

/** Live XLM market price in USD (≈ USDC, since USDC tracks $1). */
async function fetchMarketRate(): Promise<number | null> {
  try {
    const res = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=stellar&vs_currencies=usd',
      { cache: 'no-store' }
    )
    if (!res.ok) return null
    const data = (await res.json()) as { stellar?: { usd?: number } }
    const price = data.stellar?.usd
    if (Number.isFinite(price) && (price as number) > 0) return price as number
    return null
  } catch {
    return null
  }
}
