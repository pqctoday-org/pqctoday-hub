// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, vi } from 'vitest'
import { createPrivateKey, createPublicKey } from 'node:crypto'
import * as S from '@/wasm/softhsm'
import { readRsaPrivateKeyDer, serializeRsaPrivateKeyDer } from './rsaKeyEncoding'

const ones = () => Array.from({ length: 8 }, () => new Uint8Array([1]))

describe('RSA private PKCS#1 binary encoding', () => {
  it('encodes the version and eight actual components in RFC 8017 order', () => {
    const bytes = serializeRsaPrivateKeyDer(ones())
    expect(Buffer.from(bytes).toString('hex')).toBe('301b020100' + '020101'.repeat(8))
  })
  it('canonicalizes redundant leading zeroes and adds a sign pad only when necessary', () => {
    expect(
      serializeRsaPrivateKeyDer(Array.from({ length: 8 }, () => new Uint8Array([0, 0, 1])))
    ).toEqual(serializeRsaPrivateKeyDer(ones()))
    const bytes = serializeRsaPrivateKeyDer(
      Array.from({ length: 8 }, () => new Uint8Array([0, 0x80]))
    )
    expect(Buffer.from(bytes).toString('hex')).toBe('3023020100' + '02020080'.repeat(8))
    expect(bytes.length).not.toBe(serializeRsaPrivateKeyDer(ones()).length)
  })
  it.each([
    [127, '308199020100027f', 156],
    [128, '30819b020100028180', 158],
    [255, '3082011a0201000281ff', 286],
    [256, '3082011c02010002820100', 288],
  ])('uses canonical DER length octets for a %s-byte component', (length, prefix, total) => {
    const values = [new Uint8Array(length).fill(1), ...ones().slice(1)]
    const bytes = serializeRsaPrivateKeyDer(values)
    expect(Buffer.from(bytes).toString('hex').startsWith(prefix)).toBe(true)
    expect(bytes.length).toBe(total)
  })
  it('rejects incomplete, empty and zero components rather than reporting an encoded key size', () => {
    expect(() => serializeRsaPrivateKeyDer(ones().slice(1))).toThrow(/eight/)
    expect(() => serializeRsaPrivateKeyDer([new Uint8Array(), ...ones().slice(1)])).toThrow(
      /nonzero/
    )
    expect(() => serializeRsaPrivateKeyDer([new Uint8Array([0, 0]), ...ones().slice(1)])).toThrow(
      /nonzero/
    )
  })
  it.each([
    ['missing private exponent', S.CKA_PRIVATE_EXPONENT, 0x12, null],
    ['denied prime', S.CKA_PRIME_1, 0x11, null],
    ['malformed prime', S.CKA_PRIME_2, 0, new Uint8Array()],
  ] as const)('rejects a later %s without producing partial DER', (_reason, target, rv, value) => {
    const spy = vi
      .spyOn(S, 'readBytesAttr')
      .mockImplementation((_M, _session, _handle, attr) =>
        attr === target ? { rv, value } : { rv: 0, value: new Uint8Array([1]) }
      )
    try {
      expect(() => readRsaPrivateKeyDer({} as S.SoftHSMModule, 7, 12)).toThrow(/RSA private/)
    } finally {
      spy.mockRestore()
    }
  })
  it.each([
    ['absent', 0x12],
    ['sensitive', 0x11],
    ['operational failure', 0xb3],
  ])('does not fabricate private DER after an %s attribute read', (_reason, rv) => {
    const spy = vi.spyOn(S, 'readBytesAttr').mockReturnValue({ rv, value: null })
    try {
      expect(() => readRsaPrivateKeyDer({} as S.SoftHSMModule, 7, 12)).toThrow(
        /private.*attribute unavailable/
      )
      expect(spy).toHaveBeenCalledTimes(1)
    } finally {
      spy.mockRestore()
    }
  })
})

describe('existing Rust RSA sample attributes and independent Node decoding', () => {
  it('measures actual 2048/3072/4096 binary keys and preserves the same public key', async () => {
    const M = await S.getSoftHSMRustModule()
    S.hsm_initialize(M)
    const slot = S.hsm_getFirstFreeSlot(M)
    const id = S.hsm_initToken(M, slot, '12345678', 'RSAEncoding')
    const session = S.hsm_openUserSession(M, id, '12345678', 'user1234')
    try {
      for (const bits of [2048, 3072, 4096] as const) {
        const pair = S.hsm_generateRSAKeyPair(M, session, bits, true)
        const publicDer = S.hsm_extractRSAPublicKeyDer(M, session, pair.pubHandle)
        const privateDer = readRsaPrivateKeyDer(M, session, pair.privHandle)
        const privateKey = createPrivateKey({
          key: Buffer.from(privateDer),
          format: 'der',
          type: 'pkcs1',
        })
        const publicKey = createPublicKey({
          key: Buffer.from(publicDer),
          format: 'der',
          type: 'pkcs1',
        })
        expect(privateKey.asymmetricKeyDetails?.modulusLength).toBe(bits)
        expect(publicKey.asymmetricKeyDetails?.publicExponent).toBe(65537n)
        expect(privateKey.export({ format: 'der', type: 'pkcs1' })).toEqual(Buffer.from(privateDer))
        expect(createPublicKey(privateKey).export({ format: 'der', type: 'pkcs1' })).toEqual(
          Buffer.from(publicDer)
        )
        expect(publicDer.byteLength).toBe(bits / 8 + 14)
        expect(privateDer.byteLength).toBeGreaterThan(bits / 4)
        expect(privateDer.byteLength).not.toBe(Buffer.from(privateDer).toString('hex').length)
        expect(privateDer.byteLength).not.toBe(
          privateKey.export({ format: 'pem', type: 'pkcs1' }).length
        )
        const attrs = S.hsm_getKeyAttributes(M, session, pair.privHandle)
        expect(attrs.ckSensitive).toBe(false)
        expect(attrs.ckExtractable).toBe(true)
        // The lock-selected engine intentionally has no externally readable RSA CKA_VALUE.
        expect(S.readBytesAttr(M, session, pair.privHandle, S.CKA_VALUE)).toEqual({
          rv: 0x12,
          value: null,
        })
      }
    } finally {
      S.hsm_finalize(M, session)
    }
  }, 120000)
})
