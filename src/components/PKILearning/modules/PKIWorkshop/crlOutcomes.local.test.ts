// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import {
  inspectSampleIssuer,
  inspectSampleCrl,
  classifySampleVerify,
  sampleVerifyFailure,
  sampleInputId,
} from './crlOutcomes'
import fixtures from './crlOutcomes.local.fixtures.json'
import observed from './crlVerifyOutcomes.local.fixtures.json'
const p = fixtures.pem
const verify = (name: string, cert: string) => {
  const row = observed.rows.find((r) => r.name === name && r.cert === cert)!
  return 'thrown' in row.result
    ? sampleVerifyFailure(new Error(row.result.thrown))
    : { stdout: row.result.stdout ?? '', stderr: row.result.stderr ?? '', error: row.result.error }
}
describe('Direct sample CRL identity and scope', () => {
  it('retains the real serial and CRL dates for the selected inputs', () => {
    expect(inspectSampleCrl(p.good, p.ca, p.current)).toEqual({
      serial: '0a',
      thisUpdate: '2025-01-01T00:00:00.000Z',
      nextUpdate: '2030-01-01T00:00:00.000Z',
    })
  })
  it('accepts the same CRL in DER encoding', () => {
    const bytes = Uint8Array.from(atob(p.current.replace(/-----[^-]+-----|\s/g, '')), (c) =>
      c.charCodeAt(0)
    )
    expect(inspectSampleCrl(p.good, p.ca, bytes).serial).toBe('0a')
  })
  it('does not confuse identical subject names with matching issuer keys', () => {
    expect(() => inspectSampleIssuer(p.good, p['same-name-other-key-ca'])).toThrow(
      /key identifiers differ/
    )
  })
  it('does not accept partial names or a misleading filename as issuer evidence', () => {
    expect(() => inspectSampleIssuer(p.good, p['different-ca'])).toThrow(/names do not match/)
  })
  it.each(['same-name-wrong-key', 'wrong-issuer', 'wrong-scope', 'delta', 'malformed'] as const)(
    'keeps unsupported or mismatched %s incomplete before execution',
    (crl) => {
      expect(() => inspectSampleCrl(p.good, p.ca, p[crl])).toThrow()
    }
  )
  it('does not claim to check signatures in its identity preflight', () => {
    expect(inspectSampleCrl(p.revoked, p.ca, p['bad-signature']).serial).toBe('0b')
    expect(classifySampleVerify(verify('bad-signature', 'revoked'), true)).toBe('incomplete')
  })
  it('uses exact content for selection bindings', () => {
    expect(sampleInputId(p.ca)).not.toBe(sampleInputId(p['same-name-other-key-ca']))
    expect(sampleInputId(p.current)).not.toBe(sampleInputId(p.expired))
  })
  it('rejects a non-CA issuer and a CA target for this leaf-only check', () => {
    expect(() => inspectSampleIssuer(p.good, p.good)).toThrow(/not a CA/)
    expect(() => inspectSampleCrl(p.ca, p.ca, p.current)).toThrow(/end-entity/)
  })
})
describe('Observed OpenSSL verification outcomes', () => {
  it('requires the exact completed success marker', () => {
    expect(classifySampleVerify(verify('current', 'good'), true)).toBe('passed')
    expect(classifySampleVerify({ stdout: '', stderr: '', error: '' }, true)).toBe('error')
  })
  it('recognizes only the observed leaf revoked result and expected exit status', () => {
    expect(classifySampleVerify(verify('current', 'revoked'), true)).toBe('revoked')
    expect(classifySampleVerify(verify('current', 'revoked'), false)).toBe('incomplete')
  })
  it.each([
    'expired',
    'future',
    'same-name-wrong-key',
    'wrong-issuer',
    'wrong-scope',
    'bad-signature',
    'malformed',
  ])('never calls %s evidence confirmed revocation', (crl) => {
    for (const cert of ['good', 'revoked'])
      expect(classifySampleVerify(verify(crl, cert), true)).not.toBe('revoked')
  })
  it('does not interpret the word CRL or revoked as a diagnosis', () => {
    for (const message of [
      'CRL missing',
      'CRL expired',
      'worker error: revoked text',
      'Verification failed',
    ]) {
      expect(classifySampleVerify(sampleVerifyFailure(new Error(message)), true)).toBe('error')
    }
  })
  it('requires a completed leaf check without conflicting errors', () => {
    const base = verify('current', 'revoked')
    expect(
      classifySampleVerify({ ...base, stderr: base.stderr.replace('0 depth', '1 depth') }, true)
    ).toBe('incomplete')
    expect(
      classifySampleVerify(
        { ...base, stderr: base.stderr + '\nerror 12 at 0 depth lookup: CRL expired' },
        true
      )
    ).toBe('incomplete')
    expect(classifySampleVerify({ ...base, error: 'worker reset' }, true)).not.toBe('revoked')
  })
})
