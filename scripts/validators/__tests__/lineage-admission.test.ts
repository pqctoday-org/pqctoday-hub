// SPDX-License-Identifier: GPL-3.0-only
// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { admissionState } from '../lineage-admission.js'

describe('admissionState()', () => {
  it('admits a converted MATCH source', () => {
    expect(admissionState({ artefact: 'SOURCE', identity: 'MATCH', unified: 'converted' })).toBe(
      'admitted'
    )
  })
  it('admits UNCONFIRMED (the door admits by design) and SITE', () => {
    expect(admissionState({ artefact: 'SITE', identity: 'UNCONFIRMED', unified: 'current' })).toBe(
      'admitted'
    )
  })
  it('refuses rejected artefacts, FORMAT-MISMATCH, CONTRADICTED, and non-current unified', () => {
    expect(admissionState({ artefact: 'PAYWALL', identity: 'MATCH', unified: 'current' })).toBe(
      'artefact PAYWALL'
    )
    expect(
      admissionState({ artefact: 'FORMAT-MISMATCH', identity: 'MATCH', unified: 'current' })
    ).toBe('artefact FORMAT-MISMATCH')
    expect(
      admissionState({ artefact: 'SOURCE', identity: 'CONTRADICTED', unified: 'current' })
    ).toBe('identity CONTRADICTED')
    expect(admissionState({ artefact: 'SOURCE', identity: 'MATCH', unified: 'error' })).toBe(
      'unified error'
    )
  })
  it('an entry never stamped through the door is "not admitted"', () => {
    expect(admissionState({ status: 'downloaded' } as never)).toMatch(/^not admitted/)
  })
})
