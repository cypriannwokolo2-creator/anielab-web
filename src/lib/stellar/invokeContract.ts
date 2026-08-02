import { rpc, Contract, TransactionBuilder, Networks, BASE_FEE, xdr } from '@stellar/stellar-sdk'

export const server = new rpc.Server(process.env.NEXT_PUBLIC_SOROBAN_RPC_URL!)

export const NETWORK_PASSPHRASE =
  process.env.NEXT_PUBLIC_STELLAR_NETWORK === 'PUBLIC'
    ? Networks.PUBLIC
    : Networks.TESTNET

export function getContract(contractId: string) {
  return new Contract(contractId)
}

// Reusable transaction builder for contract invocations
export async function buildContractTx(sourcePublicKey: string, operation: xdr.Operation) {
  const account = await server.getAccount(sourcePublicKey)
  return new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(operation)
    .setTimeout(30)
    .build()
}
