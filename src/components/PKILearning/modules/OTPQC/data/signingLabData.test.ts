// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { SIGNING_SCHEMES, getScheme, planSigning, DEFAULT_SIGNING_PLAN } from './signingLabData'

describe('OT signing lab: CNSA 2.0 status of the hash-based schemes', () => {
  it('marks both two-level HSS selectors as not CNSA 2.0, whichever tree height is chosen', () => {
    for (const id of ['hss-l2-h10-w8', 'hss-l2-h20-w8'] as const) {
      const scheme = getScheme(id)
      expect(scheme.label).toMatch(/HSS L=2/)
      expect(scheme.cnsa2).toBe('not-cnsa')
      expect(scheme.note).toMatch(/does not imply CNSA 2\.0 approval/)
    }
  })

  it('keeps the single-tree LMS and XMSS rows as the CNSA 2.0 firmware-signing choices', () => {
    for (const id of ['lms-h10-w8', 'lms-h15-w8', 'lms-h20-w8', 'lms-h25-w8', 'xmss-h20'] as const)
      expect(getScheme(id).cnsa2).toBe('firmware-signing')
  })

  it('warns, for each multi-tree selector, that SP 800-208 approval is not NSS approval', () => {
    for (const id of ['hss-l2-h10-w8', 'hss-l2-h20-w8'] as const) {
      const warnings = planSigning({ ...DEFAULT_SIGNING_PLAN, scheme: id }).warnings.join(' ')
      expect(warnings).toMatch(/not allowed in National Security Systems/)
      expect(warnings).toMatch(/approved by NIST SP 800-208/)
    }
    const lms = planSigning({ ...DEFAULT_SIGNING_PLAN, scheme: 'lms-h20-w8' }).warnings.join(' ')
    expect(lms).not.toMatch(/not allowed in National Security Systems/)
  })

  it('does not label any multi-level scheme as a CNSA 2.0 firmware-signing scheme', () => {
    const multi = SIGNING_SCHEMES.filter((s) => /HSS L=[2-9]/.test(s.label))
    expect(multi.length).toBe(2)
    for (const s of multi) expect(s.cnsa2).not.toBe('firmware-signing')
  })
})
