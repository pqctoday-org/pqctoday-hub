// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import type { ThreatItem } from '@/data/threatsData'
import { ThreatsTable } from './ThreatsTable'

const threat = (partial: Partial<ThreatItem>): ThreatItem => ({
  industry: 'Insurance',
  threatId: 'INS-X',
  description: 'A test threat.',
  criticality: 'High',
  cryptoAtRisk: 'RSA-2048',
  pqcReplacement: 'ML-KEM-768',
  mainSource: 'Test Source',
  sourceUrl: '',
  relatedModules: [],
  threatClass: 'both',
  ...partial,
})

const renderTable = (items: ThreatItem[]) =>
  render(
    <MemoryRouter>
      <ThreatsTable
        items={items}
        sortField="industry"
        sortDirection="asc"
        onSort={vi.fn()}
        onItemClick={vi.fn()}
      />
    </MemoryRouter>
  )

describe('ThreatsTable layout (UX-14)', () => {
  it('drops the repeated Industry column when the rows are one industry', () => {
    renderTable([threat({ threatId: 'INS-1' }), threat({ threatId: 'INS-2' })])
    expect(screen.queryByRole('columnheader', { name: /Industry/ })).not.toBeInTheDocument()
    // The industry is still named once, on its group header row.
    expect(screen.getByText('Insurance')).toBeInTheDocument()
  })

  it('keeps the Industry column when the rows span industries', () => {
    renderTable([
      threat({ threatId: 'INS-1' }),
      threat({ threatId: 'FIN-1', industry: 'Finance & Banking' }),
    ])
    expect(screen.getByRole('columnheader', { name: /Industry/ })).toBeInTheDocument()
  })

  it('has no chevron-only Info column', () => {
    renderTable([threat({})])
    expect(screen.queryByRole('columnheader', { name: 'Info' })).not.toBeInTheDocument()
  })

  it('lets the class badge wrap rather than clip "HNDL + HNFL"', () => {
    renderTable([threat({})])
    const badge = screen.getByRole('button', { name: 'HNDL + HNFL definition' })
    expect(badge).toHaveClass('whitespace-normal')
  })
})
