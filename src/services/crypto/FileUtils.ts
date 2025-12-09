/**
 * Shared utility functions for handling file operations in crypto services.
 * Extracts common logic for reading OpenSSL output files and converting formats.
 */

import type { OpenSSLCommandResult } from './OpenSSLService'

/**
 * Helper to convert Uint8Array to Hex string
 */
export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Helper to convert Hex string to Uint8Array
 */
export function hexToBytes(hex: string): Uint8Array {
  const match = hex.match(/.{1,2}/g)
  if (!match) return new Uint8Array()
  return new Uint8Array(match.map((byte) => parseInt(byte, 16)))
}

/**
 * Tries to find a file in the OpenSSL result files array.
 * If found, returns its content as a Uint8Array.
 */
export function findFileInResult(
  result: OpenSSLCommandResult,
  filename: string
): Uint8Array | undefined {
  return result.files.find((f) => f.name === filename)?.data
}

/**
 * Reads a file from OpenSSL execution result or falls back to a read command if provided.
 * In many cases, we might want to read a file that was just generated.
 * This helper standardizes the "find in result OR read explicitly" pattern.
 *
 * @param service The OpenSSL service instance (to execute read if needed)
 * @param filename The filename to read
 * @param result Optional previous command result to check first
 */
// Note: We avoid importing openSSLService directly here to prevent circular deps if not needed,
// but usually services import the singleton. For a util, passing the service or strictly
// operating on data is better. We'll keep it simple: operating on data.

/**
 * Parsed OpenSSL output often requires decoding Base64 if we used `openssl enc -base64`.
 * This helper decodes a base64 string (usually from stdout) to Uint8Array.
 */
export function decodeBase64Output(stdout: string): Uint8Array {
  const b64 = stdout.replace(/\n/g, '')
  if (!b64) return new Uint8Array()

  try {
    const binStr = atob(b64)
    const bytes = new Uint8Array(binStr.length)
    for (let i = 0; i < binStr.length; i++) {
      bytes[i] = binStr.charCodeAt(i)
    }
    return bytes
  } catch (e) {
    console.error('Failed to decode base64 output', e)
    return new Uint8Array()
  }
}
