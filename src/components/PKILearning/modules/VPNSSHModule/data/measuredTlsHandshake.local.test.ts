// SPDX-License-Identifier: AGPL-3.0-only
import { Buffer } from 'node:buffer'
import { describe, expect, it } from 'vitest'
import fixtures from './tlsMeasuredSamples.json'
import { measureTlsSample, tlsSample, type TlsSampleMode } from './measuredTlsHandshake'
import { PROTOCOL_SIZE_DATA } from './protocolSizeComparisons'
import { inspectMeasuredCertificate } from '../../PKIWorkshop/measuredChainSample'

const modes: TlsSampleMode[] = ['classical', 'hybrid', 'pure-pqc']
const fixtureFor = (mode: TlsSampleMode) =>
  structuredClone(
    fixtures.profiles.find((profile) => profile.name === (mode === 'pure-pqc' ? 'pqc' : mode))!
  )
const golden = {
  classical: [159, 90, 6, 1642, 264, 36, 36],
  hybrid: [1337, 1178, 6, 1642, 264, 36, 36],
  'pure-pqc': [1303, 1146, 6, 11100, 3317, 36, 36],
}

describe('TLS captured-message accounting', () => {
  it.each(modes)(
    '%s matches independently decoded native captures and the displayed row',
    (mode) => {
      const sample = tlsSample(mode)
      expect(sample.messages.map((message) => message.bytes)).toEqual(golden[mode])
      expect(sample.totalBytes).toBe({ classical: 2233, hybrid: 4499, 'pure-pqc': 16944 }[mode])
      const row = PROTOCOL_SIZE_DATA.find(
        (entry) => entry.protocol === 'TLS 1.3' && entry.mode === mode
      )!
      expect(row.handshakeBytes).toBe(sample.totalBytes)
      expect(row.publicKeyBytes).toBe(sample.clientShareBytes)
      expect(row.ciphertextBytes).toBe(sample.ciphertextBytes)
      expect(sample.messages.filter((message) => message.name === 'Finished')).toHaveLength(2)
    }
  )

  it('distinguishes both hybrid key shares from the ML-KEM ciphertext component', () => {
    const sample = tlsSample('hybrid')
    expect([sample.clientShareBytes, sample.serverShareBytes, sample.ciphertextBytes]).toEqual([
      1216, 1120, 1088,
    ])
    expect(tlsSample('classical').serverShareBytes).toBe(32)
  })

  it.each(modes)('%s includes DER entry framing and CertificateVerify framing', (mode) => {
    const sample = tlsSample(mode)
    const der = sample.certificateDerBytes.reduce((sum, bytes) => sum + bytes, 0)
    expect(sample.messages[3].bytes).toBe(4 + 1 + 3 + 2 * (3 + 2) + der)
    expect(sample.messages[4].bytes).toBe(4 + 2 + 2 + sample.signatureBytes)
    expect(sample.authenticationBytes).toBe(sample.messages[3].bytes + sample.messages[4].bytes)
  })

  it('accounts for the observed six-byte EC point-format extension difference', () => {
    const classical = tlsSample('classical'),
      hybrid = tlsSample('hybrid')
    expect(classical.clientExtensionTypes).toContain(11)
    expect(hybrid.clientExtensionTypes).not.toContain(11)
    expect(hybrid.totalBytes - classical.totalBytes).toBe(
      hybrid.clientShareBytes + hybrid.serverShareBytes - 64 - 6
    )
    expect(hybrid.certificateDerBytes).toEqual(classical.certificateDerBytes)
  })

  it.each(modes)(
    '%s public certificates match the already approved fictional chain metadata',
    (mode) => {
      const fixture = fixtureFor(mode)
      const cert = Buffer.from(fixture.messages[3].base64, 'base64')
      let offset = 8 // Handshake header + empty context length + certificate-list length
      const roles = ['leaf', 'intermediate'] as const
      const algorithm = mode === 'pure-pqc' ? 'ML-DSA-65' : 'RSA-2048'
      for (const role of roles) {
        const length = cert.readUIntBE(offset, 3)
        offset += 3
        const der = new Uint8Array(cert.subarray(offset, offset + length))
        offset += length
        expect(cert.readUInt16BE(offset)).toBe(0)
        offset += 2
        const b64 = Buffer.from(der).toString('base64')
        const pem = `-----BEGIN CERTIFICATE-----\n${b64}\n-----END CERTIFICATE-----\n`
        expect(inspectMeasuredCertificate(der, pem, algorithm, role).role).toBe(role)
      }
      expect(offset).toBe(cert.length)
    }
  )

  describe.each(modes)('%s contrary cases', (mode) => {
    it('rejects a truncated message', () => {
      const fixture = fixtureFor(mode)
      fixture.messages[0].base64 = Buffer.from(fixture.messages[0].base64, 'base64')
        .subarray(0, -1)
        .toString('base64')
      expect(() => measureTlsSample(mode, fixture)).toThrow(/Truncated/)
    })
    it('rejects the original undersized total', () => {
      const fixture = fixtureFor(mode)
      fixture.totalBytes = { classical: 1200, hybrid: 3500, 'pure-pqc': 3200 }[mode]
      expect(() => measureTlsSample(mode, fixture)).toThrow(/total/)
    })
    it('rejects a wrong client key-share group without changing any lengths', () => {
      const fixture = fixtureFor(mode)
      const raw = Buffer.from(fixture.messages[0].base64, 'base64')
      const marker = Buffer.alloc(8)
      marker.writeUInt16BE(51, 0)
      marker.writeUInt16BE(fixture.clientShareBytes + 6, 2)
      marker.writeUInt16BE(fixture.clientShareBytes + 4, 4)
      marker.writeUInt16BE(fixture.groupCode, 6)
      const offset = raw.indexOf(marker)
      expect(offset).toBeGreaterThanOrEqual(0)
      raw.writeUInt16BE(0, offset + 6)
      fixture.messages[0].base64 = raw.toString('base64')
      expect(() => measureTlsSample(mode, fixture)).toThrow(/client-share group/)
    })
    it('rejects the wrong authentication scheme without changing the signature length', () => {
      const fixture = fixtureFor(mode)
      const raw = Buffer.from(fixture.messages[4].base64, 'base64')
      raw.writeUInt16BE(0, 4)
      fixture.messages[4].base64 = raw.toString('base64')
      expect(() => measureTlsSample(mode, fixture)).toThrow(/CertificateVerify scheme/)
    })
    it('rejects a missing Finished message', () => {
      const fixture = fixtureFor(mode)
      fixture.messages.pop()
      expect(() => measureTlsSample(mode, fixture)).toThrow(/seven/)
    })
    it('rejects an incorrect direction and false size metadata', () => {
      const fixture = fixtureFor(mode)
      fixture.messages[6].direction = 'server-to-client'
      expect(() => measureTlsSample(mode, fixture)).toThrow(/direction/)
      fixture.messages[6].direction = 'client-to-server'
      fixture.signatureBytes++
      expect(() => measureTlsSample(mode, fixture)).toThrow(/metadata/)
    })
  })
})
