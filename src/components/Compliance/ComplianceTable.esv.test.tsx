// SPDX-License-Identifier: AGPL-3.0-only
//
// The Entropy (ESV) tab of the Product Records: its own columns (certificate, entropy
// source, vendor, status, validation date, NIST page), search by number and vendor,
// numeric certificate order, and no PQC or classical-algorithm columns.
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import '@testing-library/jest-dom'
import { ComplianceTable, ComplianceRow } from './ComplianceTable'
import { EsvCard, EsvRow } from './EsvRecords'
import type { ComplianceRecord } from './types'

// jsdom has no Element.scrollTo; the table calls it when a (debounced) search is applied.
const realScrollTo = HTMLElement.prototype.scrollTo
beforeAll(() => {
  HTMLElement.prototype.scrollTo = vi.fn() as unknown as typeof HTMLElement.prototype.scrollTo
})
afterAll(() => {
  HTMLElement.prototype.scrollTo = realScrollTo
})

const base: ComplianceRecord = {
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
  esvNoiseSourceClassification: 'Non-Physical',
  esvReuseStatus: 'Open for Reuse',
  esvFirstValidated: '2026-03-11',
}
const e2: ComplianceRecord = {
  ...base,
  id: 'E2',
  date: '2025-02-20',
  esvFirstValidated: '2022-10-11',
  link: 'https://csrc.nist.gov/projects/cryptographic-module-validation-program/entropy-validations/certificate/2',
  productName: 'VaultIC408 Entropy Source',
  vendor: 'WISeKey',
  esvNoiseSourceClassification: 'Physical',
  esvReuseStatus: 'Reuse restricted to vendor',
}
const e10: ComplianceRecord = {
  ...base,
  id: 'E10',
  productName: 'Kernel Jitter RNG',
  vendor: 'atsec',
}
const fips: ComplianceRecord = {
  ...base,
  id: '5300',
  type: 'FIPS 140-3',
  status: 'Active',
  productName: 'Luna M7 Cryptographic Module',
  productCategory: 'HSM',
  vendor: 'Thales',
  pqcCoverage: 'LMS',
}
const data = [base, e2, e10, fips]

