import { create } from 'zustand'
import { getNetworkDetails } from './freighter'
import { getWallet, SignatureResult } from './wallets'
import { createClient } from '@/lib/supabase/client'

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3001'

export interface AuthSession {
  accessToken: string
  user: { id: string; stellar_address: string; auth_method: string } | null
}

interface WalletState {
  address: string | null
  network: string | null
  provider: string | null
  status: 'disconnected' | 'connecting' | 'connected'
  authStatus: 'idle' | 'signing' | 'authenticated'
  error: string | null
  session: AuthSession | null
  connect: (providerId: string) => Promise<void>
  signIn: (providerId: string) => Promise<void>
  signOut: () => Promise<void>
  disconnect: () => void
}

export const useWalletStore = create<WalletState>((set, get) => ({
  address: null,
  network: null,
  provider: null,
  status: 'disconnected',
  authStatus: 'idle',
  error: null,
  session: null,

  connect: async (providerId: string) => {
    const wallet = getWallet(providerId)
    if (!wallet) {
      set({ error: `Unknown wallet: ${providerId}` })
      return
    }
    set({ status: 'connecting', error: null })
    try {
      const address = await wallet.getPublicKey()
      let network: string | null = null
      if (providerId === 'freighter') {
        const details = await getNetworkDetails()
        network = details.network
      }
      set({ address, provider: providerId, network, status: 'connected' })
    } catch (err) {
      set({
        status: 'disconnected',
        error: err instanceof Error ? err.message : 'Failed to connect wallet',
      })
    }
  },

  // Wallet auth: challenge → sign message in the chosen wallet → verify on
  // backend. The backend mints a Supabase-compatible token; we hand it to
  // supabase-js so RLS and getUser() work for wallet users like email users.
  signIn: async (providerId: string) => {
    const wallet = getWallet(providerId)
    if (!wallet) {
      set({ error: `Unknown wallet: ${providerId}` })
      return
    }
    set({ authStatus: 'signing', error: null })
    try {
      let address = get().address
      let provider = get().provider
      if (!address || provider !== providerId) {
        address = await wallet.getPublicKey()
        provider = providerId
        set({ address, provider, status: 'connected' })
      }

      const challengeRes = await fetch(`${BACKEND}/api/auth/challenge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stellarAddress: address }),
      })
      const challenge = await challengeRes.json()
      if (!challengeRes.ok) throw new Error(challenge.error ?? 'Challenge failed')

      const sig: SignatureResult = await wallet.signMessage(challenge.message)

      const verifyRes = await fetch(`${BACKEND}/api/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stellarAddress: address,
          nonce: challenge.nonce,
          ...sig,
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
    set({
      address: null,
      network: null,
      provider: null,
      status: 'disconnected',
      authStatus: 'idle',
      session: null,
      error: null,
    }),
}))
