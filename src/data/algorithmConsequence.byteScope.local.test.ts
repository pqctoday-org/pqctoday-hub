// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it, vi } from 'vitest'
import { transitionConsequence } from './algorithmConsequence'
import { ALGORITHM_REGISTRY } from './algorithmProperties'

vi.mock('./algorithmProperties', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./algorithmProperties')>()
  const template = actual.ALGORITHM_REGISTRY['ML-DSA-44']
  return {
    ...actual,
    ALGORITHM_REGISTRY: {
      ...actual.ALGORITHM_REGISTRY,
      'Sample-100': { ...template, name: 'Sample-100', signatureOrCiphertextBytes: 100 },
      'Sample-105': { ...template, name: 'Sample-105', signatureOrCiphertextBytes: 105 },
      'Sample-106': { ...template, name: 'Sample-106', signatureOrCiphertextBytes: 106 },
    },
  }
})

describe('selected byte-field comparison is not a capacity assessment', () => {
  it('does not describe a large decrease as about the same or zero capacity work', () => {
    const result = transitionConsequence('ML-DSA-87', 'ML-DSA-44')!
    expect(result.growthFactor).toBe(
      ALGORITHM_REGISTRY['ML-DSA-44'].signatureOrCiphertextBytes /
        ALGORITHM_REGISTRY['ML-DSA-87'].signatureOrCiphertextBytes
    )
    expect(result.dimension).toBe('signature')
    expect(result.sentence).toContain('4,627 B → 2,420 B')
    expect(result.sentence).toContain(
      'CPU, memory, latency and end-to-end capacity requirements are not assessed'
    )
    expect(result.sentence).not.toMatch(/about the same|no capacity work|costs.*nothing/)
  })
  it('preserves the exact 1.05 boundary, byte fields and greater-growth branch', () => {
    const equal = transitionConsequence('Sample-100', 'Sample-100')!
    const boundary = transitionConsequence('Sample-100', 'Sample-105')!
    const growth = transitionConsequence('Sample-100', 'Sample-106')!
    expect(equal.growthFactor).toBe(1)
    expect(boundary.growthFactor).toBe(1.05)
    expect(boundary.sentence).toContain('100 B → 105 B for the selected byte field')
    expect(growth.growthFactor).toBe(1.06)
    expect(growth.sentence).toContain('Signatures grow 100 B → 106 B')
    expect(transitionConsequence('absent', 'Sample-105')).toBeNull()
  })
})
