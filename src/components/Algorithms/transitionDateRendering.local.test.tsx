// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { algorithmsData } from '@/data/algorithmsData'
import { MobileAlgorithmList } from './MobileAlgorithmList'
import { AlgorithmComparison } from './AlgorithmComparison'
const selected = algorithmsData.filter(
  (r) =>
    r.classical === 'RSA' &&
    r.keySize === '2048-bit' &&
    r.pqc.startsWith('ML-KEM-512') &&
    r.region === 'NIST'
)
describe('Sourced publication day and after-year policy in transition consumers', () => {
  it('renders the actual mobile row with scoped after-year evidence', () => {
    expect(selected).toHaveLength(1)
    render(
      <MemoryRouter>
        <MobileAlgorithmList data={selected} />
      </MemoryRouter>
    )
    expect(screen.getByText(selected[0].deprecationDate)).toBeInTheDocument()
    expect(screen.getByText('NIST IR 8547 (final)')).toHaveAttribute(
      'title',
      expect.stringContaining('after 2030')
    )
    expect(screen.queryByText('2030-01-01')).not.toBeInTheDocument()
  })
  it('renders the canonical publication precision in the actual desktop comparison row', async () => {
    render(
      <MemoryRouter>
        <AlgorithmComparison
          filteredData={selected}
          compareSet={new Set()}
          compareType={null}
          maxCompareReached={false}
          onToggleTransitionRow={() => {}}
        />
      </MemoryRouter>
    )
    expect(
      await screen.findByText(
        (content) =>
          content.startsWith('Standard published:') &&
          content.includes(selected[0].standardizationDate)
      )
    ).toBeInTheDocument()
    expect(screen.getAllByText(selected[0].deprecationDate).length).toBeGreaterThan(0)
    expect(screen.queryByText('2024-01-01')).not.toBeInTheDocument()
  })
})
