// SPDX-License-Identifier: GPL-3.0-only
/**
 * Provenance gate for the four CSWP.39 passages the tools quote verbatim.
 *
 * Four tools were scored A-/A by the 2026-08-10 audit largely because they
 * carry these constants — "the strongest grounding pattern in the codebase".
 * The constants had never been compared against the document. When they finally
 * were, on 2026-08-11, two of them silently dropped a parenthetical from inside
 * a sentence that renders on screen, and in exports, inside `> "..."`.
 *
 * Neither elision changed the meaning. That is the point: a quotation that
 * reads plausibly is the one nobody re-checks. A quote presented as verbatim
 * either is verbatim or is marked with an ellipsis — there is no third option
 * that is still honest.
 *
 * Source: NIST-CSWP-39.pdf (47pp) in the private evidence cache, transcribed
 * into CSWP39_VERBATIM_QUOTES. This test compares the shipped constants
 * against that transcription, so drift in either direction fails.
 */
import { describe, it, expect } from 'vitest'
import { CSWP39_VERBATIM_QUOTES } from './cswp39Headings'
import { CSWP39_311_QUOTE } from '@/components/PKILearning/modules/CryptoMgmtModernization/components/MTINegotiator'
import { CSWP39_324_QUOTE } from '@/components/PKILearning/modules/CryptoMgmtModernization/components/HybridTransitionPlanner'
import { CSWP39_41_QUOTE } from '@/components/PKILearning/modules/CryptoMgmtModernization/components/CryptoApiRefactorAudit'
import { CSWP39_64_QUOTE } from '@/components/PKILearning/modules/CryptoMgmtModernization/components/CloudResponsibilityMatrix'

describe('CSWP.39 verbatim quotes', () => {
  it('MTI Negotiator quotes §3.1.1 exactly', () => {
    expect(CSWP39_311_QUOTE).toBe(CSWP39_VERBATIM_QUOTES['§3.1.1'])
  })

  it('keeps the §3.1.1 parenthetical that was dropped', () => {
    // The shipped quote read "...as mandatory-to-implement. Of course..." —
    // the document says "...as mandatory-to-implement (i.e., to be supported
    // by all implementations). Of course...".
    expect(CSWP39_311_QUOTE).toContain('(i.e., to be supported by all implementations)')
  })

  it('Hybrid Transition Planner quotes §3.2.4 exactly', () => {
    expect(CSWP39_324_QUOTE).toBe(CSWP39_VERBATIM_QUOTES['§3.2.4'])
  })

  it('Crypto API Refactor Audit quotes §4.1 exactly on both sides of its ellipsis', () => {
    const [a, b] = CSWP39_41_QUOTE.split(' [...] ')
    expect(a).toBe(CSWP39_VERBATIM_QUOTES['§4.1-a'])
    expect(b).toBe(CSWP39_VERBATIM_QUOTES['§4.1-b'])
  })

  it('keeps the §4.1 parenthetical that was dropped', () => {
    expect(CSWP39_41_QUOTE).toContain('(e.g., email and web apps)')
  })

  it('Cloud Responsibility Matrix quotes §6.4 exactly', () => {
    // This one was correct all along. It only LOOKED wrong: the PDF's text
    // layer injects a running page header mid-sentence ("...data, applications,
    // and NIST CSWP 39 ... 29 configurations."), which breaks a naive
    // substring comparison. Pinned so that the false alarm is not "fixed".
    expect(CSWP39_64_QUOTE).toBe(CSWP39_VERBATIM_QUOTES['§6.4'])
  })

  it('marks every elision with an ellipsis rather than closing the gap silently', () => {
    for (const [section, quote] of Object.entries({
      '§3.1.1': CSWP39_311_QUOTE,
      '§3.2.4': CSWP39_324_QUOTE,
      '§4.1': CSWP39_41_QUOTE,
      '§6.4': CSWP39_64_QUOTE,
    })) {
      // No quote may contain a bare "..." — an elision is written "[...]".
      const bareEllipsis = /(?:^|[^[])\.\.\.(?:[^\]]|$)/.test(quote)
      expect(bareEllipsis, `${section} uses a bare ellipsis`).toBe(false)
    }
  })
})
