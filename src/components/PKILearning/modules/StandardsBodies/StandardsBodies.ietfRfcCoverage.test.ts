// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { content } from './content'
import { ORGANIZATIONS } from './data'
import { WORKSHOP_SCENARIOS } from './data/workshopScenarios'

const ietf = ORGANIZATIONS.find((organization) => organization.id === 'ietf')!

describe('Standards Bodies: current IETF PQC RFC coverage', () => {
  it('distinguishes TLS key agreement, X.509 composite signatures, and CMS signatures', () => {
    expect(ietf.keyPqcOutputs.join(' ')).toContain(
      'RFC 10024 (TLS 1.3 PQ/T hybrid key agreement groups)'
    )
    expect(ietf.keyPqcOutputs.join(' ')).toContain(
      'RFC 10073 (composite ML-DSA signature format for X.509/PKIX'
    )
    expect(ietf.keyPqcOutputs.join(' ')).toContain('RFC 10082 (composite ML-DSA signatures for CMS')
    expect(ietf.libraryRefs).toContain(
      'RFC-10073-Composite-ML-DSA-for-Use-in-X-509-Public-Key-Infra'
    )
    expect(ietf.libraryRefs).toContain('RFC 10082')
  })

  it('resolves the published RFC references through the module standard registry', () => {
    const ids = content.standards.map((standard) => standard.id)
    expect(ids).toContain('RFC-10073-Composite-ML-DSA-for-Use-in-X-509-Public-Key-Infra')
    expect(ids).toContain('RFC 10082')
    const rfc10082 = content.standards.find((standard) => standard.id === 'RFC 10082')!
    expect(rfc10082.status).toContain('Proposed Standard (November 2026)')
    expect(rfc10082.organization).toContain('IETF')
  })

  it('uses the published TLS RFC and keeps generic ETSI guidance distinct from TLS', () => {
    const tlsScenario = WORKSHOP_SCENARIOS.find((scenario) => scenario.id === 'tls-ietf')!
    expect(
      tlsScenario.standardOptions.find((option) => option.id === 'tls-hybrid')?.label
    ).toContain('RFC 10024')
    expect(tlsScenario.standardOptions.find((option) => option.id === 'etsi-ts')?.label).toContain(
      'generic hybrid key establishment'
    )
    expect(tlsScenario.detailedExplanation).toContain('published RFC 10024')
    expect(tlsScenario.detailedExplanation).toContain('not the TLS profile')
    expect(tlsScenario.detailedExplanation).not.toContain('IETF draft')
    expect(tlsScenario.detailedExplanation).not.toContain(
      'already ship X25519MLKEM768 in production'
    )
  })

  it('states the current NIST FIPS 206 status without repeating an old draft-clearance date', () => {
    expect(content.narratives.relatedStandards).toContain('remains in development')
    expect(content.narratives.relatedStandards).toContain("NIST's current PQC standardization page")
    expect(content.narratives.relatedStandards).not.toContain('April 2, 2026')
  })
})
