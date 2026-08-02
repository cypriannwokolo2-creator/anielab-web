import { create } from 'zustand'
import { connectFreighter, getNetworkDetails, signMessage } from './freighter'
import { createClient } from '@/lib/supabase/client'

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3001'

export interface AuthSession {
  accessToken: string
  user: { id: string; stellar_address: string; auth_method: string } | null
}

interface WalletState {
  address: string | null
  network: string | null
  status: 'disconnected' | 'connecting' | 'connected'
  authStatus: 'idle' | 'signing' | 'authenticated'
  error: string | null
  session: AuthSession | null
  connect: () => Promise<void>
  signIn: () => Promise<void>
  signOut: () => Promise<void>
  disconnect: () => void
}

export const useWalletStore = create<WalletState>((set, get) => ({
  address: null,
  network: null,
  status: 'disconnected',
  authStatus: 'idle',
  error: null,
  session: null,

  connect: async () => {
    set({ status: 'connecting', error: null })
    try {
      const address = await connectFreighter()
      const network = await getNetworkDetails()
      set({ address, network: network.network, status: 'connected' })
    } catch (err) {
      set({
        status: 'disconnected',
        error: err instanceof Error ? err.message : 'Failed to connect wallet',
      })
    }
  },

  // Wallet auth: challenge → sign message in Freighter → verify on backend.
  // Backend mints a Supabase-compatible session token; we hand it to
  // supabase-js so RLS and getUser() work for wallet users exactly like
  // email users.
  signIn: async () => {
    set({ authStatus: 'signing', error: null })
    try {
      let address = get().address
      if (!address) {
        address = await connectFreighter()
        set({ address, status: 'connected' })
      }

      const challengeRes = await fetch(`${BACKEND}/api/auth/challenge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stellarAddress: address }),
      })
      const challenge = await challengeRes.json()
      if (!challengeRes.ok) throw new Error(challenge.error ?? 'Challenge failed')

      const res = await signMessage(challenge.message)
      if (!res.signedMessage) throw new Error('No signature — did you approve the message in Freighter?')
      // Freighter v3 returns a Buffer, v4 (SEP-30 SIWS) a base64 string
      const signedMessage =
        typeof res.signedMessage === 'string'
          ? res.signedMessage
          : res.signedMessage.toString('base64')

      const verifyRes = await fetch(`${BACKEND}/api/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stellarAddress: address,
          nonce: challenge.nonce,
          signedMessage,
        }),
      })
      const result = await verifyRes.json()
      if (!verifyRes.ok) throw new Error(result.error ?? 'Verification failed')

      const supabase = createClient()
      await supabase.auth.setSession({
        access_token: result.accessToken,
        refresh_token: 'placeholder-refresh-token',
      })

      set({
        session: { accessToken: result.accessToken, user: result.user },
        authStatus: 'authenticated',
        status: 'connected',
      })
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Sign-in failed',
        authStatus: 'idle',
      })
    }
  },

  signOut: async () => {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
    } catch {
      // ignore — session is cleared regardless
    }
    set({ session: null, authStatus: 'idle', address: null, status: 'disconnected', error: null })
  },

  disconnect: () =>
    set({ address: null, network: null, status: 'disconnected', authStatus: 'idle', session: null, error: null }),
}))
