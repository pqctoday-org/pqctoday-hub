// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import {
  PASSIVE_OBSERVATIONS,
  PQC_TESTING_VALIDATION_EVIDENCE_BOUNDARY,
  SCAN_RESULTS,
} from './testingConstants'
import curiousSummary from '../curious-summary.md?raw'
import ragSummary from '../rag-summary.md?raw'

describe('passive discovery observations: not observed is not the same as not supported', () => {
  const all = Object.values(PASSIVE_OBSERVATIONS).flat()
  const byId = (id: string) => all.find((o) => o.id === id)!

  it('a flow without a hybrid exchange says support is unknown, not that the endpoint lacks it', () => {
    const d = byId('obs-cloud-2').details
    expect(d).toMatch(/hybrid key exchange was not observed/i)
    expect(d).toMatch(/unknown from this capture/)
    expect(d).not.toMatch(/does not support hybrid/)
  })

  it('an encrypted TLS 1.3 flow explains why a passive tap cannot see the certificate chain', () => {
    const o = byId('obs-cloud-3')
    expect(o.quantumSafe).toBe('unknown')
    expect(o.details).toMatch(/hybrid was not observed and support is unknown/)
    expect(o.details).toMatch(/TLS 1\.3 encrypts the Certificate message/)
    expect(o.details).toMatch(/endpoint telemetry/)
  })

  it('no observation turns an absent hybrid exchange into a requirement', () => {
    expect(byId('obs-wan-3').details).not.toMatch(/Upgrade to hybrid required/)
  })
})

describe('active scan results: TLS 1.2 is not deprecated and BEAST is a TLS 1.0 CBC issue', () => {
  const t3 = SCAN_RESULTS.t3
  const t7 = SCAN_RESULTS.t7

  it('reports static RSA lack of forward secrecy and CBC implementation risk for TLS 1.2, without calling it deprecated or BEAST-prone', () => {
    const v = t3.vulnerabilities.join(' | ')
    expect(t3.tlsVersion).toBe('TLS 1.2')
    expect(v).not.toMatch(/deprecated/i)
    expect(v).not.toMatch(/BEAST/)
    expect(v).toMatch(/no forward secrecy/)
    expect(v).toMatch(/Lucky Thirteen/)
    expect(t3.recommendation).toMatch(/TLS 1\.2 itself is not deprecated/)
    expect(t3.recommendation).toMatch(/RFC 8996 deprecates TLS 1\.0 and 1\.1/)
  })

  it('keeps the end-of-life label for TLS 1.1', () => {
    expect(t7.tlsVersion).toBe('TLS 1.1')
    expect(t7.vulnerabilities.join(' ')).toMatch(/TLS 1\.1/)
  })
})

describe('pqc-testing-validation ACVP vs module boundary & certificate cross-check gate', () => {
  it('separates NIST CAVP ACVP IUT mathematical conformance from FIPS 140-3 / CC module boundary validation', () => {
    expect(PQC_TESTING_VALIDATION_EVIDENCE_BOUNDARY.acvpIutConformance).toContain('IUT')
    expect(PQC_TESTING_VALIDATION_EVIDENCE_BOUNDARY.moduleBoundaryValidation).toContain(
      'SP 800-90B'
    )
    expect(PQC_TESTING_VALIDATION_EVIDENCE_BOUNDARY.moduleBoundaryValidation).toContain(
      'key zeroization'
    )
    expect(curiousSummary).toContain('IUT')
    expect(curiousSummary).toContain('SP 800-90B')
    expect(ragSummary).toContain('IUT')
    expect(ragSummary).toContain('SP 800-90B')
  })

  it('requires cross-checking the 5 production certificate fields and rejects sample Hub exports as certification evidence', () => {
    expect(PQC_TESTING_VALIDATION_EVIDENCE_BOUNDARY.requiredCertificateCrossCheckFields).toEqual([
      'Operational Environment (OE)',
      'CAVP Algorithm Cert #',
      'CMVP Module Cert #',
      'Tested Version/Commit',
      'Security Target SHA-256',
    ])
    for (const field of PQC_TESTING_VALIDATION_EVIDENCE_BOUNDARY.requiredCertificateCrossCheckFields) {
      expect(curiousSummary).toContain(field)
      expect(ragSummary).toContain(field)
    }
    expect(PQC_TESTING_VALIDATION_EVIDENCE_BOUNDARY.sampleNonEquivalenceNotice).toContain(
      'never certification evidence'
    )
  })
})
