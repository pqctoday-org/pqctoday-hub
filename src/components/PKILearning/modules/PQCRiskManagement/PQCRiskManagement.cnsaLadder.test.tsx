// SPDX-License-Identifier: AGPL-3.0-only
/**
 * One CNSA 2.0 ladder in the whole lesson. NSA's FAQ (version 2.2, October 2026) gives three
 * dates for national security systems: new acquisitions from 1 January 2027, equipment that
 * cannot support CNSA 2.0 phased out by 31 December 2030, and CNSA 2.0 algorithms mandated by
 * 31 December 2031. The earlier "preferred 2025" and "exclusive 2030" ladder must not come back
 * in Step 4 of the workshop or in the exercises.
 */
import { describe, it, expect } from 'vitest'
import { render, fireEvent, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { ComplianceGapAnalysis } from './components/ComplianceGapAnalysis'
import { PQCRiskManagementExercises } from './PQCRiskManagementExercises'
import { content } from './content'
import { CNSA_2_0_BY_CLASS } from '@/data/regulatoryTimelines'

const flat = (s: string | null) => (s ?? '').replace(/\s+/g, ' ')

const entry = {
  id: 'r1',
  assetName: 'Fictional signing service',
  currentAlgorithm: 'RSA-2048',
  threatVector: 'forgery',
  likelihood: 3,
  impact: 3,
  mitigation: 'Review applicable operation and profile',
}

describe('Compliance Gap Analysis (Step 4) lists the current CNSA 2.0 dates', () => {
  it('shows the acquisition, phase-out and mandate dates from the shared table, oldest first, with the NIST dates', () => {
    render(<ComplianceGapAnalysis riskEntries={[entry]} />)
    const section = screen
      .getByRole('heading', { name: /Reference years/ })
      .closest('section') as HTMLElement
    const lines = Array.from(section.querySelectorAll('p'))
      .map((p) => flat(p.textContent))
      .filter((t) => t.includes('applicability not assessed') && /\d{4}/.test(t))
    const [acq, phase, mandate] = CNSA_2_0_BY_CLASS.map((c) => c.year)
    expect(lines).toEqual([
      `CNSA 2.0: new national security system acquisitions (from 1 January 2027): ${acq} — applicability not assessed`,
      'NIST Deprecation: 2030 — applicability not assessed',
      `CNSA 2.0: equipment that cannot support CNSA 2.0 phased out (31 December 2030, exceptions possible): ${phase} — applicability not assessed`,
      `CNSA 2.0 algorithms mandated for national security systems (31 December 2031, unless otherwise noted): ${mandate} — applicability not assessed`,
      'NIST Disallowance: 2035 — applicability not assessed',
    ])
  })

  it('no longer plots the earlier "preferred" and "exclusive" years, in the list or in a row', () => {
    render(<ComplianceGapAnalysis riskEntries={[entry]} />)
    fireEvent.click(screen.getByRole('button', { name: /Fictional signing service/ }))
    const text = flat(document.body.textContent)
    expect(text).not.toMatch(/CNSA 2\.0 Preferred|CNSA 2\.0 Exclusive/)
    expect(text).not.toContain('2025')
    // five cards in the opened row, one per date
    expect(screen.getAllByText('Applicability not assessed', { exact: true })).toHaveLength(5)
  })
})

describe('Risk management exercises state the current CNSA 2.0 dates', () => {
  it('the government scenario gives the three FAQ dates and not "exclusive PQC by 2030"', () => {
    render(<PQCRiskManagementExercises onNavigateToWorkshop={() => {}} />)
    const text = flat(document.body.textContent)
    expect(text).toContain('new acquisitions from 1 January 2027')
    expect(text).toContain('phased out by 31 December 2030 absent an exception')
    expect(text).toContain('algorithms mandated by 31 December 2031 unless otherwise noted')
    expect(text).not.toMatch(/exclusive PQC by 2030/)
  })
})

describe('the module deadline labels', () => {
  it('say the 2030 line is equipment that cannot support CNSA 2.0, with exceptions, and the 2031 line is "unless otherwise noted"', () => {
    const labels = content.deadlines.filter((d) => d.source === 'CNSA 2.0').map((d) => d.label)
    expect(labels).toContain(
      'CNSA 2.0: equipment that cannot support CNSA 2.0 phased out (31 December 2030, exceptions possible)'
    )
    expect(labels).toContain(
      'CNSA 2.0 algorithms mandated for national security systems (31 December 2031, unless otherwise noted)'
    )
    // not readable as "out of vendor support"
    expect(labels.join(' ')).not.toMatch(/unsupported/i)
  })
})
