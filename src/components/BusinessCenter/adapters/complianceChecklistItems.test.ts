// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { STANDARD_CHECKLIST_ITEMS } from './complianceChecklistItems'

const evidence = STANDARD_CHECKLIST_ITEMS.find((item) => item.value === 'evidence')

describe('compliance checklist evidence item keeps each validation scope separate', () => {
  it('still exists under its stored value', () => {
    expect(evidence).toBeDefined()
  })

  it('does not group CMVP, ACVP and Common Criteria as one evidence pack', () => {
    expect(evidence?.label).not.toMatch(/Evidence pack/)
    expect(evidence?.label).not.toMatch(/CMVP \/ ACVP \/ CC/)
  })

  it('names each scope on its own: module, algorithm, local sample and product evaluation', () => {
    const text = `${evidence?.label} ${evidence?.description}`
    expect(text).toMatch(/CMVP module certificate/)
    expect(text).toMatch(/NIST CAVP algorithm validation/)
    expect(text).toMatch(/local ACVP sample run/)
    expect(text).toMatch(/Common Criteria/)
  })

  it('says a local sample run is not a certificate', () => {
    expect(evidence?.description).toMatch(/local ACVP sample run[^.]*not a certificate/)
  })

  it('says a local run or a Common Criteria record does not establish validation on its own', () => {
    expect(evidence?.description).toMatch(
      /local run or a Common Criteria record does not[^.]*establish[^.]*validat/
    )
  })

  it('no longer uses the interchangeable wording', () => {
    expect(evidence?.description).not.toMatch(
      /is collected to show the claimed algorithm or module is actually validated/
    )
    expect(evidence?.description).not.toMatch(
      /ACVP algorithm test results, or Common Criteria certification/
    )
  })

  it('keeps the other control values unchanged', () => {
    expect(STANDARD_CHECKLIST_ITEMS.map((item) => item.value)).toEqual([
      'inventory',
      'gap-analysis',
      'pqc-dependency',
      'roadmap',
      'evidence',
      'attestation',
    ])
  })
})
