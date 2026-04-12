// SPDX-License-Identifier: GPL-3.0-only
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

/**
 * Linear Congruential Generator — deliberately weak PRNG for educational demos.
 * Uses the classic Numerical Recipes parameters: a=1664525, c=1013904223, m=2^32.
 * NOT a NIST SP 800-90A approved construction — included only to demonstrate
 * the predictability and seed-guessability of non-cryptographic PRNGs.
 *
 * Weakness 1 — parameters: short effective period, poor high-dimensional
 * distribution (Marsaglia's theorem), and known spectral failures.
 * Weakness 2 — seed: Date.now() has ~1ms resolution; an attacker who knows
 * the approximate generation time can enumerate ≤ ~86,400,000 candidates/day,
 * making brute-force trivially feasible on any normal hardware.
 */
export interface LCGResult {
  bytes: Uint8Array
  finalState: number
  /** Multiplier (a) used in the recurrence: state = (a × state + c) mod m */
  a: number
  /** Increment (c) used in the recurrence */
  c: number
  /** Modulus m = 2^32 (implicit via 32-bit unsigned overflow) */
  m: number
  /** Seed value supplied at construction time */
  seed: number
}

export function lcgBytes(count: number, seed: number): LCGResult {
  const a = 1664525
  const c = 1013904223
  const bytes = new Uint8Array(count)
  let state = seed >>> 0 // Ensure unsigned 32-bit
  for (let i = 0; i < count; i++) {
    state = (Math.imul(a, state) + c) >>> 0
    bytes[i] = (state >>> 24) & 0xff // Use high byte (less predictable than low bits)
  }
  return { bytes, finalState: state, a, c, m: 0x100000000, seed: seed >>> 0 }
}

/** Generate the next N bytes from a given LCG state (for prediction demo) */
export function lcgPredict(count: number, state: number): LCGResult {
  return lcgBytes(count, state)
}

/** Generate bytes from Math.random() — NOT cryptographically secure */
export function mathRandomBytes(count: number): Uint8Array {
  const bytes = new Uint8Array(count)
  for (let i = 0; i < count; i++) {
    bytes[i] = Math.floor(Math.random() * 256)
  }
  return bytes
}