describe('ComplianceTable — Entropy (ESV) tab', () => {
  it('adds an Entropy (ESV) tab after the other record types, and selects it', () => {
    const onCertTypeChange = vi.fn()
    render(<ComplianceTable data={data} certType="all" onCertTypeChange={onCertTypeChange} />)
    const tab = screen.getByRole('button', { name: 'Entropy (ESV)' })
    expect(tab).toBeInTheDocument()
    fireEvent.click(tab)
    expect(onCertTypeChange).toHaveBeenCalledWith('esv')
    const labels = screen
      .getAllByRole('button')
      .map((b) => b.textContent ?? '')
      .filter((t) =>
        /^(All Records|FIPS 140-3|NIST CAVP|Common Criteria|CSPN \(ANSSI\)|Entropy \(ESV\))/.test(t)
      )
    expect(labels.at(-1)).toMatch(/^Entropy \(ESV\)/)
  })

  it('lists only entropy certificates, with the entropy columns and no PQC columns', async () => {
    render(<ComplianceTable data={data} certType="esv" />)
    const table = await screen.findByTestId('esv-table')
    const headers = within(table)
      .getAllByRole('columnheader')
      .map((h) => (h.textContent ?? '').trim())
    expect(headers.slice(0, 5).map((h) => h.trim())).toEqual([
      'Certificate',
      'Entropy source',
      'Vendor',
      'Status',
      'Validated',
    ])
    expect(headers[5]).toMatch(/^NIST page/)
    expect(within(table).queryByText('PQC')).not.toBeInTheDocument()
    expect(within(table).queryByText('Classic')).not.toBeInTheDocument()
    const rows = await screen.findAllByTestId('esv-row')
    expect(rows).toHaveLength(3)
    expect(screen.queryByText('Luna M7 Cryptographic Module')).not.toBeInTheDocument()
    expect(screen.getByText('3 records')).toBeInTheDocument()
  })

  it('shows number, source, noise classification, vendor, status, dates and the NIST link', async () => {
    render(<ComplianceTable data={[base, e2]} certType="esv" />)
    const row = (await screen.findAllByTestId('esv-row')).find((r) =>
      within(r).queryByText('E321')
    )!
    expect(within(row).getByText('SP 800-90B')).toBeInTheDocument()
    expect(within(row).getByText('BoringCrypto Jitter Entropy')).toBeInTheDocument()
    expect(within(row).getByText('Non-Physical · Open for Reuse')).toBeInTheDocument()
    expect(within(row).getByText('Google, LLC')).toBeInTheDocument()
    expect(within(row).getByText('Validated')).toBeInTheDocument()
    expect(within(row).getByText('2026-03-11')).toBeInTheDocument()
    const link = within(row).getByRole('link', { name: 'NIST certificate page for E321' })
    expect(link).toHaveAttribute('href', base.link)
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    // a re-validated certificate also says when it was first validated
    const row2 = (await screen.findAllByTestId('esv-row')).find((r) => within(r).queryByText('E2'))!
    expect(within(row2).getByText('first validated 2022-10-11')).toBeInTheDocument()
  })

  it('finds a certificate by number and by vendor', async () => {
    const { rerender } = render(<ComplianceTable data={data} certType="esv" filterText="E321" />)
    await waitFor(() => expect(screen.getAllByTestId('esv-row')).toHaveLength(1))
    expect(screen.getByText('BoringCrypto Jitter Entropy')).toBeInTheDocument()
    rerender(<ComplianceTable data={data} certType="esv" filterText="wisekey" />)
    // the search is debounced: wait for the new match rather than for a row count
    expect(await screen.findByText('VaultIC408 Entropy Source')).toBeInTheDocument()
    expect(screen.getAllByTestId('esv-row')).toHaveLength(1)
  })

  it('orders certificates numerically, so E2 comes before E10 and E321', async () => {
    render(<ComplianceTable data={data} certType="esv" sortColumn="id" sortDirection="asc" />)
    const rows = await screen.findAllByTestId('esv-row')
    const ids = rows.map((r) => within(r).getByText(/^E\d+$/).textContent)
    expect(ids).toEqual(['E2', 'E10', 'E321'])
  })

  it('sorts when a column header is pressed', async () => {
    const onSortColumnChange = vi.fn()
    render(
      <ComplianceTable
        data={data}
        certType="esv"
        sortColumn="date"
        sortDirection="desc"
        onSortColumnChange={onSortColumnChange}
      />
    )
    const table = await screen.findByTestId('esv-table')
    fireEvent.click(within(table).getByRole('button', { name: /Vendor/ }))
    expect(onSortColumnChange).toHaveBeenCalledWith('vendor')
  })

  it('opens the details from a row', async () => {
    const onSelectRecord = vi.fn()
    render(<ComplianceTable data={data} certType="esv" onSelectRecord={onSelectRecord} />)
    const row = (await screen.findAllByTestId('esv-row')).find((r) => within(r).queryByText('E10'))!
    fireEvent.click(within(row).getByRole('button', { name: 'View details' }))
    expect(onSelectRecord).toHaveBeenCalledWith('E10')
  })

  it('explains the tab and drops the PQC and Migrate-category facets from it', () => {
    render(
      <ComplianceTable
        data={data}
        certType="esv"
        pqcFilters={['ML-KEM']}
        migrateCatFilters={['CSC-001']}
      />
    )
    expect(screen.getByTestId('esv-tab-note')).toHaveTextContent(
      /say nothing about post-quantum algorithms/
    )
    // the PQC filters carried over from another tab neither hide the rows nor show as chips
    expect(screen.getAllByTestId('esv-row')).toHaveLength(3)
    expect(screen.queryByText('Active Filters:')).not.toBeInTheDocument()
    expect(screen.getByPlaceholderText(/certificate # \(E321\)/)).toBeInTheDocument()
  })

  it('keeps the standard table, with its PQC columns, on the other tabs', () => {
    render(<ComplianceTable data={data} certType="fips" />)
    expect(screen.queryByTestId('esv-table')).not.toBeInTheDocument()
    expect(screen.getByText('PQC')).toBeInTheDocument()
    expect(screen.queryByTestId('esv-tab-note')).not.toBeInTheDocument()
  })
})

describe('Entropy (ESV) rows name the modules that rely on them', () => {
  const luna: ComplianceRecord = {
    ...fips,
    id: '5450',
    productName: 'Luna T7',
    entropyCertificates: ['E321'],
  }
  const luna2: ComplianceRecord = { ...fips, id: '5300', entropyCertificates: ['E321'] }

  it('shows how many FIPS 140-3 modules name the certificate', async () => {
    render(<ComplianceTable data={[...data, luna, luna2]} certType="esv" />)
    const row = (await screen.findAllByTestId('esv-row')).find((r) =>
      within(r).queryByText('E321')
    )!
    expect(within(row).getByText('Relied on by 2 FIPS 140-3 modules')).toBeInTheDocument()
    const other = (await screen.findAllByTestId('esv-row')).find((r) =>
      within(r).queryByText('E2')
    )!
    expect(within(other).queryByText(/Relied on by/)).not.toBeInTheDocument()
  })

  it('says "1 FIPS 140-3 module" for a single module', async () => {
    render(<ComplianceTable data={[...data, luna]} certType="esv" />)
    expect(await screen.findByText('Relied on by 1 FIPS 140-3 module')).toBeInTheDocument()
  })
})

describe('Entropy (ESV) rows on the other views', () => {
  it('shows N/A in the PQC column of the All Records table, never "Unknown"', () => {
    render(
      <table>
        <tbody>
          <ComplianceRow record={base} index={0} />
        </tbody>
      </table>
    )
    expect(screen.getByText('N/A')).toBeInTheDocument()
    expect(screen.queryByText(/^unknown$/i)).not.toBeInTheDocument()
    expect(screen.getByText('Entropy (ESV)')).toBeInTheDocument()
  })

  it('renders the small-screen card with number, source, vendor, noise source and link', () => {
    const onOpen = vi.fn()
    render(<EsvCard record={base} onOpen={onOpen} />)
    expect(screen.getByText('E321')).toBeInTheDocument()
    expect(screen.getByText('Non-Physical · Open for Reuse')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'NIST certificate page for E321' })).toHaveAttribute(
      'href',
      base.link
    )
    fireEvent.click(screen.getByRole('button', { name: 'View details' }))
    expect(onOpen).toHaveBeenCalledWith(base)
  })

  it('renders a bare row without optional fields', () => {
    const bare: ComplianceRecord = {
      ...base,
      esvStandard: undefined,
      esvNoiseSourceClassification: undefined,
      esvReuseStatus: undefined,
      esvFirstValidated: undefined,
    }
    render(
      <table>
        <tbody>
          <EsvRow record={bare} onOpenDetails={vi.fn()} />
        </tbody>
      </table>
    )
    expect(screen.getByText('E321')).toBeInTheDocument()
    expect(screen.queryByText(/first validated/)).not.toBeInTheDocument()
  })
})
