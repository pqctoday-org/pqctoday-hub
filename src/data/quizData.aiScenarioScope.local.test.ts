// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { quizQuestions } from '@/data/quizDataLoader'
import { estimateHNDLRiskWindow } from '@/components/PKILearning/modules/AISecurityPQC/data/scaleEncryptionData'
const question = (id: string) => {
  const matches = quizQuestions.filter((q) => q.id === id)
  expect(matches).toHaveLength(1)
  return matches[0]!
}
describe('AI question source and worked-answer scope through the actual loader', () => {
  it('keeps the visible seven-year calculation and correct option within the declared authored bands', () => {
    const q = question('aisec-010')
    expect(q.type).toBe('multiple-choice')
    expect(q.correctAnswer).toBe('c')
    expect(q.question).toMatch(/2026.*7 years.*2033/)
    expect(q.options.find((o) => o.id === 'c')?.text).toMatch(
      /^Medium.*after 2030.*no later than 2035/
    )
    expect(q.explanation).toContain('2026 + 7 = 2033')
    expect(q.explanation).toMatch(/not CRQC arrival estimates/)
    expect(q.source).toMatch(/Hub authored.*base year 2026/)
    expect(q.explanation).not.toMatch(/many credible CRQC timeline estimates|risk is High/)
  })
  it.each([
    [4, 2030, 'Low'],
    [7, 2033, 'Medium'],
    [9, 2035, 'Medium'],
    [10, 2036, 'High'],
  ] as const)(
    'independently checks %i years → %i → %s against the real model',
    (years, expiry, band) => {
      expect(2026 + years).toBe(expiry)
      expect(estimateHNDLRiskWindow(years)).toMatch(new RegExp('^' + band + ' '))
      expect(estimateHNDLRiskWindow(years)).toContain(String(expiry))
    }
  )
  it('pins COSE signature structure and signer-trust scope without promoting a primitive demo to C2PA support', () => {
    const q = question('aisec-013')
    expect(q.type).toBe('true-false')
    expect(q.correctAnswer).toBe('true')
    expect(q.options.map((o) => o.id)).toEqual(['true', 'false'])
    expect(q.question).toMatch(/Specification 2\.4.*COSE_Sign1_Tagged/)
    expect(q.explanation).toMatch(/section 13\.2\.3.*COSE_Sign1_Tagged.*rather than CMS/)
    expect(q.explanation).toMatch(/distinct from judging the truth/)
    expect(q.explanation).toMatch(/does not establish C2PA protocol support/)
    expect(q.source).toMatch(/2\.4.*13\.2\.3.*pinned edition/)
    expect(q.sourceUrl).toBe(
      'https://spec.c2pa.org/specifications/specifications/2.4/specs/C2PA_Specification.html'
    )
    expect(q.explanation).not.toMatch(/certificates with CMS signatures/)
  })
})
