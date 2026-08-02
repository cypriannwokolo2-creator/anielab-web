import {
  isConnected,
  requestAccess,
  getAddress,
  getNetwork,
  signTransaction,
  signMessage,
} from '@stellar/freighter-api'

export async function connectFreighter() {
  const connected = await isConnected()
  if (!connected.isConnected) {
    throw new Error('Freighter extension not detected')
  }
  await requestAccess()
  const { address } = await getAddress()
  return address
}

export async function getNetworkDetails() {
  return getNetwork()
}

export { signTransaction, signMessage }
