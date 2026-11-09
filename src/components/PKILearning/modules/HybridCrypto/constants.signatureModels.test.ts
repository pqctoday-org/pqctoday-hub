// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { HYBRID_SIGNATURE_MODELS } from './constants'

describe('hybrid signature models', () => {
  it('records no non-separability level for the local shared-binding model', () => {
    const model = HYBRID_SIGNATURE_MODELS.find((m) => m.id === 'silithium')
    expect(model).toBeDefined()
    // Its description disclaims any non-separability claim, so the data must not claim one.
    expect(model?.description).toContain('No security proof or non-separability claim')
    expect(model?.nonSeparability).toBe('unclaimed')
  })

  it('keeps the RFC 9955 levels for concatenation and nesting', () => {
    const levels = Object.fromEntries(HYBRID_SIGNATURE_MODELS.map((m) => [m.id, m.nonSeparability]))
    expect(levels.concatenation).toBe('none')
    expect(levels.nesting).toBe('wns')
  })
})
