// SPDX-License-Identifier: AGPL-3.0-only
//
// ENISA facts on the Certificates page (27 Oct 2026): an EUCC record ENISA
// lists as withdrawn is shown as not current, with ENISA's own sentence; a Common Criteria Portal
// listing's EUCC number links to ENISA's certificate page when the number is on ENISA's list and
// says so when it is not. Every field is optional: a record without them looks as it did before.
import { describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import '@testing-library/jest-dom'
import { MemoryRouter } from 'react-router'
import { ComplianceTable } from './ComplianceTable'
import { ComplianceDetailPopover } from './ComplianceDetailPopover'
import { ModuleCertificationStatus } from './views/parts/ModuleCertificationStatus'
import {
  applyRecordScope,
  euccEnisaListing,
  isCurrentRecord,
  safeHttpUrl,
  schemeCertificateId,
  statusBadgeClass,
  statusTone,
} from './recordSemantics'
import { matchesRecordText } from './recordFilters'
import { buildComplianceCsv } from './recordsExport'
import type { ComplianceRecord } from './types'

vi.mock('../ui/AskAssistantButton', () => ({ AskAssistantButton: () => null }))
vi.mock('../ui/EndorseButton', () => ({ EndorseButton: () => null }))
vi.mock('../ui/FlagButton', () => ({ FlagButton: () => null }))

const base: ComplianceRecord = {
  id: 'x',
  source: 'ENISA',
  date: '2026-09-10',
  link: 'https://certification.enisa.europa.eu/certificates_en',
  type: 'EUCC',
  status: 'Active',
  pqcCoverage: '',
  productName: 'Product',
  productCategory: 'Network device',
  vendor: 'Vendor',
}

const WITHDRAWAL_NOTE =
  'This certificate was withdrawn following a successful re-assessment in accordance with Article 13(2)(c) of Commission Implementing Regulation (EU) 2024/482.'

const activeEucc: ComplianceRecord = {
  ...base,
  id: 'enisa-eucc-3089-2026-000002-i-00',
  euccCertificateId: 'EUCC-3089-2026-002',
  productName: 'Nokia Lightspan Access Node MF-2',
  vendor: 'Nokia Solutions and Networks Oy',
}

const withdrawnEucc: ComplianceRecord = {
  ...base,
  id: 'enisa-eucc-3089-2026-000005-i-00',
  euccCertificateId: 'EUCC-3089-2026-005',
  status: 'Withdrawn',
  euccWithdrawalNote: WITHDRAWAL_NOTE,
  productName: 'Withdrawn Switch WS-1',
  vendor: 'Withdrawn Networks',
}

const PORTAL_BASE = {
  ...base,
  source: 'Common Criteria' as const,
  type: 'Common Criteria' as const,
  link: 'https://www.commoncriteriaportal.org/products/',
}

const ENISA_PAGE = 'https://certification.enisa.europa.eu/certificates/example-listed_en'

const portalListed: ComplianceRecord = {
  ...PORTAL_BASE,
  id: 'cc-st33ktpm2xspi-tpm-firmware-9-528-eucc-3090-2026-64-6c2e08dd',
  productName: 'ST33KTPM2XSPI TPM FIRMWARE 9.528 (EUCC-3090-2026-64)',
  vendor: 'Listed Semiconductor',
  euccCertificateNumber: 'EUCC-3090-2026-64',
  euccOnEnisaList: true,
  euccEnisaLink: ENISA_PAGE,
}

const portalNotListed: ComplianceRecord = {
  ...PORTAL_BASE,
  id: 'cc-s3d384c-s3d352c-20260630-eucc-3090-2026-80-1a2b3c4d',
  productName: 'S3D384C/S3D352C_20260630 (EUCC-3090-2026-80)',
  vendor: 'Unlisted Semiconductor',
  euccCertificateNumber: 'EUCC-3090-2026-80',
  euccOnEnisaList: false,
}

// A Portal listing without any of the new fields: the name's trailing number is all there is.
const portalAbsent: ComplianceRecord = {
  ...PORTAL_BASE,
  id: 'cc-st54j-st54k-a07-eucc-3090-2026-67-9f8e7d6c',
  productName: 'ST54J / ST54K (A07) (EUCC-3090-2026-67)',
  vendor: 'Plain Semiconductor',
}

// The Portal name ends in a garbled bracket, so only the cleaned number can supply it.
const portalGarbled: ComplianceRecord = {
  ...PORTAL_BASE,
  id: 'cc-chipdoc-v4-on-jcop-4-p71-eucc-3090-2026-72-5e6f7a8b',
  productName: 'ChipDoc v4 on JCOP 4 P71 (EUCC-3090-2026-72à',
  vendor: 'Garbled Card Co',
  euccCertificateNumber: 'EUCC-3090-2026-72',
}

describe('Withdrawn EUCC record', () => {
  it('is not current: status tone, scope, counts and export all agree', () => {
    expect(statusTone('Withdrawn')).toBe('historical')
    expect(statusBadgeClass('Withdrawn')).toBe(statusBadgeClass('Archived'))
    expect(statusBadgeClass('Withdrawn')).not.toContain('status-success')
    expect(isCurrentRecord(withdrawnEucc)).toBe(false)
    expect(applyRecordScope([activeEucc, withdrawnEucc], 'current')).toEqual([activeEucc])
    expect(applyRecordScope([activeEucc, withdrawnEucc], 'all')).toHaveLength(2)

    const csv = buildComplianceCsv([activeEucc, withdrawnEucc], { scope: 'all' })
    expect(csv).toMatch(/Withdrawn Switch WS-1,.*,Withdrawn,no,/)
    expect(csv).toMatch(/Nokia Lightspan Access Node MF-2,.*,Active,yes,/)
    expect(buildComplianceCsv([activeEucc, withdrawnEucc], { scope: 'current' })).not.toContain(
      'Withdrawn Switch WS-1'
    )
  })

  it('is left out of the current-record counts of the certification panel', () => {
    const fips: ComplianceRecord = {
      ...base,
      id: '4389',
      type: 'FIPS 140-3',
      source: 'NIST',
      pqcCoverage: 'ML-KEM',
    }
    render(
      <MemoryRouter>
        <ModuleCertificationStatus records={[fips, activeEucc, withdrawnEucc]} />
      </MemoryRouter>
    )
    // FIPS + the Active EUCC record; the withdrawn one is not a current record.
    expect(screen.getByText('Current records').parentElement).toHaveTextContent('2')
  })

  it('shows a Withdrawn badge in the not-current style and counts it as hidden by default', () => {
    const { rerender } = render(<ComplianceTable data={[activeEucc, withdrawnEucc]} />)
    expect(screen.queryByText('Withdrawn Switch WS-1')).not.toBeInTheDocument()
    expect(screen.getAllByText('Nokia Lightspan Access Node MF-2').length).toBeGreaterThan(0)
    expect(screen.getByText('1 record')).toBeInTheDocument()
    expect(
      screen.getByText('· current only — 1 historical / archived record hidden')
    ).toBeInTheDocument()

    rerender(<ComplianceTable data={[activeEucc, withdrawnEucc]} recordScope="all" />)
    expect(screen.getByText('2 records')).toBeInTheDocument()
    const rowOf = (name: string) =>
      within(screen.getAllByRole('row').find((r) => within(r).queryByText(name)) as HTMLElement)
    const badge = rowOf('Withdrawn Switch WS-1').getByText('Withdrawn')
    expect(badge.className).toContain('bg-muted')
    expect(badge.className).toContain('text-muted-foreground')
    expect(badge.className).not.toContain('status-success')
    expect(rowOf('Withdrawn Switch WS-1').getByText('EUCC-3089-2026-005')).toBeInTheDocument()
    // The Active record keeps the current style.
    expect(rowOf('Nokia Lightspan Access Node MF-2').getByText('Active').className).toContain(
      'status-success'
    )
  })

  it('counts only the Active record on the EUCC tab by default', () => {
    render(<ComplianceTable data={[activeEucc, withdrawnEucc]} certType="eucc" />)
    expect(screen.getByText('1 record')).toBeInTheDocument()
    expect(screen.queryByText('2 records')).not.toBeInTheDocument()
  })

  it('shows ENISA’s sentence under a Withdrawn heading in the detail view', () => {
    render(<ComplianceDetailPopover isOpen onClose={vi.fn()} record={withdrawnEucc} />)
    const section = within(screen.getByTestId('eucc-withdrawal'))
    expect(section.getByRole('heading', { name: 'Withdrawn' })).toBeInTheDocument()
    expect(section.getByText(WITHDRAWAL_NOTE)).toBeInTheDocument()
    expect(section.getByText('Stated by ENISA.')).toBeInTheDocument()
    expect(section.queryByText('Replaced by')).not.toBeInTheDocument()
    // The status badge in the header is the not-current one.
    const dialog = within(screen.getByRole('dialog'))
    expect(dialog.getAllByText('Withdrawn')[0].className).toContain('bg-muted')
  })

  it('names the replacement certificate when ENISA states one: a number as text, a link as a link', () => {
    const { rerender } = render(
      <ComplianceDetailPopover
        isOpen
        onClose={vi.fn()}
        record={{ ...withdrawnEucc, euccReplacedBy: 'EUCC-3089-2026-050' }}
      />
    )
    let section = within(screen.getByTestId('eucc-withdrawal'))
    expect(section.getByText('Replaced by')).toBeInTheDocument()
    expect(section.getByText('EUCC-3089-2026-050')).toBeInTheDocument()
    expect(section.queryByRole('link')).not.toBeInTheDocument()

    rerender(
      <ComplianceDetailPopover
        isOpen
        onClose={vi.fn()}
        record={{ ...withdrawnEucc, euccReplacedBy: ENISA_PAGE }}
      />
    )
    section = within(screen.getByTestId('eucc-withdrawal'))
    expect(section.getByRole('link', { name: new RegExp(ENISA_PAGE) })).toHaveAttribute(
      'href',
      ENISA_PAGE
    )

    // A replacement that is not an http(s) address is never made a link.
    rerender(
      <ComplianceDetailPopover
        isOpen
        onClose={vi.fn()}
        record={{ ...withdrawnEucc, euccReplacedBy: 'javascript:alert(1)' }}
      />
    )
    section = within(screen.getByTestId('eucc-withdrawal'))
    expect(section.queryByRole('link')).not.toBeInTheDocument()
  })

  it('shows no Withdrawn section for an EUCC record without the new fields', () => {
    render(<ComplianceDetailPopover isOpen onClose={vi.fn()} record={activeEucc} />)
    expect(screen.queryByTestId('eucc-withdrawal')).not.toBeInTheDocument()
    expect(screen.queryByText('Stated by ENISA.')).not.toBeInTheDocument()
  })
})

describe('Common Criteria Portal listing: the EUCC number and ENISA’s certificate list', () => {
  it('links the number to ENISA’s page when it is on the list', () => {
    render(<ComplianceTable data={[portalListed]} />)
    const link = screen.getAllByRole('link', { name: /EUCC-3090-2026-64/ })[0]
    expect(link).toHaveAttribute('href', ENISA_PAGE)
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    expect(link).toHaveTextContent('EUCC-3090-2026-64')
    expect(screen.queryByText("not on ENISA's certificate list")).not.toBeInTheDocument()
  })

  it('says so, in plain text after the number, when the number is not on the list', () => {
    render(<ComplianceTable data={[portalNotListed]} />)
    expect(screen.getAllByText('EUCC-3090-2026-80').length).toBeGreaterThan(0)
    const note = screen.getAllByText("not on ENISA's certificate list")[0]
    expect(note.className).toContain('text-muted-foreground')
    expect(screen.queryByRole('link', { name: /EUCC-3090-2026-80/ })).not.toBeInTheDocument()
  })

  it('shows the number exactly as before when the new fields are absent', () => {
    render(<ComplianceTable data={[portalAbsent]} />)
    expect(screen.getAllByText('EUCC-3090-2026-67').length).toBeGreaterThan(0)
    expect(screen.queryByRole('link', { name: /EUCC-3090-2026-67/ })).not.toBeInTheDocument()
    expect(screen.queryByText("not on ENISA's certificate list")).not.toBeInTheDocument()
    expect(euccEnisaListing(portalAbsent)).toBeNull()
  })

  it('shows the cleaned number for a Portal name with a garbled closing bracket', () => {
    render(<ComplianceTable data={[portalGarbled]} />)
    expect(screen.getAllByText('EUCC-3090-2026-72').length).toBeGreaterThan(0)
    expect(screen.queryByText('No scheme number in the listing')).not.toBeInTheDocument()
    // Without the cleaned number the garbled name supplies none.
    expect(schemeCertificateId({ ...portalGarbled, euccCertificateNumber: undefined })).toBeNull()
  })

  it('applies in the detail view header too', () => {
    const { rerender } = render(
      <ComplianceDetailPopover isOpen onClose={vi.fn()} record={portalListed} />
    )
    expect(screen.getByRole('link', { name: /EUCC-3090-2026-64/ })).toHaveAttribute(
      'href',
      ENISA_PAGE
    )
    rerender(<ComplianceDetailPopover isOpen onClose={vi.fn()} record={portalNotListed} />)
    expect(screen.getByText('EUCC-3090-2026-80')).toBeInTheDocument()
    expect(screen.getByText("not on ENISA's certificate list")).toBeInTheDocument()
    rerender(<ComplianceDetailPopover isOpen onClose={vi.fn()} record={portalAbsent} />)
    expect(screen.getByText('EUCC-3090-2026-67')).toBeInTheDocument()
    expect(screen.queryByText("not on ENISA's certificate list")).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /EUCC-3090-2026-67/ })).not.toBeInTheDocument()
  })

  it('decides the listing from the record: listed needs a safe link, other record types never qualify', () => {
    expect(euccEnisaListing(portalListed)).toEqual({
      state: 'listed',
      number: 'EUCC-3090-2026-64',
      url: ENISA_PAGE,
    })
    expect(euccEnisaListing(portalNotListed)).toEqual({
      state: 'not-listed',
      number: 'EUCC-3090-2026-80',
    })
    // Listed but no link in the data, or an unsafe one: shown as today.
    expect(euccEnisaListing({ ...portalListed, euccEnisaLink: undefined })).toBeNull()
    expect(euccEnisaListing({ ...portalListed, euccEnisaLink: 'javascript:alert(1)' })).toBeNull()
    // The facts belong to Portal listings only.
    expect(euccEnisaListing({ ...activeEucc, euccOnEnisaList: false })).toBeNull()
    expect(euccEnisaListing({ ...portalNotListed, id: 'anssi-cc-2024-39' })).toBeNull()
    expect(safeHttpUrl('https://certification.enisa.europa.eu/x')).toBe(
      'https://certification.enisa.europa.eu/x'
    )
    expect(safeHttpUrl('ftp://example.test')).toBeNull()
    expect(safeHttpUrl(undefined)).toBeNull()
  })

  it('prefers the cleaned number over the one read from the product name', () => {
    expect(
      schemeCertificateId({ ...portalListed, euccCertificateNumber: 'EUCC-3090-2026-65' })
    ).toBe('EUCC-3090-2026-65')
    expect(schemeCertificateId({ ...portalListed, euccCertificateNumber: undefined })).toBe(
      'EUCC-3090-2026-64'
    )
  })
})

