// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { lcgBytes } from './outputFormatters'
import { recoverLcgTimestampSeed } from './lcgAttack'

describe('recoverLcgTimestampSeed', () => {
  it('recovers a timestamp seed from an observed prefix inside the search window', () => {
    const seed = 0x12345678
    const observed = lcgBytes(8, seed).bytes.slice(0, 4)

    const recovered = recoverLcgTimestampSeed(observed, seed + 137, 250)

    expect(recovered?.seed).toBe(seed)
    expect(recovered?.candidatesChecked).toBeGreaterThan(0)
  })

  it('returns null when the seed is outside the search window', () => {
    const seed = 0x12345678
    const observed = lcgBytes(8, seed).bytes.slice(0, 4)

    expect(recoverLcgTimestampSeed(observed, seed + 1_000, 100)).toBeNull()
  })

  it('rejects empty prefixes and invalid radii', () => {
    expect(recoverLcgTimestampSeed(new Uint8Array(), 1, 100)).toBeNull()
    expect(recoverLcgTimestampSeed(new Uint8Array([1]), 1, -1)).toBeNull()
    expect(recoverLcgTimestampSeed(new Uint8Array([1]), 1, 1.5)).toBeNull()
  })
})
