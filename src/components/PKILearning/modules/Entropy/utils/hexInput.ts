// SPDX-License-Identifier: AGPL-3.0-only

export type HexParseResult =
  { ok: true; bytes: Uint8Array; normalized: string } | { ok: false; error: string }

/** Parse learner-supplied hex without changing its byte values. */
export function parseHexBytes(input: string): HexParseResult {
  const normalized = input.replace(/0x/gi, '').replace(/[\s,]/g, '')

  if (normalized.length < 2) {
    return { ok: false, error: 'Hex string must contain at least one complete byte.' }
  }
  if (!/^[0-9a-fA-F]+$/.test(normalized)) {
    return { ok: false, error: 'Invalid characters — enter hexadecimal digits only (0–9, a–f).' }
  }
  if (normalized.length % 2 !== 0) {
    return { ok: false, error: 'Odd number of hex digits — each byte requires 2 digits.' }
  }

  const bytes = new Uint8Array(normalized.length / 2)
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = Number.parseInt(normalized.slice(i * 2, i * 2 + 2), 16)
  }
  return { ok: true, bytes, normalized: normalized.toLowerCase() }
}
