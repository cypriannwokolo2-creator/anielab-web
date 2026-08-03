/** Shared USDC helpers — safe to import from both server and client code. */

export const USDC_DECIMALS = 7n

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
