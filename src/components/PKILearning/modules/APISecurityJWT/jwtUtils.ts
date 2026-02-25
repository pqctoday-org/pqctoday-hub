/* eslint-disable security/detect-object-injection */
// ── JWT Helper Utilities ────────────────────────────────────────────────────

/**
 * Encode a Uint8Array as a base64url string (no padding).
 */
export function base64urlEncode(data: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < data.length; i++) {
    binary += String.fromCharCode(data[i])
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/**
 * Decode a base64url string to a Uint8Array.
 */
export function base64urlDecode(str: string): Uint8Array {
  // Restore standard base64 characters and padding
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/')
  while (base64.length % 4 !== 0) {
    base64 += '='
  }
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

/**
 * Decode a JWT string into its three parts: header, payload, signature.
 * Returns null if the token cannot be decoded.
 */
export function decodeJWT(
  token: string
): { header: Record<string, unknown>; payload: Record<string, unknown>; signature: string } | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null

    const headerBytes = base64urlDecode(parts[0])
    const payloadBytes = base64urlDecode(parts[1])

    const headerJson = new TextDecoder().decode(headerBytes)
    const payloadJson = new TextDecoder().decode(payloadBytes)

    const header = JSON.parse(headerJson) as Record<string, unknown>
    const payload = JSON.parse(payloadJson) as Record<string, unknown>

    return { header, payload, signature: parts[2] }
  } catch {
    return null
  }
}

/**
 * Create a base64url-encoded JOSE header.
 */
export function createJWTHeader(alg: string): string {
  const header = { alg, typ: 'JWT' }
  const json = JSON.stringify(header)
  const bytes = new TextEncoder().encode(json)
  return base64urlEncode(bytes)
}

/**
 * Create a base64url-encoded JWT payload from claims.
 */
export function createJWTPayload(claims: Record<string, unknown>): string {
  const json = JSON.stringify(claims)
  const bytes = new TextEncoder().encode(json)
  return base64urlEncode(bytes)
}

/**
 * Calculate JWT sizes given the component sizes.
 * Returns the size of each base64url-encoded part and total with dots.
 */
export function calculateJWTSize(
  headerSize: number,
  payloadSize: number,
  sigBytes: number
): { headerB64: number; payloadB64: number; signatureB64: number; total: number; dots: number } {
  // Base64url encoding expands bytes by ~4/3 (no padding)
  const headerB64 = Math.ceil((headerSize * 4) / 3)
  const payloadB64 = Math.ceil((payloadSize * 4) / 3)
  const signatureB64 = Math.ceil((sigBytes * 4) / 3)
  const dots = 2 // Two dots separating the three parts
  const total = headerB64 + payloadB64 + signatureB64 + dots

  return { headerB64, payloadB64, signatureB64, total, dots }
}

/**
 * Generate a simulated hex string of a given byte length.
 * Used for realistic-looking demo output.
 */
export function simulateHexBytes(byteCount: number): string {
  const chars = '0123456789abcdef'
  let result = ''
  for (let i = 0; i < byteCount * 2; i++) {
    result += chars[Math.floor(Math.random() * 16)]
  }
  return result
}

/**
 * Generate a simulated base64url string of a given byte length.
 * Used for realistic-looking demo signatures/ciphertexts.
 */
export function simulateBase64url(byteCount: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'
  const b64Length = Math.ceil((byteCount * 4) / 3)
  let result = ''
  for (let i = 0; i < b64Length; i++) {
    result += chars[Math.floor(Math.random() * 64)]
  }
  return result
}
