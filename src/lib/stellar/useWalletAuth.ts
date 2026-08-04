import { create } from 'zustand'
import { getNetworkDetails } from './freighter'
import {
  ensureConnected,
  kitDisconnect,
  kitGetNetwork,
  signMessageWith,
  stellarKitId,
} from './wallets'
import { createClient } from '@/lib/supabase/client'

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3001'

export interface AuthSession {
  accessToken: string
  refreshToken: string
  user: {
    id: string
    stellar_address: string
    auth_method: string
    email?: string | null
    display_name?: string | null
  } | null
}

interface WalletState {
  address: string | null
  network: string | null
  provider: string | null
  status: 'disconnected' | 'connecting' | 'connected'
  authStatus: 'idle' | 'signing' | 'authenticated'
  error: string | null
  session: AuthSession | null
  hydrated: boolean
  restoreSession: () => Promise<void>
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
  hydrated: false,

  // Restore a persisted Supabase session from cookies (set by @supabase/ssr
  // during verifyOtp) so a page refresh keeps the user signed in.
  restoreSession: async () => {
    try {
      const supabase = createClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (session?.user) {
        const meta = session.user.user_metadata as Record<string, unknown> | undefined
        const stellarAddress =
          typeof meta?.stellar_address === 'string' ? meta.stellar_address : ''
        set({
          session: {
            accessToken: session.access_token,
            refreshToken: session.refresh_token,
            user: {
              id: session.user.id,
              stellar_address: stellarAddress,
              auth_method:
                typeof meta?.auth_method === 'string' ? meta.auth_method : 'email',
              email: session.user.email,
              display_name:
                typeof meta?.display_name === 'string' ? meta.display_name : null,
            },
          },
          authStatus: 'authenticated',
          address: stellarAddress || null,
          status: 'connected',
        })
      }
    } catch {
      // ignore — treat as signed out
    } finally {
      set({ hydrated: true })
    }
  },

  connect: async (providerId: string) => {
    set({ status: 'connecting', error: null })
    try {
      const { address } = await ensureConnected(providerId)
      let network: string | null = null
      if (providerId === stellarKitId) {
        const details = await kitGetNetwork()
        network = details?.network ?? null
      } else if (providerId === 'freighter') {
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
  // backend. The backend verifies the signature and returns a magic-link
  // token; we exchange it for a real Supabase session (access + refresh
  // tokens) which @supabase/ssr persists as cookies, so RLS and getUser()
  // work for wallet users exactly like email users — including refresh.
  // providerId may be a specific extension ('freighter') or the Stellar
  // Wallets Kit ('stellar-kit'), which lets the user pick any wallet — Freighter,
  // Rabet, LOBSTR, xBull, Albedo, Hana, or WalletConnect.
  signIn: async (providerId: string) => {
    set({ authStatus: 'signing', error: null })
    try {
      let address = get().address
      let provider = get().provider
      if (!address || provider !== providerId) {
        const res = await ensureConnected(providerId)
        address = res.address
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

      const sig = await signMessageWith(providerId, challenge.message)

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
      const { data, error: otpError } = await supabase.auth.verifyOtp({
        type: 'magiclink',
        token_hash: result.tokenHash,
      })
      if (otpError) throw new Error(otpError.message)
      const session = data.session
      if (!session?.user) throw new Error('No session returned')

      const user = {
        id: session.user.id,
        stellar_address: address,
        auth_method: 'wallet',
        email: session.user.email,
      }

      set({
        session: {
          accessToken: session.access_token,
          refreshToken: session.refresh_token,
          user,
        },
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
    if (get().provider === stellarKitId) {
      await kitDisconnect()
    }
    set({ session: null, authStatus: 'idle', address: null, status: 'disconnected', error: null })
  },

  disconnect: () => {
    void kitDisconnect()
    set({
      address: null,
      network: null,
      provider: null,
      status: 'disconnected',
      authStatus: 'idle',
      session: null,
      error: null,
    })
  },
}))
