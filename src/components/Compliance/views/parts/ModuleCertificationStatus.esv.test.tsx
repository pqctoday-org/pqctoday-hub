// SPDX-License-Identifier: AGPL-3.0-only
//
// An entropy source validation says nothing about PQC: the PQC status panel must neither
// count it as a current record nor as "not read".
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { MemoryRouter } from 'react-router'
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
    pqcCoverage: 'ML-KEM',
    productName: 'Test',
    productCategory: '',
    vendor: '',
    ...overrides,
  }) as ComplianceRecord

describe('ModuleCertificationStatus — entropy source validations', () => {
  it('leaves ESV records out of every count', () => {
    render(
      <MemoryRouter>
        <ModuleCertificationStatus
          records={[
            stub({ id: '1' }),
            stub({ id: 'E1', type: 'ESV', status: 'Validated', pqcCoverage: '' }),
            stub({ id: 'E2', type: 'ESV', status: 'Validated', pqcCoverage: '' }),
          ]}
        />
      </MemoryRouter>
    )
    expect(screen.getByText('Current records').parentElement).toHaveTextContent('1')
    expect(screen.queryByText(/not read \/ not yet analyzed/)).not.toBeInTheDocument()
  })

  it('renders nothing when the only records are entropy certificates', () => {
    const { container } = render(
      <MemoryRouter>
        <ModuleCertificationStatus
          records={[stub({ id: 'E1', type: 'ESV', status: 'Validated', pqcCoverage: '' })]}
        />
      </MemoryRouter>
    )
    expect(container.firstChild).toBeNull()
  })
})
