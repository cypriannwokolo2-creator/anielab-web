import {
  isConnected,
  requestAccess,
  getAddress,
  signMessage as freighterSignMessage,
} from '@stellar/freighter-api'

export interface SignatureResult {
  /** SEP-30 SIWS payload (base64) — preferred */
  signedMessage?: string
  /** Bare Ed25519 signature (base64) — fallback */
  signature?: string
}

export interface WalletAdapter {
  id: string
  name: string
  isAvailable(): Promise<boolean>
  getPublicKey(): Promise<string>
  signMessage(message: string): Promise<SignatureResult>
}

/* ------------------------------------------------------------------ */
/* Freighter — official extension API                                  */
/* ------------------------------------------------------------------ */

export const freighterAdapter: WalletAdapter = {
  id: 'freighter',
  name: 'Freighter',
  async isAvailable() {
    try {
      const connected = await isConnected()
      return connected.isConnected
    } catch {
      return false
    }
  },
  async getPublicKey() {
    const connected = await isConnected()
    if (!connected.isConnected) throw new Error('Freighter extension not detected')
    await requestAccess()
    const { address } = await getAddress()
    return address
  },
  async signMessage(message) {
    const res = await freighterSignMessage(message)
    if (!res.signedMessage) throw new Error('No signature returned from Freighter')
    return {
      signedMessage:
        typeof res.signedMessage === 'string'
          ? res.signedMessage
          : res.signedMessage.toString('base64'),
    }
  },
}

/* ------------------------------------------------------------------ */
/* Rabet — injected window.rabet (SDK-less)                            */
/* ------------------------------------------------------------------ */

interface RabetWallet {
  connect?: () => Promise<{ address?: string; publicKey?: string } | string>
  signMessage?: (
    message: string,
    opts?: { network?: string }
  ) => Promise<{ signedMessage?: string; signature?: string } | string>
}

interface RabetGlobal {
  wallet?: RabetWallet
  connect?: RabetWallet['connect']
  signMessage?: RabetWallet['signMessage']
}

function rabetGlobal(): RabetGlobal | undefined {
  if (typeof window === 'undefined') return undefined
  return (window as unknown as { rabet?: RabetGlobal }).rabet
}

export const rabetAdapter: WalletAdapter = {
  id: 'rabet',
  name: 'Rabet',
  async isAvailable() {
    const r = rabetGlobal()
    return !!(r && (r.wallet || r.connect) && (r.wallet?.signMessage || r.signMessage))
  },
  async getPublicKey() {
    const r = rabetGlobal()
    if (!r) throw new Error('Rabet extension not detected')
    const wallet = r.wallet ?? r
    if (!wallet.connect) throw new Error('Rabet not ready')
    const res = await wallet.connect()
    if (typeof res === 'string') return res
    return res?.address ?? res?.publicKey ?? ''
  },
  async signMessage(message) {
    const r = rabetGlobal()
    if (!r) throw new Error('Rabet extension not detected')
    const wallet = r.wallet ?? r
    if (!wallet.signMessage) throw new Error('Rabet does not support message signing')
    const res = await wallet.signMessage(message, { network: 'TESTNET' })
    if (typeof res === 'string') return { signedMessage: res }
    if (res?.signedMessage) return { signedMessage: res.signedMessage }
    if (res?.signature) return { signature: res.signature }
    throw new Error('No signature returned from Rabet')
  },
}

/* ------------------------------------------------------------------ */
/* LOBSTR — injected window.lobstr (SDK-less)                          */
/* ------------------------------------------------------------------ */

interface LobstrGlobal {
  connect?: () => Promise<{ address?: string; publicKey?: string } | string>
  signMessage?: (
    message: string,
    opts?: { network?: string }
  ) => Promise<{ signedMessage?: string; signature?: string } | string>
}

function lobstrGlobal(): LobstrGlobal | undefined {
  if (typeof window === 'undefined') return undefined
  return (window as unknown as { lobstr?: LobstrGlobal }).lobstr
}

export const lobstrAdapter: WalletAdapter = {
  id: 'lobstr',
  name: 'LOBSTR',
  async isAvailable() {
    const l = lobstrGlobal()
    return !!(l && l.connect && l.signMessage)
  },
  async getPublicKey() {
    const l = lobstrGlobal()
    if (!l || !l.connect) throw new Error('LOBSTR extension not detected')
    const res = await l.connect()
    if (typeof res === 'string') return res
    return res?.address ?? res?.publicKey ?? ''
  },
  async signMessage(message) {
    const l = lobstrGlobal()
    if (!l || !l.signMessage) throw new Error('LOBSTR does not support message signing')
    const res = await l.signMessage(message, { network: 'TESTNET' })
    if (typeof res === 'string') return { signedMessage: res }
    if (res?.signedMessage) return { signedMessage: res.signedMessage }
    if (res?.signature) return { signature: res.signature }
    throw new Error('No signature returned from LOBSTR')
  },
}

/* ------------------------------------------------------------------ */

export const wallets: WalletAdapter[] = [freighterAdapter, rabetAdapter, lobstrAdapter]

export function getWallet(id: string): WalletAdapter | undefined {
  return wallets.find((w) => w.id === id)
}

export async function detectAvailableWallets(): Promise<WalletAdapter[]> {
  const results = await Promise.all(
    wallets.map(async (w) => ({ wallet: w, available: await w.isAvailable() }))
  )
  return results.filter((r) => r.available).map((r) => r.wallet)
}
