// SPDX-License-Identifier: AGPL-3.0-only
// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'
import { createHash, createHmac } from 'node:crypto'
import { hkdfExtract, hkdfExpand } from '@/utils/webCrypto'
import {
  deriveTlsImporterSample,
  serializeSampleImportedIdentity,
  sampleDerivedPskLabel,
  TLS_SAMPLE_CONTEXT,
} from './tlsPskImporterSample'

const bytes = (hex: string) => Uint8Array.from(Buffer.from(hex, 'hex'))
const hex = (value: Uint8Array) => Buffer.from(value).toString('hex')
const extract = (salt: Uint8Array, ikm: Uint8Array) =>
  createHmac('sha256', salt).update(ikm).digest()
function expand(prk: Uint8Array, info: Uint8Array, length: number) {
  let previous = Buffer.alloc(0),
    output = Buffer.alloc(0)
  for (let counter = 1; output.length < length; counter++) {
    previous = createHmac('sha256', prk)
      .update(Buffer.concat([previous, Buffer.from(info), Buffer.from([counter])]))
      .digest()
    output = Buffer.concat([output, previous])
  }
  return output.subarray(0, length)
}
// Independently encode the selected fields with Node Buffer, not the browser serializer.
function reference(
  epsk: Uint8Array,
  identity: Uint8Array,
  context: Uint8Array,
  protocol = 0x0304,
  kdf = 0x0001
) {
  const externalLength = Buffer.alloc(2),
    contextLength = Buffer.alloc(2),
    targets = Buffer.alloc(4)
  externalLength.writeUInt16BE(identity.length)
  contextLength.writeUInt16BE(context.length)
  targets.writeUInt16BE(protocol, 0)
  targets.writeUInt16BE(kdf, 2)
  const serializedIdentity = Buffer.concat([
      externalLength,
      Buffer.from(identity),
      contextLength,
      Buffer.from(context),
      targets,
    ]),
    identityHash = createHash('sha256').update(serializedIdentity).digest(),
    epskx = extract(new Uint8Array(32), epsk),
    label = Buffer.from('tls13 derived psk'),
    hkdfLabel = Buffer.concat([
      Buffer.from([0, 32, label.length]),
      label,
      Buffer.from([identityHash.length]),
      identityHash,
    ]),
    ipsk = expand(epskx, hkdfLabel, 32),
    earlySecret = extract(new Uint8Array(32), ipsk)
  return { serializedIdentity, identityHash, epskx, hkdfLabel, ipsk, earlySecret }
}
const epsk = Uint8Array.from({ length: 32 }, (_, i) => i),
  identity = new TextEncoder().encode('sample-key-id'),
  context = new TextEncoder().encode(TLS_SAMPLE_CONTEXT)
