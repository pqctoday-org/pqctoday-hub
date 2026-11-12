// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { createHash, createPublicKey, X509Certificate } from 'node:crypto'
import samples from '../data/emailSizeSamples.json'
import { certificateFieldComparison } from '../data/emailSigningConstants'
import {
  certificateDer,
  decodeSampleBase64,
  measureEmailSample,
  measureMime,
} from './emailArtifactMeasurements'
const subject = 'PQC workshop test message'
describe('Complete captured email encodings', () => {
  it.each([
    [0, 1101, 1545, 422, 2018, 384],
    [1, 5524, 7539, 1974, 9312, 1952],
  ])(
    'sample %i agrees with independent decoded encodings',
    (index, derBytes, pemBytes, spkiBytes, cmsBytes, componentBytes) => {
      const sample = samples.samples.at(index)!
      const value = measureEmailSample(sample, samples.payload, subject)
      const cert = certificateDer(sample.certPem)
      expect(cert.length).toBe(derBytes)
      expect(createHash('sha256').update(cert).digest('hex')).toBe(sample.certificateSha256)
      expect(createHash('sha256').update(decodeSampleBase64(sample.cmsBase64)).digest('hex')).toBe(
        sample.cmsSha256
      )
      expect([
        value.certDerBytes,
        value.certPemBytes,
        value.spkiDerBytes,
        value.cmsBytes,
        value.componentBytes,
      ]).toEqual([derBytes, pemBytes, spkiBytes, cmsBytes, componentBytes])
      expect(value.payloadBytes).toBe(67)
      expect(value.payloadBytes).toBeGreaterThan(samples.payload.length)
      expect(value.certOtherBytes + value.spkiDerBytes + value.certSignatureBytes).toBe(derBytes)
      expect(value.mimeBytes).toBe(value.headerBytes + value.bodyBytes)
      expect(value.overheadBytes).toBe(value.mimeBytes - 67)
    }
  )
  it('Node independently reads RSA3072 exponent65537, modulus, PKCS1 and fullSPKI boundaries', () => {
    const key = new X509Certificate(samples.samples[0].certPem).publicKey
    expect(key.asymmetricKeyDetails).toMatchObject({ modulusLength: 3072, publicExponent: 65537n })
    expect(key.export({ format: 'der', type: 'spki' }).byteLength).toBe(422)
    const pkcs1 = key.export({ format: 'der', type: 'pkcs1' })
    expect(pkcs1.byteLength).toBe(398)
    // Positive 3072-bit modulus needs a leading DER INTEGER zero; exponent65537 adds three contentbytes.
    expect(pkcs1.subarray(0, 9).toString('hex')).toBe('3082018a0282018100')
    const jwk = createPublicKey(samples.samples[0].certPem).export({ format: 'jwk' })
    expect(Buffer.from(jwk.n!, 'base64url')).toHaveLength(384)
    expect(Buffer.from(jwk.e!, 'base64url')).toEqual(Buffer.from([1, 0, 1]))
  })
  it('PEM line endings alter textual bytes but preserve exactDER/SPKI/CMS', () => {
    const s = samples.samples[0],
      a = measureEmailSample(s, samples.payload, subject)
    const b = measureEmailSample(
      { ...s, certPem: s.certPem.replace(/\n/g, '\r\n') },
      samples.payload,
      subject
    )
    expect(b.certPemBytes - a.certPemBytes).toBe(s.certPem.split('\n').length - 1)
    expect(b.certDerBytes).toBe(a.certDerBytes)
    expect(b.spkiDerBytes).toBe(a.spkiDerBytes)
    expect(b.cmsBytes).toBe(a.cmsBytes)
  })
  it('unsigned UTF8Subject changes only MIME header/total overhead, never signedcontent orCMS', () => {
    const s = samples.samples[0],
      a = measureEmailSample(s, samples.payload, 'a'),
      b = measureEmailSample(s, samples.payload, 'café')
    expect(b.headerBytes - a.headerBytes).toBe(4)
    expect(b.mimeBytes - a.mimeBytes).toBe(4)
    expect(b.overheadBytes - a.overheadBytes).toBe(4)
    expect(b.bodyBytes).toBe(a.bodyBytes)
    expect(b.cmsBytes).toBe(a.cmsBytes)
  })
  it.each([0, 1, 47, 48, 49, 96, 97])(
    'existing64columnMIME formatter independently decodes %i bytes',
    (n) => {
      const bytes = new Uint8Array(n).fill(0x41),
        m = measureMime(bytes, 0, '')
      const body = m.mime.split('\r\n\r\n')[1]
      expect(Buffer.from(body.replace(/\r\n/g, ''), 'base64')).toEqual(Buffer.from(bytes))
      const base64Length = 4 * Math.ceil(n / 3),
        lines = Math.ceil(base64Length / 64)
      expect(m.bodyBytes).toBe(base64Length + 2 * Math.max(1, lines))
      expect(m.overheadBytes).toBe(m.mimeBytes)
    }
  )
  it('actualfields retain separate certificate and CMS signature assumptions', () => {
    const [a, b] = samples.samples.map((s) => measureEmailSample(s, samples.payload, subject))
    expect(a.certSignatureOid).toBe('1.2.840.113549.1.1.11')
    expect(a.cmsSignatureOid).toBe('1.2.840.113549.1.1.10')
    expect(b.certSignatureOid).toBe('2.16.840.1.101.3.4.3.18')
    const rows = certificateFieldComparison(a, b)
    expect(rows.find((r) => r.field === 'Issuer')?.rsaValue).toBe(a.issuer)
    expect(a.issuer).toBe(a.subject)
    expect(rows.find((r) => r.field === 'Extension OIDs')?.rsaValue).toBe(
      a.extensions.join(', ') || 'none'
    )
  })
  it('rejects malformed/truncated DER, different payload, mismatched embedded certificate and header injection', () => {
    const [rsa, pq] = samples.samples
    expect(() => measureEmailSample({ ...rsa, certPem: 'bad' }, samples.payload, subject)).toThrow()
    expect(() =>
      measureEmailSample(
        { ...rsa, cmsBase64: rsa.cmsBase64.slice(0, -4) },
        samples.payload,
        subject
      )
    ).toThrow()
    expect(() => measureEmailSample(rsa, samples.payload + 'x', subject)).toThrow('content differs')
    expect(() =>
      measureEmailSample({ ...rsa, certPem: pq.certPem }, samples.payload, subject)
    ).toThrow('certificate differs')
    expect(() => measureEmailSample(rsa, samples.payload, 'a\r\nInjected: b')).toThrow(
      'one header line'
    )
    expect(() => measureMime(new Uint8Array(), Number.NaN, 'x')).toThrow('Invalid payload')
  })
})
