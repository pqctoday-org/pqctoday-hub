// SPDX-License-Identifier: AGPL-3.0-only
//
// ENISA facts on the phone Records section (27 Oct 2026): the same
// reading as the desktop Certificates page. A withdrawn EUCC record is not current and its
// sheet carries ENISA's sentence; a Common Criteria Portal listing's EUCC number links to ENISA's
// certificate page when it is on ENISA's list and says so when it is not. All fields optional.
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { MobileComplianceView, type MobileCertRecord } from './MobileComplianceView'
import { usePersonaStore } from '@/store/usePersonaStore'

const WITHDRAWAL_NOTE =
  'This certificate was withdrawn following a successful re-assessment in accordance with Article 13(2)(c) of Commission Implementing Regulation (EU) 2024/482.'
const ENISA_PAGE = 'https://certification.enisa.europa.eu/certificates/example-listed_en'

const base: MobileCertRecord = {
  id: 'x',
  source: 'ENISA',
  date: '2026-09-10',
  link: 'https://certification.enisa.europa.eu/certificates_en',
  type: 'EUCC',
  status: 'Active',
  productName: 'Product',
  productCategory: 'Network device',
  vendor: 'Vendor',
  pqcCoverage: '',
}

const withdrawn: MobileCertRecord = {
  ...base,
  id: 'enisa-eucc-3089-2026-000005-i-00',
  euccCertificateId: 'EUCC-3089-2026-005',
  status: 'Withdrawn',
  euccWithdrawalNote: WITHDRAWAL_NOTE,
  euccReplacedBy: 'EUCC-3089-2026-050',
  productName: 'Withdrawn Switch WS-1',
}

const active: MobileCertRecord = {
  ...base,
  id: 'enisa-eucc-3089-2026-000002-i-00',
  euccCertificateId: 'EUCC-3089-2026-002',
  productName: 'Nokia Lightspan Access Node MF-2',
}

const portal = { ...base, source: 'Common Criteria', type: 'Common Criteria' }

const listed: MobileCertRecord = {
  ...portal,
  id: 'cc-st33ktpm2xspi-tpm-firmware-9-528-eucc-3090-2026-64-6c2e08dd',
  productName: 'ST33KTPM2XSPI TPM FIRMWARE 9.528 (EUCC-3090-2026-64)',
  euccCertificateNumber: 'EUCC-3090-2026-64',
  euccOnEnisaList: true,
  euccEnisaLink: ENISA_PAGE,
}

const notListed: MobileCertRecord = {
  ...portal,
  id: 'cc-s3d384c-s3d352c-20260630-eucc-3090-2026-80-1a2b3c4d',
  productName: 'S3D384C/S3D352C_20260630 (EUCC-3090-2026-80)',
  euccCertificateNumber: 'EUCC-3090-2026-80',
  euccOnEnisaList: false,
}

const absent: MobileCertRecord = {
  ...portal,
  id: 'cc-st54j-st54k-a07-eucc-3090-2026-67-9f8e7d6c',
  productName: 'ST54J / ST54K (A07) (EUCC-3090-2026-67)',
}

const garbled: MobileCertRecord = {
  ...portal,
  id: 'cc-chipdoc-v4-on-jcop-4-p71-eucc-3090-2026-72-5e6f7a8b',
  productName: 'ChipDoc v4 on JCOP 4 P71 (EUCC-3090-2026-72à',
  euccCertificateNumber: 'EUCC-3090-2026-72',
}

function renderAt(url: string, records: MobileCertRecord[]) {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <MobileComplianceView records={records} recordsLoaded={records.length > 0} />
    </MemoryRouter>
  )
}
const sheet = () => within(screen.getByTestId('compliance-record-detail-sheet'))

beforeEach(() => {
  usePersonaStore.setState({ selectedPersona: null, selectedIndustries: [], selectedRegion: null })
})

