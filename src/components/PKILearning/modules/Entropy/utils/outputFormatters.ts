/**
 * Output formatting utilities for the Entropy & Randomness module.
 */

/** Format a Uint8Array as a hex string with optional grouping */
export function formatHex(data: Uint8Array, groupSize = 4): string {
  const hexParts: string[] = []
  for (let i = 0; i < data.length; i++) {
    hexParts.push(data[i].toString(16).padStart(2, '0'))
  }

  if (groupSize <= 0) return hexParts.join('')

  const groups: string[] = []
  for (let i = 0; i < hexParts.length; i += groupSize) {
    groups.push(hexParts.slice(i, i + groupSize).join(''))
  }
  return groups.join(' ')
}

/** Compute byte frequency distribution (256 buckets) */
export function byteFrequency(data: Uint8Array): number[] {
  const freq = new Array(256).fill(0)
  for (const byte of data) {
    freq[byte]++
  }
  return freq
}

/** Compute byte frequency grouped into N bins (for small sample display) */
export function binnedFrequency(data: Uint8Array, bins: number): number[] {
  const freq = new Array(bins).fill(0)
  const binSize = 256 / bins
  for (const byte of data) {
    const bin = Math.min(Math.floor(byte / binSize), bins - 1)
    freq[bin]++
  }
  return freq
}

/** Format elapsed time in milliseconds */
export function formatTiming(ms: number): string {
  if (ms < 1) return `${(ms * 1000).toFixed(0)} μs`
  if (ms < 1000) return `${ms.toFixed(1)} ms`
  return `${(ms / 1000).toFixed(2)} s`
}

/** XOR two Uint8Arrays of equal length */
export function xorBytes(a: Uint8Array, b: Uint8Array): Uint8Array {
  const len = Math.min(a.length, b.length)
  const result = new Uint8Array(len)
  for (let i = 0; i < len; i++) {
    result[i] = a[i] ^ b[i]
  }
  return result
}
