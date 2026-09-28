// SPDX-License-Identifier: GPL-3.0-only
import { describe, expect, it } from 'vitest'
import {
  EVIDENCE_CLASSES,
  EVIDENCE_CLASS_IDS,
  evidenceBadgeFor,
  isEvidenceClassId,
} from './evidenceClasses'

describe('evidence-class taxonomy (plan §2.1)', () => {
  it('has exactly the eight plan ids, each with its permitted claim', () => {
    expect([...EVIDENCE_CLASS_IDS]).toEqual([
      'nist-acvp-reference-sample',
      'acvts-issued-vector',
      'published-standard-kat',
      'independent-oracle',
      'cross-implementation-differential',
      'functional-round-trip',
      'oasis-profile-case',
      'product-mechanism-probe',
    ])
    for (const id of EVIDENCE_CLASS_IDS) {
      expect(EVIDENCE_CLASSES[id].id).toBe(id)
      expect(EVIDENCE_CLASSES[id].permittedClaim.length).toBeGreaterThan(10)
    }
    expect(EVIDENCE_CLASSES['nist-acvp-reference-sample'].permittedClaim).toBe(
      'Passes this public NIST ACVP-Server reference sample'
    )
  })

  it('never badges an unverified or quarantined entry', () => {
    expect(isEvidenceClassId('unverified')).toBe(false)
    expect(evidenceBadgeFor({ evidenceClass: 'unverified', status: 'quarantined' })).toBeUndefined()
    expect(
      evidenceBadgeFor({ evidenceClass: 'published-standard-kat', status: 'quarantined' })
    ).toBeUndefined()
    expect(evidenceBadgeFor({ evidenceClass: 'independent-oracle', status: 'active' })?.label).toBe(
      'Independent oracle'
    )
  })
})
