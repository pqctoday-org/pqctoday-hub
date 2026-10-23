// SPDX-License-Identifier: AGPL-3.0-only
//
// The phone Records list carries the same reading aids the table has: that the list is a
// snapshot (not a live feed), when each source was retrieved (UTC), and a one-line PQC
// stage summary in place of the chart. A Common Criteria listing with no scheme number
// must not show its internal slug as a certificate number.
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { MobileComplianceView, type MobileCertRecord } from './MobileComplianceView'
import { usePersonaStore } from '@/store/usePersonaStore'

const fips: MobileCertRecord = {
  id: '4389',
  source: 'NIST',
  date: '2025-03-01',
  link: 'https://example.test/4389',
  type: 'FIPS 140-3',
  status: 'Active',
  productName: 'Acme Crypto Module',
  productCategory: 'HSM',
  vendor: 'Acme',
  pqcCoverage: 'ML-KEM, ML-DSA',
}

const fipsNoPqc: MobileCertRecord = {
  ...fips,
  id: '4390',
  productName: 'Plain Module',
  pqcCoverage: 'No PQC Mechanisms Detected',
}

const cavp: MobileCertRecord = {
  id: 'A5555',
  source: 'NIST',
  date: '2024-06-01',
  link: 'https://example.test/A5555',
  type: 'ACVP',
  status: 'Validated',
  productName: 'Beta Library',
  productCategory: 'Library',
  vendor: 'Beta',
  pqcCoverage: 'ML-DSA',
}

const ccPortal: MobileCertRecord = {
  id: 'cc-gamma-smart-card-3881cf5c',
  source: 'Common Criteria',
  date: '2026-02-01',
  link: 'https://example.test/cc',
  type: 'Common Criteria',
  status: 'Active',
  productName: 'Gamma Smart Card',
  productCategory: 'Smart Card',
  vendor: 'Gamma',
}

const meta = {
  partitions: {
    fips: { label: 'NIST CMVP', retrievedAt: '2026-10-23T02:05:53+00:00' },
    cavp: { label: 'NIST CAVP', retrievedAt: '2026-10-22T23:10:00+00:00' },
  },
}

function renderRecords(withMeta = true) {
  const records = [fips, fipsNoPqc, cavp, ccPortal]
  return render(
    <MemoryRouter initialEntries={['/compliance?tab=records']}>
      <MobileComplianceView records={records} recordsLoaded meta={withMeta ? meta : undefined} />
    </MemoryRouter>
  )
}

beforeEach(() => {
  usePersonaStore.setState({ selectedPersona: null, selectedIndustries: [], selectedRegion: null })
})

describe('MobileComplianceView — Records reading aids', () => {
  it('says the list is a snapshot, not a live feed', () => {
    renderRecords()
    expect(screen.getByTestId('records-phone-snapshot')).toHaveTextContent(
      'Snapshot, not a live feed — confirm status on the official register'
    )
  })

  it('prints the retrieval dates and labels them UTC', () => {
    renderRecords()
    const block = within(screen.getByTestId('records-phone-snapshot'))
    expect(
      block.getByText(
        'NIST CMVP retrieved 23 Oct 2026 · NIST CAVP retrieved 22 Oct 2026 (dates in UTC)'
      )
    ).toBeInTheDocument()
  })

  it('keeps a one-line PQC stage summary in place of the chart', () => {
    renderRecords()
    expect(screen.getByTestId('records-phone-snapshot')).toHaveTextContent(
      'PQC in this snapshot: 1 of 2 FIPS 140-3 certificates · 1 CAVP validations.'
    )
  })

  it('omits the retrieval line when the snapshot has no sidecar', () => {
    renderRecords(false)
    expect(screen.getByTestId('records-phone-snapshot')).not.toHaveTextContent(/retrieved/)
  })

  it('does not print a generated Common Criteria slug as a certificate number', () => {
    renderRecords()
    const list = within(screen.getByRole('region', { name: 'Certification records' }))
    const card = list.getByRole('button', { name: /Gamma Smart Card/ })
    expect(card).not.toHaveTextContent('cc-gamma-smart-card-3881cf5c')
    expect(card).toHaveTextContent('Gamma · Common Criteria · 2026-02-01')
  })
})
