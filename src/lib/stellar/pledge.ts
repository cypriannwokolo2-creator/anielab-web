import 'client-only'
import { contract } from '@stellar/stellar-sdk'
import type { AssembledTransaction } from '@stellar/stellar-sdk/contract'
import { signTransactionWith } from './wallets'
import { getNetworkConfig } from './network'

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

  const net = await getNetworkConfig()
  if (!net.usdcAsset) {
    throw new Error('USDC is not configured on the live network yet — try again later')
  }

  const client = await contract.Client.from<SacClient>({
    contractId: net.usdcAsset,
    rpcUrl: net.rpcUrl,
    networkPassphrase: net.networkPassphrase,
    publicKey,
    signTransaction: async (xdr, signOpts) => {
      const res = await signTransactionWith(
        providerId,
        xdr,
        signOpts?.networkPassphrase ?? net.networkPassphrase
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