describe('selected RFC9258 TLS1.3/SHA256 importer mechanics with explicit sample inputs', () => {
  it('reuses native extract/expand that match RFC5869 AppendixA.1 known outputs', async () => {
    const ikm = new Uint8Array(22).fill(0x0b),
      salt = bytes('000102030405060708090a0b0c'),
      info = bytes('f0f1f2f3f4f5f6f7f8f9'),
      prk = await hkdfExtract(salt, ikm, 'SHA-256')
    expect(hex(prk)).toBe('077709362c2e32df0ddc3f0dc47bba6390b6c73bb50f9c3122ec844ad7c2b3e5')
    expect(hex(await hkdfExpand(prk, info, 42, 'SHA-256'))).toBe(
      '3cb25f25faacd57a90434f64d0362f2a2d2d0a90cf1a5a4c5db02d56ecc4c5bf34007208d5b887185865'
    )
  })
  it('matches independent Node every intermediate and positions IPSK as EarlySecret IKM', async () => {
    const actual = await deriveTlsImporterSample(epsk, identity, context),
      expected = reference(epsk, identity, context)
    for (const name of [
      'serializedIdentity',
      'identityHash',
      'epskx',
      'hkdfLabel',
      'ipsk',
      'earlySecret',
    ] as const)
      expect(hex(actual[name])).toBe(hex(expected[name]))
    expect(Buffer.from(actual.serializedIdentity).readUInt16BE(0)).toBe(identity.length)
    expect(hex(actual.serializedIdentity.slice(-4))).toBe('03040001')
    expect(hex(actual.hkdfLabel.slice(0, 3))).toBe('002011')
    expect(new TextDecoder().decode(actual.hkdfLabel.slice(3, 20))).toBe('tls13 derived psk')
    expect(actual.hkdfLabel[20]).toBe(32)
    expect(hex(actual.earlySecret)).not.toBe(hex(extract(actual.ipsk, new Uint8Array(32))))
    expect(hex(actual.ipsk)).not.toBe(hex(epsk))
  })
  it('binds changed identity/context and cannot match a corrupted target or label encoding', async () => {
    const base = await deriveTlsImporterSample(epsk, identity, context),
      changedId = identity.slice(),
      changedContext = context.slice()
    changedId[0] ^= 1
    changedContext[0] ^= 1
    expect(hex((await deriveTlsImporterSample(epsk, changedId, context)).ipsk)).not.toBe(
      hex(base.ipsk)
    )
    expect(hex((await deriveTlsImporterSample(epsk, identity, changedContext)).ipsk)).not.toBe(
      hex(base.ipsk)
    )
    // Corrupt fields in the independent reference, not a new offered TLS/DTLS or KDF profile.
    expect(hex(reference(epsk, identity, context, 0x0305).ipsk)).not.toBe(hex(base.ipsk))
    expect(hex(reference(epsk, identity, context, 0x0304, 0x0002).ipsk)).not.toBe(hex(base.ipsk))
    const wrongLabel = base.hkdfLabel.slice()
    wrongLabel[3] ^= 1
    expect(hex(expand(base.epskx, wrongLabel, 32))).not.toBe(hex(base.ipsk))
  })
  it('uses opaque byte lengths rather than JavaScript character counts', () => {
    const id = new TextEncoder().encode('id-π'),
      ctx = new TextEncoder().encode('context-ü'),
      serialized = serializeSampleImportedIdentity(id, ctx)
    expect(hex(serialized)).toBe(hex(reference(epsk, id, ctx).serializedIdentity))
    expect(new DataView(serialized.buffer).getUint16(0, false)).toBe(5)
  })
  it('rejects missing/oversized fields and label lengths rather than generating a fallback', async () => {
    for (const [id, ctx] of [
      [new Uint8Array(), context],
      [identity, new Uint8Array()],
      [new Uint8Array(65536), context],
      [identity, new Uint8Array(65536)],
      [new Uint8Array(65535), new Uint8Array(1)],
    ])
      expect(() => serializeSampleImportedIdentity(id, ctx)).toThrow()
    expect(serializeSampleImportedIdentity(new Uint8Array(1), new Uint8Array(65526))).toHaveLength(
      65535
    )
    expect(() => serializeSampleImportedIdentity(new Uint8Array(1), new Uint8Array(65527))).toThrow(
      /size bound/
    )
    expect(() => sampleDerivedPskLabel(new Uint8Array(31))).toThrow(/32 bytes/)
    await expect(deriveTlsImporterSample(new Uint8Array(31), identity, context)).rejects.toThrow(
      /32 bytes/
    )
  })
  it('snapshots all inputs before asynchronous native crypto and propagates operational errors', async () => {
    const source = epsk.slice(),
      id = identity.slice(),
      ctx = context.slice(),
      pending = deriveTlsImporterSample(source, id, ctx)
    source.fill(255)
    id.fill(0)
    ctx.fill(0)
    expect(hex((await pending).ipsk)).toBe(hex(reference(epsk, identity, context).ipsk))
    const sign = vi
      .spyOn(crypto.subtle, 'sign')
      .mockRejectedValueOnce(new Error('native HMAC failed'))
    try {
      await expect(deriveTlsImporterSample(epsk, identity, context)).rejects.toThrow(
        'native HMAC failed'
      )
    } finally {
      sign.mockRestore()
    }
  })
  it('rejects empty native outputs before dependent expansion or Early Secret', async () => {
    const sign = vi.spyOn(crypto.subtle, 'sign').mockResolvedValueOnce(new ArrayBuffer(0))
    try {
      await expect(deriveTlsImporterSample(epsk, identity, context)).rejects.toThrow(/EPSK extract/)
      expect(sign).toHaveBeenCalledTimes(1)
      sign.mockClear()
      sign.mockResolvedValueOnce(new ArrayBuffer(32)).mockResolvedValueOnce(new ArrayBuffer(0))
      await expect(deriveTlsImporterSample(epsk, identity, context)).rejects.toThrow(
        /IPSK expansion/
      )
      expect(sign).toHaveBeenCalledTimes(2)
    } finally {
      sign.mockRestore()
    }
  })
})
