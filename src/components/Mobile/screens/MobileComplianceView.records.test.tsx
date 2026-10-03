// SPDX-License-Identifier: GPL-3.0-only
//
// Deep-link addressability (2026-10-03): the phone Records section lists and
// searches the certification records, and the `?cert=` sheet shows the same
// record facts as desktop's ComplianceDetailPopover.
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter, useLocation, useNavigationType } from 'react-router'
import '@testing-library/jest-dom'
import { MobileComplianceView, type MobileCertRecord } from './MobileComplianceView'
import { usePersonaStore } from '@/store/usePersonaStore'
import { cavpValidationUrl } from '@/components/Compliance/recordSemantics'

function LocationProbe() {
  return (
    <>
      <output data-testid="location-search">{useLocation().search}</output>
      <output data-testid="navigation-type">{useNavigationType()}</output>
    </>
  )
}
const urlParams = () => new URLSearchParams(screen.getByTestId('location-search').textContent ?? '')
const navType = () => screen.getByTestId('navigation-type').textContent

const fips: MobileCertRecord = {
  id: '4389',
  source: 'NIST',
  date: '2025-03-01',
  link: 'https://csrc.nist.gov/projects/cryptographic-module-validation-program/certificate/4389',
  type: 'FIPS 140-3',
  status: 'Active',
  productName: 'Acme Crypto Module',
  productCategory: 'HSM',
  vendor: 'Acme',
  certificationLevel: 'FIPS 140-3 L3',
  pqcCoverage: 'ML-KEM, ML-DSA',
  classicalAlgorithms: 'AES, SHA-256',
  cmvpStandard: 'FIPS 140-3',
  cmvpStatus: 'Active',
  cmvpDetailsFetchedAt: '2026-09-25T10:00:00Z',
  sunsetDate: '2030-03-01',
  overallLevel: 3,
  moduleType: 'Hardware',
  embodiment: 'Multi-Chip Stand Alone',
  caveat: 'When operated in approved mode',
  operationalEnvironments: ['Acme OS 5'],
  cmvpApprovedAlgorithms: [{ name: 'ML-KEM', cavpRefs: ['A1234'] }],
}

const cavp: MobileCertRecord = {
  id: 'A5555',
  source: 'NIST',
  date: '2024-06-01',
  link: 'https://csrc.nist.gov/x',
  type: 'ACVP',
  status: 'Validated',
  productName: 'Beta Library',
  productCategory: 'Library',
  vendor: 'Beta',
  pqcCoverage: 'ML-DSA',
  cavpFirstValidated: '2024-06-01',
  cavpImplementationVersion: '2.1',
  cavpCapabilities: [
    {
      algorithm: 'ML-DSA',
      operatingEnvironment: 'Linux x86_64',
      parameterSets: ['ML-DSA-65'],
      functions: ['sigGen'],
    },
  ],
}

const cc: MobileCertRecord = {
  id: 'CC-77',
  source: 'Common Criteria',
  date: '2023-02-01',
  link: 'https://www.commoncriteriaportal.org/x',
  type: 'Common Criteria',
  status: 'Archived',
  productName: 'Gamma Smart Card',
  productCategory: 'Smart Card',
  vendor: 'Gamma',
  lab: 'Lab One',
  pqcCoverage: 'ML-KEM',
  ccArchivedDate: '2025-01-15',
  securityTargetUrls: ['https://example.org/st.pdf'],
  sourceConflicts: [
    {
      field: 'vendor',
      values: [
        { value: 'Gamma Inc', source: 'CC Portal' },
        { value: 'Gamma SA', source: 'ANSSI', url: 'https://example.org/anssi' },
      ],
    },
  ],
}

function renderAt(url: string, records: MobileCertRecord[] = [fips, cavp, cc]) {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <MobileComplianceView records={records} recordsLoaded={records.length > 0} />
      <LocationProbe />
    </MemoryRouter>
  )
}

beforeEach(() => {
  usePersonaStore.setState({ selectedPersona: null, selectedIndustries: [], selectedRegion: null })
})

