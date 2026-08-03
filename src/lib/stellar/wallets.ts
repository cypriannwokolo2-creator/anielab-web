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

/**
 * The Stellar Wallets Kit — the modal that supports Freighter, Rabet, LOBSTR,
 * Albedo, xBull, Hana, HOT and (via WalletConnect) every SEP-43 mobile wallet.
 *
 * It is loaded lazily (dynamic import) so its heavy deps (@reown/appkit,
 * @walletconnect/sign-client) never execute during SSR.
 */
export const stellarKitId = 'stellar-kit'

import type * as Swk from '@creit.tech/stellar-wallets-kit'

type KitCore = {
  StellarWalletsKit: typeof Swk.StellarWalletsKit
  Networks: typeof Swk.Networks
}

let kitPromise: Promise<KitCore> | null = null
let kitInitialized = false

function loadKit(): Promise<KitCore> {
  if (kitPromise) return kitPromise
  const loaded = import('@creit.tech/stellar-wallets-kit') as unknown as Promise<KitCore>
  kitPromise = loaded
  return loaded
}

async function initKit(): Promise<KitCore> {
  const kit = await loadKit()
  if (kitInitialized) return kit

  const { defaultModules } = await import(
    '@creit.tech/stellar-wallets-kit/modules/utils'
  )
  let modules = defaultModules()
  const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
  if (projectId) {
    const { WalletConnectModule, WalletConnectTargetChain } = await import(
      '@creit.tech/stellar-wallets-kit/modules/wallet-connect'
    )
    modules = [
      ...modules,
      new WalletConnectModule({
        projectId,
        metadata: {
          name: 'AnieLab',
          description:
            'Co-create anime, comics & games — get paid exactly for your share.',
          url: typeof window !== 'undefined' ? window.location.origin : 'https://anielab.xyz',
          icons: [],
        },
        allowedChains: [WalletConnectTargetChain.TESTNET],
      }),
    ]
  }

  kit.StellarWalletsKit.init({
    modules,
    selectedWalletId: 'freighter',
    network: kit.Networks.TESTNET,
    authModal: { showInstallLabel: true },
  })
  kitInitialized = true
  return kit
}

/** Opens the kit's connect modal and resolves with the chosen address + wallet id. */
export async function connectWithKit(): Promise<{ address: string; walletId: string }> {
  const kit = await initKit()
  const { address } = await kit.StellarWalletsKit.authModal()
  const walletId = kit.StellarWalletsKit.selectedModule?.productId ?? stellarKitId
  return { address, walletId }
}

export async function kitSignMessage(message: string): Promise<SignatureResult> {
  const kit = await initKit()
  const { signedMessage } = await kit.StellarWalletsKit.signMessage(message, {
    networkPassphrase: kit.Networks.TESTNET,
  })
  return { signedMessage }
}

export async function kitGetNetwork(): Promise<{ network: string; networkPassphrase: string } | null> {
  try {
    const kit = await initKit()
    return await kit.StellarWalletsKit.getNetwork()
  } catch {
    return null
  }
}

export async function kitDisconnect(): Promise<void> {
  try {
    const kit = await initKit()
    await kit.StellarWalletsKit.disconnect()
  } catch {
    // ignore — session is cleared regardless
  }
}

/** Ensure a connection exists for the given provider and return its address. */
export async function ensureConnected(
  providerId: string
): Promise<{ address: string; walletId: string }> {
  if (providerId === stellarKitId) {
    return connectWithKit()
  }
  const wallet = getWallet(providerId)
  if (!wallet) throw new Error(`Unknown wallet: ${providerId}`)
  const address = await wallet.getPublicKey()
  return { address, walletId: providerId }
}

export async function signMessageWith(
  providerId: string,
  message: string
): Promise<SignatureResult> {
  if (providerId === stellarKitId) {
    return kitSignMessage(message)
  }
  const wallet = getWallet(providerId)
  if (!wallet) throw new Error(`Unknown wallet: ${providerId}`)
  return wallet.signMessage(message)
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

/** Quick-access extension wallets shown under the kit's "Connect any wallet" button. */
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
