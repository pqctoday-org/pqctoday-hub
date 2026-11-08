// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import {
  COMPLIANCE_CURIOUS_PREFACES,
  getComplianceCuriousPreface,
} from './complianceCuriousPrefaces'

describe('compliance curious prefaces — scope of recommendations and mandates', () => {
  it('presents the BSI guideline as a recommendation, not a rule for every German company', () => {
    const bsi = getComplianceCuriousPreface('BSI') ?? ''
    expect(bsi).not.toMatch(/tells every German company/i)
    expect(bsi).not.toMatch(/most technically detailed/i)
    expect(bsi).toMatch(/recommendation/i)
    expect(bsi).toMatch(/not a law/i)
  })

  it('keeps CNSA 2.0 to national security systems with the dated CNSSP 15 timetable', () => {
    const cnsa = getComplianceCuriousPreface('CNSA-2') ?? ''
    // National security systems, not "US defense and federal contracts".
    expect(cnsa).toMatch(/National Security Systems \(NSS\)/)
    expect(cnsa).toMatch(/not to every federal contract/i)
    expect(cnsa).not.toMatch(/deadline that matters most/i)
    // The three CNSSP 15 dates, with the edition they come from.
    expect(cnsa).toMatch(/version 2\.2/)
    expect(cnsa).toMatch(/1 January 2027/)
    expect(cnsa).toMatch(/31 December 2030/)
    expect(cnsa).toMatch(/31 December 2031/)
    // The earlier per-category schedule is not offered as the current one.
    expect(cnsa).not.toMatch(/2033/)
    expect(cnsa).not.toMatch(/exclusively by 2030/i)
  })

  it('does not call ANSSI guidance stricter than others or the floor for government contracts', () => {
    const anssi = getComplianceCuriousPreface('ANSSI') ?? ''
    expect(anssi).not.toMatch(/stricter/i)
    expect(anssi).not.toMatch(/de facto floor/i)
  })

  it('keeps every preface non-empty', () => {
    for (const text of Object.values(COMPLIANCE_CURIOUS_PREFACES)) {
      expect(text.trim().length).toBeGreaterThan(40)
    }
  })
})
