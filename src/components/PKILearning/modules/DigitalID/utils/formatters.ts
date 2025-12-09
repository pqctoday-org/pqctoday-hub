// EUDI Wallet Crypto Formatters
// Following cryptoimplementation.md requirements

/* eslint-disable security/detect-unsafe-regex */
import { sha256, sha384, sha512 } from '@noble/hashes/sha2.js'
import { bytesToHex, hexToBytes } from '@noble/hashes/utils.js'
import { openSSLService } from '../../../../../services/crypto/OpenSSLService'

/**
 * Browser-compatible base64url encoding
 */
const base64urlEncode = (data: Uint8Array): string => {
  const base64 = btoa(String.fromCharCode(...data))
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

/**
 * Browser-compatible base64url decoding
 */
const base64urlDecode = (base64url: string): Uint8Array => {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=')
  const binary = atob(padded)
  return new Uint8Array(binary.split('').map((c) => c.charCodeAt(0)))
}

/**
 * Browser-compatible base64 encoding
 */
const base64Encode = (data: Uint8Array): string => {
  return btoa(String.fromCharCode(...data))
}

/**
 * Format public key as JWK from OpenSSL PEM output
 * Following cryptoimplementation.md: Use OpenSSL text output parsing
 */
export const formatPublicKeyAsJWK = async (
  pubKeyFile: string,
  files: Array<{ name: string; data: Uint8Array }>
): Promise<{ kty: string; crv: string; x: string; y: string }> => {
  // Extract key using OpenSSL text output
  const result = await openSSLService.execute(
    `openssl pkey -pubin -in ${pubKeyFile} -text -noout`,
    files
  )

  // Parse the public key coordinates from OpenSSL output
  // Format: pub: \n    04:xx:xx:... (uncompressed format with 04 prefix)
  const pubMatch = result.stdout.match(/pub:\s*\n\s*((?:[0-9a-f]{2}:?)+)/i)
  if (!pubMatch) {
    throw new Error('Failed to parse public key from OpenSSL output')
  }

  // Remove colons and whitespace
  const pubHex = pubMatch[1].replace(/[:\s]/g, '')

  // For P-256/P-384: First byte is 0x04 (uncompressed), then x and y coordinates
  if (pubHex.startsWith('04')) {
    const coordsHex = pubHex.slice(2) // Remove 04 prefix
    const coordLength = coordsHex.length / 2 // x and y are equal length

    const xHex = coordsHex.slice(0, coordLength)
    const yHex = coordsHex.slice(coordLength)

    // Determine curve based on coordinate length
    const crv = coordLength === 64 ? 'P-256' : coordLength === 96 ? 'P-384' : 'P-521'

    // Convert hex to bytes then to base64url
    const xBytes = hexToBytes(xHex)

    const yBytes = hexToBytes(yHex)

    return {
      kty: 'EC',
      crv,
      x: base64urlEncode(xBytes),
      y: base64urlEncode(yBytes),
    }
  }

  throw new Error('Unsupported public key format')
}

/**
 * Create SHA-256 hash for signing
 * Using @noble/hashes per cryptoimplementation.md
 */
export const createSHA256Hash = (data: Uint8Array): Uint8Array => {
  return sha256(data)
}

/**
 * Create SHA-384 hash
 */
export const createSHA384Hash = (data: Uint8Array): Uint8Array => {
  return sha384(data)
}

/**
 * Create SHA-512 hash
 */
export const createSHA512Hash = (data: Uint8Array): Uint8Array => {
  return sha512(data)
}

/**
 * Format CBOR data as hex string for mdoc display
 */
export const formatCBOR = (data: Uint8Array): string => {
  return bytesToHex(data)
}

/**
 * Create SD-JWT disclosure
 * Format: Base64URL(JSON([salt, claim_name, claim_value]))
 */
export const createDisclosure = (salt: string, claimName: string, claimValue: unknown): string => {
  const disclosure = JSON.stringify([salt, claimName, claimValue])
  const bytes = new TextEncoder().encode(disclosure)
  return base64urlEncode(bytes)
}

/**
 * Hash disclosure for SD-JWT
 * Returns Base64URL(SHA-256(disclosure))
 */
export const hashDisclosure = (disclosure: string): string => {
  const disclosureBytes = base64urlDecode(disclosure)
  const hash = sha256(disclosureBytes)
  return base64urlEncode(hash)
}

/**
 * Format bytes as hex string with colons (OpenSSL style)
 */
export const formatHexWithColons = (data: Uint8Array): string => {
  const hex = bytesToHex(data)
  return hex.match(/.{1,2}/g)?.join(':') || hex
}

/**
 * Parse hex string (with or without colons) to Uint8Array
 */
export const parseHexString = (hex: string): Uint8Array => {
  const cleanHex = hex.replace(/[:\s]/g, '')
  return hexToBytes(cleanHex)
}

/**
 * Format timestamp as ISO 8601
 */
export const formatTimestamp = (timestamp?: number): string => {
  const date = timestamp ? new Date(timestamp * 1000) : new Date()
  return date.toISOString()
}

/**
 * Create nonce for protocol messages
 */
export const createNonce = (): string => {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return base64urlEncode(bytes)
}

/**
 * Format JWT header
 */
export const formatJWTHeader = (alg: string, typ: string, kid?: string): string => {
  const header = { alg, typ, ...(kid && { kid }) }
  const bytes = new TextEncoder().encode(JSON.stringify(header))
  return base64urlEncode(bytes)
}

/**
 * Format JWT payload
 */
export const formatJWTPayload = (payload: object): string => {
  const bytes = new TextEncoder().encode(JSON.stringify(payload))
  return base64urlEncode(bytes)
}

/**
 * Extract private key hex from OpenSSL text output
 * Following cryptoimplementation.md warning about fragility
 */
export const extractPrivateKeyHex = (opensslTextOutput: string): string => {
  // Try to match private key section
  const privMatch = opensslTextOutput.match(/priv:\s*\n\s*((?:[0-9a-f]{2}:?)+)/i)
  if (!privMatch) {
    throw new Error('Failed to parse private key from OpenSSL output')
  }

  // Remove colons and whitespace
  const privHex = privMatch[1].replace(/[:\s]/g, '')

  // Validate length (32 bytes for P-256, 48 bytes for P-384, 66 bytes for P-521)
  if (![64, 96, 132].includes(privHex.length)) {
    throw new Error(
      `Invalid private key length: ${privHex.length} hex chars. Expected 64 (P-256), 96 (P-384), or 132 (P-521)`
    )
  }

  return privHex
}

/**
 * Format signature as Base64
 */
export const formatSignatureBase64 = (signature: Uint8Array): string => {
  return base64Encode(signature)
}

/**
 * Format signature as Base64URL
 */
export const formatSignatureBase64URL = (signature: Uint8Array): string => {
  return base64urlEncode(signature)
}
