import type { Key, LogEntry } from '../../../types'
import * as MLDSA from '../../../wasm/liboqs_dsa'
import * as WebCrypto from '../../../utils/webCrypto'
import { bytesToHex, hexToBytes } from '../../../utils/dataInputUtils'
import type { ExecutionMode } from '../PlaygroundContext'

interface UseDsaOperationsProps {
  keyStore: Key[]
  selectedSignKeyId: string
  selectedVerifyKeyId: string
  executionMode: ExecutionMode
  wasmLoaded: boolean
  dataToSign: string
  signature: string
  setSignature: (val: string) => void
  setVerificationResult: (val: boolean | null) => void
  addLog: (entry: Omit<LogEntry, 'id' | 'timestamp'>) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export const useDsaOperations = ({
  keyStore,
  selectedSignKeyId,
  selectedVerifyKeyId,
  executionMode,
  wasmLoaded,
  dataToSign,
  signature,
  setSignature,
  setVerificationResult,
  addLog,
  setLoading,
  setError,
}: UseDsaOperationsProps) => {
  const runDsaOperation = async (type: 'sign' | 'verify') => {
    setLoading(true)
    setError(null)
    const start = performance.now()

    try {
      // 1. Identify the key involved
      let selectedKey: Key | undefined
      if (type === 'sign') selectedKey = keyStore.find((k) => k.id === selectedSignKeyId)
      else if (type === 'verify') selectedKey = keyStore.find((k) => k.id === selectedVerifyKeyId)

      // 2. Check if Classical Algorithm
      const isClassical =
        selectedKey &&
        (selectedKey.algorithm.startsWith('RSA') ||
          selectedKey.algorithm.startsWith('ECDSA') ||
          selectedKey.algorithm === 'Ed25519')

      if (isClassical && selectedKey) {
        // --- CLASSICAL OPERATIONS (Web Crypto) ---
        if (type === 'sign') {
          if (!selectedKey.data || !(selectedKey.data instanceof CryptoKey))
            throw new Error('Invalid key data for Web Crypto operation')

          const messageBytes = new TextEncoder().encode(dataToSign)
          let signature: Uint8Array

          if (selectedKey.algorithm.startsWith('RSA')) {
            signature = await WebCrypto.signRSA(selectedKey.data, messageBytes)
          } else if (selectedKey.algorithm.startsWith('ECDSA')) {
            signature = await WebCrypto.signECDSA(selectedKey.data, messageBytes)
          } else {
            signature = await WebCrypto.signEd25519(selectedKey.data, messageBytes)
          }

          const end = performance.now()
          setSignature(bytesToHex(signature))
          addLog({
            keyLabel: selectedKey.name,
            operation: `Sign (${selectedKey.algorithm})`,
            result: `Signature: ${signature.length} bytes`,
            executionTime: end - start,
          })
        } else if (type === 'verify') {
          if (!selectedKey.data || !(selectedKey.data instanceof CryptoKey))
            throw new Error('Invalid key data for Web Crypto operation')
          if (!signature) throw new Error('No signature available. Run Sign first.')

          const messageBytes = new TextEncoder().encode(dataToSign)
          const signatureBytes = hexToBytes(signature)
          let isValid: boolean

          if (selectedKey.algorithm.startsWith('RSA')) {
            isValid = await WebCrypto.verifyRSA(selectedKey.data, signatureBytes, messageBytes)
          } else if (selectedKey.algorithm.startsWith('ECDSA')) {
            isValid = await WebCrypto.verifyECDSA(selectedKey.data, signatureBytes, messageBytes)
          } else {
            isValid = await WebCrypto.verifyEd25519(selectedKey.data, signatureBytes, messageBytes)
          }

          const end = performance.now()
          setVerificationResult(isValid)
          addLog({
            keyLabel: selectedKey.name,
            operation: `Verify (${selectedKey.algorithm})`,
            result: isValid ? '✓ VALID' : '✗ INVALID',
            executionTime: end - start,
          })
        }
      } else if (executionMode === 'wasm') {
        // WASM Mode Operations
        if (!wasmLoaded) throw new Error('WASM libraries not loaded')

        if (type === 'sign') {
          const key = keyStore.find((k) => k.id === selectedSignKeyId)
          if (!key) throw new Error('Please select a Private Key')

          if (!key.data || !(key.data instanceof Uint8Array))
            throw new Error('Selected key has invalid data format (expected Uint8Array)')

          const messageBytes = new TextEncoder().encode(dataToSign)
          const signature = await MLDSA.sign(messageBytes, key.data)

          setSignature(bytesToHex(signature))

          const end = performance.now()

          addLog({
            keyLabel: key.name,
            operation: 'Sign (WASM)',
            result: `Signature: ${signature.length} bytes`,
            executionTime: end - start,
          })
        } else if (type === 'verify') {
          const key = keyStore.find((k) => k.id === selectedVerifyKeyId)
          if (!key) throw new Error('Please select a Public Key')

          if (!key.data || !(key.data instanceof Uint8Array))
            throw new Error('Selected key has invalid data format (expected Uint8Array)')
          if (!signature) throw new Error('No signature available. Run Sign first.')

          const messageBytes = new TextEncoder().encode(dataToSign)
          const isValid = await MLDSA.verify(hexToBytes(signature), messageBytes, key.data)

          const end = performance.now()
          setVerificationResult(isValid)

          addLog({
            keyLabel: key.name,
            operation: 'Verify (WASM)',
            result: isValid ? '✓ VALID' : '✗ INVALID',
            executionTime: end - start,
          })
        }
      } else {
        // Mock Mode Operations
        await new Promise((resolve) => setTimeout(resolve, 500))
        const end = performance.now()

        if (type === 'sign') {
          const key = keyStore.find((k) => k.id === selectedSignKeyId)
          if (!key) throw new Error('Please select a Private Key')

          const newSignature = 'mock_signature_' + Math.random().toString(36).substring(7)
          setSignature(newSignature)

          addLog({
            keyLabel: key.name,
            operation: 'Sign (Mock)',
            result: 'Signature Generated',
            executionTime: end - start,
          })
        } else if (type === 'verify') {
          const key = keyStore.find((k) => k.id === selectedVerifyKeyId)
          if (!key) throw new Error('Please select a Public Key')
          if (!signature)
            throw new Error('No signature available. Run Sign first or enter a signature.')

          const isValid = signature.startsWith('mock_signature_') // Simple mock validation
          setVerificationResult(isValid)

          addLog({
            keyLabel: key.name,
            operation: 'Verify (Mock)',
            result: isValid ? '✓ VALID' : '✗ INVALID',
            executionTime: end - start,
          })
        }
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Operation failed'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return { runDsaOperation }
}