describe('MobileComplianceView: withdrawn EUCC record', () => {
  it('is hidden from the current list and counted out of it', () => {
    renderAt('/compliance?tab=records', [active, withdrawn])
    expect(screen.getByText('1 record.')).toBeInTheDocument()
    expect(screen.queryByText('Withdrawn Switch WS-1')).not.toBeInTheDocument()
  })

  it('is listed, in the not-current style, once historical records are included', () => {
    renderAt('/compliance?tab=records&rstatus=all', [active, withdrawn])
    expect(screen.getByText('2 records.')).toBeInTheDocument()
    expect(screen.getByText('Withdrawn Switch WS-1')).toBeInTheDocument()
  })

  it('shows ENISA’s sentence under a Withdrawn heading in its sheet, with the replacement', () => {
    renderAt('/compliance?cert=enisa-eucc-3089-2026-000005-i-00', [withdrawn])
    const badge = sheet().getAllByText('Withdrawn')[0]
    expect(badge.className).toContain('bg-muted')
    expect(badge.className).not.toContain('status-success')
    const section = within(screen.getByTestId('eucc-withdrawal'))
    expect(section.getByText('Withdrawn')).toBeInTheDocument()
    expect(section.getByText(WITHDRAWAL_NOTE)).toBeInTheDocument()
    expect(section.getByText('Replaced by')).toBeInTheDocument()
    expect(section.getByText('EUCC-3089-2026-050')).toBeInTheDocument()
    expect(section.getByText('Stated by ENISA.')).toBeInTheDocument()
  })

  it('shows no Withdrawn section for an EUCC record without the new fields', () => {
    renderAt('/compliance?cert=enisa-eucc-3089-2026-000002-i-00', [active])
    expect(screen.queryByTestId('eucc-withdrawal')).not.toBeInTheDocument()
  })
})

describe('MobileComplianceView: Portal listing and ENISA’s certificate list', () => {
  it('links the number in the sheet when it is on the list', () => {
    renderAt(`/compliance?cert=${listed.id}`, [listed])
    const link = sheet().getByRole('link', { name: /EUCC-3090-2026-64/ })
    expect(link).toHaveAttribute('href', ENISA_PAGE)
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    expect(sheet().queryByText("not on ENISA's certificate list")).not.toBeInTheDocument()
  })

  it('says it is not on the list, in plain text, in the sheet and the list line', () => {
    renderAt(`/compliance?cert=${notListed.id}`, [notListed])
    expect(sheet().getByText('EUCC-3090-2026-80')).toBeInTheDocument()
    expect(sheet().getByText("not on ENISA's certificate list")).toBeInTheDocument()
    expect(sheet().queryByRole('link', { name: /EUCC-3090-2026-80/ })).not.toBeInTheDocument()
  })

  it('lists the number with the note when not on the list, and plain when the fields are absent', () => {
    renderAt('/compliance?tab=records&rstatus=all', [notListed, absent])
    expect(
      screen.getByText(/#EUCC-3090-2026-80 not on ENISA's certificate list/)
    ).toBeInTheDocument()
    expect(screen.getByText(/#EUCC-3090-2026-67/)).toBeInTheDocument()
    expect(screen.queryByText(/#EUCC-3090-2026-67 not on/)).not.toBeInTheDocument()
  })

  it('shows the number exactly as before when the fields are absent', () => {
    renderAt(`/compliance?cert=${absent.id}`, [absent])
    expect(sheet().getByText('EUCC-3090-2026-67')).toBeInTheDocument()
    expect(sheet().queryByRole('link', { name: /EUCC-3090-2026-67/ })).not.toBeInTheDocument()
    expect(sheet().queryByText("not on ENISA's certificate list")).not.toBeInTheDocument()
  })

  it('shows the cleaned number for a name with a garbled closing bracket', () => {
    renderAt(`/compliance?cert=${garbled.id}`, [garbled])
    expect(sheet().getByText('EUCC-3090-2026-72')).toBeInTheDocument()
  })

  it('search finds a listing by its cleaned EUCC number when the name does not carry it', () => {
    const nameless: MobileCertRecord = {
      ...garbled,
      id: 'cc-secure-element-x-2b3c4d5e',
      productName: 'Secure Element X',
      euccCertificateNumber: 'EUCC-3090-2026-99',
    }
    renderAt('/compliance?tab=records&rstatus=all&q=EUCC-3090-2026-99', [nameless, absent])
    expect(screen.getByText('1 record.')).toBeInTheDocument()
    expect(screen.getByText('Secure Element X')).toBeInTheDocument()
    expect(screen.queryByText(/ST54J/)).not.toBeInTheDocument()
  })
})
