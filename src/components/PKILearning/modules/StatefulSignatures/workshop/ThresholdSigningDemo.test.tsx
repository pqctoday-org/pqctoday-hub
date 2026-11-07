// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { ThresholdSigningDemo } from './ThresholdSigningDemo'

function pageText(): string {
  render(
    <MemoryRouter>
      <ThresholdSigningDemo />
    </MemoryRouter>
  )
  return (document.body.textContent ?? '').replace(/\s+/g, ' ')
}

describe('Threshold signing demo: research basis', () => {
  it('does not present FROST as a lattice-based or post-quantum alternative', () => {
    const t = pageText()
    expect(t).not.toMatch(
      /lattice-based threshold schemes \(e\.g\., threshold Dilithium \/ FROST variants\)/
    )
    expect(t).not.toMatch(/are currently more practical/)
    expect(t).toMatch(
      /FROST \(RFC 9591\) is a different kind of scheme: a threshold Schnorr signature/
    )
    expect(t).toMatch(/depends on the discrete logarithm problem/)
    expect(t).toMatch(/not a post-quantum alternative to this construction/)
  })

  it('names a sourced research example for threshold ML-DSA without ranking practicality', () => {
    const t = pageText()
    expect(t).toMatch(/arXiv preprint 2601\.20917 on FIPS 204-compatible threshold ML-DSA/)
    expect(t).toMatch(
      /Neither a standard nor a ranking of practicality for larger thresholds is established here/
    )
  })

  it('states the Haystack limit as a number of signing coalitions, with the source figures', () => {
    const t = pageText()
    expect(t).toMatch(/fewer than about 100/)
    expect(t).toMatch(
      /5-of-10 threshold .* about 4,161 signatures per coalition, a 10-of-20 threshold only five/
    )
    expect(t).not.toMatch(/Practical only for small thresholds \(n ≤ 5–6\)/)
  })
})
