// SPDX-License-Identifier: AGPL-3.0-only
import 'reflect-metadata'
import { describe, expect, it } from 'vitest'
import { AsnConvert } from '@peculiar/asn1-schema'
import { PemConverter, Pkcs10CertificateRequest } from '@peculiar/x509'
import samples from './subjectKeyUsage.local.fixtures.json'
import { resolveSubjectKeyUsage } from './subjectKeyUsage'
import type { X509Attribute } from '../../common/types'

export const usage = (value: string): X509Attribute => ({
  id: '2.5.29.15',
  oid: '2.5.29.15',
  label: 'keyUsage',
  value,
  enabled: true,
  status: 'optional',
  elementType: 'Extension',
  placeholder: '',
  description: '',
})
class EditableRequest extends Pkcs10CertificateRequest {
  change(oid?: string, parameters?: ArrayBuffer | null) {
    if (oid) this.asn.certificationRequestInfo.subjectPKInfo.algorithm.algorithm = oid
    this.asn.certificationRequestInfo.subjectPKInfo.algorithm.parameters = parameters
    return PemConverter.encode(AsnConvert.serialize(this.asn), 'CERTIFICATE REQUEST')
  }
}
// Mutated CSR structures test inspection only: they are not valid signed requests.
// The component's existing separate CSR self-signature gate still precedes issuance.
describe('CSR subject usage inspection', () => {
  it.each(Object.keys(samples) as (keyof typeof samples)[])(
    'uses the subject SPKI for %s signing defaults',
    (name) => {
      const result = resolveSubjectKeyUsage(samples[name], [])
      expect(result.value).toBe('digitalSignature')
      expect(result.explicit).toBe(false)
      expect(result.label).not.toBe('')
    }
  )
  it('preserves deliberate RSA key transport, including an explicit critical prefix', () => {
    const result = resolveSubjectKeyUsage(samples.rsa, [
      usage('critical,digitalSignature,keyEncipherment'),
    ])
    expect(result.value).toBe('critical,digitalSignature,keyEncipherment')
    expect(result.purpose).toContain('legacy TLS')
  })
  it('preserves generic EC key agreement rather than treating all EC as signing only', () => {
    expect(resolveSubjectKeyUsage(samples.ec, [usage('keyAgreement,encipherOnly')]).value).toBe(
      'keyAgreement,encipherOnly'
    )
  })
  it('honors restricted ECDH rather than defaulting to a signature usage', () => {
    const request = new EditableRequest(samples.ec)
    const pem = request.change(
      '1.3.132.1.12',
      new Uint8Array([6, 8, 42, 134, 72, 206, 61, 3, 1, 7]).buffer
    )
    expect(() => resolveSubjectKeyUsage(pem, [])).toThrow(/incompatible/)
    expect(resolveSubjectKeyUsage(pem, [usage('keyAgreement')]).label).toBe('ECDH (P-256)')
  })
  it.each(['ec', 'ed25519', 'mldsa44', 'mldsa65', 'slhdsa128f'] as const)(
    'rejects RSA transport on a %s subject',
    (name) => {
      expect(() =>
        resolveSubjectKeyUsage(samples[name], [usage('digitalSignature,keyEncipherment')])
      ).toThrow(/incompatible/)
    }
  )
  it.each([
    '',
    'critical',
    'digitalSignature,',
    'digitalSignature,digitalSignature',
    'digitalSignature,critical',
    '@usage',
    'DER:03:02:05:A0',
    'keyCertSign',
    'encipherOnly',
    'keyAgreement,encipherOnly,decipherOnly',
  ])('rejects unresolved/incompatible usage %s', (value) => {
    expect(() => resolveSubjectKeyUsage(samples.ec, [usage(value)])).toThrow()
  })
  it('rejects duplicate keyUsage extensions including a numeric alias', () => {
    expect(() =>
      resolveSubjectKeyUsage(samples.rsa, [
        usage('digitalSignature'),
        { ...usage('keyEncipherment'), label: '2.5.29.15' },
      ])
    ).toThrow(/Multiple/)
  })
  it('does not treat a disabled profile usage as an active override', () => {
    expect(
      resolveSubjectKeyUsage(samples.ec, [{ ...usage('keyEncipherment'), enabled: false }]).value
    ).toBe('digitalSignature')
  })
  it('rejects unknown or key-establishment subject identifiers, not guessing from issuer/metadata', () => {
    for (const oid of ['1.2.3.4.5', '2.16.840.1.101.3.4.4.2', '1.3.101.110']) {
      expect(() =>
        resolveSubjectKeyUsage(new EditableRequest(samples.ed25519).change(oid), [])
      ).toThrow(/Unsupported CSR subject algorithm/)
    }
  })
  it('rejects missing EC parameters and present PQC parameters', () => {
    expect(() => resolveSubjectKeyUsage(new EditableRequest(samples.ec).change(), [])).toThrow(
      /parameters/
    )
    expect(() =>
      resolveSubjectKeyUsage(new EditableRequest(samples.mldsa44).change(undefined, null), [])
    ).toThrow(/parameters must be absent/)
  })
  it('rejects malformed CSR data', () => {
    expect(() => resolveSubjectKeyUsage('not a CSR', [])).toThrow(/Cannot inspect/)
  })
})
