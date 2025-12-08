/**
 * Utility functions for formatting cryptographic output
 */

/**
 * Format hex string with optional spacing
 */
export function formatHex(hex: string, groupSize: number = 8): string {
    const cleanHex = hex.replace(/[^a-fA-F0-9]/g, '')
    if (groupSize === 0) return cleanHex

    const groups: string[] = []
    for (let i = 0; i < cleanHex.length; i += groupSize) {
        groups.push(cleanHex.slice(i, i + groupSize))
    }
    return groups.join(' ')
}

/**
 * Truncate long values with ellipsis
 */
export function truncateValue(value: string, maxLength: number = 32): string {
    if (value.length <= maxLength) return value
    const halfLength = Math.floor((maxLength - 3) / 2)
    return `${value.slice(0, halfLength)}...${value.slice(-halfLength)}`
}

/**
 * Detect if string is a Bitcoin address
 */
export function isBitcoinAddress(text: string): boolean {
    // Legacy P2PKH (1...), P2SH (3...), or Bech32 (bc1...)
    return /^(1|3)[a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(text) || /^bc1[a-z0-9]{39,59}$/.test(text)
}

/**
 * Detect if string is an Ethereum address
 */
export function isEthereumAddress(text: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(text)
}

/**
 * Detect if string is a Solana address
 */
export function isSolanaAddress(text: string): boolean {
    // Base58 encoded, typically 32-44 characters
    return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(text)
}

/**
 * Detect if string is a hex value (64+ characters)
 */
export function isHexValue(text: string): boolean {
    return /^(0x)?[a-fA-F0-9]{64,}$/.test(text)
}

/**
 * Format Bitcoin address with appropriate styling
 */
export function formatBitcoinAddress(address: string): string {
    if (address.startsWith('bc1')) {
        return `bc1${address.slice(3, 10)}...${address.slice(-8)}`
    }
    return `${address.slice(0, 8)}...${address.slice(-8)}`
}

/**
 * Format Ethereum address with checksum
 */
export function formatEthereumAddress(address: string): string {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
}

/**
 * Format Solana address
 */
export function formatSolanaAddress(address: string): string {
    return `${address.slice(0, 8)}...${address.slice(-8)}`
}

/**
 * Detect crypto data type from string
 */
export function detectCryptoType(
    text: string
): 'bitcoin' | 'ethereum' | 'solana' | 'hex' | 'unknown' {
    if (isBitcoinAddress(text)) return 'bitcoin'
    if (isEthereumAddress(text)) return 'ethereum'
    if (isSolanaAddress(text)) return 'solana'
    if (isHexValue(text)) return 'hex'
    return 'unknown'
}

/**
 * Get color class for crypto data type
 */
export function getCryptoColorClass(type: 'bitcoin' | 'ethereum' | 'solana' | 'hex' | 'unknown'): string {
    switch (type) {
        case 'bitcoin':
            return 'text-yellow-400'
        case 'ethereum':
            return 'text-blue-400'
        case 'solana':
            return 'text-purple-400'
        case 'hex':
            return 'text-green-400'
        default:
            return 'text-foreground'
    }
}

/**
 * Parse output text and identify crypto values
 */
export interface ParsedValue {
    type: 'bitcoin' | 'ethereum' | 'solana' | 'hex' | 'text'
    value: string
    original: string
}

export function parseOutputText(text: string): ParsedValue[] {
    const lines = text.split('\n')
    const parsed: ParsedValue[] = []

    for (const line of lines) {
        // Check for labeled values (e.g., "Address: 1A1zP1...")
        const labelMatch = line.match(/^([^:]+):\s*(.+)$/)
        if (labelMatch) {
            const [, label, value] = labelMatch
            const trimmedValue = value.trim()
            const type = detectCryptoType(trimmedValue)

            if (type !== 'unknown') {
                parsed.push({
                    type,
                    value: trimmedValue,
                    original: line,
                })
                continue
            }
        }

        // Check for standalone addresses/hashes
        const words = line.split(/\s+/)
        for (const word of words) {
            const type = detectCryptoType(word)
            if (type !== 'unknown') {
                parsed.push({
                    type,
                    value: word,
                    original: line,
                })
                continue
            }
        }

        // If no crypto values found, treat as text
        if (parsed.length === 0 || parsed[parsed.length - 1].original !== line) {
            parsed.push({
                type: 'text',
                value: line,
                original: line,
            })
        }
    }

    return parsed
}
