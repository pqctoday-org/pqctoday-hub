// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The memory-encryption threat vector used to say "Intel (Granite Rapids+): 2027, AMD (Zen 6+):
 * 2028" for AES-256 memory encryption. Intel's Multi-Key Total Memory Encryption specification
 * (rev 1.7) says memory is encrypted with AES-XTS "with 128-bit keys or 256-bit keys, depending on
 * the algorithm availability and selection" and gives no processor generation or date; no source
 * for the AMD date was found. The two dates are not printed.
 */
import { describe, it, expect } from 'vitest'
import { QUANTUM_THREAT_VECTORS } from './attestationData'

describe('memory encryption threat vector: vendor timeline', () => {
  const vector = QUANTUM_THREAT_VECTORS.find((v) => v.id === 'memory-encryption-grover')

  it('is there', () => {
    expect(vector).toBeDefined()
  })

  it('prints no processor generation and no year it cannot source', () => {
    expect(vector?.vendorTimeline).toBe('Intel: TBD, AMD: TBD')
    expect(vector?.vendorTimeline).not.toMatch(/Granite Rapids|Zen 6|20\d\d/)
  })
})
