import { useState } from 'react'
import { useOpenSSLStore } from '../../../../OpenSSLStudio/store'
import { openSSLService } from '../../../../../services/crypto/OpenSSLService'
import { extractKeyFromOpenSSLOutput } from '../../../../../utils/cryptoUtils'
import { bytesToHex } from '@noble/hashes/utils.js'
import { DIGITAL_ASSETS_CONSTANTS } from '../constants'
import { ed25519 } from '@noble/curves/ed25519.js'

export interface KeyPair {
  privateKey: Uint8Array
  publicKey: Uint8Array
  privateKeyHex: string
  publicKeyHex: string
}

export interface KeyGenerationResult {
  keyPair: KeyPair
  files: Array<{ name: string; data: Uint8Array }>
}

/**
 * Shared hook for key generation across all Digital Assets flows
 * Eliminates code duplication by centralizing the common pattern:
 * 1. Generate private key via OpenSSL
 * 2. Extract public key
 * 3. Extract raw key bytes
 * 4. Store files in OpenSSL store
 */
export function useKeyGeneration(chain: 'bitcoin' | 'ethereum' | 'solana') {
  const { addFile } = useOpenSSLStore()
  const [privateKey, setPrivateKey] = useState<Uint8Array | null>(null)
  const [publicKey, setPublicKey] = useState<Uint8Array | null>(null)
  const [privateKeyHex, setPrivateKeyHex] = useState<string | null>(null)
  const [publicKeyHex, setPublicKeyHex] = useState<string | null>(null)
  const [usingFallback, setUsingFallback] = useState(false)

  /**
   * Generate a key pair for the specified chain
   */
  const generateKeyPair = async (
    privateKeyFilename: string,
    publicKeyFilename: string
  ): Promise<KeyGenerationResult> => {
    // Step 1: Generate private key
    const genKeyCmd =
      chain === 'solana'
        ? DIGITAL_ASSETS_CONSTANTS.COMMANDS.SOLANA.GEN_KEY(privateKeyFilename)
        : chain === 'bitcoin'
          ? DIGITAL_ASSETS_CONSTANTS.COMMANDS.BITCOIN.GEN_KEY(privateKeyFilename)
          : DIGITAL_ASSETS_CONSTANTS.COMMANDS.ETHEREUM.GEN_KEY(privateKeyFilename)

    let res1
    let files: Array<{ name: string; data: Uint8Array }> = []
    let rawPrivateKeyBytes: Uint8Array | null = null
    let privHex: string | null = null

    try {
      res1 = await openSSLService.execute(genKeyCmd)

      if (
        res1.error ||
        (chain === 'solana' && res1.stderr.includes('Algorithm Ed25519 not found'))
      ) {
        throw new Error(res1.error || 'Ed25519 not supported')
      }

      // Add private key file to store
      res1.files.forEach((file) => {
        addFile({
          name: file.name,
          type: 'key',
          content: file.data,
          size: file.data.length,
          timestamp: Date.now(),
        })
      })
      files = [...res1.files]

      // Step 2: Extract raw private key bytes
      rawPrivateKeyBytes = await extractKeyFromOpenSSLOutput(privateKeyFilename, 'private', files)
      privHex = bytesToHex(rawPrivateKeyBytes)
      setUsingFallback(false)
    } catch (err) {
      // Fallback for Solana/Ed25519
      if (chain === 'solana') {
        console.warn('Falling back to JS for Ed25519 key generation:', err)
        const privKey = ed25519.utils.randomSecretKey()
        rawPrivateKeyBytes = privKey
        privHex = bytesToHex(privKey)
        setUsingFallback(true)

        // Create a mock PEM file or just raw data
        addFile({
          name: privateKeyFilename,
          type: 'key',
          content: privKey,
          size: privKey.length,
          timestamp: Date.now(),
        })
      } else {
        throw err
      }
    }

    if (!rawPrivateKeyBytes || !privHex) {
      throw new Error('Failed to generate private key')
    }

    // Step 3: Derive public key
    let res2
    let rawPublicKeyBytes: Uint8Array | null = null
    let pubHex: string | null = null

    if (!usingFallback && chain !== 'solana') {
      // Standard OpenSSL flow (Bitcoin/Ethereum)
      const extractPubCmd =
        chain === 'bitcoin'
          ? DIGITAL_ASSETS_CONSTANTS.COMMANDS.BITCOIN.EXTRACT_PUB(
              privateKeyFilename,
              publicKeyFilename
            )
          : DIGITAL_ASSETS_CONSTANTS.COMMANDS.ETHEREUM.EXTRACT_PUB(
              privateKeyFilename,
              publicKeyFilename
            )

      res2 = await openSSLService.execute(extractPubCmd, files)
      if (res2.error) throw new Error(res2.error)

      // Add public key file to store
      res2.files.forEach((file) => {
        addFile({
          name: file.name,
          type: 'key',
          content: file.data,
          size: file.data.length,
          timestamp: Date.now(),
        })
      })
      files = [...files, ...res2.files]

      // Step 4: Extract raw public key bytes
      rawPublicKeyBytes = await extractKeyFromOpenSSLOutput(publicKeyFilename, 'public', res2.files)
      pubHex = bytesToHex(rawPublicKeyBytes)
    } else if (chain === 'solana') {
      // JS extraction for Solana (always if fallback, or if we want consistency)
      if (!usingFallback) {
        try {
          const extractPubCmd = DIGITAL_ASSETS_CONSTANTS.COMMANDS.SOLANA.EXTRACT_PUB(
            privateKeyFilename,
            publicKeyFilename
          )
          res2 = await openSSLService.execute(extractPubCmd, files)

          // Check explicit success
          if (res2.error && res2.error.toLowerCase().includes('error')) throw new Error(res2.error)

          res2.files.forEach((file) =>
            addFile({
              name: file.name,
              type: 'key',
              content: file.data,
              size: file.data.length,
              timestamp: Date.now(),
            })
          )
          files = [...files, ...res2.files]

          rawPublicKeyBytes = await extractKeyFromOpenSSLOutput(
            publicKeyFilename,
            'public',
            res2.files
          )
          pubHex = bytesToHex(rawPublicKeyBytes)
        } catch (e) {
          // Fallback
          console.warn('OpenSSL PubKey extraction failed, falling back to JS', e)
          rawPublicKeyBytes = ed25519.getPublicKey(rawPrivateKeyBytes)
          pubHex = bytesToHex(rawPublicKeyBytes)

          addFile({
            name: publicKeyFilename,
            type: 'key',
            content: rawPublicKeyBytes,
            size: rawPublicKeyBytes.length,
            timestamp: Date.now(),
          })
        }
      } else {
        // Fallback mode
        rawPublicKeyBytes = ed25519.getPublicKey(rawPrivateKeyBytes)
        pubHex = bytesToHex(rawPublicKeyBytes)
        // Save 'fake' file
        addFile({
          name: publicKeyFilename,
          type: 'key',
          content: rawPublicKeyBytes,
          size: rawPublicKeyBytes.length,
          timestamp: Date.now(),
        })
      }
    }

    if (!rawPublicKeyBytes || !pubHex) throw new Error('Failed to generate public key')

    // Update state
    setPrivateKey(rawPrivateKeyBytes)
    setPublicKey(rawPublicKeyBytes)
    setPrivateKeyHex(privHex)
    setPublicKeyHex(pubHex)

    const keyPair: KeyPair = {
      privateKey: rawPrivateKeyBytes,
      publicKey: rawPublicKeyBytes,
      privateKeyHex: privHex,
      publicKeyHex: pubHex,
    }

    return {
      keyPair,
      files,
    }
  }

  /**
   * Reset key state
   */
  const resetKeys = () => {
    setPrivateKey(null)
    setPublicKey(null)
    setPrivateKeyHex(null)
    setPublicKeyHex(null)
    setUsingFallback(false)
  }

  return {
    // State
    privateKey,
    publicKey,
    privateKeyHex,
    publicKeyHex,
    usingFallback,
    // Actions
    generateKeyPair,
    resetKeys,
  }
}
