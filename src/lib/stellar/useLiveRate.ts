'use client'

import { useCallback, useEffect, useState } from 'react'
import { getXlmUsdcRate, getXlmUsdcRateFresh, RATE_QUOTE_TTL_MS } from './usdc'

export interface LiveRate {
  /** Latest live XLM→USDC rate, or null while loading / on failure. */
  rate: number | null
  /** True until a rate exists AND it is younger than RATE_QUOTE_TTL_MS. */
  stale: boolean
  /** Seconds since the rate was fetched (null while loading). */
  ageSec: number | null
  /** Seconds left before the quote expires (null while loading/stale). */
  ttlSec: number | null
  /** Both live sources failed — no rate available. */
  error: boolean
  refreshing: boolean
  /** Force a fresh network read; resolves the rate (or null on failure). */
  refresh: () => Promise<number | null>
}

/**
 * Live XLM→USDC rate with an expiry clock. The quote times out after
 * RATE_QUOTE_TTL_MS so a user who sits on the dialog can't pledge at a
 * stale price — the UI must refresh before submitting.
 */
export function useLiveRate(active: boolean): LiveRate {
  const [rate, setRate] = useState<number | null>(null)
  const [fetchedAt, setFetchedAt] = useState<number | null>(null)
  const [error, setError] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  // 1s heartbeat so the countdown re-renders.
  const [, setTick] = useState(0)

  const refresh = useCallback(async (): Promise<number | null> => {
    setRefreshing(true)
    setError(false)
    try {
      const r = await getXlmUsdcRateFresh()
      if (r == null) {
        setError(true)
        setRate(null)
        setFetchedAt(null)
      } else {
        setRate(r)
        setFetchedAt(Date.now())
      }
      return r
    } finally {
      setRefreshing(false)
    }
  }, [])

  // Fetch once when the quote becomes relevant.
  useEffect(() => {
    if (!active) return
    let cancelled = false
    getXlmUsdcRate().then((r) => {
      if (cancelled) return
      if (r == null) {
        setError(true)
      } else {
        setRate(r)
        setFetchedAt(Date.now())
      }
    })
    return () => {
      cancelled = true
    }
  }, [active])

  useEffect(() => {
    if (!active) return
    const id = setInterval(() => setTick((t) => t + 1), 1000)
    return () => clearInterval(id)
  }, [active])

  const ageSec = fetchedAt != null ? Math.floor((Date.now() - fetchedAt) / 1000) : null
  const stale = rate == null || fetchedAt == null || Date.now() - fetchedAt > RATE_QUOTE_TTL_MS
  const ttlSec = fetchedAt != null && rate != null
    ? Math.max(0, Math.ceil((RATE_QUOTE_TTL_MS - (Date.now() - fetchedAt)) / 1000))
    : null

  return { rate, stale, ageSec, ttlSec, error, refreshing, refresh }
}
