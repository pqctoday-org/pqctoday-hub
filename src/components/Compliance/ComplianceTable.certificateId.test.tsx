// SPDX-License-Identifier: AGPL-3.0-only
//
// A Common Criteria Portal listing carries no scheme certificate number; the table must
// not show the internal slug in the certificate-number cell as if it were one.
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { ComplianceTable } from './ComplianceTable'
import type { ComplianceRecord } from './types'

const base: ComplianceRecord = {
  id: '5560',
  source: 'NIST',
  date: '2026-10-21',
  link: 'https://example.test',
  type: 'FIPS 140-3',
  status: 'Active',
  pqcCoverage: '',
  productName: 'Module A',
  productCategory: 'HSM',
  vendor: 'Vendor A',
}

describe('ComplianceTable certificate number', () => {
  it('shows the generated Common Criteria slug as "no scheme number", not as a number', () => {
    const cc: ComplianceRecord = {
      ...base,
      id: 'cc-secure-module-1-0-3881cf5c',
      type: 'Common Criteria',
      source: 'Common Criteria',
      productName: 'Secure Module',
    }
    render(<ComplianceTable data={[cc]} onRefresh={vi.fn()} />)
    expect(screen.queryByText(/cc-secure-module-1-0-3881cf5c/)).not.toBeInTheDocument()
    expect(screen.getAllByText('No scheme number in the listing').length).toBeGreaterThan(0)
  })

  it('shows the EUCC certificate number, not the generated record id', () => {
    const eucc: ComplianceRecord = {
      ...base,
      id: 'enisa-eucc-3089-2026-000002-i-00',
      euccCertificateId: 'EUCC-3089-2026-002',
      type: 'EUCC',
      source: 'ENISA',
      productName: 'Nokia Lightspan Access Node MF-2',
    }
    render(<ComplianceTable data={[eucc]} onRefresh={vi.fn()} />)
    expect(screen.getAllByText('EUCC-3089-2026-002').length).toBeGreaterThan(0)
    expect(screen.queryByText(/enisa-eucc-3089-2026/)).not.toBeInTheDocument()
  })

  it('still shows a real certificate number', () => {
    render(<ComplianceTable data={[base]} onRefresh={vi.fn()} />)
    expect(screen.getAllByText('5560').length).toBeGreaterThan(0)
  })
})
