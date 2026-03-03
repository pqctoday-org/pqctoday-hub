// SPDX-License-Identifier: GPL-3.0-only
import type { Key, LogEntry } from '../../../types'
import * as MLDSA from '../../../wasm/liboqs_dsa'
import * as LIBOQS_SIG from '../../../wasm/liboqs_sig'
import * as WebCrypto from '../../../utils/webCrypto'
import { bytesToHex, hexToBytes } from '../../../utils/dataInputUtils'
import type { ExecutionMode } from '../PlaygroundContext'
import { openSSLService } from '../../../services/crypto/OpenSSLService'
import { secp256k1 } from '@noble/curves/secp256k1.js'
import { sha256 } from '@noble/hashes/sha2.js'

// Helper to detect which signing module to use
const isLiboqsSigAlgorithm = (algo: string): boolean =>
  algo.startsWith('SLH-DSA') || algo.startsWith('FN-DSA') || algo.startsWith('Falcon')

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

      // 2. Check algorithm category
      const isWebCryptoClassical =
        selectedKey &&
        (selectedKey.algorithm.startsWith('RSA') ||
          selectedKey.algorithm.startsWith('ECDSA') ||
          selectedKey.algorithm === 'Ed25519')
      const isOpenSSLClassical = selectedKey && selectedKey.algorithm === 'Ed448'
      const isNobleClassical = selectedKey && selectedKey.algorithm === 'secp256k1'

      if (isNobleClassical && selectedKey) {
        // --- secp256k1 OPERATIONS (@noble/curves) ---
        const messageBytes = new TextEncoder().encode(dataToSign)
        const msgHash = sha256(messageBytes)

        if (type === 'sign') {
          if (!selectedKey.data || !(selectedKey.data instanceof Uint8Array))
            throw new Error('Invalid key data for secp256k1 operation')

          const sigBytes = secp256k1.sign(msgHash, selectedKey.data)

          const end = performance.now()
          setSignature(bytesToHex(sigBytes))
          addLog({
            keyLabel: selectedKey.name,
            operation: 'Sign (secp256k1)',
            result: `Signature: ${sigBytes.length} bytes`,
            executionTime: end - start,
          })
        } else if (type === 'verify') {
          if (!selectedKey.data || !(selectedKey.data instanceof Uint8Array))
            throw new Error('Invalid key data for secp256k1 operation')
          if (!signature) throw new Error('No signature available. Run Sign first.')

          const sigBytes = hexToBytes(signature)
          const isValid = secp256k1.verify(sigBytes, msgHash, selectedKey.data)

          const end = performance.now()
          setVerificationResult(isValid)
          addLog({
            keyLabel: selectedKey.name,
            operation: 'Verify (secp256k1)',
            result: isValid ? '✓ VALID' : '✗ INVALID',
            executionTime: end - start,
          })
        }
      } else if (isOpenSSLClassical && selectedKey) {
        // --- Ed448 OPERATIONS (OpenSSL WASM) ---
        const messageBytes = new TextEncoder().encode(dataToSign)

        if (type === 'sign') {
          if (!selectedKey.data || !(selectedKey.data instanceof Uint8Array))
            throw new Error('Invalid key data for Ed448 operation')

          await openSSLService.init()
          const result = await openSSLService.execute(
            'pkeyutl -sign -inkey priv.pem -rawin -in msg.bin -out sig.bin',
            [
              { name: 'priv.pem', data: selectedKey.data },
              { name: 'msg.bin', data: messageBytes },
            ]
          )
          const sigFile = result.files.find((f) => f.name === 'sig.bin')
          if (!sigFile) throw new Error('Ed448 signing failed — no signature output')

          const end = performance.now()
          setSignature(bytesToHex(sigFile.data))
          addLog({
            keyLabel: selectedKey.name,
            operation: 'Sign (Ed448 OpenSSL)',
            result: `Signature: ${sigFile.data.length} bytes`,
            executionTime: end - start,
          })
        } else if (type === 'verify') {
          if (!selectedKey.data || !(selectedKey.data instanceof Uint8Array))
            throw new Error('Invalid key data for Ed448 operation')
          if (!signature) throw new Error('No signature available. Run Sign first.')

          await openSSLService.init()
          const sigBytes = hexToBytes(signature)
          const result = await openSSLService.execute(
            'pkeyutl -verify -pubin -inkey pub.pem -rawin -in msg.bin -sigfile sig.bin',
            [
              { name: 'pub.pem', data: selectedKey.data },
              { name: 'msg.bin', data: messageBytes },
              { name: 'sig.bin', data: sigBytes },
            ]
          )
          const isValid = result.stdout.includes('Signature Verified Successfully')

          const end = performance.now()
          setVerificationResult(isValid)
          addLog({
            keyLabel: selectedKey.name,
            operation: 'Verify (Ed448 OpenSSL)',
            result: isValid ? '✓ VALID' : '✗ INVALID',
            executionTime: end - start,
          })
        }
      } else if (isWebCryptoClassical && selectedKey) {
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
          let signatureBytes: Uint8Array

          if (key.algorithm.startsWith('LMS-')) {
            // LMS via dedicated LMS WASM module (stateful — private key updates)
            const { lmsService } = await import('../../../wasm/LmsService')
            const result = await lmsService.sign(key.data, messageBytes)
            signatureBytes = result.signature
            // Update the private key in keystore (LMS is stateful)
            key.data = result.updatedPrivateKey
          } else if (isLiboqsSigAlgorithm(key.algorithm)) {
            signatureBytes = await LIBOQS_SIG.sign(messageBytes, key.data, key.algorithm)
          } else {
            signatureBytes = await MLDSA.sign(messageBytes, key.data)
          }

          setSignature(bytesToHex(signatureBytes))

          const end = performance.now()

          addLog({
            keyLabel: key.name,
            operation: `Sign (${key.algorithm.startsWith('LMS-') ? 'LMS WASM' : isLiboqsSigAlgorithm(key.algorithm) ? 'liboqs' : 'WASM'})`,
            result: `Signature: ${signatureBytes.length} bytes`,
            executionTime: end - start,
          })
        } else if (type === 'verify') {
          const key = keyStore.find((k) => k.id === selectedVerifyKeyId)
          if (!key) throw new Error('Please select a Public Key')

          if (!key.data || !(key.data instanceof Uint8Array))
            throw new Error('Selected key has invalid data format (expected Uint8Array)')
          if (!signature) throw new Error('No signature available. Run Sign first.')

          const messageBytes = new TextEncoder().encode(dataToSign)
          let isValid: boolean

          if (key.algorithm.startsWith('LMS-')) {
            // LMS verify via dedicated WASM module
            const { lmsService } = await import('../../../wasm/LmsService')
            isValid = await lmsService.verify(key.data, messageBytes, hexToBytes(signature))
          } else if (isLiboqsSigAlgorithm(key.algorithm)) {
            isValid = await LIBOQS_SIG.verify(
              hexToBytes(signature),
              messageBytes,
              key.data,
              key.algorithm
            )
          } else {
            isValid = await MLDSA.verify(hexToBytes(signature), messageBytes, key.data)
          }

          const end = performance.now()
          setVerificationResult(isValid)

          addLog({
            keyLabel: key.name,
            operation: `Verify (${isLiboqsSigAlgorithm(key.algorithm) ? 'liboqs' : 'WASM'})`,
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
