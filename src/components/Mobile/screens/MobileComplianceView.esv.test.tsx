// SPDX-License-Identifier: AGPL-3.0-only
//
// The Entropy (ESV) record type on the phone layout: a record-type chip row that honours
// ?rtab= (so /compliance?tab=records&rtab=esv opens the entropy certificates), search by
// number and vendor, and a record sheet with the entropy facts and no PQC line.
import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import '@testing-library/jest-dom'
import { MemoryRouter } from 'react-router'
import { MobileComplianceView, type MobileCertRecord } from './MobileComplianceView'

const esv = (over: Partial<MobileCertRecord>): MobileCertRecord => ({
  id: 'E321',
  source: 'NIST',
  date: '2026-03-11',
  link: 'https://csrc.nist.gov/projects/cryptographic-module-validation-program/entropy-validations/certificate/321',
  type: 'ESV',
  status: 'Validated',
  pqcCoverage: '',
  productName: 'BoringCrypto Jitter Entropy',
  productCategory: 'Entropy Source',
  vendor: 'Google, LLC',
  lab: 'EWA - Canada',
  esvStandard: 'SP 800-90B',
  esvVersion: '20250725',
  esvNoiseSourceClassification: 'Non-Physical',
  esvReuseStatus: 'Open for Reuse',
  esvFirstValidated: '2026-03-11',
  esvEntropyClaims: [
    {
      bitsOfEntropyPerOutput: 'Full entropy',
      outputSizeBits: '384',
      operatingEnvironments: ['Google Prodimage with Linux 6.6.65 on AMD EPYC 7B12'],
      conditioningComponents: [
        {
          cavp: 'A7815',
          algorithm: 'SHA2-384',
          url: 'https://csrc.nist.gov/Projects/Cryptographic-Algorithm-Validation-Program/details?validation=40425',
        },
      ],
    },
  ],
  esvValidationHistory: [{ date: '2026-03-11', lab: 'EWA - Canada' }],
  ...over,
})

const records: MobileCertRecord[] = [
  esv({}),
  esv({
    id: 'E2',
    productName: 'VaultIC408 Entropy Source',
    vendor: 'WISeKey',
    date: '2025-02-20',
    esvNoiseSourceClassification: 'Physical',
  }),
  {
    id: '5300',
    source: 'NIST',
    date: '2026-06-03',
    link: 'https://csrc.nist.gov/projects/cryptographic-module-validation-program/certificate/5300',
    type: 'FIPS 140-3',
    status: 'Active',
    pqcCoverage: 'LMS',
    productName: 'Luna M7 Cryptographic Module',
    productCategory: 'HSM',
    vendor: 'Thales',
  },
]

const luna: MobileCertRecord = {
  id: '5450',
  source: 'NIST',
  date: '2026-05-01',
  link: 'https://csrc.nist.gov/projects/cryptographic-module-validation-program/certificate/5450',
  type: 'FIPS 140-3',
  status: 'Active',
  pqcCoverage: 'LMS',
  productName: 'Luna T7',
  productCategory: 'HSM',
  vendor: 'Thales Trusted Cyber Technologies',
  certificationLevel: 'FIPS 140-3 L3',
  entropyCertificates: ['E321', 'E999'],
  entropyCertificatesSource: {
    policyUrl:
      'https://csrc.nist.gov/CSRC/media/projects/cryptographic-module-validation-program/documents/security-policies/140sp5450.pdf',
    table: 'Table 8: Entropy Certificates',
    page: 24,
  },
}
const withLinks: MobileCertRecord[] = [...records, luna]

const viewWithLinks = (url: string) =>
  render(
    <MemoryRouter initialEntries={[url]}>
      <MobileComplianceView records={withLinks} recordsLoaded />
    </MemoryRouter>
  )

const view = (url: string) =>
  render(
    <MemoryRouter initialEntries={[url]}>
      <MobileComplianceView records={records} recordsLoaded />
    </MemoryRouter>
  )

