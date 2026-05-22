// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ModuleCertificationStatus } from './ModuleCertificationStatus'
import type { ComplianceRecord } from '../../types'

const stub = (overrides: Partial<ComplianceRecord>): ComplianceRecord =>
  ({
    id: '1',
    source: 'NIST',
    date: '2026-01-01',
    link: '',
    type: 'FIPS 140-3',
    status: 'Active',
    pqcCoverage: 'No PQC Mechanisms Detected',
    productName: 'Test',
    productCategory: '',
    vendor: '',
    ...overrides,
  }) as ComplianceRecord

const renderPanel = (records: ComplianceRecord[]) =>
  render(
    <MemoryRouter>
      <ModuleCertificationStatus records={records} />
    </MemoryRouter>
  )

describe('ModuleCertificationStatus', () => {
  it('renders nothing when no records are passed', () => {
    const { container } = renderPanel([])
    expect(container.firstChild).toBeNull()
  })

  it('counts ML-KEM and ML-DSA matches separately', () => {
    renderPanel([
      stub({ id: '1', pqcCoverage: 'ML-DSA, ML-KEM' }),
      stub({ id: '2', pqcCoverage: 'ML-KEM' }),
      stub({ id: '3', pqcCoverage: 'No PQC Mechanisms Detected' }),
    ])
    // 3 total, 2 with PQC (67%), ML-KEM=2 (rows 1+2), ML-DSA=1 (row 1)
    expect(screen.getByText('Modules tracked').parentElement).toHaveTextContent('3')
    const pqcTile = screen.getByText('With PQC support').parentElement
    expect(pqcTile).toHaveTextContent('2')
    expect(pqcTile).toHaveTextContent('67%')
    expect(screen.getByText('ML-KEM validated').parentElement).toHaveTextContent('2')
    expect(screen.getByText('ML-DSA validated').parentElement).toHaveTextContent('1')
  })

  it('mentions the count of classical-only modules in the footer', () => {
    renderPanel([
      stub({ id: '1', pqcCoverage: 'No PQC Mechanisms Detected' }),
      stub({ id: '2', pqcCoverage: '' }),
      stub({ id: '3', pqcCoverage: 'ML-KEM' }),
    ])
    // 2 are no-PQC (one explicit, one empty string)
    expect(
      screen.getByText(/2 modules in the registry still ship classical-only/)
    ).toBeInTheDocument()
  })

  it('links to the Records tab', () => {
    renderPanel([stub({ id: '1', pqcCoverage: 'ML-KEM' })])
    const link = screen.getByRole('link', { name: /open the records tab/i })
    expect(link).toHaveAttribute('href', '/compliance?tab=records')
  })
})