describe('Search finds a Portal listing by its cleaned EUCC number', () => {
  // The name does not carry the number, so only the field can match it.
  const nameless: ComplianceRecord = {
    ...portalGarbled,
    id: 'cc-secure-element-x-2b3c4d5e',
    productName: 'Secure Element X',
    vendor: 'Secure Co',
    euccCertificateNumber: 'EUCC-3090-2026-99',
  }

  it('matches whole or in part, and no other row', () => {
    expect(matchesRecordText(nameless, 'EUCC-3090-2026-99')).toBe(true)
    expect(matchesRecordText(nameless, 'eucc-3090-2026-99')).toBe(true)
    expect(matchesRecordText(nameless, '3090-2026-99')).toBe(true)
    expect(matchesRecordText(portalAbsent, 'EUCC-3090-2026-99')).toBe(false)
  })

  it('narrows the table to that row', () => {
    render(
      <ComplianceTable data={[nameless, portalAbsent, activeEucc]} filterText="EUCC-3090-2026-99" />
    )
    expect(screen.getAllByText('Secure Element X').length).toBeGreaterThan(0)
    expect(screen.queryByText('ST54J / ST54K (A07) (EUCC-3090-2026-67)')).not.toBeInTheDocument()
    expect(screen.queryByText('Nokia Lightspan Access Node MF-2')).not.toBeInTheDocument()
  })
})
