// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { MODELS } from './models'

describe('acceleration models: the ASIC entry', () => {
  const asic = MODELS.find((m) => m.id === 'asic')
  const text = [
    asic?.tagline,
    asic?.layman.analogy,
    asic?.layman.whatsDifferent,
    asic?.layman.catch,
  ].join(' ')

  it('does not equate fixed circuits with an algorithm that can never be updated', () => {
    expect(asic).toBeDefined()
    expect(text).not.toMatch(/frozen forever/)
    expect(text).not.toMatch(/the parameter sets are fixed at tape-out/)
    expect(text).toMatch(/circuits are fixed at tape-out/)
    expect(text).toMatch(/hard-wired or in ROM, or in writable microcode or firmware/)
    expect(text).toMatch(
      /writable, authenticated microcode, you can change the steps but still not the walls/
    )
  })

  it('does not imply that being an ASIC proves resistance to physical attacks', () => {
    expect(text).toMatch(
      /Dedicated silicon says nothing by itself about resistance to physical or side-channel attacks/
    )
  })
})
