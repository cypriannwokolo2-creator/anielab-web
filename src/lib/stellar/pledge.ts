import 'client-only'
import { contract } from '@stellar/stellar-sdk'
import type { AssembledTransaction } from '@stellar/stellar-sdk/contract'
import { signTransactionWith } from './wallets'

const RPC_URL =
  process.env.NEXT_PUBLIC_SOROBAN_RPC_URL || 'https://soroban-testnet.stellar.org'

/** Test SDF Network ; September 2015 */
const NETWORK_PASSPHRASE = 'Test SDF Network ; September 2015'

/** USDC Stellar Asset Contract on testnet. */
const USDC_SAC =
  process.env.NEXT_PUBLIC_USDC_SAC_TESTNET ||
  'CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA'

interface SacClient {
  transfer(opts: { from: string; to: string; amount: bigint }): Promise<AssembledTransaction<unknown>>
}

/**
 * Sends a pledge: transfers `amountUsdc` (raw units) of USDC from the user's
 * wallet straight into the project contract. Whatever the user funded in (XLM
 * or USDC), this is always a USDC transfer on-chain — the conversion happens
 * before we build the transaction.
 */
export async function sendUsdcPledge(opts: {
  providerId: string
  publicKey: string
  toContractId: string
  amountUsdc: bigint
}): Promise<{ hash: string | null; toXdr: string }> {
  const { providerId, publicKey, toContractId, amountUsdc } = opts

  const client = await contract.Client.from<SacClient>({
    contractId: USDC_SAC,
    rpcUrl: RPC_URL,
    networkPassphrase: NETWORK_PASSPHRASE,
    publicKey,
    signTransaction: async (xdr, signOpts) => {
      const res = await signTransactionWith(
        providerId,
        xdr,
        signOpts?.networkPassphrase ?? NETWORK_PASSPHRASE
      )
      return { signedTxXdr: res.signedTxXdr, signerAddress: res.signerAddress }
    },
  })

  const tx = await client.transfer({ from: publicKey, to: toContractId, amount: amountUsdc })
  const toXdr = tx.toXDR()
  const sent = await tx.signAndSend()
  const response = sent.getTransactionResponse
  const hash =
    response && 'hash' in response && typeof response.hash === 'string'
      ? response.hash
      : null
  return { hash, toXdr }
}
