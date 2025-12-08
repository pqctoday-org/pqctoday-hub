import { useState } from 'react'
import { useOpenSSLStore } from '../../../../OpenSSLStudio/store'

export interface ArtifactFilenames {
    trans?: string
    hash?: string
    sig?: string
}

/**
 * Shared hook for managing cryptographic artifacts (transactions, hashes, signatures)
 * Eliminates code duplication by centralizing artifact file management
 */
export function useArtifactManagement() {
    const { addFile } = useOpenSSLStore()
    const [filenames, setFilenames] = useState<ArtifactFilenames>({})

    /**
     * Generate timestamp for artifact filenames
     */
    const getTimestamp = () => new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14)

    /**
     * Save an artifact file to the OpenSSL store
     */
    const saveArtifact = (
        chain: string,
        type: 'transdata' | 'hashdata' | 'signdata',
        data: Uint8Array,
        customTimestamp?: string
    ): string => {
        const timestamp = customTimestamp || getTimestamp()
        const filename = `${chain}_${type}_${timestamp}.${type.includes('sign') ? 'sig' : 'dat'}`

        addFile({
            name: filename,
            type: 'binary',
            content: data,
            size: data.length,
            timestamp: Date.now(),
        })

        // Update filenames state
        const key = type.replace('data', '') as keyof ArtifactFilenames
        setFilenames((prev) => ({ ...prev, [key]: filename }))

        return filename
    }

    /**
     * Save transaction data artifact
     */
    const saveTransaction = (chain: string, data: Uint8Array): string => {
        return saveArtifact(chain, 'transdata', data)
    }

    /**
     * Save hash data artifact
     */
    const saveHash = (chain: string, data: Uint8Array): string => {
        return saveArtifact(chain, 'hashdata', data)
    }

    /**
     * Save signature artifact
     */
    const saveSignature = (chain: string, data: Uint8Array): string => {
        return saveArtifact(chain, 'signdata', data)
    }

    /**
     * Reset artifact filenames
     */
    const resetArtifacts = () => {
        setFilenames({})
    }

    return {
        // State
        filenames,
        // Actions
        saveArtifact,
        saveTransaction,
        saveHash,
        saveSignature,
        resetArtifacts,
        getTimestamp,
    }
}
