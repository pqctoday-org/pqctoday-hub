// SPDX-License-Identifier: GPL-3.0-only
//
// ACCURACY-0705, item 4: an empty-string pqcCoverage must render as "Not read"
// (the source page could not be read — unknown), NOT fall through to the same
// branch as an explicit, analyzed 'No PQC Mechanisms Detected'. Since the
// 2026-09-24 data contract '' on a FIPS 140-3 row means the certificate page's
// Approved Algorithms list could not be read.
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { ComplianceRow } from './ComplianceTable'
import type { ComplianceRecord } from './types'

const baseRecord: ComplianceRecord = {
  id: 'test-1',
  source: 'ANSSI',
  date: '2025-01-08',
  link: 'https://example.test',
  type: 'Common Criteria',
  status: 'Active',
  pqcCoverage: '',
  productName: 'Test Product',
  productCategory: 'Test Category',
  vendor: 'Test Vendor',
}

function renderRow(
  pqcCoverage: ComplianceRecord['pqcCoverage'],
  overrides: Partial<ComplianceRecord> = {}
) {
  return render(
    <table>
      <tbody>
        <ComplianceRow record={{ ...baseRecord, ...overrides, pqcCoverage }} index={0} />
      </tbody>
    </table>
  )
}

describe('ComplianceRow pqcCoverage rendering (ACCURACY-0705)', () => {
  it('renders an empty string (PQC status unknown) as "Unknown"', () => {
    renderRow('')
    expect(screen.getByText(/^unknown$/i)).toBeInTheDocument()
  })

  it('does NOT render the empty-string case as the analyzed-clean icon/state', () => {
    renderRow('')
    // The analyzed-clean / detected-algorithms branch renders a ShieldCheck
    // icon button ("View PQC mechanisms"); the unanalyzed branch must not.
    expect(screen.queryByLabelText(/view pqc mechanisms/i)).not.toBeInTheDocument()
  })

  it('still distinguishes an explicit analyzed "No PQC Mechanisms Detected" from unanalyzed', () => {
    renderRow('No PQC Mechanisms Detected')
    expect(screen.queryByText(/^not read$/i)).not.toBeInTheDocument()
  })

  it('still renders real detected algorithms normally', () => {
    renderRow('ML-KEM, ML-DSA')
    expect(screen.getByLabelText(/view pqc mechanisms/i)).toBeInTheDocument()
  })

  it('labels PQC on a Common Criteria row as named in the Security Target', () => {
    renderRow('ML-KEM', { securityTargetUrls: ['https://example.test/st.pdf'] })
    expect(
      screen.getByLabelText(/view pqc mechanisms named in the security target/i)
    ).toBeInTheDocument()
    expect(screen.getByText('Named in the Security Target')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /open the security target/i })).toHaveAttribute(
      'href',
      'https://example.test/st.pdf'
    )
  })

  it('labels PQC on a CSPN row as named in the Security Target too', () => {
    renderRow('ML-DSA', { type: 'CSPN' })
    expect(screen.getByText('Named in the Security Target')).toBeInTheDocument()
    expect(screen.getByText('CSPN (ANSSI)')).toBeInTheDocument()
  })

  it('labels FIPS 140-3 PQC as from the Approved Algorithms list', () => {
    renderRow('ML-KEM', { type: 'FIPS 140-3', source: 'NIST' })
    expect(screen.getByText("On the certificate's Approved Algorithms list")).toBeInTheDocument()
  })

  it('shows CAVP rows as "NIST CAVP", never "ACVP"', () => {
    renderRow('ML-KEM', { type: 'ACVP', source: 'NIST', status: 'Validated' })
    expect(screen.getByText('NIST CAVP')).toBeInTheDocument()
    expect(screen.queryByText(/^ACVP$/)).not.toBeInTheDocument()
    expect(screen.getByText('Validated')).toBeInTheDocument()
  })

  it('renders an unknown status verbatim', () => {
    renderRow('', { status: 'Under Review' })
    expect(screen.getByText('Under Review')).toBeInTheDocument()
  })
})
