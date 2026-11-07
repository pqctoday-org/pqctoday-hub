// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AlgorithmFamilyWorkshop } from './AlgorithmFamilyWorkshop'

const flat = (el: Element) => (el.textContent ?? '').replace(/\s+/g, ' ')

describe('AlgorithmFamilyWorkshop: quantum resistance is not "no quantum speedup at all"', () => {
  it('lattice panel says no efficient quantum algorithm is known and that generic quantum search still applies', () => {
    const { container } = render(<AlgorithmFamilyWorkshop />)
    const t = flat(container)
    expect(t).toMatch(/No efficient quantum algorithm is known/)
    expect(t).toMatch(/generic quantum search still applies, so parameters allow for it/)
    expect(t).not.toMatch(/No known quantum algorithm provides speedup/)
  })

  it('hash panel says a longer hash output restores the margin instead of calling doubling a complete fix', () => {
    const { container } = render(<AlgorithmFamilyWorkshop />)
    fireEvent.click(screen.getByText('Hash-Based'))
    const t = flat(container)
    expect(t).toMatch(/quadratic speedup on preimage search/)
    expect(t).not.toMatch(/complete fix/)
  })

  it('code panel does not say no quantum algorithm provides meaningful speedup', () => {
    const { container } = render(<AlgorithmFamilyWorkshop />)
    fireEvent.click(screen.getByText('Code-Based'))
    fireEvent.click(screen.getByText('Encode with Redundancy'))
    fireEvent.change(screen.getByLabelText('Error injection count'), { target: { value: '1' } })
    const t = flat(container)
    expect(t).toMatch(
      /No efficient quantum break is known, though generic quantum search can still speed up brute-force-style attacks/
    )
    expect(t).not.toMatch(/provides meaningful speedup/)
    expect(t).not.toMatch(/resisted all attacks since 1978/)
  })
})
