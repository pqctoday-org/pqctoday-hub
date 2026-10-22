import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { PqcImpact } from './SharedSections'
import { HYBRID_POSITIONS } from '../../data/sharedData'

describe('Hybrid or standalone comparison', () => {
  it('compares the four schemes with a Library source on every row', () => {
    render(
      <MemoryRouter>
        <PqcImpact />
      </MemoryRouter>
    )
    expect(
      screen.getByRole('heading', { name: 'Hybrid or standalone: what each scheme expects' })
    ).toBeInTheDocument()
    const table = screen.getByRole('table', { name: 'Hybrid or standalone PQC, by scheme' })
    expect(within(table).getAllByRole('row')).toHaveLength(HYBRID_POSITIONS.length + 1)
    for (const row of HYBRID_POSITIONS) expect(row.sources.length).toBeGreaterThan(0)
    expect(table).toHaveTextContent('The Implementation Guidance has no hybrid-signature scenario')
    expect(table).toHaveTextContent('may however also be used in a standalone way')
    expect(screen.getByText(/IETF Composite ML-DSA/)).toHaveTextContent(
      'Re-check before relying on this table'
    )
  })
})
