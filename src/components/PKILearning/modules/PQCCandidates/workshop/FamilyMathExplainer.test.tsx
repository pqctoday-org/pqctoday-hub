// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import '@testing-library/jest-dom'
import { FamilyMathExplainer } from './FamilyMathExplainer'
import { FAMILIES } from '../data/families'

const textOf = (container: HTMLElement) => (container.textContent ?? '').replace(/\s+/g, ' ')

describe('FamilyMathExplainer: MPC-in-the-Head assumptions', () => {
  it('names a different hard problem for FAEST, MQOM and SDitH', () => {
    const { container } = render(<FamilyMathExplainer initialFamilyId="mpcith" />)
    const text = textOf(container)
    // Each candidate is tied to its own assumption.
    expect(text).toMatch(/FAEST[^.]*\bAES\b/)
    expect(text).toMatch(/MQOM[^.]*(multivariate|MQ)/)
    expect(text).toMatch(/SDitH[^.]*syndrome decoding/)
  })

  it('does not reduce the whole family to symmetric primitives', () => {
    const { container } = render(<FamilyMathExplainer initialFamilyId="mpcith" />)
    const text = textOf(container)
    expect(text).not.toMatch(/built entirely from/i)
    expect(text).not.toMatch(/reduces? to the symmetric primitives/i)
    expect(text).not.toMatch(/hash-based for SDitH/i)
    expect(text).not.toMatch(/most conservative bet of the four/i)
  })

  it('keeps the data-level hardness statement per candidate and the MQOM proof caveat', () => {
    const { hardness, openConcerns } = FAMILIES.mpcith
    expect(hardness).toMatch(/FAEST[^.]*AES/)
    expect(hardness).toMatch(/MQOM[^.]*multivariate/)
    expect(hardness).toMatch(/SDitH[^.]*syndrome decoding/)
    expect(openConcerns).toMatch(/MQOM/)
    expect(openConcerns).toMatch(/might not be considered mature or complete/)
  })
})

describe('FamilyMathExplainer: Falcon and HAWK sampling', () => {
  it('describes randomised discrete Gaussian sampling, not deterministic rounding', () => {
    const { container } = render(<FamilyMathExplainer initialFamilyId="lattice" />)
    const text = textOf(container)
    expect(text).toMatch(/discrete Gaussian/i)
    expect(text).toMatch(/random/i)
    expect(text).not.toMatch(/Babai/i)
    expect(text).not.toMatch(/continuous Gaussian/i)
    expect(text).not.toMatch(/round\s*→\s*1/)
  })

  it('labels the geometric diagram as intuition and keeps the HAWK withdrawal warning beside it', () => {
    const { container } = render(<FamilyMathExplainer initialFamilyId="lattice" />)
    const text = textOf(container)
    expect(text).toMatch(/geometric intuition/i)
    expect(text).toMatch(/HAWK was withdrawn/i)
    expect(text).toMatch(/should not be used/i)
  })

  it('does not call the Falcon geometry "closest atom" rounding in the plain-language analogy', () => {
    expect(FAMILIES.lattice.layman.analogy).not.toMatch(/closest to a randomly-pointed laser dot/)
    expect(FAMILIES.lattice.layman.analogy).toMatch(/bell curve/)
  })
})
