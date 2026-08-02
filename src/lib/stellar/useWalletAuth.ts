import { create } from 'zustand'
import { connectFreighter, getNetworkDetails } from './freighter'

interface WalletState {
  address: string | null
  network: string | null
  status: 'disconnected' | 'connecting' | 'connected'
  error: string | null
  connect: () => Promise<void>
  disconnect: () => void
}

export const useWalletStore = create<WalletState>((set) => ({
  address: null,
  network: null,
  status: 'disconnected',
  error: null,
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
  disconnect: () =>
    set({ address: null, network: null, status: 'disconnected', error: null }),
}))
