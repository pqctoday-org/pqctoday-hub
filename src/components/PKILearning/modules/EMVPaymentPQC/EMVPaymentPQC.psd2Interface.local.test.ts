// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import ragSummary from './rag-summary.md?raw'

// Article 33 of the PSD2 technical standards does not make the customer
// interface a blanket fallback: the exemption has conditions.
describe('PSD2 access-interface summary', () => {
  const line = ragSummary.split('\n').find((l) => l.includes('Open Banking & PSD2'))

  it('finds the open banking line', () => {
    expect(line).toBeDefined()
  })

  it('describes the Art. 33 fallback as conditional on the competent authority', () => {
    expect(line).toContain(
      "contingency measures for when that interface fails, including a fallback to the interfaces the bank's own customers use unless the competent authority exempts the bank under Art. 33(6)"
    )
    expect(line).toContain(
      'all four conditions must be met; three months of wide use is only one of them'
    )
  })

  it('no longer calls the fallback mandatory', () => {
    expect(line).not.toContain('a mandatory fallback')
  })
})
