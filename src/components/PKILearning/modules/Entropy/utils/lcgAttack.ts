// SPDX-License-Identifier: AGPL-3.0-only
import { lcgBytes } from './outputFormatters'

export interface LcgSeedRecovery {
  seed: number
  candidatesChecked: number
}

function bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false
  return a.every((byte, index) => byte === b[index])
}

/**
 * Search a timestamp window for an LCG seed that reproduces an observed prefix.
 * This is intentionally bounded for the browser workshop; it demonstrates the
 * attack structure without presenting the exercise as a performance benchmark.
 */
export function recoverLcgTimestampSeed(
  observedPrefix: Uint8Array,
  approximateSeed: number,
  radiusMs: number
): LcgSeedRecovery | null {
  if (observedPrefix.length === 0 || radiusMs < 0 || !Number.isInteger(radiusMs)) return null

  let candidatesChecked = 0
  for (let offset = -radiusMs; offset <= radiusMs; offset++) {
    const seed = (approximateSeed + offset) >>> 0
    candidatesChecked++
    if (bytesEqual(lcgBytes(observedPrefix.length, seed).bytes, observedPrefix)) {
      return { seed, candidatesChecked }
    }
  }
  return null
}
