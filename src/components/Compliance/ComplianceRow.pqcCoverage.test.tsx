// SPDX-License-Identifier: GPL-3.0-only
//
// ACCURACY-0705, item 4: an empty-string pqcCoverage (the 889 Common Criteria
// certs never run through PQC detection, verified live: 1081 CC records, 889
// with pqcCoverage === '') must render as "Not yet analyzed", NOT fall through
// to the same branch as an explicit, analyzed 'No PQC Mechanisms Detected'.
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

function renderRow(pqcCoverage: ComplianceRecord['pqcCoverage']) {
  return render(
    <table>
      <tbody>
        <ComplianceRow record={{ ...baseRecord, pqcCoverage }} index={0} />
      </tbody>
    </table>
  )
}

describe('ComplianceRow pqcCoverage rendering (ACCURACY-0705)', () => {
  it('renders an empty string (unanalyzed) as "Not yet analyzed"', () => {
    renderRow('')
    expect(screen.getByText(/not yet analyzed/i)).toBeInTheDocument()
  })

  it('does NOT render the empty-string case as the analyzed-clean icon/state', () => {
    renderRow('')
    // The analyzed-clean / detected-algorithms branch renders a ShieldCheck
    // icon button ("View PQC mechanisms"); the unanalyzed branch must not.
    expect(screen.queryByLabelText(/view pqc mechanisms/i)).not.toBeInTheDocument()
  })

  it('still distinguishes an explicit analyzed "No PQC Mechanisms Detected" from unanalyzed', () => {
    renderRow('No PQC Mechanisms Detected')
    expect(screen.queryByText(/not yet analyzed/i)).not.toBeInTheDocument()
  })

  it('still renders real detected algorithms normally', () => {
    renderRow('ML-KEM, ML-DSA')
    expect(screen.getByLabelText(/view pqc mechanisms/i)).toBeInTheDocument()
  })
})
