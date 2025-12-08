import { useState } from 'react'
import { useOpenSSLStore } from '../../../../OpenSSLStudio/store'
import { openSSLService } from '../../../../../services/crypto/OpenSSLService'
import { extractKeyFromOpenSSLOutput } from '../../../../../utils/cryptoUtils'
import { bytesToHex } from '@noble/hashes/utils.js'
import { DIGITAL_ASSETS_CONSTANTS } from '../constants'

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

        const res1 = await openSSLService.execute(genKeyCmd)
        if (res1.error) throw new Error(res1.error)

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

        // Step 2: Extract raw private key bytes
        const rawPrivateKeyBytes = await extractKeyFromOpenSSLOutput(
            privateKeyFilename,
            'private',
            res1.files
        )
        const privHex = bytesToHex(rawPrivateKeyBytes)

        // Step 3: Derive public key
        const extractPubCmd =
            chain === 'solana'
                ? DIGITAL_ASSETS_CONSTANTS.COMMANDS.SOLANA.EXTRACT_PUB(
                    privateKeyFilename,
                    publicKeyFilename
                )
                : chain === 'bitcoin'
                    ? DIGITAL_ASSETS_CONSTANTS.COMMANDS.BITCOIN.EXTRACT_PUB(
                        privateKeyFilename,
                        publicKeyFilename
                    )
                    : DIGITAL_ASSETS_CONSTANTS.COMMANDS.ETHEREUM.EXTRACT_PUB(
                        privateKeyFilename,
                        publicKeyFilename
                    )

        const res2 = await openSSLService.execute(extractPubCmd, res1.files)
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

        // Step 4: Extract raw public key bytes
        const rawPublicKeyBytes = await extractKeyFromOpenSSLOutput(
            publicKeyFilename,
            'public',
            res2.files
        )
        const pubHex = bytesToHex(rawPublicKeyBytes)

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
            files: [...res1.files, ...res2.files],
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
    }

    return {
        // State
        privateKey,
        publicKey,
        privateKeyHex,
        publicKeyHex,
        // Actions
        generateKeyPair,
        resetKeys,
    }
}
