// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The scheme chooser recommends HSS and XMSS^MT for some use cases. NSA CNSA 2.0 FAQ v2.2, p. 11:
 * "From NIST SP 800-208, NSA has only approved LMS and XMSS for use in NSS. The multi-tree
 * algorithms HSS and XMSSMT are not allowed." The rows that name a multi-tree scheme must say so,
 * and must not carry the phrases that had no source.
 */
import { describe, it, expect } from 'vitest'
import { USE_CASE_RECOMMENDATIONS } from './statefulSigsConstants'

const row = (id: string) => USE_CASE_RECOMMENDATIONS.find((r) => r.id === id)!

describe('scheme chooser: multi-tree recommendations carry the NSA caveat', () => {
  it.each([
    ['firmware-signing', 'NSA does not allow HSS in National Security Systems'],
    ['code-signing', 'NSA does not allow it in National Security Systems'],
    ['document-signing', 'NSA does not allow XMSS^MT in National Security Systems'],
  ])('%s says: %s (CNSA 2.0 FAQ v2.2, p. 11)', (id, phrase) => {
    expect(row(id).rationale).toContain(phrase)
    expect(row(id).rationale).toContain('CNSA 2.0 FAQ v2.2, p. 11')
  })

  it('has dropped the phrases that had no source', () => {
    const all = USE_CASE_RECOMMENDATIONS.map((r) => r.rationale).join(' ')
    expect(all).not.toContain('Better state recovery mechanisms')
    expect(all).not.toContain('PKI-integrated workflows')
    expect(all).not.toContain('massive signing capacity')
  })
})
