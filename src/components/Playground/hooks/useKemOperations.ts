import type { Key, LogEntry } from '../../../types'
import * as MLKEM from '../../../wasm/liboqs_kem'
import * as WebCrypto from '../../../utils/webCrypto'
import { bytesToHex, hexToBytes } from '../../../utils/dataInputUtils'
import type { ExecutionMode } from '../PlaygroundContext'
import { hkdfExtract } from '../../../utils/webCrypto'

interface UseKemOperationsProps {
  keyStore: Key[]
  selectedEncKeyId: string
  selectedDecKeyId: string
  isHybridMode: boolean
  secondaryEncKeyId: string
  secondaryDecKeyId: string
  executionMode: ExecutionMode
  wasmLoaded: boolean
  keySize: string
  sharedSecret: string
  ciphertext: string
  setSharedSecret: (val: string) => void
  setCiphertext: (val: string) => void
  setKemDecapsulationResult: (val: boolean | null) => void
  setDecapsulatedSecret: (val: string) => void
  addLog: (entry: Omit<LogEntry, 'id' | 'timestamp'>) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  hybridMethod: 'concat-hkdf' | 'concat'
  setPqcSharedSecret: (val: string) => void
  setClassicalSharedSecret: (val: string) => void
  setPqcRecoveredSecret: (val: string) => void
  setClassicalRecoveredSecret: (val: string) => void
}

