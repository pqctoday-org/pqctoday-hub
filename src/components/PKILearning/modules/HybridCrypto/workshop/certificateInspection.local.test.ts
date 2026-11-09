// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { X509Certificate } from 'node:crypto'
import { AsnConvert } from '@peculiar/asn1-schema'
import { Certificate, AttributeValue } from '@peculiar/asn1-x509'
import { IETF_CERT_VECTORS, decodeDer, derToPem } from '../data/ietfTestVectors'
import {
  inspectCertificateDer,
  inspectCertificatePem,
  workspaceCertificateGroups,
} from './certificateInspection'

const fixture = () => decodeDer(IETF_CERT_VECTORS.find((v) => v.certType === 'pure-pqc')!.derBase64)

describe('Actual certificate structural fields and byte boundaries', () => {
  it.each(IETF_CERT_VECTORS.map((v) => [v.id, v.derBase64]))(
    'reads actual reference bytes for %s',
    (_id, base64) => {
      const der = decodeDer(base64)
      const result = inspectCertificateDer(der)
      const independent = new X509Certificate(der)
      const cn = independent.subject
        .split('\n')
        .find((line) => line.startsWith('CN='))
        ?.slice(3)
      if (cn) expect(result.text).toContain(`CN=${JSON.stringify(cn)}`)
      expect(result.text.toLowerCase()).toContain(independent.serialNumber.toLowerCase())
      expect(result.sizes.derSize).toBe(der.length)
      expect(result.sizes.pubKeySize + result.sizes.sigSize + result.sizes.overhead).toBe(
        der.length
      )
      expect(result.sizes.overhead).toBeGreaterThanOrEqual(0)
      expect(result.info.publicKeyBytes!.length).toBe(result.sizes.pubKeySize)
      expect(result.info.signatureBytes!.length).toBe(result.sizes.sigSize)
    }
  )

  it('preserves DER partitions when PEM wrapping changes its UTF8 transport size', () => {
    const der = fixture()
    const pem = derToPem(der)
    const crlf = pem.replace(/\n/g, '\r\n')
    const a = inspectCertificatePem(pem),
      b = inspectCertificatePem(new TextEncoder().encode(crlf))
    expect(a.der).toEqual(b.der)
    expect(b.sizes).toEqual({ ...a.sizes, pemSize: new TextEncoder().encode(crlf).length })
    expect(b.sizes.pemSize).toBeGreaterThan(a.sizes.pemSize)
    expect(b.pem).toBe(crlf)
  })

  it('reads changed encoded names/serial and accounts for changed DER structure', () => {
    const original = inspectCertificateDer(fixture())
    const cert = AsnConvert.parse(fixture(), Certificate)
    cert.tbsCertificate.subject[0][0].value = new AttributeValue({
      utf8String: 'Different actual encoded subject with a longer name',
    })
    cert.tbsCertificate.serialNumber = new Uint8Array([1, 2, 3, 4]).buffer
    const changed = inspectCertificateDer(new Uint8Array(AsnConvert.serialize(cert)))
    expect(changed.text).toContain('Different actual encoded subject with a longer name')
    expect(changed.text).toContain('Serial Number (encoded hex): 01020304')
    expect(changed.sizes.pubKeySize).toBe(original.sizes.pubKeySize)
    expect(changed.sizes.sigSize).toBe(original.sizes.sigSize)
    expect(changed.sizes.overhead).not.toBe(original.sizes.overhead)
  })

  it('shows unsupported encoded name values without fabricating a CN', () => {
    const cert = AsnConvert.parse(fixture(), Certificate)
    cert.tbsCertificate.subject[0][0].type = '1.2.3.4'
    cert.tbsCertificate.subject[0][0].value = new AttributeValue({
      anyValue: new Uint8Array([4, 3, 1, 2, 3]).buffer,
    })
    const result = inspectCertificateDer(new Uint8Array(AsnConvert.serialize(cert)))
    expect(result.text).toContain('1.2.3.4=#0403010203')
  })

  it('retains a genuinely empty encoded signature as zero bytes', () => {
    const cert = AsnConvert.parse(fixture(), Certificate)
    cert.signatureAlgorithm.algorithm = '1.3.6.1.5.5.7.6.36'
    cert.signatureValue = new ArrayBuffer(0)
    const result = inspectCertificateDer(new Uint8Array(AsnConvert.serialize(cert)))
    expect(result.sizes.sigSize).toBe(0)
    expect(result.text).toContain('Signature payload: 0 octets')
  })

  it.each([
    new Uint8Array(),
    new Uint8Array([0x30, 0]),
    fixture().slice(0, -1),
    new Uint8Array([...fixture(), 0]),
  ])('rejects incomplete or trailing DER instead of inventing measurements', (der) => {
    expect(() => inspectCertificateDer(der)).toThrow()
  })

  it.each([
    '',
    '-----BEGIN CERTIFICATE-----\n!!!!\n-----END CERTIFICATE-----',
    '-----BEGIN PRIVATE KEY-----\nAA==\n-----END PRIVATE KEY-----',
  ])('rejects malformed or private PEM', (pem) => {
    expect(() => inspectCertificatePem(pem)).toThrow()
  })

  it('selects exact public role filenames only, retaining incomplete entries without leaking private input', () => {
    const pem = derToPem(fixture())
    const file = (name: string, type: 'cert' | 'key', content = pem) => ({
      name,
      type,
      content,
      size: content.length,
      timestamp: 1234,
    })
    const groups = workspaceCertificateGroups([
      file('hybrid-pure-pqc-ca.pem', 'cert'),
      file('hybrid-pure-pqc.pem', 'cert'),
      file('hybrid-related-certs-cert-a.pem', 'cert'),
      file('hybrid-related-certs-cert-b.pem', 'cert'),
      file('hybrid-composite.pem', 'key'),
      file('hybrid-composite-ca.pem', 'cert'),
      file('hybrid-unsigned-kem-ca.pem', 'cert'),
      file('hybrid-unknown.pem', 'cert'),
      file('hybrid-parallel.pem', 'cert'),
      file(
        'hybrid-alt-sig.pem',
        'cert',
        '-----BEGIN PRIVATE KEY-----\nAA==\n-----END PRIVATE KEY-----'
      ),
    ])
    expect(groups.flatMap((group) => group.certs).map((entry) => entry.label)).toEqual([
      'hybrid-pure-pqc-ca.pem',
      'hybrid-pure-pqc.pem',
      'hybrid-alt-sig.pem',
      'hybrid-related-certs-cert-a.pem',
      'hybrid-related-certs-cert-b.pem',
    ])
    const bad = groups.flatMap((group) => group.certs).find((entry) => entry.error)!
    expect(bad.inspection).toBeUndefined()
    expect(bad.pem).toBe('')
    expect(bad.parsed).toBe('')
  })

  it('retains all three exact Related and Discovery roles from the actual producer suffix contract', () => {
    const names = [
      'hybrid-related-certs-ca.pem',
      'hybrid-related-certs-cert-a.pem',
      'hybrid-related-certs-cert-b.pem',
      'hybrid-cert-discovery-ca.pem',
      'hybrid-cert-discovery-cert-a.pem',
      'hybrid-cert-discovery.pem',
    ]
    const files = names.map((name) => ({
      name,
      type: 'cert' as const,
      content: derToPem(fixture()),
      size: 0,
      timestamp: 1234,
    }))
    expect(
      workspaceCertificateGroups(files)
        .flatMap((group) => group.certs)
        .map((entry) => entry.label)
        .sort()
    ).toEqual(names.sort())
    // Names identify source slots only: they cannot turn a pure-PQC DER into a discovery/composite proof.
    expect(
      workspaceCertificateGroups(files).every((group) =>
        group.certs.every(
          (entry) =>
            entry.inspection?.info.algorithmOID ===
            inspectCertificateDer(fixture()).info.algorithmOID
        )
      )
    ).toBe(true)
  })
})
