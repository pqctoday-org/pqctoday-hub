// SPDX-License-Identifier: AGPL-3.0-only
// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { D4_DATASETS } from './syntheticDatasets'

describe('D4 synthetic datasets — teaching notes', () => {
  const note = (id: string) => D4_DATASETS.find((d) => d.id === id)?.teachingNote ?? ''

  it('presents the Markov 0.515 figure as the ideal-model rate, not the true entropy of the fixed-seed sample', () => {
    const t = note('d4-markov-1bit')
    expect(t).not.toMatch(/true per-sample min-entropy/i)
    expect(t).toMatch(/ideal stochastic Markov source/)
    expect(t).toMatch(/asymptotic min-entropy rate/)
    expect(t).toMatch(/approximately −log2\(0\.7\) ≈ 0\.515 bits\/sample/)
    expect(t).toMatch(/fixed-seed demonstration has no fresh entropy/)
    expect(t).toMatch(/not the true entropy of these bytes/)
  })

  it('keeps the contrasting ideal-source scope on the biased-bit note', () => {
    expect(note('d4-biased-1bit')).toMatch(/For an ideal independent source/)
  })
})
