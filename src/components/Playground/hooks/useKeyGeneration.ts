// SPDX-License-Identifier: GPL-3.0-only
import { useState } from 'react'
import { createLogger } from '../../../utils/logger'
import type { Key, LogEntry } from '../../../types'
import * as MLKEM from '../../../wasm/liboqs_kem'
import * as MLDSA from '../../../wasm/liboqs_dsa'
import * as LIBOQS_SIG from '../../../wasm/liboqs_sig'
import * as WebCrypto from '../../../utils/webCrypto'
import { bytesToHex } from '../../../utils/dataInputUtils'
import type { ExecutionMode, ClassicalAlgorithm } from '../PlaygroundContext'
import { useModuleStore } from '../../../store/useModuleStore'
import { openSSLService } from '../../../services/crypto/OpenSSLService'
import { secp256k1 } from '@noble/curves/secp256k1.js'

interface UseKeyGenerationProps {
  algorithm: string
  keySize: string
  executionMode: ExecutionMode
  wasmLoaded: boolean
  classicalAlgorithm: ClassicalAlgorithm
  setKeyStore: React.Dispatch<React.SetStateAction<Key[]>>
  setSelectedEncKeyId: (id: string) => void
  setSelectedDecKeyId: (id: string) => void
  setSelectedSignKeyId: (id: string) => void
  setSelectedVerifyKeyId: (id: string) => void
  addLog: (entry: Omit<LogEntry, 'id' | 'timestamp'>) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

const logger = createLogger('useKeyGeneration')

// Limit keystore to prevent unbounded growth
const MAX_KEYS = 100

export const useKeyGeneration = ({
  algorithm,
  keySize,
  executionMode,
  wasmLoaded,
  classicalAlgorithm,
  setKeyStore,
  setSelectedEncKeyId,
  setSelectedDecKeyId,
  setSelectedSignKeyId,
  setSelectedVerifyKeyId,
  addLog,
  setLoading,
  setError,
}: UseKeyGenerationProps) => {
  const [classicalLoading, setClassicalLoading] = useState(false)

  const generateKeys = async () => {
    setLoading(true)
    setError(null)
    const start = performance.now()

    try {
      if (executionMode === 'wasm') {
        // WASM Mode - Real cryptographic operations
        if (!wasmLoaded) {
          throw new Error('WASM libraries not loaded')
        }

        const timestamp = new Date().toLocaleTimeString([], { hour12: false })
        const idBase = Math.random().toString(36).substring(2, 9)

        let newKeys: Key[] = []
        let algoName = ''

        if (
          algorithm === 'ML-KEM' ||
          algorithm.startsWith('HQC') ||
          algorithm.startsWith('FrodoKEM') ||
          algorithm.startsWith('Classic-McEliece')
        ) {
          // KEM Algorithms (ML-KEM, HQC, FrodoKEM, McEliece)
          algoName = algorithm === 'ML-KEM' ? `ML-KEM-${keySize}` : algorithm
          logger.debug('[Playground] Generating KEM keys...', algoName)
          const keys = await MLKEM.generateKey({ name: algoName })
          logger.debug('[Playground] KEM keys generated:', keys)

          newKeys = [
            {
              id: `pk-${idBase}`,
              name: `${algoName} Public Key (WASM) [${timestamp}]`,
              type: 'public',
              algorithm: algoName,
              value: bytesToHex(keys.publicKey),
              data: keys.publicKey,
              dataType: 'binary',
              timestamp: Date.now(),
            },
            {
              id: `sk-${idBase}`,
              name: `${algoName} Private Key (WASM) [${timestamp}]`,
              type: 'private',
              algorithm: algoName,
              value: bytesToHex(keys.secretKey),
              data: keys.secretKey,
              dataType: 'binary',
              timestamp: Date.now(),
            },
          ]

          setKeyStore((prev) => {
            const newStore = [...prev, ...newKeys]
            // Keep only the most recent MAX_KEYS keys
            return newStore.length > MAX_KEYS ? newStore.slice(-MAX_KEYS) : newStore
          })
          setSelectedEncKeyId(newKeys[0].id)
          setSelectedDecKeyId(newKeys[1].id)
          // Bridge: record generated key pair to scoring system
          useModuleStore.getState().addKey({
            id: newKeys[1].id,
            name: algoName,
            algorithm: algoName,
            keySize: 0,
            created: Date.now(),
            publicKey: '',
            description: 'Playground',
          })

          const end = performance.now()
          addLog({
            keyLabel: `${algoName} Pair`,
            operation: 'Key Generation (WASM)',
            result: `PK: ${keys.publicKey.length}B, SK: ${keys.secretKey.length}B`,
            executionTime: end - start,
          })
        } else if (algorithm === 'ML-DSA' || algorithm.startsWith('ML-DSA-')) {
          // ML-DSA
          // Validate keySize is a valid DSA level (44, 65, 87), not a KEM algorithm name
          const validDSALevels = ['44', '65', '87']
          const dsaLevel = validDSALevels.includes(keySize) ? keySize : '65'
          algoName = algorithm.startsWith('ML-DSA-') ? algorithm : `ML-DSA-${dsaLevel}`
          const keypair = await MLDSA.generateKey({ name: algoName }, true, ['sign', 'verify'])

          newKeys = [
            {
              id: `pk-${idBase}`,
              name: `${algoName} Public Key (WASM) [${timestamp}]`,
              type: 'public',
              algorithm: algoName,
              value: bytesToHex(keypair.publicKey),
              data: keypair.publicKey,
              dataType: 'binary',
              timestamp: Date.now(),
            },
            {
              id: `sk-${idBase}`,
              name: `${algoName} Private Key (WASM) [${timestamp}]`,
              type: 'private',
              algorithm: algoName,
              value: bytesToHex(keypair.secretKey),
              data: keypair.secretKey,
              dataType: 'binary',
              timestamp: Date.now(),
            },
          ]

          setKeyStore((prev) => {
            const newStore = [...prev, ...newKeys]
            return newStore.length > MAX_KEYS ? newStore.slice(-MAX_KEYS) : newStore
          })
          setSelectedSignKeyId(newKeys[1].id)
          setSelectedVerifyKeyId(newKeys[0].id)
          // Bridge: record generated key pair to scoring system
          useModuleStore.getState().addKey({
            id: newKeys[1].id,
            name: algoName,
            algorithm: algoName,
            keySize: 0,
            created: Date.now(),
            publicKey: '',
            description: 'Playground',
          })

          const end = performance.now()
          addLog({
            keyLabel: `${algoName} Pair`,
            operation: 'Key Generation (WASM)',
            result: `PK: ${keypair.publicKey.length}B, SK: ${keypair.secretKey.length}B`,
            executionTime: end - start,
          })
        } else if (algorithm.startsWith('SLH-DSA') || algorithm.startsWith('FN-DSA')) {
          // SLH-DSA and FN-DSA (Falcon) via liboqs
          algoName = algorithm
          logger.debug('[Playground] Generating SLH-DSA/FN-DSA keys...', algoName)
          const keypair = await LIBOQS_SIG.generateKey({ name: algoName })

          newKeys = [
            {
              id: `pk-${idBase}`,
              name: `${algoName} Public Key (WASM) [${timestamp}]`,
              type: 'public',
              algorithm: algoName,
              value: bytesToHex(keypair.publicKey),
              data: keypair.publicKey,
              dataType: 'binary',
              timestamp: Date.now(),
            },
            {
              id: `sk-${idBase}`,
              name: `${algoName} Private Key (WASM) [${timestamp}]`,
              type: 'private',
              algorithm: algoName,
              value: bytesToHex(keypair.secretKey),
              data: keypair.secretKey,
              dataType: 'binary',
              timestamp: Date.now(),
            },
          ]

          setKeyStore((prev) => {
            const newStore = [...prev, ...newKeys]
            return newStore.length > MAX_KEYS ? newStore.slice(-MAX_KEYS) : newStore
          })
          setSelectedSignKeyId(newKeys[1].id)
          setSelectedVerifyKeyId(newKeys[0].id)
          // Bridge: record generated key pair to scoring system
          useModuleStore.getState().addKey({
            id: newKeys[1].id,
            name: algoName,
            algorithm: algoName,
            keySize: 0,
            created: Date.now(),
            publicKey: '',
            description: 'Playground',
          })

          const end = performance.now()
          addLog({
            keyLabel: `${algoName} Pair`,
            operation: 'Key Generation (liboqs)',
            result: `PK: ${keypair.publicKey.length}B, SK: ${keypair.secretKey.length}B`,
            executionTime: end - start,
          })
        } else if (algorithm.startsWith('LMS-')) {
          // LMS/HSS via dedicated LMS WASM module
          algoName = algorithm
          logger.debug('[Playground] Generating LMS keys...', algoName)

          // Map algorithm name to LMS type parameters
          // LMS-SHA256-H10 → lmsType=5 (LMS_SHA256_M32_H10), lmotsType=4 (LMOTS_SHA256_N32_W8)
          // LMS-SHA256-H15 → lmsType=6 (LMS_SHA256_M32_H15)
          // LMS-SHA256-H20 → lmsType=7 (LMS_SHA256_M32_H20)
          const lmsTypeMap: Record<string, number> = {
            'LMS-SHA256-H10': 5,
            'LMS-SHA256-H15': 6,
            'LMS-SHA256-H20': 7,
          }
          // eslint-disable-next-line security/detect-object-injection
          const lmsType = lmsTypeMap[algoName] ?? 5
          const lmotsType = 4 // LMOTS_SHA256_N32_W8

          const { lmsService } = await import('../../../wasm/LmsService')
          const keypair = await lmsService.generateKeypair(lmsType, lmotsType)

          newKeys = [
            {
              id: `pk-${idBase}`,
              name: `${algoName} Public Key (WASM) [${timestamp}]`,
              type: 'public',
              algorithm: algoName,
              value: bytesToHex(keypair.publicKey),
              data: keypair.publicKey,
              dataType: 'binary',
              timestamp: Date.now(),
            },
            {
              id: `sk-${idBase}`,
              name: `${algoName} Private Key (WASM) [${timestamp}]`,
              type: 'private',
              algorithm: algoName,
              value: bytesToHex(keypair.privateKey),
              data: keypair.privateKey,
              dataType: 'binary',
              timestamp: Date.now(),
            },
          ]

          setKeyStore((prev) => {
            const newStore = [...prev, ...newKeys]
            return newStore.length > MAX_KEYS ? newStore.slice(-MAX_KEYS) : newStore
          })
          setSelectedSignKeyId(newKeys[1].id)
          setSelectedVerifyKeyId(newKeys[0].id)
          useModuleStore.getState().addKey({
            id: newKeys[1].id,
            name: algoName,
            algorithm: algoName,
            keySize: 0,
            created: Date.now(),
            publicKey: '',
            description: 'Playground',
          })

          const end = performance.now()
          addLog({
            keyLabel: `${algoName} Pair`,
            operation: 'Key Generation (LMS WASM)',
            result: `PK: ${keypair.publicKey.length}B, SK: ${keypair.privateKey.length}B`,
            executionTime: end - start,
          })
        }
      } else {
        // Mock Mode - Simulated operations
        await new Promise((resolve) => setTimeout(resolve, 800))

        const timestamp = new Date().toLocaleTimeString([], { hour12: false })
        const idBase = Math.random().toString(36).substring(2, 9)

        const algorithmLabel = algorithm === 'ML-KEM' ? `ML-KEM-${keySize}` : `ML-DSA-${keySize}`
        const publicKeyType = algorithm === 'ML-KEM' ? 'Kyber' : 'Dilithium'
        const privateKeyType = algorithm === 'ML-KEM' ? 'Kyber' : 'Dilithium'

        const newKeys: Key[] = [
          {
            id: `pk-${idBase}`,
            name: `${algorithmLabel} Public Key (Mock) [${timestamp}]`,
            type: 'public',
            algorithm,
            value:
              algorithm === 'ML-KEM'
                ? `1a2b3c4d... (${publicKeyType}-${keySize} Public Key)`
                : `5e6f7g8h... (${publicKeyType}-${keySize} Public Key)`,
            dataType: 'string',
            timestamp: Date.now(),
          },
          {
            id: `sk-${idBase}`,
            name: `${algorithmLabel} Private Key (Mock) [${timestamp}]`,
            type: 'private',
            algorithm,
            value:
              algorithm === 'ML-KEM'
                ? `9z8y7x6w... (${privateKeyType}-${keySize} Private Key)`
                : `4v3u2t1s... (${privateKeyType}-${keySize} Private Key)`,
            dataType: 'string',
            timestamp: Date.now(),
          },
        ]

        setKeyStore((prev) => {
          const newStore = [...prev, ...newKeys]
          return newStore.length > MAX_KEYS ? newStore.slice(-MAX_KEYS) : newStore
        })

        if (algorithm === 'ML-KEM') {
          setSelectedEncKeyId(newKeys[0].id)
          setSelectedDecKeyId(newKeys[1].id)
        } else {
          setSelectedSignKeyId(newKeys[1].id)
          setSelectedVerifyKeyId(newKeys[0].id)
        }

        const end = performance.now()

        addLog({
          keyLabel: `${algorithmLabel} Pair`,
          operation: 'Key Generation (Mock)',
          result: 'Success',
          executionTime: end - start,
        })
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(`Failed to generate keys: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  const generateClassicalKeys = async () => {
    setClassicalLoading(true)
    setError(null)
    const start = performance.now()

    try {
      const timestamp = new Date().toLocaleTimeString([], { hour12: false })
      const idBase = Math.random().toString(36).substring(2, 9)
      let newKeys: Key[] = []
      let keyPairResult

      // Generate keys based on selected algorithm
      if (classicalAlgorithm.startsWith('RSA')) {
        const keySize = parseInt(classicalAlgorithm.split('-')[1]) as WebCrypto.RSAKeySize
        keyPairResult = await WebCrypto.generateRSAKeyPair(keySize)

        newKeys = [
          {
            id: `pk-${idBase}`,
            name: `${classicalAlgorithm} Public Key (WebCrypto) [${timestamp}]`,
            type: 'public',
            algorithm: 'RSA',
            value: keyPairResult.publicKeyHex,
            data: keyPairResult.publicKey,
            dataType: 'cryptokey',
            timestamp: Date.now(),
          },
          {
            id: `sk-${idBase}`,
            name: `${classicalAlgorithm} Private Key (WebCrypto) [${timestamp}]`,
            type: 'private',
            algorithm: 'RSA',
            value: keyPairResult.privateKeyHex,
            data: keyPairResult.privateKey,
            dataType: 'cryptokey',
            timestamp: Date.now(),
          },
        ]
      } else if (classicalAlgorithm.startsWith('ECDSA')) {
        const curve =
          classicalAlgorithm === 'ECDSA-P256'
            ? 'P-256'
            : classicalAlgorithm === 'ECDSA-P384'
              ? 'P-384'
              : ('P-521' as WebCrypto.ECDSACurve)
        keyPairResult = await WebCrypto.generateECDSAKeyPair(curve)

        newKeys = [
          {
            id: `pk-${idBase}`,
            name: `ECDSA ${curve} Public Key (WebCrypto) [${timestamp}]`,
            type: 'public',
            algorithm: classicalAlgorithm,
            value: keyPairResult.publicKeyHex,
            data: keyPairResult.publicKey,
            dataType: 'cryptokey',
            timestamp: Date.now(),
          },
          {
            id: `sk-${idBase}`,
            name: `ECDSA ${curve} Private Key (WebCrypto) [${timestamp}]`,
            type: 'private',
            algorithm: classicalAlgorithm,
            value: keyPairResult.privateKeyHex,
            data: keyPairResult.privateKey,
            dataType: 'cryptokey',
            timestamp: Date.now(),
          },
        ]
      } else if (classicalAlgorithm === 'Ed25519') {
        keyPairResult = await WebCrypto.generateEd25519KeyPair()

        newKeys = [
          {
            id: `pk-${idBase}`,
            name: `Ed25519 Public Key (WebCrypto) [${timestamp}]`,
            type: 'public',
            algorithm: 'Ed25519',
            value: keyPairResult.publicKeyHex,
            data: keyPairResult.publicKey,
            dataType: 'cryptokey',
            timestamp: Date.now(),
          },
          {
            id: `sk-${idBase}`,
            name: `Ed25519 Private Key (WebCrypto) [${timestamp}]`,
            type: 'private',
            algorithm: 'Ed25519',
            value: keyPairResult.privateKeyHex,
            data: keyPairResult.privateKey,
            dataType: 'cryptokey',
            timestamp: Date.now(),
          },
        ]
      } else if (classicalAlgorithm === 'X25519') {
        keyPairResult = await WebCrypto.generateX25519KeyPair()

        newKeys = [
          {
            id: `pk-${idBase}`,
            name: `X25519 Public Key (WebCrypto) [${timestamp}]`,
            type: 'public',
            algorithm: 'X25519',
            value: keyPairResult.publicKeyHex,
            data: keyPairResult.publicKey,
            dataType: 'cryptokey',
            timestamp: Date.now(),
          },
          {
            id: `sk-${idBase}`,
            name: `X25519 Private Key (WebCrypto) [${timestamp}]`,
            type: 'private',
            algorithm: 'X25519',
            value: keyPairResult.privateKeyHex,
            data: keyPairResult.privateKey,
            dataType: 'cryptokey',
            timestamp: Date.now(),
          },
        ]
      } else if (
        classicalAlgorithm === 'P-256' ||
        classicalAlgorithm === 'P-384' ||
        classicalAlgorithm === 'P-521'
      ) {
        keyPairResult = await WebCrypto.generateECDHKeyPair(
          classicalAlgorithm as WebCrypto.ECDHCurve
        )

        newKeys = [
          {
            id: `pk-${idBase}`,
            name: `${classicalAlgorithm} ECDH Public Key (WebCrypto) [${timestamp}]`,
            type: 'public',
            algorithm: classicalAlgorithm,
            value: keyPairResult.publicKeyHex,
            data: keyPairResult.publicKey,
            dataType: 'cryptokey',
            timestamp: Date.now(),
          },
          {
            id: `sk-${idBase}`,
            name: `${classicalAlgorithm} ECDH Private Key (WebCrypto) [${timestamp}]`,
            type: 'private',
            algorithm: classicalAlgorithm,
            value: keyPairResult.privateKeyHex,
            data: keyPairResult.privateKey,
            dataType: 'cryptokey',
            timestamp: Date.now(),
          },
        ]
      } else if (classicalAlgorithm.startsWith('AES')) {
        const keySize = parseInt(classicalAlgorithm.split('-')[1]) as WebCrypto.AESKeySize
        const aesKey = await WebCrypto.generateAESKey(keySize)
        const exportedKey = await crypto.subtle.exportKey('raw', aesKey)

        newKeys = [
          {
            id: `aes-${idBase}`,
            name: `${classicalAlgorithm}-GCM Key (WebCrypto) [${timestamp}]`,
            type: 'symmetric',
            algorithm: 'AES-GCM',
            value: WebCrypto.arrayBufferToHex(exportedKey),
            data: aesKey,
            dataType: 'cryptokey',
            timestamp: Date.now(),
          },
        ]
      } else if (classicalAlgorithm === 'Ed448') {
        // Ed448 via OpenSSL WASM (no Web Crypto browser support)
        await openSSLService.init()
        const genResult = await openSSLService.execute(
          'genpkey -algorithm Ed448 -out ed448_priv.pem'
        )
        const privPemFile = genResult.files.find((f) => f.name === 'ed448_priv.pem')
        if (!privPemFile) throw new Error('Failed to generate Ed448 private key')

        const pubResult = await openSSLService.execute(
          'pkey -in ed448_priv.pem -pubout -out ed448_pub.pem',
          [{ name: 'ed448_priv.pem', data: privPemFile.data }]
        )
        const pubPemFile = pubResult.files.find((f) => f.name === 'ed448_pub.pem')
        if (!pubPemFile) throw new Error('Failed to extract Ed448 public key')

        newKeys = [
          {
            id: `pk-${idBase}`,
            name: `Ed448 Public Key (OpenSSL) [${timestamp}]`,
            type: 'public',
            algorithm: 'Ed448',
            value: bytesToHex(pubPemFile.data),
            data: pubPemFile.data,
            dataType: 'binary',
            timestamp: Date.now(),
          },
          {
            id: `sk-${idBase}`,
            name: `Ed448 Private Key (OpenSSL) [${timestamp}]`,
            type: 'private',
            algorithm: 'Ed448',
            value: bytesToHex(privPemFile.data),
            data: privPemFile.data,
            dataType: 'binary',
            timestamp: Date.now(),
          },
        ]
      } else if (classicalAlgorithm === 'X448') {
        // X448 via OpenSSL WASM (no Web Crypto browser support)
        await openSSLService.init()
        const genResult = await openSSLService.execute('genpkey -algorithm X448 -out x448_priv.pem')
        const privPemFile = genResult.files.find((f) => f.name === 'x448_priv.pem')
        if (!privPemFile) throw new Error('Failed to generate X448 private key')

        const pubResult = await openSSLService.execute(
          'pkey -in x448_priv.pem -pubout -out x448_pub.pem',
          [{ name: 'x448_priv.pem', data: privPemFile.data }]
        )
        const pubPemFile = pubResult.files.find((f) => f.name === 'x448_pub.pem')
        if (!pubPemFile) throw new Error('Failed to extract X448 public key')

        newKeys = [
          {
            id: `pk-${idBase}`,
            name: `X448 Public Key (OpenSSL) [${timestamp}]`,
            type: 'public',
            algorithm: 'X448',
            value: bytesToHex(pubPemFile.data),
            data: pubPemFile.data,
            dataType: 'binary',
            timestamp: Date.now(),
          },
          {
            id: `sk-${idBase}`,
            name: `X448 Private Key (OpenSSL) [${timestamp}]`,
            type: 'private',
            algorithm: 'X448',
            value: bytesToHex(privPemFile.data),
            data: privPemFile.data,
            dataType: 'binary',
            timestamp: Date.now(),
          },
        ]
      } else if (classicalAlgorithm === 'secp256k1') {
        // secp256k1 via @noble/curves
        const privKeyBytes = secp256k1.utils.randomSecretKey()
        const pubKeyBytes = secp256k1.getPublicKey(privKeyBytes)

        newKeys = [
          {
            id: `pk-${idBase}`,
            name: `secp256k1 Public Key (@noble) [${timestamp}]`,
            type: 'public',
            algorithm: 'secp256k1',
            value: bytesToHex(pubKeyBytes),
            data: pubKeyBytes,
            dataType: 'binary',
            timestamp: Date.now(),
          },
          {
            id: `sk-${idBase}`,
            name: `secp256k1 Private Key (@noble) [${timestamp}]`,
            type: 'private',
            algorithm: 'secp256k1',
            value: bytesToHex(privKeyBytes),
            data: privKeyBytes,
            dataType: 'binary',
            timestamp: Date.now(),
          },
        ]
      } else if (classicalAlgorithm === 'DH-2048') {
        // DH-2048 via OpenSSL WASM (RFC 7919 ffdhe2048 named group)
        await openSSLService.init()
        const genResult = await openSSLService.execute(
          'genpkey -algorithm DH -pkeyopt group:ffdhe2048 -out dh_priv.pem'
        )
        const privPemFile = genResult.files.find((f) => f.name === 'dh_priv.pem')
        if (!privPemFile) throw new Error('Failed to generate DH-2048 private key')

        const pubResult = await openSSLService.execute(
          'pkey -in dh_priv.pem -pubout -out dh_pub.pem',
          [{ name: 'dh_priv.pem', data: privPemFile.data }]
        )
        const pubPemFile = pubResult.files.find((f) => f.name === 'dh_pub.pem')
        if (!pubPemFile) throw new Error('Failed to extract DH-2048 public key')

        newKeys = [
          {
            id: `pk-${idBase}`,
            name: `DH-2048 Public Key (OpenSSL) [${timestamp}]`,
            type: 'public',
            algorithm: 'DH-2048',
            value: bytesToHex(pubPemFile.data),
            data: pubPemFile.data,
            dataType: 'binary',
            timestamp: Date.now(),
          },
          {
            id: `sk-${idBase}`,
            name: `DH-2048 Private Key (OpenSSL) [${timestamp}]`,
            type: 'private',
            algorithm: 'DH-2048',
            value: bytesToHex(privPemFile.data),
            data: privPemFile.data,
            dataType: 'binary',
            timestamp: Date.now(),
          },
        ]
      }

      setKeyStore((prev) => {
        const newStore = [...prev, ...newKeys]
        return newStore.length > MAX_KEYS ? newStore.slice(-MAX_KEYS) : newStore
      })
      // Bridge: record generated key to scoring system
      if (newKeys.length > 0) {
        const bridgeKey =
          newKeys.find((k) => k.type === 'private' || k.type === 'symmetric') ?? newKeys[0]
        useModuleStore.getState().addKey({
          id: bridgeKey.id,
          name: classicalAlgorithm,
          algorithm: classicalAlgorithm,
          keySize: 0,
          created: Date.now(),
          publicKey: '',
          description: 'Playground',
        })
      }

      const end = performance.now()

      // Calculate sizes for display
      let resultStr = ''
      if (newKeys.length === 2) {
        // Asymmetric
        const pkSize = newKeys[0].value.length / 2 // hex to bytes
        const skSize = newKeys[1].value.length / 2
        resultStr = `PK: ${pkSize}B, SK: ${skSize}B`
      } else if (newKeys.length === 1) {
        // Symmetric
        const keySize = newKeys[0].value.length / 2
        resultStr = `Key: ${keySize}B`
      } else {
        resultStr = `Generated ${newKeys.length} key(s)`
      }

      addLog({
        keyLabel: `${classicalAlgorithm} ${newKeys.length > 1 ? 'Pair' : 'Key'}`,
        operation: 'Key Generation (WebCrypto)',
        result: resultStr,
        executionTime: end - start,
      })
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(`Failed to generate classical keys: ${errorMessage}`)
    } finally {
      setClassicalLoading(false)
    }
  }

  return {
    generateKeys,
    generateClassicalKeys,
    classicalLoading,
  }
}
