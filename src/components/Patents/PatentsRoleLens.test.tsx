// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import {
  PatentsRoleLens,
  algorithmNameMatchesFamily,
  patentTouchesPersonaAlgorithms,
  relevantAlgorithmFamilies,
} from './PatentsRoleLens'
import type { PatentItem } from '@/types/PatentTypes'

const patent = (over: Partial<PatentItem>): PatentItem =>
  ({
    patentNumber: 'US1',
    title: 't',
    assignee: 'Acme',
    pqcAlgorithms: [],
    ...over,
  }) as unknown as PatentItem

describe('patent role lens: filing-era algorithm names', () => {
  const families = ['ML-KEM', 'ML-DSA', 'SLH-DSA']

  it('counts patents that use the name current when they were filed', () => {
    for (const name of [
      'Kyber',
      'Kyber-768',
      'Kyber768',
      'CRYSTALS-KYBER',
      'CRYSTALS-Kyber',
      'Dilithium',
      'CRYSTALS-Dilithium',
      'SPHINCS+',
      'ML-KEM-768',
      'ML-DSA',
      'SLH-DSA-SHA2-128s',
    ]) {
      expect(
        patentTouchesPersonaAlgorithms(patent({ pqcAlgorithms: [name] }), families),
        name
      ).toBe(true)
    }
  })

  it('does not count a different algorithm, a general class, or a longer word that merely contains the name', () => {
    for (const name of [
      'Falcon',
      'XMSS',
      'SIKE',
      'lattice-based',
      'Kyberslash',
      'ML-KEMX',
      'Not-ML-KEM',
      'LMS',
    ]) {
      expect(
        patentTouchesPersonaAlgorithms(patent({ pqcAlgorithms: [name] }), families),
        name
      ).toBe(false)
    }
    expect(patentTouchesPersonaAlgorithms(patent({ pqcAlgorithms: [] }), families)).toBe(false)
  })

  it('treats Falcon as FN-DSA only when the reader’s own set includes that family', () => {
    expect(algorithmNameMatchesFamily('Falcon-512', 'FN-DSA')).toBe(true)
    expect(algorithmNameMatchesFamily('FN-DSA-512', 'FN-DSA')).toBe(true)
    expect(algorithmNameMatchesFamily('Falcon-512', 'ML-DSA')).toBe(false)
  })

  it('shows the count, the filing-era names it includes, and the limits of the catalogue', () => {
    const { container } = render(
      <MemoryRouter>
        <PatentsRoleLens
          persona={null}
          patents={[
            patent({ patentNumber: 'US1', pqcAlgorithms: ['Kyber'], assignee: 'Acme' }),
            patent({
              patentNumber: 'US2',
              pqcAlgorithms: ['CRYSTALS-Dilithium'],
              assignee: 'Beta',
            }),
            patent({ patentNumber: 'US3', pqcAlgorithms: ['lattice-based'], assignee: 'Gamma' }),
          ]}
        />
      </MemoryRouter>
    )
    expect(relevantAlgorithmFamilies(null)).toEqual(['ML-KEM', 'ML-DSA', 'SLH-DSA'])
    expect(screen.getByText(/filing-era names Kyber, Dilithium, SPHINCS\+/)).toBeInTheDocument()
    // Two of the three records name a counted algorithm; the generic "lattice-based" one is not counted.
    expect(container.textContent).toMatch(/2 of the\s*patents below name ML-KEM, ML-DSA, SLH-DSA/)
    expect(screen.getByText(/catalogue records only/)).toBeInTheDocument()
    expect(screen.getByText(/not a complete search of patent offices/)).toBeInTheDocument()
    expect(screen.getByText(/lower bound/)).toBeInTheDocument()
  })
})
