// SPDX-License-Identifier: AGPL-3.0-only
//
// A Common Criteria Portal listing carries no scheme certificate number; the table must
// not show the internal slug in the certificate-number cell as if it were one.
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
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

  it('shows the EUCC number a Common Criteria Portal listing ends its name with', () => {
    const portal: ComplianceRecord = {
      ...base,
      id: 'cc-st33ktpm2xspi-st33ktpm2x-tpm-firmware-9-528-eucc-3090-2026-64-6c2e08dd',
      type: 'Common Criteria',
      source: 'Common Criteria',
      productName: 'ST33KTPM2XSPI & ST33KTPM2X,TPM FIRMWARE 9.528 (EUCC-3090-2026-64)',
    }
    render(<ComplianceTable data={[portal]} onRefresh={vi.fn()} />)
    expect(screen.getAllByText('EUCC-3090-2026-64').length).toBeGreaterThan(0)
    expect(screen.queryByText('No scheme number in the listing')).not.toBeInTheDocument()
  })
})

describe('ComplianceTable EUCC search and tab', () => {
  const nokia: ComplianceRecord = {
    ...base,
    id: 'enisa-eucc-3089-2026-000002-i-00',
    euccCertificateId: 'EUCC-3089-2026-002',
    type: 'EUCC',
    source: 'ENISA',
    productName: 'Nokia Lightspan Access Node MF-2',
    vendor: 'Nokia Solutions and Networks Oy',
  }
  const portal: ComplianceRecord = {
    ...base,
    id: 'cc-secure-module-1-0-3881cf5c',
    type: 'Common Criteria',
    source: 'Common Criteria',
    productName: 'Secure Module',
    vendor: 'Secure Co',
  }

  it('finds the Nokia record by the certificate number the table shows, and not the Common Criteria row', () => {
    render(<ComplianceTable data={[nokia, portal, base]} filterText="EUCC-3089-2026-002" />)
    expect(screen.getAllByText('Nokia Lightspan Access Node MF-2').length).toBeGreaterThan(0)
    expect(screen.queryByText('Secure Module')).not.toBeInTheDocument()
    expect(screen.queryByText('Module A')).not.toBeInTheDocument()
  })

  it('says the search takes a certificate number', () => {
    render(<ComplianceTable data={[nokia]} />)
    expect(screen.getByPlaceholderText(/certificate #/)).toBeInTheDocument()
  })

  it('has an EUCC (ENISA) tab that selects ?rtab=eucc and lists EUCC records only', () => {
    const onCertTypeChange = vi.fn()
    const { rerender } = render(
      <ComplianceTable data={[nokia, portal, base]} onCertTypeChange={onCertTypeChange} />
    )
    fireEvent.click(screen.getByRole('button', { name: 'EUCC (ENISA)' }))
    expect(onCertTypeChange).toHaveBeenCalledWith('eucc')
    rerender(<ComplianceTable data={[nokia, portal, base]} certType="eucc" />)
    expect(screen.getAllByText('Nokia Lightspan Access Node MF-2').length).toBeGreaterThan(0)
    expect(screen.queryByText('Secure Module')).not.toBeInTheDocument()
    expect(screen.queryByText('Module A')).not.toBeInTheDocument()
    // The Common Criteria tab shows none of the EUCC records.
    rerender(<ComplianceTable data={[nokia, portal, base]} certType="cc" />)
    expect(screen.queryByText('Nokia Lightspan Access Node MF-2')).not.toBeInTheDocument()
    expect(screen.getAllByText('Secure Module').length).toBeGreaterThan(0)
  })
})
