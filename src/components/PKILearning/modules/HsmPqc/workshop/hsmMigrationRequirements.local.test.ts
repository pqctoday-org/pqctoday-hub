// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { buildPlanningTopics, reviewContextKey, vendorDraftKey } from './hsmMigrationRequirements'

const ids = (caseId: string, em = false) => buildPlanningTopics(caseId, em).map((topic) => topic.id)

describe('Explicit fictional HSM requirements', () => {
  it('does not produce a reviewable case from absent or unknown intent', () => {
    expect(ids('')).toEqual([])
    expect(ids('constructor', true)).toEqual([])
  })
  it('makes signing-only operation and interface requirements independent of KEM', () => {
    const topics = ids('signing')
    expect(topics).toEqual(
      expect.arrayContaining([
        'sign-verify',
        'pkcs11-signature',
        'randomness',
        'threat-scope',
        'lifecycle',
      ])
    )
    expect(topics).not.toContain('encapsulate-decapsulate')
    expect(topics).not.toContain('pkcs11-kem')
    expect(topics.some((id) => id.includes('record'))).toBe(false)
  })
  it('uses the explicit vendor-API KEM requirement without adding signing or PKCS#11', () => {
    const topics = ids('kem')
    expect(topics).toContain('encapsulate-decapsulate')
    expect(topics).toContain('vendor-api')
    expect(topics).not.toContain('sign-verify')
    expect(topics.some((id) => id.startsWith('pkcs11'))).toBe(false)
    expect(topics.some((id) => id.includes('record'))).toBe(false)
  })
  it('requires records only on explicit project request and never derives EM from that request', () => {
    const topics = ids('both-records')
    expect(topics).toEqual(
      expect.arrayContaining([
        'sign-verify',
        'encapsulate-decapsulate',
        'pkcs11-signature',
        'pkcs11-kem',
        'module-record',
        'algorithm-record-ML-DSA-65',
        'algorithm-record-ML-KEM-768',
      ])
    )
    expect(topics).not.toContain('em-assessment')
    expect(ids('both-records', true)).toEqual([...topics, 'em-assessment'])
    expect(ids('signing', true)).toContain('em-assessment')
    expect(ids('signing', true)).not.toContain('module-record')
  })
  it('keeps context identity distinct across cases, EM requests, vendors and firmware', () => {
    expect(reviewContextKey('signing', false)).not.toBe(reviewContextKey('signing', true))
    expect(reviewContextKey('signing', false)).not.toBe(reviewContextKey('kem', false))
    const path = { vendorId: 'A', currentFirmware: '1', targetFirmware: '2' }
    expect(vendorDraftKey(path)).not.toBe(vendorDraftKey({ ...path, vendorId: 'B' }))
    expect(vendorDraftKey(path)).not.toBe(vendorDraftKey({ ...path, targetFirmware: '3' }))
    expect(vendorDraftKey(path)).not.toBe(vendorDraftKey({ ...path, currentFirmware: '0' }))
  })
})