describe('MobileComplianceView — ?cert= sheet shows the desktop record facts', () => {
  it('renders the FIPS 140-3 certificate details', () => {
    renderAt('/compliance?cert=4389')
    const s = within(screen.getByTestId('compliance-record-detail-sheet'))
    expect(s.getByText('FIPS 140-3 module validation (NIST CMVP)')).toBeInTheDocument()
    expect(s.getByText('FIPS 140-3 L3')).toBeInTheDocument()
    expect(s.getByText("PQC — on the certificate's approved algorithms list")).toBeInTheDocument()
    expect(s.getByText('ML-KEM, ML-DSA')).toBeInTheDocument()
    expect(s.getByText('AES, SHA-256')).toBeInTheDocument()
    expect(s.getByText('status observed 25 Sep 2026')).toBeInTheDocument()
    expect(s.getByText('1 Mar 2030')).toBeInTheDocument()
    expect(s.getByText('Multi-Chip Stand Alone')).toBeInTheDocument()
    expect(s.getByText('When operated in approved mode')).toBeInTheDocument()
    expect(s.getByText('Acme OS 5')).toBeInTheDocument()
    expect(s.getByRole('link', { name: /A1234/ })).toHaveAttribute(
      'href',
      cavpValidationUrl('A1234')
    )
    expect(s.getByRole('link', { name: /View the NIST CMVP certificate page/ })).toHaveAttribute(
      'href',
      fips.link
    )
  })

  it('renders the NIST CAVP validation and its capabilities', () => {
    renderAt('/compliance?cert=A5555')
    const s = within(screen.getByTestId('compliance-record-detail-sheet'))
    expect(s.getByText('NIST CAVP algorithm validation', { selector: 'p' })).toBeInTheDocument()
    expect(s.getByText('2.1')).toBeInTheDocument()
    expect(s.getByText('Parameter sets: ML-DSA-65')).toBeInTheDocument()
    expect(s.getByText('Functions: sigGen')).toBeInTheDocument()
    expect(s.getByText('Operating environment: Linux x86_64')).toBeInTheDocument()
  })

  it('renders a CC record: lab, archive date, Security Target claim, source conflicts', () => {
    renderAt('/compliance?cert=CC-77')
    const s = within(screen.getByTestId('compliance-record-detail-sheet'))
    expect(s.getByText('Lab One')).toBeInTheDocument()
    expect(s.getByText('15 Jan 2025')).toBeInTheDocument()
    expect(s.getByText(/A claim in the evaluated Security Target/)).toBeInTheDocument()
    expect(s.getByText('Official sources disagree')).toBeInTheDocument()
    expect(s.getByRole('link', { name: /ANSSI/ })).toHaveAttribute(
      'href',
      'https://example.org/anssi'
    )
    expect(s.getByRole('link', { name: /Security Target 1/ })).toHaveAttribute(
      'href',
      'https://example.org/st.pdf'
    )
  })
})

describe('MobileComplianceView — searchable Records list', () => {
  it('lists current records newest first; historical ones need ?rstatus=all', () => {
    renderAt('/compliance?tab=records')
    const list = within(screen.getByRole('region', { name: 'Certification records' }))
    const names = list
      .getAllByRole('button')
      .map((b) => b.textContent ?? '')
      .filter((t) => /Module|Library|Card/.test(t))
    expect(names[0]).toMatch(/Acme Crypto Module/)
    expect(names[1]).toMatch(/Beta Library/)
    expect(list.queryByText('Gamma Smart Card')).not.toBeInTheDocument()

    fireEvent.click(list.getByRole('button', { name: 'Include historical' }))
    expect(urlParams().get('rstatus')).toBe('all')
    expect(list.getByText('Gamma Smart Card')).toBeInTheDocument()
  })

  it('search writes ?q= (with tab=records) and filters by vendor or certificate #', () => {
    renderAt('/compliance?tab=records')
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search certification records' }), {
      target: { value: 'a5555' },
    })
    expect(urlParams().get('q')).toBe('a5555')
    expect(urlParams().get('tab')).toBe('records')
    const list = within(screen.getByRole('region', { name: 'Certification records' }))
    expect(list.getByText('Beta Library')).toBeInTheDocument()
    expect(list.queryByText('Acme Crypto Module')).not.toBeInTheDocument()
  })

  it('a shared ?q= link opens the filtered list', () => {
    renderAt('/compliance?tab=records&q=acme')
    const list = within(screen.getByRole('region', { name: 'Certification records' }))
    expect(list.getByText('Acme Crypto Module')).toBeInTheDocument()
    expect(list.queryByText('Beta Library')).not.toBeInTheDocument()
    expect(screen.getByText('1 record.')).toBeInTheDocument()
  })

  it('tapping a record pushes ?cert= and opens the same sheet', () => {
    renderAt('/compliance?tab=records')
    fireEvent.click(screen.getByRole('button', { name: /Beta Library/ }))
    expect(urlParams().get('cert')).toBe('A5555')
    expect(navType()).toBe('PUSH')
    expect(
      within(screen.getByTestId('compliance-record-detail-sheet')).getByText(
        'Parameter sets: ML-DSA-65'
      )
    ).toBeInTheDocument()
  })

  it('caps the list and says how many more match', () => {
    const many: MobileCertRecord[] = Array.from({ length: 25 }, (_, i) => ({
      ...fips,
      id: `9${String(i).padStart(3, '0')}`,
      productName: `Bulk Module ${i}`,
      date: `2024-01-${String(i + 1).padStart(2, '0')}`,
    }))
    renderAt('/compliance?tab=records', many)
    expect(screen.getByText('Showing the newest 20 of 25 — search to narrow.')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /Bulk Module/ })).toHaveLength(20)
    expect(screen.getByRole('button', { name: /Bulk Module 24/ })).toBeInTheDocument()
    // The 5 oldest (#9000–#9004) are past the cap.
    expect(screen.queryByRole('button', { name: /#9000 / })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /#9004 / })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /#9005 / })).toBeInTheDocument()
  })

  it('keeps the glossary, folded under a toggle when the list is shown', () => {
    renderAt('/compliance?tab=records')
    expect(screen.queryByText('HNDL')).not.toBeInTheDocument()
    const toggle = screen.getByRole('button', { name: /Terms used in these records/ })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(toggle)
    expect(screen.getByText('HNDL')).toBeInTheDocument()
  })
})
