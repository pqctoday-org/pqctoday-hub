// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import {
  createPrivateKey,
  createPublicKey,
  diffieHellman,
  createHash,
  sign,
  verify,
} from 'node:crypto'
import {
  createSshExchangeSample,
  assessSshExchange,
  serializeSshExchangeHash,
  sshPositiveMpint,
  type SshHashFields,
} from './sshExchangeHashSample'
import fixtures from '../../VPNSSHModule/data/sshMeasuredSamples.json'

// Newly authored disposable test seeds, unrelated to any retained SSH session.
const seeds = {
  clientSecret: new Uint8Array(32).fill(1),
  serverSecret: new Uint8Array(32).fill(2),
  hostSecret: new Uint8Array(32).fill(3),
}
const key = (seed: Uint8Array, oid: '6e' | '70') =>
  createPrivateKey({
    key: Buffer.concat([
      Buffer.from(`302e020100300506032b65${oid}04220420`, 'hex'),
      Buffer.from(seed),
    ]),
    format: 'der',
    type: 'pkcs8',
  })
const string = (data: Uint8Array) => {
  const size = Buffer.alloc(4)
  size.writeUInt32BE(data.length)
  return Buffer.concat([size, Buffer.from(data)])
}
function reference(fields: SshHashFields) {
  const bigint = BigInt('0x' + Buffer.from(fields.K).toString('hex'))
  let hex = bigint.toString(16)
  if (hex.length % 2) hex = '0' + hex
  if (parseInt(hex.slice(0, 2), 16) >= 128) hex = '00' + hex
  return Buffer.concat(
    [
      fields.V_C,
      fields.V_S,
      fields.I_C,
      fields.I_S,
      fields.K_S,
      fields.Q_C,
      fields.Q_S,
      Buffer.from(hex, 'hex'),
    ].map(string)
  )
}

