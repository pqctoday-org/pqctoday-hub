// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { inflateSync } from 'node:zlib'
import { X509Certificate } from 'node:crypto'
import captures from '../../VPNSSHModule/data/tlsMeasuredSamples.json'
import variants from './handshakeCertificateVariants.json'
import {
  compareMeasuredHandshake,
  exportHandshakeComparison,
  validateCertificateVariant,
} from './measuredHandshakeComparison'

const modes = ['classical', 'hybrid', 'pure-pqc'] as const
const totals = [2233, 4499, 16944]
const compressed = [2052, 4318, 16769]
const rpk = [909, 3175, 7842]
const fixture = (index: number) => captures.profiles[index]
const variant = (index: number) => variants.variants[index]
const u24 = (bytes: Buffer, at: number) => bytes.readUIntBE(at, 3)

describe('measured handshake variants', () => {
  it.each(modes)('independently sums all seven captured messages: %s', (mode) => {
    const i = modes.indexOf(mode),
      result = compareMeasuredHandshake(mode, [], 10000)
    const sum = fixture(i).messages.reduce((n, m) => n + Buffer.from(m.base64, 'base64').length, 0)
    expect(result.baselineBytes).toBe(sum)
    expect(result.adjustedBytes).toBe(totals[i])
    expect(result.messages).toHaveLength(7)
    expect(result.bandwidthBytesPerSecond).toBe(totals[i] * 10000)
  })
  it.each(modes)(
    'roundtrips the exact captured certificate body and counts only its substitution: %s',
    (mode) => {
      const i = modes.indexOf(mode),
        original = Buffer.from(fixture(i).messages[3].base64, 'base64')
      const replacement = Buffer.from(variant(i).compressedCertificateBase64, 'base64')
      const inflated = inflateSync(replacement.subarray(12))
      expect(inflated.equals(original.subarray(4))).toBe(true)
      expect(u24(replacement, 6)).toBe(inflated.length)
      const result = compareMeasuredHandshake(mode, ['compression'], 1000)
      expect(result.adjustedBytes).toBe(compressed[i])
      expect(result.negotiationBytes).toBe(7)
      expect(result.messages?.[0].bytes).toBe(fixture(i).messages[0].bytes + 7)
      for (const j of [1, 2, 4, 5, 6])
        expect(result.messages?.[j]).toEqual(result.baselineMessages[j])
    }
  )
  it.each(modes)(
    'extracts the identical leaf SPKI and preserves its authentication message: %s',
    (mode) => {
      const i = modes.indexOf(mode),
        original = Buffer.from(fixture(i).messages[3].base64, 'base64')
      const cert = new X509Certificate(original.subarray(11, 11 + u24(original, 8)))
      const spki = cert.publicKey.export({ format: 'der', type: 'spki' })
      expect(spki.equals(Buffer.from(variant(i).leafSpkiBase64, 'base64'))).toBe(true)
      const result = compareMeasuredHandshake(mode, ['rpk'], 10000)
      expect(result.adjustedBytes).toBe(rpk[i])
      expect(result.messages?.[3].bytes).toBe(spki.length + 13)
      expect(result.negotiationBytes).toBe(11)
      for (const j of [1, 4, 5, 6]) expect(result.messages?.[j]).toEqual(result.baselineMessages[j])
      expect(result.rawPublicKeyScope).toMatch(/external identity-to-key trust binding/)
    }
  )
  it.each(['missing', 'truncated', 'corrupted', 'same-length-other-source', 'wrong-profile'])(
    'refuses %s certificate substitution',
    (kind) => {
      const source = structuredClone(fixture(0)),
        data = structuredClone(variant(0))
      if (kind === 'missing') data.compressedCertificateBase64 = ''
      if (kind === 'truncated')
        data.compressedCertificateBase64 = Buffer.from(data.compressedCertificateBase64, 'base64')
          .subarray(0, -1)
          .toString('base64')
      if (kind === 'corrupted') {
        const b = Buffer.from(data.compressedCertificateBase64, 'base64')
        b[b.length - 1] ^= 1
        data.compressedCertificateBase64 = b.toString('base64')
        expect(() => inflateSync(b.subarray(12))).toThrow()
      }
      if (kind === 'same-length-other-source') {
        const b = Buffer.from(source.messages[3].base64, 'base64')
        b[100] ^= 1
        source.messages[3].base64 = b.toString('base64')
      }
      if (kind === 'wrong-profile') data.profile = 'hybrid'
      expect(() => validateCertificateVariant('classical', source, data)).toThrow()
    }
  )
  it('does not compound duplicate or transport choices and changes bandwidth only with explicit rate', () => {
    const a = compareMeasuredHandshake('hybrid', ['compression'], 10000)
    const b = compareMeasuredHandshake(
      'hybrid',
      ['compression', 'compression', 'http3-quic', 'connection-coalescing'],
      1000
    )
    expect(b.adjustedBytes).toBe(a.adjustedBytes)
    expect(b.mitigations).toHaveLength(3)
    expect(b.bandwidthBytesPerSecond! * 10).toBe(a.bandwidthBytesPerSecond)
    expect(compareMeasuredHandshake('hybrid', ['http3-quic'], 10000).adjustedBytes).toBe(4499)
  })
  it.each([['compression', 'rpk'], ['psk'], ['mtc']])(
    'exports an unavailable whole budget for unsupported choice %j',
    (...ids) => {
      const result = compareMeasuredHandshake('pure-pqc', ids, 10000)
      const exported = JSON.parse(exportHandshakeComparison(result))
      expect(exported.adjustedBytes).toBeNull()
      expect(exported.messages).toBeNull()
      expect(exported.bandwidthBytesPerSecond).toBeNull()
      expect(exported.unsupportedReason).toBeTruthy()
      expect(exported.baselineBytes).toBe(16944)
      expect(exported.remainingBeforePskEnvelopeChanges).toBe(2527)
    }
  )
  it.each([NaN, Infinity, -1, 1.5, Number.MAX_SAFE_INTEGER])('refuses invalid rate %s', (rate) =>
    expect(() => compareMeasuredHandshake('classical', [], rate)).toThrow()
  )
  it('refuses unknown profiles and mitigation names, and permits an explicit zero rate', () => {
    expect(() => compareMeasuredHandshake('invented', [], 1000)).toThrow()
    expect(() => compareMeasuredHandshake('classical', ['invented'], 1000)).toThrow()
    expect(compareMeasuredHandshake('classical', [], 0).bandwidthBytesPerSecond).toBe(0)
  })
})
