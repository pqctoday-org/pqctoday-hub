import { useReducer, useMemo } from 'react'
import type { EthereumFlowState, EthereumFlowActions } from '../flows/ethereum/types'

type Action =
  | { type: 'SET_RAW_PUB_KEY'; payload: Uint8Array | null }
  | { type: 'SET_TX_HASH'; payload: string | null }
  | { type: 'SET_SIGNATURE'; payload: { r: bigint; s: bigint; recovery: number } | null }
  | { type: 'SET_RECIPIENT_PUB_KEY_HEX'; payload: string | null }
  | { type: 'SET_SOURCE_ADDRESS'; payload: string | null }
  | { type: 'SET_RECIPIENT_ADDRESS'; payload: string | null }
  | { type: 'SET_TRANSACTION_DATA'; payload: EthereumFlowState['transactionData'] }
  | { type: 'SET_EDITABLE_RECIPIENT_ADDRESS'; payload: string }
  | { type: 'RESET' }

const initialState: EthereumFlowState = {
  rawPubKey: null,
  txHash: null,
  signature: null,
  recipientPublicKeyHex: null,
  sourceAddress: null,
  recipientAddress: null,
  transactionData: null,
  editableRecipientAddress: '',
}

function flowReducer(state: EthereumFlowState, action: Action): EthereumFlowState {
  switch (action.type) {
    case 'SET_RAW_PUB_KEY':
      return { ...state, rawPubKey: action.payload }
    case 'SET_TX_HASH':
      return { ...state, txHash: action.payload }
    case 'SET_SIGNATURE':
      return { ...state, signature: action.payload }
    case 'SET_RECIPIENT_PUB_KEY_HEX':
      return { ...state, recipientPublicKeyHex: action.payload }
    case 'SET_SOURCE_ADDRESS':
      return { ...state, sourceAddress: action.payload }
    case 'SET_RECIPIENT_ADDRESS':
      return { ...state, recipientAddress: action.payload }
    case 'SET_TRANSACTION_DATA':
      return { ...state, transactionData: action.payload }
    case 'SET_EDITABLE_RECIPIENT_ADDRESS':
      return { ...state, editableRecipientAddress: action.payload }
    case 'RESET':
      return initialState
    default:
      return state
  }
}

export function useFlowState() {
  const [state, dispatch] = useReducer(flowReducer, initialState)

  const actions: EthereumFlowActions = useMemo(
    () => ({
      setRawPubKey: (val) => dispatch({ type: 'SET_RAW_PUB_KEY', payload: val }),
      setTxHash: (val) => dispatch({ type: 'SET_TX_HASH', payload: val }),
      setSignature: (val) => dispatch({ type: 'SET_SIGNATURE', payload: val }),
      setRecipientPublicKeyHex: (val) =>
        dispatch({ type: 'SET_RECIPIENT_PUB_KEY_HEX', payload: val }),
      setSourceAddress: (val) => dispatch({ type: 'SET_SOURCE_ADDRESS', payload: val }),
      setRecipientAddress: (val) => dispatch({ type: 'SET_RECIPIENT_ADDRESS', payload: val }),
      setTransactionData: (val) => dispatch({ type: 'SET_TRANSACTION_DATA', payload: val }),
      setEditableRecipientAddress: (val) =>
        dispatch({ type: 'SET_EDITABLE_RECIPIENT_ADDRESS', payload: val }),
    }),
    []
  )

  return { state, actions, dispatch }
}
