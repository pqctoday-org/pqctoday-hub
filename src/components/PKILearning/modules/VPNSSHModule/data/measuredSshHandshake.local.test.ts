// SPDX-License-Identifier: AGPL-3.0-only
import { Buffer } from 'node:buffer'
import { describe, expect, it } from 'vitest'
import fixtures from './sshMeasuredSamples.json'
import { measureSshSample, sshSample } from './measuredSshHandshake'
import { PROTOCOL_SIZE_DATA } from './protocolSizeComparisons'
const modes = ['classical', 'hybrid', 'pure-pqc'] as const
const fixture = (mode: (typeof modes)[number]) =>
  structuredClone(fixtures.profiles.find((p) => p.name === (mode === 'pure-pqc' ? 'pqc' : mode))!)
const golden = {
  classical: [31, 232, 48, 16, 31, 200, 192, 16],
  hybrid: [31, 232, 1232, 16, 31, 200, 1280, 16],
  'pure-pqc': [31, 232, 1200, 16, 31, 192, 6416, 16],
}
describe('captured SSH transport accounting', () => {
  it.each(modes)('%s includes both streams through NEWKEYS and matches its row', (mode) => {
    const s = sshSample(mode),
      row = PROTOCOL_SIZE_DATA.find((r) => r.protocol === 'SSH' && r.mode === mode)!
    expect(s.messages.map((m) => m.bytes)).toEqual(golden[mode])
    expect(s.totalBytes).toBe({ classical: 766, hybrid: 3038, 'pure-pqc': 8134 }[mode])
    expect(row.handshakeBytes).toBe(s.totalBytes)
    expect(row.publicKeyBytes).toBe(s.clientShareBytes)
    expect(row.ciphertextBytes).toBe(s.ciphertextBytes)
    expect(s.messages.filter((m) => m.name === 'NEWKEYS')).toHaveLength(2)
    expect(s.messages.reduce((n, m) => n + m.payloadBytes + m.framingBytes, 0)).toBe(s.totalBytes)
  })
  it('counts the wrapped host public key and signature in the PQC reply', () => {
    const s = sshSample('pure-pqc')
    expect([
      s.rawPublicKeyBytes,
      s.hostKeyBlobBytes,
      s.rawSignatureBytes,
      s.signatureBlobBytes,
    ]).toEqual([1952, 1972, 3309, 3329])
    expect(s.messages[6].payloadBytes).toBe(1 + 4 + 1972 + 4 + 1088 + 4 + 3329)
    expect(s.messages[6].bytes).toBe(6416)
  })
  it('separates hybrid share sizes and the ciphertext component', () => {
    const s = sshSample('hybrid')
    expect([s.clientShareBytes, s.serverShareBytes, s.ciphertextBytes]).toEqual([1216, 1120, 1088])
  })
  describe.each(modes)('%s contrary cases', (mode) => {
    it('rejects the old undersized or unaccounted total', () => {
      const f = fixture(mode)
      f.totalBytes = { classical: 984, hybrid: 3296, 'pure-pqc': 3100 }[mode]
      expect(() => measureSshSample(mode, f)).toThrow(/total/)
    })
    it('rejects truncated raw packets', () => {
      const f = fixture(mode)
      f.messages[1].base64 = Buffer.from(f.messages[1].base64, 'base64')
        .subarray(0, -1)
        .toString('base64')
      expect(() => measureSshSample(mode, f)).toThrow(/size/)
    })
    it('rejects a corrupted packet length with unchanged raw size', () => {
      const f = fixture(mode),
        b = Buffer.from(f.messages[1].base64, 'base64')
      b[3] ^= 1
      f.messages[1].base64 = b.toString('base64')
      expect(() => measureSshSample(mode, f)).toThrow(/length/)
    })
    it('rejects inadequate padding', () => {
      const f = fixture(mode),
        b = Buffer.from(f.messages[1].base64, 'base64')
      b[4] = 3
      f.messages[1].base64 = b.toString('base64')
      expect(() => measureSshSample(mode, f)).toThrow(/padding/)
    })
    it('rejects a wrong message number', () => {
      const f = fixture(mode),
        b = Buffer.from(f.messages[2].base64, 'base64')
      b[5] = 31
      f.messages[2].base64 = b.toString('base64')
      expect(() => measureSshSample(mode, f)).toThrow(/type/)
    })
    it('rejects a missing NEWKEYS or swapped direction', () => {
      const f = fixture(mode)
      f.messages.pop()
      expect(() => measureSshSample(mode, f)).toThrow(/eight/)
      const g = fixture(mode)
      g.messages[7].direction = 'client-to-server'
      expect(() => measureSshSample(mode, g)).toThrow(/direction/)
    })
    it('rejects a compression list that prefers compression to none', () => {
      const f = fixture(mode)
      const packet = Buffer.from(f.messages[1].base64, 'base64')
      const oldList = Buffer.from('none,zlib@openssh.com')
      const newList = Buffer.from('zlib@openssh.com,none')
      const at = packet.indexOf(oldList)
      expect(at).toBeGreaterThan(0)
      newList.copy(packet, at)
      f.messages[1].base64 = packet.toString('base64')
      expect(() => measureSshSample(mode, f)).toThrow(/compression/)
    })
    it('rejects a different claimed authentication or cipher', () => {
      const f = fixture(mode)
      f.authentication = 'ssh-rsa'
      expect(() => measureSshSample(mode, f)).toThrow(/profile/)
      const g = fixture(mode)
      g.cipher = 'aes256-ctr'
      expect(() => measureSshSample(mode, g)).toThrow(/cipher/)
    })
  })
})