export const useKemOperations = ({
  keyStore,
  selectedEncKeyId,
  selectedDecKeyId,
  isHybridMode,
  secondaryEncKeyId,
  secondaryDecKeyId,
  executionMode,
  wasmLoaded,
  keySize,
  sharedSecret,
  ciphertext,
  setSharedSecret,
  setCiphertext,
  setKemDecapsulationResult,
  setDecapsulatedSecret,
  addLog,
  setLoading,
  setError,
  hybridMethod,
  setPqcSharedSecret,
  setClassicalSharedSecret,
  setPqcRecoveredSecret,
  setClassicalRecoveredSecret,
}: UseKemOperationsProps) => {
  const runKemOperation = async (type: 'encapsulate' | 'decapsulate') => {
    setLoading(true)
    setError(null)
    const start = performance.now()

    try {
      // 1. Identify the key involved
      let selectedKey: Key | undefined
      if (type === 'encapsulate') selectedKey = keyStore.find((k) => k.id === selectedEncKeyId)
      else if (type === 'decapsulate') selectedKey = keyStore.find((k) => k.id === selectedDecKeyId)

      // 2. Check if Classical Algorithm
      const isClassical =
        selectedKey && (selectedKey.algorithm === 'X25519' || selectedKey.algorithm === 'P-256')

      if (isClassical && selectedKey) {
        // --- CLASSICAL OPERATIONS (Web Crypto) ---
        if (type === 'encapsulate') {
          // Clear previous decapsulation results
          setDecapsulatedSecret('')
          setKemDecapsulationResult(null)
          setPqcRecoveredSecret('')
          setClassicalRecoveredSecret('')

          if (!selectedKey.data || !(selectedKey.data instanceof CryptoKey))
            throw new Error('Invalid key data for Web Crypto operation')

          const ephemeralKeyPair =
            selectedKey.algorithm === 'X25519'
              ? await WebCrypto.generateX25519KeyPair()
              : await WebCrypto.generateECDHKeyPair()

          const sharedSecretBytes = await WebCrypto.deriveSharedSecret(
            ephemeralKeyPair.privateKey,
            selectedKey.data
          )
          const ciphertextHex = ephemeralKeyPair.publicKeyHex

          // Apply HKDF normalization if selected
          let finalSecret: Uint8Array = sharedSecretBytes
          if (hybridMethod === 'concat-hkdf') {
            finalSecret = await hkdfExtract(new Uint8Array(0), sharedSecretBytes, 'SHA-256')
          }

          setSharedSecret(bytesToHex(finalSecret))
          setCiphertext(ciphertextHex)

          const end = performance.now()
          addLog({
            keyLabel: selectedKey.name,
            operation: `Encapsulate (${selectedKey.algorithm})`,
            result: `Shared Secret: ${finalSecret.length}B, Ephemeral PK: ${ciphertextHex.length / 2}B`,
            executionTime: end - start,
          })
        } else if (type === 'decapsulate') {
          if (!selectedKey.data || !(selectedKey.data instanceof CryptoKey))
            throw new Error('Invalid key data for Web Crypto operation')
          if (!ciphertext) throw new Error('No ciphertext available. Run Encapsulate first.')

          const epkBytes = hexToBytes(ciphertext)
          const epk = await window.crypto.subtle.importKey(
            'raw',
            epkBytes as BufferSource,
            selectedKey.algorithm === 'X25519'
              ? { name: 'X25519' }
              : { name: 'ECDH', namedCurve: 'P-256' },
            true,
            []
          )

          const recoveredSecret = await WebCrypto.deriveSharedSecret(selectedKey.data, epk)

          // Apply HKDF normalization if selected
          let finalSecret: Uint8Array = recoveredSecret
          if (hybridMethod === 'concat-hkdf') {
            finalSecret = await hkdfExtract(new Uint8Array(0), recoveredSecret, 'SHA-256')
          }

          // Verify match
          let matches = false
          if (sharedSecret) {
            const originalSecretBytes = hexToBytes(sharedSecret)
            matches = finalSecret.every(
              // eslint-disable-next-line security/detect-object-injection
              (byte, i) => byte === originalSecretBytes[i]
            )
          }

          setDecapsulatedSecret(bytesToHex(finalSecret))
          setKemDecapsulationResult(matches)

          const end = performance.now()
          addLog({
            keyLabel: selectedKey.name,
            operation: `Decapsulate (${selectedKey.algorithm})`,
            result: `Recovered Secret: ${finalSecret.length}B, Match: ${matches}`,
            executionTime: end - start,
          })
        }
      } else if (isHybridMode && type === 'encapsulate') {
        // Clear previous decapsulation results
        setDecapsulatedSecret('')
        setKemDecapsulationResult(null)
        setPqcRecoveredSecret('')
        setClassicalRecoveredSecret('')

        // --- HYBRID ENCAPSULATION ---
        const pqcKey = keyStore.find((k) => k.id === selectedEncKeyId)
        const classicalKey = keyStore.find((k) => k.id === secondaryEncKeyId)

        if (!pqcKey) throw new Error('Please select a PQC Public Key')
        if (!classicalKey) throw new Error('Please select a Classical Public Key')
        if (!wasmLoaded) throw new Error('WASM libraries not loaded for PQC component')

        // 1. Classical Encapsulation (ECDH/X25519)
        if (!classicalKey.data || !(classicalKey.data instanceof CryptoKey))
          throw new Error('Invalid classical key data')

        const ephemeralKeyPair =
          classicalKey.algorithm === 'X25519'
            ? await WebCrypto.generateX25519KeyPair()
            : await WebCrypto.generateECDHKeyPair()

        const classicalSecret = await WebCrypto.deriveSharedSecret(
          ephemeralKeyPair.privateKey,
          classicalKey.data
        )
        const classicalCiphertext = ephemeralKeyPair.publicKeyHex

        // 2. PQC Encapsulation (WASM)
        if (!pqcKey.data || !(pqcKey.data instanceof Uint8Array))
          throw new Error('Invalid PQC key data')

        // Determine algo name (same logic as pure WASM)
        let algoName = pqcKey.algorithm
        if (algoName === 'ML-KEM' || algoName.startsWith('ML-KEM')) {
          if (pqcKey.data.length === 800) algoName = 'ML-KEM-512'
          else if (pqcKey.data.length === 1184) algoName = 'ML-KEM-768'
          else if (pqcKey.data.length === 1568) algoName = 'ML-KEM-1024'
          else algoName = `ML-KEM-${keySize}`
        }

        const { ciphertext: pqcCiphertext, sharedKey: pqcSecret } = await MLKEM.encapsulateBits(
          { name: algoName },
          pqcKey.data
        )

        // 3. Combine Secrets
        const combinedSecret = new Uint8Array(classicalSecret.length + pqcSecret.length)
        combinedSecret.set(classicalSecret)
        combinedSecret.set(pqcSecret, classicalSecret.length)

        // 3. Update Raw Secret State for UI (left side)
        setPqcSharedSecret(bytesToHex(pqcSecret))
        setClassicalSharedSecret(bytesToHex(classicalSecret))

        let finalSecret: Uint8Array = combinedSecret
        if (hybridMethod === 'concat-hkdf') {
          // 4. Normalize with HKDF-Extract
          finalSecret = await hkdfExtract(new Uint8Array(0), combinedSecret, 'SHA-256')
        }

        // 5. Update State
        setSharedSecret(bytesToHex(finalSecret))
        // Combine ciphertexts: PQC_CT_HEX|CLASSICAL_CT_HEX (arbitrary format for playground)
        setCiphertext(`${bytesToHex(pqcCiphertext)}|${classicalCiphertext}`)

        const end = performance.now()
        addLog({
          keyLabel: `${pqcKey.name} + ${classicalKey.name}`,
          operation: 'Encapsulate (Hybrid)',
          result: `Hybrid Secret: ${finalSecret.length}B${hybridMethod === 'concat-hkdf' ? ' (HKDF)' : ' (Raw)'}`,
          executionTime: end - start,
        })
      } else if (isHybridMode && type === 'decapsulate') {
        // --- HYBRID DECAPSULATION ---
        const pqcKey = keyStore.find((k) => k.id === selectedDecKeyId)
        const classicalKey = keyStore.find((k) => k.id === secondaryDecKeyId)

        if (!pqcKey) throw new Error('Please select a PQC Private Key')
        if (!classicalKey) throw new Error('Please select a Classical Private Key')
        if (!ciphertext || !ciphertext.includes('|'))
          throw new Error('Invalid hybrid ciphertext format')

        const [pqcCtHex, classicalCtHex] = ciphertext.split('|')

        // 1. Classical Decapsulation
        if (!classicalKey.data || !(classicalKey.data instanceof CryptoKey))
          throw new Error('Invalid classical key data')

        const epkBytes = hexToBytes(classicalCtHex)
        const epk = await window.crypto.subtle.importKey(
          'raw',
          epkBytes as BufferSource,
          classicalKey.algorithm === 'X25519'
            ? { name: 'X25519' }
            : { name: 'ECDH', namedCurve: 'P-256' },
          true,
          []
        )
        const classicalSecret = await WebCrypto.deriveSharedSecret(classicalKey.data, epk)

        // 2. PQC Decapsulation
        if (!pqcKey.data || !(pqcKey.data instanceof Uint8Array))
          throw new Error('Invalid PQC key data')

        // Determine algo name
        let algoName = pqcKey.algorithm
        if (algoName === 'ML-KEM') {
          if (pqcKey.data.length === 1632) algoName = 'ML-KEM-512'
          else if (pqcKey.data.length === 2400) algoName = 'ML-KEM-768'
          else if (pqcKey.data.length === 3168) algoName = 'ML-KEM-1024'
          else algoName = `ML-KEM-${keySize}`
        }

        const pqcSecret = await MLKEM.decapsulateBits(
          { name: algoName },
          pqcKey.data,
          hexToBytes(pqcCtHex)
        )

        // 3. Combine & Normalize
        const combinedSecret = new Uint8Array(classicalSecret.length + pqcSecret.length)
        combinedSecret.set(classicalSecret)
        combinedSecret.set(pqcSecret, classicalSecret.length)

        // Update Raw Recovered Secret State for UI (right side)
        setPqcRecoveredSecret(bytesToHex(pqcSecret))
        setClassicalRecoveredSecret(bytesToHex(classicalSecret))

        let finalSecret: Uint8Array = combinedSecret
        if (hybridMethod === 'concat-hkdf') {
          finalSecret = await hkdfExtract(new Uint8Array(0), combinedSecret, 'SHA-256')
        }

        // 4. Verify
        let matches = false
        if (sharedSecret) {
          const originalSecretBytes = hexToBytes(sharedSecret)
          if (finalSecret.length === originalSecretBytes.length) {
            matches = finalSecret.every(
              // eslint-disable-next-line security/detect-object-injection
              (byte, i) => byte === originalSecretBytes[i]
            )
          }
        }

        const end = performance.now()
        setKemDecapsulationResult(matches)
        setDecapsulatedSecret(bytesToHex(finalSecret))
        addLog({
          keyLabel: `${pqcKey.name} + ${classicalKey.name}`,
          operation: `Decapsulate (Hybrid)`,
          result: matches ? '✓ Secret Recovered (Match)' : '✗ Mismatch',
          executionTime: end - start,
        })
      } else if (executionMode === 'wasm') {
        // WASM Mode Operations
        if (!wasmLoaded) throw new Error('WASM libraries not loaded')

        if (type === 'encapsulate') {
          // Clear previous decapsulation results
          setDecapsulatedSecret('')
          setKemDecapsulationResult(null)
          setPqcRecoveredSecret('')
          setClassicalRecoveredSecret('')
          const key = keyStore.find((k) => k.id === selectedEncKeyId)
          if (!key) throw new Error('Please select a Public Key')

          if (!key.data || !(key.data instanceof Uint8Array))
            throw new Error('Selected key has invalid data format (expected Uint8Array)')

          let algoName = key.algorithm
          // ML-KEM inference for legacy keys (if size matches)
          if (algoName === 'ML-KEM' || algoName.startsWith('ML-KEM')) {
            const len = key.data.length
            // Check legacy pure 'ML-KEM' cases or confirm size match
            if (algoName === 'ML-KEM') {
              if (len === 800) algoName = 'ML-KEM-512'
              else if (len === 1184) algoName = 'ML-KEM-768'
              else if (len === 1568) algoName = 'ML-KEM-1024'
              else algoName = `ML-KEM-${keySize}` // Fallback
            }
          }
          // For other algorithms (HQC, Frodo, McEliece), key.algorithm IS the full name (e.g. 'HQC-128')
          // So we can pass key.algorithm directly to the WASM wrapper.
          const { ciphertext, sharedKey } = await MLKEM.encapsulateBits(
            { name: algoName },
            key.data
          )

          // Apply HKDF normalization if selected
          let finalSecret: Uint8Array = sharedKey
          if (hybridMethod === 'concat-hkdf') {
            finalSecret = await hkdfExtract(new Uint8Array(0), sharedKey, 'SHA-256')
          }

          setSharedSecret(bytesToHex(finalSecret))
          setCiphertext(bytesToHex(ciphertext))

          const end = performance.now()

          addLog({
            keyLabel: key.name,
            operation: 'Encapsulate (WASM)',
            result: `Shared Secret: ${finalSecret.length}B, Ciphertext: ${ciphertext.length}B`,
            executionTime: end - start,
          })
        } else if (type === 'decapsulate') {
          const key = keyStore.find((k) => k.id === selectedDecKeyId)
          if (!key) throw new Error('Please select a Private Key')

          if (!key.data || !(key.data instanceof Uint8Array))
            throw new Error('Selected key has invalid data format (expected Uint8Array)')
          if (!ciphertext) throw new Error('No ciphertext available. Run Encapsulate first.')

          let algoName = key.algorithm
          if (algoName === 'ML-KEM') {
            // Infer from key size for legacy keys
            const len = key.data.length
            if (len === 1632) algoName = 'ML-KEM-512'
            else if (len === 2400) algoName = 'ML-KEM-768'
            else if (len === 3168) algoName = 'ML-KEM-1024'
            else algoName = `ML-KEM-${keySize}` // Fallback
          }
          const recoveredSecret = await MLKEM.decapsulateBits(
            { name: algoName },
            key.data,
            hexToBytes(ciphertext)
          )

          // Apply HKDF normalization if selected
          let finalSecret: Uint8Array = recoveredSecret
          if (hybridMethod === 'concat-hkdf') {
            finalSecret = await hkdfExtract(new Uint8Array(0), recoveredSecret, 'SHA-256')
          }

          // Verify against the shared secret from encapsulation (if available)
          let matches = false
          if (sharedSecret) {
            const originalSecretBytes = hexToBytes(sharedSecret)
            if (finalSecret.length === originalSecretBytes.length) {
              matches = finalSecret.every(
                // eslint-disable-next-line security/detect-object-injection
                (byte: number, i: number) => byte === originalSecretBytes[i]
              )
            }
          }

          setDecapsulatedSecret(bytesToHex(finalSecret))
          setKemDecapsulationResult(matches)

          const end = performance.now()

          addLog({
            keyLabel: key.name,
            operation: 'Decapsulate (WASM)',
            result: matches ? '✓ Secret Recovered (Match)' : '✗ Mismatch',
            executionTime: end - start,
          })
        }
      } else {
        // Mock Mode Operations
        await new Promise((resolve) => setTimeout(resolve, 500))
        const end = performance.now()

        if (type === 'encapsulate') {
          // Clear previous decapsulation results
          setDecapsulatedSecret('')
          setKemDecapsulationResult(null)
          setPqcRecoveredSecret('')
          setClassicalRecoveredSecret('')

          const key = keyStore.find((k) => k.id === selectedEncKeyId)
          if (!key) throw new Error('Please select a Public Key')

          const newSharedSecret = Math.random().toString(36).substring(2).toUpperCase()
          const newCiphertext =
            Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2)
          setSharedSecret(newSharedSecret)
          setCiphertext(newCiphertext)

          addLog({
            keyLabel: key.name,
            operation: 'Encapsulate (Mock)',
            result: 'Shared Secret Generated',
            executionTime: end - start,
          })
        } else if (type === 'decapsulate') {
          const key = keyStore.find((k) => k.id === selectedDecKeyId)
          if (!key) throw new Error('Please select a Private Key')
          if (!ciphertext) throw new Error('No ciphertext available. Run Encapsulate first.')

          // In Mock mode, we just pretend we recovered the shared secret
          if (sharedSecret) {
            setDecapsulatedSecret(sharedSecret)
          } else {
            setDecapsulatedSecret('MOCK_RECOVERED_SECRET_INVALID')
          }
          setKemDecapsulationResult(true)

          addLog({
            keyLabel: key.name,
            operation: 'Decapsulate (Mock)',
            result: 'Secret Recovered (Simulated)',
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

  return { runKemOperation }
}
