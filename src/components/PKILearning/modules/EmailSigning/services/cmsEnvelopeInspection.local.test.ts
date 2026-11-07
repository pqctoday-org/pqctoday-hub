// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { inspectCmsEnvelope } from './cmsEnvelopeInspection'
import { smimeEnvelopeEncrypted } from './smimeMultipart'
import fixtures from './cmsEnvelope.local.fixtures.json'
const bytes = (name: keyof typeof fixtures.samples) =>
  Uint8Array.from(atob(fixtures.samples[name]), (c) => c.charCodeAt(0))
describe('CMS output inspection', () => {
  it.each(['RSA-aes-256-gcm', 'RSA-aes-128-gcm'] as const)(
    'identifies actual GCM container and baseline RSA transport: %s',
    (name) => {
      const result = inspectCmsEnvelope(bytes(name))
      expect(result.contentType).toBe('AuthEnvelopedData')
      expect(result.recipientOid).toBe('1.2.840.113549.1.1.1')
      expect(result.oaepHashOid).toBeUndefined()
    }
  )
  it('distinguishes unauthenticated CBC container', () => {
    const result = inspectCmsEnvelope(bytes('RSA-aes-256-cbc'))
    expect(result.contentType).toBe('EnvelopedData')
    expect(result.cipherOid).toBe('2.16.840.1.101.3.4.1.42')
  })
  it('decodes explicit OAEP hashes from independently generated output', () => {
    expect(inspectCmsEnvelope(bytes('native-oaep'))).toMatchObject({
      recipient: 'RSA-OAEP',
      oaepHashOid: '2.16.840.1.101.3.4.2.1',
      mgfHashOid: '2.16.840.1.101.3.4.2.1',
      oaepLabelHex: '',
    })
  })
  it.each([
    ['ML-KEM-512-aes-256-gcm', '1'],
    ['ML-KEM-768-aes-256-gcm', '2'],
    ['ML-KEM-1024-aes-256-gcm', '3'],
  ] as const)('preserves actual KEM variant and key wrapping: %s', (name, suffix) => {
    expect(inspectCmsEnvelope(bytes(name))).toMatchObject({
      contentType: 'AuthEnvelopedData',
      recipientOid: '2.16.840.1.101.3.4.4.' + suffix,
      kdfOid: '1.2.840.113549.1.9.16.3.28',
      wrapOid: '2.16.840.1.101.3.4.1.45',
    })
  })
  it('preserves AES-128 key-wrap instead of assigning AES-256 from another run', () => {
    expect(inspectCmsEnvelope(bytes('ML-KEM-768-aes-128-gcm'))).toMatchObject({
      cipherOid: '2.16.840.1.101.3.4.1.6',
      wrapOid: '2.16.840.1.101.3.4.1.5',
    })
  })
  it('rejects truncated and trailing data', () => {
    const original = bytes('native-oaep')
    expect(() => inspectCmsEnvelope(original.slice(0, -4))).toThrow()
    expect(() => inspectCmsEnvelope(new Uint8Array([...original, 0]))).toThrow()
  })
  it('uses the inspected type in MIME metadata without changing bytes', () => {
    for (const name of ['RSA-aes-256-cbc', 'native-oaep'] as const) {
      const input = bytes(name),
        result = inspectCmsEnvelope(input)
      const mime = smimeEnvelopeEncrypted(input, { date: 'sample' }, result.contentType)
      expect(mime).toContain(
        `smime-type=${result.contentType === 'AuthEnvelopedData' ? 'authEnveloped-data' : 'enveloped-data'}`
      )
      const encoded = mime.split('\r\n\r\n')[1].replaceAll('\r\n', '')
      expect(Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0))).toEqual(input)
    }
  })
})