describe('MobileComplianceView — Entropy (ESV) records', () => {
  it('offers the record-type chips, ESV last', () => {
    view('/compliance?tab=records')
    const group = screen.getByRole('group', { name: 'Record type' })
    const chips = within(group)
      .getAllByRole('button')
      .map((b) => b.textContent)
    expect(chips).toEqual([
      'All Records',
      'FIPS 140-3',
      'NIST CAVP',
      'Common Criteria',
      'CSPN (ANSSI)',
      'Entropy (ESV)',
    ])
    expect(
      within(group).getByRole('button', { name: 'All Records', pressed: true })
    ).toBeInTheDocument()
  })

  it('opens the entropy certificates for ?rtab=esv, and only them', () => {
    view('/compliance?tab=records&rtab=esv')
    expect(screen.getByRole('button', { name: 'Entropy (ESV)', pressed: true })).toBeInTheDocument()
    expect(screen.getByText('BoringCrypto Jitter Entropy')).toBeInTheDocument()
    expect(screen.getByText('VaultIC408 Entropy Source')).toBeInTheDocument()
    expect(screen.queryByText('Luna M7 Cryptographic Module')).not.toBeInTheDocument()
    expect(screen.getByTestId('records-phone-esv-note')).toHaveTextContent(
      /say nothing about post-quantum algorithms/
    )
    expect(screen.getByText('2 records.')).toBeInTheDocument()
  })

  it('switches tabs with the chips and keeps All Records showing every type', () => {
    view('/compliance?tab=records')
    expect(screen.getByText('Luna M7 Cryptographic Module')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Entropy (ESV)' }))
    expect(screen.queryByText('Luna M7 Cryptographic Module')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'FIPS 140-3' }))
    expect(screen.getByText('Luna M7 Cryptographic Module')).toBeInTheDocument()
    expect(screen.queryByText('BoringCrypto Jitter Entropy')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'All Records' }))
    expect(screen.getByText('BoringCrypto Jitter Entropy')).toBeInTheDocument()
  })

  it('finds an entropy certificate by number and by vendor', () => {
    view('/compliance?tab=records&rtab=esv&q=E321')
    expect(screen.getByText('BoringCrypto Jitter Entropy')).toBeInTheDocument()
    expect(screen.queryByText('VaultIC408 Entropy Source')).not.toBeInTheDocument()
  })

  it('finds an entropy certificate by vendor', () => {
    view('/compliance?tab=records&rtab=esv&q=wisekey')
    expect(screen.getByText('VaultIC408 Entropy Source')).toBeInTheDocument()
    expect(screen.queryByText('BoringCrypto Jitter Entropy')).not.toBeInTheDocument()
  })

  it('lists the vendor, type, certificate number and date on each row', () => {
    view('/compliance?tab=records&rtab=esv&q=E321')
    expect(screen.getByText('Google, LLC · Entropy (ESV) · #E321 · 2026-03-11')).toBeInTheDocument()
  })

  it('opens a record sheet with the entropy facts and no PQC line', () => {
    view('/compliance?tab=records&rtab=esv&cert=E321')
    const sheet = screen.getByTestId('compliance-record-detail-sheet')
    const details = within(sheet).getByTestId('esv-phone-details')
    expect(within(details).getByText('SP 800-90B')).toBeInTheDocument()
    expect(within(details).getByText('Non-Physical')).toBeInTheDocument()
    expect(within(details).getByText('Open for Reuse')).toBeInTheDocument()
    expect(
      within(details).getByText(/Bits of entropy per output: Full entropy/)
    ).toBeInTheDocument()
    expect(within(details).getByRole('link', { name: /A7815/ })).toHaveAttribute(
      'href',
      expect.stringContaining('validation=40425')
    )
    expect(within(details).getByText('1 operating environment')).toBeInTheDocument()
    expect(within(sheet).getByText('Latest validation')).toBeInTheDocument()
    expect(within(sheet).queryByText(/PQC mechanisms/i)).not.toBeInTheDocument()
    expect(within(sheet).queryByText(/Unknown/)).not.toBeInTheDocument()
    expect(
      within(sheet).getByRole('link', { name: 'View the NIST entropy certificate page' })
    ).toHaveAttribute('href', records[0].link)
  })

  it('lists the entropy certificates a module names, and opens one', () => {
    viewWithLinks('/compliance?tab=records&cert=5450')
    const box = screen.getByTestId('fips-phone-entropy-certificates')
    expect(within(box).getByText(/Table 8: Entropy Certificates, PDF page 24/)).toBeInTheDocument()
    expect(within(box).getByRole('link', { name: /Security Policy \(PDF\)/ })).toHaveAttribute(
      'href',
      luna.entropyCertificatesSource!.policyUrl
    )
    // a number in the ESV list is a button; one that is not is plain text, and says so
    expect(within(box).getByText('E999')).toBeInTheDocument()
    expect(within(box).getByText(/not in this snapshot.s ESV list/)).toBeInTheDocument()
    expect(within(box).queryByRole('button', { name: 'E999' })).not.toBeInTheDocument()
    fireEvent.click(within(box).getByRole('button', { name: 'E321' }))
    // the sheet now shows the entropy certificate, with the module that relies on it
    const used = screen.getByTestId('esv-phone-used-by')
    expect(within(used).getByText('Luna T7')).toBeInTheDocument()
    expect(within(used).getByText(/never matched by vendor name/)).toBeInTheDocument()
    expect(screen.getByTestId('esv-phone-details')).toBeInTheDocument()
  })

  it('opens the module from the entropy certificate', () => {
    viewWithLinks('/compliance?tab=records&cert=E321')
    fireEvent.click(
      within(screen.getByTestId('esv-phone-used-by')).getByRole('button', { name: '#5450' })
    )
    expect(screen.getByTestId('fips-phone-entropy-certificates')).toBeInTheDocument()
  })

  it('says coverage is partial when no module names the certificate', () => {
    view('/compliance?tab=records&cert=E2')
    expect(
      within(screen.getByTestId('esv-phone-used-by')).getByText(/does not mean no module uses it/)
    ).toBeInTheDocument()
  })

  it('shows no entropy section for a module whose policy named none', () => {
    viewWithLinks('/compliance?tab=records&cert=5300')
    expect(screen.queryByTestId('fips-phone-entropy-certificates')).not.toBeInTheDocument()
  })
})
