// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection */

/**
 * Base64url encoding/decoding helpers for ECDSA signatures in embed URLs.
 *
 * Follows RFC 4648 §5: URL-safe alphabet (+→-, /→_), no padding.
 */

/** Encode a Uint8Array to a base64url string (no padding). */
export function base64urlEncode(data: Uint8Array): string {
  // Convert to base64 then make URL-safe
  let base64 = ''
  const bytes = new Uint8Array(data)
  for (let i = 0; i < bytes.length; i++) {
    base64 += String.fromCharCode(bytes[i])
  }
  return btoa(base64).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/** Decode a base64url string to a Uint8Array. */
export function base64urlDecode(str: string): Uint8Array {
  // Restore standard base64 alphabet + padding
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/')
  const pad = base64.length % 4
  if (pad === 2) base64 += '=='
  else if (pad === 3) base64 += '='

  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}
