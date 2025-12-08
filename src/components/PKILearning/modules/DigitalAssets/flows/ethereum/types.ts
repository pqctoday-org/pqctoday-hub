export interface EthereumFlowState {
  rawPubKey: Uint8Array | null
  txHash: string | null
  signature: { r: bigint; s: bigint; recovery: number } | null
  recipientPublicKeyHex: string | null
  sourceAddress: string | null
  recipientAddress: string | null
  transactionData: {
    nonce: number
    gasPrice: string
    gasLimit: number
    to: string
    value: string
    data: string
    chainId: number
  } | null
  editableRecipientAddress: string
}

export interface EthereumFlowActions {
  setRawPubKey: (val: Uint8Array | null) => void
  setTxHash: (val: string | null) => void
  setSignature: (val: { r: bigint; s: bigint; recovery: number } | null) => void
  setRecipientPublicKeyHex: (val: string | null) => void
  setSourceAddress: (val: string | null) => void
  setRecipientAddress: (val: string | null) => void
  setTransactionData: (val: EthereumFlowState['transactionData']) => void
  setEditableRecipientAddress: (val: string) => void
}