describe('complete existing Curve25519/Ed25519 SSH reference sample', () => {
  it('matches independent Node X25519, byte writer, SHA-256 and Ed25519 tools', () => {
    const s = createSshExchangeSample(seeds)
    const client = key(seeds.clientSecret, '6e'),
      server = key(seeds.serverSecret, '6e'),
      host = key(seeds.hostSecret, '70')
    expect(Buffer.from(s.fields.Q_C)).toEqual(
      createPublicKey(client).export({ format: 'der', type: 'spki' }).subarray(-32)
    )
    expect(Buffer.from(s.fields.Q_S)).toEqual(
      createPublicKey(server).export({ format: 'der', type: 'spki' }).subarray(-32)
    )
    expect(Buffer.from(s.fields.K)).toEqual(
      diffieHellman({ privateKey: client, publicKey: createPublicKey(server) })
    )
    const bytes = reference(s.fields),
      h = createHash('sha256').update(bytes).digest()
    expect(Buffer.from(s.bytes)).toEqual(bytes)
    expect(Buffer.from(s.hash)).toEqual(h)
    expect(Buffer.from(s.signature)).toEqual(sign(null, h, host))
    expect(verify(null, h, createPublicKey(host), s.signature)).toBe(true)
    expect(s.verified).toBe(true)
    expect(s.sessionId).toEqual(s.hash)
    expect(s.encoded.map((f) => f.name)).toEqual([
      'V_C',
      'V_S',
      'I_C',
      'I_S',
      'K_S',
      'Q_C',
      'Q_S',
      'K',
    ])
    expect(s.fields.I_C[0]).toBe(20)
    expect(s.fields.I_C.length).toBe(218)
    expect(s.fields.I_S.length).toBe(184)
  })
  it.each(['V_C', 'V_S', 'I_C', 'I_S', 'K_S', 'Q_C', 'Q_S', 'K'] as const)(
    'binds %s in both independent and local verification',
    (field) => {
      const s = createSshExchangeSample(seeds),
        changed = { ...s.fields }
      const value = new Map(Object.entries(changed)).get(field)!.slice()
      Reflect.set(changed, field, value)
      const index = field === 'I_C' || field === 'I_S' ? 1 : value.length - 1
      value.set([value.at(index)! ^ 1], index)
      const checked = assessSshExchange(changed, s.signature, s.hostPublic, s.sessionId)
      const independent = createHash('sha256').update(reference(changed)).digest()
      expect(Buffer.from(checked.hash)).toEqual(independent)
      expect(checked.hash).not.toEqual(s.hash)
      expect(checked.verified).toBe(false)
      expect(
        verify(null, independent, createPublicKey(key(seeds.hostSecret, '70')), s.signature)
      ).toBe(false)
      expect(checked.sessionId).toEqual(s.sessionId)
    }
  )
  it('refuses cookie-only, missing/truncated fields and malformed public negotiation packets', () => {
    const s = createSshExchangeSample(seeds)
    expect(() =>
      serializeSshExchangeHash({ ...s.fields, I_C: s.fields.I_C.slice(1, 17) })
    ).toThrow()
    for (const field of ['Q_C', 'Q_S', 'K', 'K_S'] as const)
      expect(() =>
        serializeSshExchangeHash({
          ...s.fields,
          [field]: new Map(Object.entries(s.fields)).get(field)!.slice(0, -1),
        })
      ).toThrow()
    expect(() => serializeSshExchangeHash({ ...s.fields, K: new Uint8Array(32) })).toThrow(
      /All-zero/
    )
    expect(() => serializeSshExchangeHash({ ...s.fields, V_C: new Uint8Array() })).toThrow(
      /Missing/
    )
    expect(() =>
      serializeSshExchangeHash({
        ...s.fields,
        V_S: new TextEncoder().encode('SSH-2.0-invalid\r\n'),
      })
    ).toThrow()
    const f = structuredClone(fixtures.profiles[0])
    f.messages[1].base64 = btoa(atob(f.messages[1].base64).slice(0, -1))
    expect(() => createSshExchangeSample({ ...seeds, fixture: f })).toThrow()
  })
  it('encodes positive mpint sign-prefix, leading zero and empty integer boundaries', () => {
    expect(Buffer.from(sshPositiveMpint(new Uint8Array([0x80]))).toString('hex')).toBe(
      '000000020080'
    )
    expect(Buffer.from(sshPositiveMpint(new Uint8Array([0, 0x7f]))).toString('hex')).toBe(
      '000000017f'
    )
    expect(Buffer.from(sshPositiveMpint(new Uint8Array([0]))).toString('hex')).toBe('00000000')
  })
  it('rejects wrong valid host key, altered and truncated signatures; restores original', () => {
    const s = createSshExchangeSample(seeds)
    const wrong = createSshExchangeSample({ ...seeds, hostSecret: new Uint8Array(32).fill(4) })
    expect(assessSshExchange(s.fields, s.signature, wrong.hostPublic).verified).toBe(false)
    const bad = s.signature.slice()
    bad[0] ^= 1
    expect(assessSshExchange(s.fields, bad, s.hostPublic).verified).toBe(false)
    expect(assessSshExchange(s.fields, s.signature.slice(0, -1), s.hostPublic).verified).toBe(false)
    expect(assessSshExchange(s.fields, s.signature, s.hostPublic).verified).toBe(true)
  })
  it('new exchange H changes while first session identifier and host identity stay pinned', () => {
    const first = createSshExchangeSample(seeds)
    const next = createSshExchangeSample({
      ...seeds,
      clientSecret: new Uint8Array(32).fill(5),
      serverSecret: new Uint8Array(32).fill(6),
      sessionId: first.sessionId,
    })
    expect(next.hash).not.toEqual(first.hash)
    expect(next.sessionId).toEqual(first.hash)
    expect(next.hostPublic).toEqual(first.hostPublic)
    expect(next.verified).toBe(true)
    expect(() =>
      assessSshExchange(next.fields, next.signature, next.hostPublic, new Uint8Array())
    ).toThrow()
  })
})
