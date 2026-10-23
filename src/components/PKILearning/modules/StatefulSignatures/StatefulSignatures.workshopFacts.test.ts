// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The workshop facts the two modules' rag-summary.md files repeat (the site assistant
 * reads them) must be the numbers and wording the pages print: comparison sizes derived
 * from the RFC layouts, the CNSA 2.0 position, and what Simulate State Loss shows.
 */
import { describe, it, expect } from 'vitest'
import statefulRag from './rag-summary.md?raw'
import statefulCurious from './curious-summary.md?raw'
import slhdsaRag from '../SLHDSAModule/rag-summary.md?raw'
import { COMPARED_SIZES, bytesLabel } from './data/signatureSizes'

const flat = (s: string) => s.replace(/\s+/g, ' ').toLowerCase()

describe('Stateful Signatures rag-summary: workshop Steps 3 and 4', () => {
  const rag = flat(statefulRag)

  it('says what Simulate State Loss does and that it is an emulator result', () => {
    expect(rag).toContain('simulate state loss')
    for (const rv of [
      'CKR_ATTRIBUTE_READ_ONLY',
      'CKR_ATTRIBUTE_SENSITIVE',
      'CKR_ACTION_PROHIBITED',
    ])
      expect(rag).toContain(rv.toLowerCase())
    expect(rag).toContain('no leaf is reused')
    expect(rag).toContain('does not show that any certified module does the same')
    // the old claim is gone
    expect(rag).not.toContain('witness the consequences of catastrophic state loss')
  })

  it('prints the comparison sizes the page prints, for named parameter sets', () => {
    expect(rag).toContain(
      `${COMPARED_SIZES.lms.publicKey}-byte public key and a ${COMPARED_SIZES.lms.signature.toLocaleString('en-US')}-byte signature`
    )
    expect(rag).toContain(
      `${bytesLabel(COMPARED_SIZES.slhdsa192s.publicKey)} and ${bytesLabel(COMPARED_SIZES.slhdsa192s.signature)}`.toLowerCase()
    )
    expect(rag).toContain(
      `ml-dsa-65 ${bytesLabel(COMPARED_SIZES.mldsa65.publicKey)} and ${bytesLabel(COMPARED_SIZES.mldsa65.signature)}`.toLowerCase()
    )
    expect(rag).toContain(
      `ml-dsa-87 ${bytesLabel(COMPARED_SIZES.mldsa87.publicKey)} and ${bytesLabel(COMPARED_SIZES.mldsa87.signature)}`.toLowerCase()
    )
    expect(rag).toContain('assigns no nist category to lms')
    // 56 B is the LMS key (m = 32); the 60-byte key is a two-level HSS key
    expect(rag).toContain('the 60-byte key in rfc 8554 appendix f is a two-level hss key')
  })

  it('names the NIST LMS sample exactly as the vendored file does', () => {
    expect(rag).toContain('all 16 cases')
    expect(rag).toContain('975de31')
    expect(rag).toContain('lms-sigver-sp800-208 and lms-sigver-1.0')
    expect(rag).toContain('not vectors issued by an acvts test session')
    expect(rag).toContain('functional round trips, not known-answer tests')
    expect(flat(statefulCurious)).toContain('16 cases')
  })
})

describe('SLH-DSA rag-summary: algorithm checks and comparison', () => {
  const rag = flat(slhdsaRag)

  it('describes the checks panels by the kind of evidence they give', () => {
    expect(rag).toContain('algorithm checks (workshop steps 1-3)')
    expect(rag).toContain('functional round trips, not known-answer tests')
    expect(rag).toContain('the lms checks live in the stateful hash signatures module')
  })

  it('prints the same comparison sizes as the page, and the CNSA row', () => {
    expect(rag).toContain(
      `lms public key ${COMPARED_SIZES.lms.publicKey} b and signature ${COMPARED_SIZES.lms.signature.toLocaleString('en-US')} b`
    )
    expect(rag).toContain(
      `xmss ${COMPARED_SIZES.xmss.publicKey} b and ${COMPARED_SIZES.xmss.signature.toLocaleString('en-US')} b`
    )
    expect(rag).toContain(
      `slh-dsa-sha2-192s ${COMPARED_SIZES.slhdsa192s.publicKey} b and ${COMPARED_SIZES.slhdsa192s.signature.toLocaleString('en-US')} b`
    )
    expect(rag).toContain('hss and xmss^mt are not allowed')
    expect(rag).toContain('slh-dsa is not approved for any use in nss')
  })
})
