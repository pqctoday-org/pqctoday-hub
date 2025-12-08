import { useOpenSSLStore } from '../../../../OpenSSLStudio/store'

export interface FileData {
    name: string
    data: Uint8Array
}

/**
 * Shared hook for retrieving files from OpenSSL store
 * Eliminates code duplication and standardizes error handling
 */
export function useFileRetrieval() {
    /**
     * Get a file from the OpenSSL store
     * @param filename - Name of the file to retrieve
     * @param required - If true, throws error if file not found
     * @returns File data or null if not found and not required
     */
    const getFile = (filename: string, required = true): FileData | null => {
        const file = useOpenSSLStore.getState().getFile(filename)

        if (!file) {
            if (required) {
                throw new Error(`Required file not found: ${filename}. Please execute the previous steps first.`)
            }
            return null
        }

        return {
            name: file.name,
            data: file.content as Uint8Array,
        }
    }

    /**
     * Get multiple files from the OpenSSL store
     * @param filenames - Array of filenames to retrieve
     * @param required - If true, throws error if any file not found
     * @returns Array of file data
     */
    const getFiles = (filenames: string[], required = true): FileData[] => {
        return filenames.map(filename => {
            const fileData = getFile(filename, required)
            if (!fileData && !required) {
                return { name: filename, data: new Uint8Array() }
            }
            return fileData!
        })
    }

    /**
     * Prepare files for OpenSSL execution
     * Converts store files to the format expected by openSSLService.execute()
     */
    const prepareFilesForExecution = (filenames: string[]): Array<{ name: string; data: Uint8Array }> => {
        return getFiles(filenames, true).map(file => ({
            name: file.name,
            data: file.data,
        }))
    }

    /**
     * Check if a file exists in the store
     */
    const fileExists = (filename: string): boolean => {
        return useOpenSSLStore.getState().getFile(filename) !== undefined
    }

    return {
        getFile,
        getFiles,
        prepareFilesForExecution,
        fileExists,
    }
}
