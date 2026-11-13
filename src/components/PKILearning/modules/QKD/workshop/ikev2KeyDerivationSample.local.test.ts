// SPDX-License-Identifier: AGPL-3.0-only
/* eslint-disable security/detect-object-injection -- fixed key-name tables */
//
// IKEv2 SKEYSEED and SK_* (RFC 7296) with the RFC 8784 preshared-key mixing, for two fictional
// ECP-256 peers. The expected values below were computed independently (Python `hmac` and
// `cryptography`) from the RFC text, not by this module; the checks also recompute them with Node's
// HMAC. Everything is fictional: scalars 1 and 2, nonces 00..1f / 20..3f, SPIs a1.. / b1.., a PPK of
// bytes c0..df under a made-up QKD key_ID.
//
//   npx vitest run --config vitest.local.config.ts \
//     src/components/PKILearning/modules/QKD/workshop/ikev2KeyDerivationSample.local.test.ts
import { createECDH, createHmac, hkdfSync } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { IKE_V2_MODES } from '../../VPNSSHModule/data/ikev2Constants'
import {
  applyPpk,
  createSampleQkdNode,
  deriveIkeSaKeys,
  deriveSkeyseed,
  ecp256SharedX,
  hexOf,
  IKE_SAMPLE_PROFILE,
  MIN_PPK_BYTES,
  ppkIdOpaqueFromQkdKeyId,
  PPK_ID_TYPE_OPAQUE,
  prfPlus,
  runIkeQkdSample,
  type IkeQkdSampleInputs,
} from './ikev2KeyDerivationSample'

const seq = (start: number, n = 32) => Uint8Array.from({ length: n }, (_, i) => (start + i) & 0xff)
const scalar = (n: number) => Uint8Array.from([...new Array(31).fill(0), n])
const hexBytes = (hex: string) => Uint8Array.from(hex.match(/../g)!, (b) => parseInt(b, 16))
const NI = seq(0)
const NR = seq(32)
const SPI_I = hexBytes('a1a2a3a4a5a6a7a8')
const SPI_R = hexBytes('b1b2b3b4b5b6b7b8')
const PPK = seq(0xc0)
const KEY_ID = '5f1d2e3c-4b5a-4978-8a9b-0c1d2e3f4a5b'

const pair = (n: number) => {
  const ecdh = createECDH('prime256v1')
  ecdh.setPrivateKey(scalar(n))
  return { privateKey: scalar(n), publicKey: new Uint8Array(ecdh.getPublicKey()) }
}
const A = pair(1)
const B = pair(2)

// Independent known answers.
const EXPECT = {
  sharedX: '7cf27b188d034f7e8a52380304b51ac3c08969e277f21b35a60b48fc47669978',
  skeyseed: 'a02691e00cfacf374992662143d09e891052d0f46c90480fe9a2c6d642bbe70e',
  plain: {
    skD: 'e942c6222f2d5802d697159ff92637391f09685a5c3dc6704966fece18112129',
    skAi: '17fab460d68f46bfc99681b2b0d2d394c5d4f512c2dd74b1cb2609b381a40bb2',
    skAr: 'ab7ad80f849c592d917b0be5e4e0b48df2f4f6a34f2da2788d306f0d238f1427',
    skEi: '87d5106835247f4bc3232d5e2f41b05b379e53af12a5e8094c40f723dddf883c',
    skEr: '832909c32431c73f14ef9b359d80e7ea62f1860c76dfda43bc706608d0b41de0',
    skPi: '888d8931f176ada7af4c549aa0feb3ef44eb6b517afe2e598b8f980fa373d791',
    skPr: 'd5b3b22d49b04be4edb7d678f2c617559ffd977c7fbb6b17da83e28fc50673ae',
  },
  mixed: {
    skD: '569cf69b90af91733e34e2aec843a5f2fdb96664c9bd19c75a49516ea6251946',
    skPi: '9afda66b253dfb3fb6801e9924d401ff544e34215bd2a4a0058e4ef01025f6c3',
    skPr: '77c7269681cb8a55216274e1db5e15f29e3a3c966fd5c3561134f8efc3a8d033',
  },
  ppkId: '015f1d2e3c4b5a49788a9b0c1d2e3f4a5b',
}
const KEY_NAMES = ['skD', 'skAi', 'skAr', 'skEi', 'skEr', 'skPi', 'skPr'] as const

const sharedX = ecp256SharedX(A.privateKey, B.publicKey)
const plain = () => deriveIkeSaKeys({ ni: NI, nr: NR, sharedX, spiI: SPI_I, spiR: SPI_R })
const flip = (bytes: Uint8Array, at = 0) => {
  const out = new Uint8Array(bytes)
  out[at] ^= 1
  return out
}
const node = (held: [string, Uint8Array][]) => createSampleQkdNode(new Map(held))
const inputs = (over: Partial<IkeQkdSampleInputs> = {}): IkeQkdSampleInputs => ({
  ni: NI,
  nr: NR,
  spiI: SPI_I,
  spiR: SPI_R,
  initiator: A,
  responder: B,
  qkdKeyId: KEY_ID,
  initiatorNode: node([[KEY_ID, PPK]]),
  responderNode: node([[KEY_ID, PPK]]),
  ppkMandatory: false,
  ...over,
})

describe('profile', () => {
  it('is the Hub classical IKEv2 profile: group 19, PRF-HMAC-SHA-256, AES-256-CBC, HMAC-SHA-256', () => {
    const classical = IKE_V2_MODES.find((m) => m.id === 'classical')!
    expect(classical.dhGroup).toContain('Group 19')
    expect(classical.prfAlgorithm).toBe(IKE_SAMPLE_PROFILE.prfName)
    expect(classical.encAlgorithm).toBe(IKE_SAMPLE_PROFILE.encryption)
    expect(classical.integrityAlgorithm).toBe('HMAC-SHA-256')
    expect(IKE_SAMPLE_PROFILE.keyBytes).toBe(32)
  })
})

describe('ordinary IKEv2 key derivation without a PPK (RFC 7296 section 2.14)', () => {
  it('two fictional peers agree on the group 19 shared x coordinate', () => {
    expect(hexOf(sharedX)).toBe(EXPECT.sharedX)
    expect(hexOf(ecp256SharedX(B.privateKey, A.publicKey))).toBe(EXPECT.sharedX)
  })

  it('reproduces the independent SKEYSEED known answer', () => {
    expect(hexOf(deriveSkeyseed(NI, NR, sharedX))).toBe(EXPECT.skeyseed)
  })

  it('reproduces the independent known answers for all seven SK_* keys', () => {
    const keys = plain()
    expect(hexOf(keys.skeyseed)).toBe(EXPECT.skeyseed)
    for (const name of KEY_NAMES) expect(hexOf(keys[name]), name).toBe(EXPECT.plain[name])
  })

  it('agrees with a from-the-RFC recomputation using Node HMAC', () => {
    const prf = (key: Uint8Array, data: Uint8Array) =>
      new Uint8Array(createHmac('sha256', key).update(data).digest())
    const cat = (...p: Uint8Array[]) => Uint8Array.from(p.flatMap((x) => [...x]))
    const skeyseed = prf(cat(NI, NR), sharedX)
    const seed = cat(NI, NR, SPI_I, SPI_R)
    const t1 = prf(skeyseed, cat(seed, Uint8Array.of(1)))
    const t2 = prf(skeyseed, cat(t1, seed, Uint8Array.of(2)))
    const t3 = prf(skeyseed, cat(t2, seed, Uint8Array.of(3)))
    expect(hexOf(skeyseed)).toBe(EXPECT.skeyseed)
    expect(hexOf(t1)).toBe(EXPECT.plain.skD) // SK_d is the first block
    expect(hexOf(t2)).toBe(EXPECT.plain.skAi)
    expect(hexOf(t3)).toBe(EXPECT.plain.skAr)
  })

  it('prf+ takes T(n) = prf(K, T(n-1) | S | n) and truncates at a key boundary', () => {
    const key = seq(1)
    const seed = seq(9, 12)
    const long = prfPlus(key, seed, 70)
    expect(long).toHaveLength(70)
    expect(hexOf(prfPlus(key, seed, 32))).toBe(hexOf(long.subarray(0, 32)))
    expect(() => prfPlus(key, seed, 255 * 32 + 1)).toThrow()
  })

  it('changing Ni, Nr, the shared secret or an SPI changes the keys', () => {
    const base = hexOf(plain().skeyseed)
    expect(hexOf(deriveSkeyseed(flip(NI), NR, sharedX))).not.toBe(base)
    expect(hexOf(deriveSkeyseed(NI, flip(NR), sharedX))).not.toBe(base)
    expect(hexOf(deriveSkeyseed(NI, NR, flip(sharedX)))).not.toBe(base)
    const other = deriveIkeSaKeys({ ni: NI, nr: NR, sharedX, spiI: flip(SPI_I), spiR: SPI_R })
    expect(hexOf(other.skeyseed)).toBe(base) // SPIs do not enter SKEYSEED
    expect(hexOf(other.skD)).not.toBe(EXPECT.plain.skD) // but they do enter prf+
  })

  it('nonce order and PRF key/data roles matter, and the old HKDF construction is not SKEYSEED', () => {
    const seed = hexOf(deriveSkeyseed(NI, NR, sharedX))
    expect(hexOf(deriveSkeyseed(NR, NI, sharedX))).not.toBe(seed)
    const swapped = new Uint8Array(
      createHmac('sha256', sharedX)
        .update(Buffer.concat([NI, NR]))
        .digest()
    )
    expect(hexOf(swapped)).not.toBe(seed)
    const oldIllustration = new Uint8Array(
      hkdfSync('sha256', Buffer.concat([PPK, NI, NR]), Buffer.alloc(32), 'SKEYSEED', 32)
    )
    expect(hexOf(oldIllustration)).not.toBe(seed)
  })

  it('refuses truncated or mistyped inputs and a malformed or off-curve peer point', () => {
    expect(() => deriveSkeyseed(NI, NR, sharedX.subarray(1))).toThrow(/32 bytes/)
    expect(() => deriveSkeyseed(NI.subarray(1), NR, sharedX)).toThrow(/32 bytes/)
    expect(() => deriveSkeyseed(hexOf(NI) as unknown as Uint8Array, NR, sharedX)).toThrow(
      /byte array/
    )
    expect(() => ecp256SharedX(A.privateKey, new Uint8Array(65))).toThrow()
    expect(() => ecp256SharedX(A.privateKey, B.publicKey.subarray(0, 64))).toThrow(/65-byte/)
    const offCurve = new Uint8Array(B.publicKey)
    offCurve[64] ^= 1
    expect(() => ecp256SharedX(A.privateKey, offCurve)).toThrow(/not a valid/)
    expect(() =>
      deriveIkeSaKeys({ ni: NI, nr: NR, sharedX, spiI: new Uint8Array(8), spiR: SPI_R })
    ).toThrow(/non-zero/)
    expect(() =>
      deriveIkeSaKeys({ ni: NI, nr: NR, sharedX, spiI: SPI_I.subarray(1), spiR: SPI_R })
    ).toThrow(/8 bytes/)
  })
})

describe('RFC 8784 PPK mixing with the QKD key as the PPK', () => {
  it('PPK_ID is the ETSI GS QKD 014 key ID sent as PPK_ID_OPAQUE (type octet 1, then the UUID octets)', () => {
    const ppkId = ppkIdOpaqueFromQkdKeyId(KEY_ID)
    expect(PPK_ID_TYPE_OPAQUE).toBe(1)
    expect(ppkId).toHaveLength(17)
    expect(ppkId[0]).toBe(1)
    expect(hexOf(ppkId)).toBe(EXPECT.ppkId)
    expect(hexOf(ppkIdOpaqueFromQkdKeyId(KEY_ID.toUpperCase()))).toBe(EXPECT.ppkId)
    expect(() => ppkIdOpaqueFromQkdKeyId('not-a-uuid')).toThrow(/UUID/)
    expect(() => ppkIdOpaqueFromQkdKeyId(KEY_ID.slice(1))).toThrow(/UUID/)
  })

  it('reproduces the independent known answers for SK_d, SK_pi and SK_pr with the PPK', () => {
    const { keys, primed } = applyPpk(plain(), PPK)
    expect(hexOf(keys.skD)).toBe(EXPECT.mixed.skD)
    expect(hexOf(keys.skPi)).toBe(EXPECT.mixed.skPi)
    expect(hexOf(keys.skPr)).toBe(EXPECT.mixed.skPr)
    expect(hexOf(primed.skD)).toBe(EXPECT.plain.skD)
    expect(hexOf(primed.skPi)).toBe(EXPECT.plain.skPi)
    expect(hexOf(primed.skPr)).toBe(EXPECT.plain.skPr)
  })

  it('mixes with the PPK as the prf+ KEY and the primed value as the seed, once per key', () => {
    const viaNode = (seed: Uint8Array) =>
      hexOf(
        new Uint8Array(
          createHmac('sha256', PPK)
            .update(Buffer.concat([seed, Buffer.from([1])]))
            .digest()
        )
      )
    const keys = plain()
    expect(viaNode(keys.skD)).toBe(EXPECT.mixed.skD)
    expect(viaNode(keys.skPi)).toBe(EXPECT.mixed.skPi)
    expect(viaNode(keys.skPr)).toBe(EXPECT.mixed.skPr)
    // Reversed roles (primed value as the key, PPK as the seed) is a different, wrong, value.
    const reversed = hexOf(
      new Uint8Array(
        createHmac('sha256', keys.skD)
          .update(Buffer.concat([PPK, Buffer.from([1])]))
          .digest()
      )
    )
    expect(reversed).not.toBe(EXPECT.mixed.skD)
  })

  it('leaves SKEYSEED, SK_ai, SK_ar, SK_ei and SK_er untouched', () => {
    const before = plain()
    const { keys } = applyPpk(before, PPK)
    for (const name of ['skeyseed', 'skAi', 'skAr', 'skEi', 'skEr'] as const)
      expect(hexOf(keys[name]), name).toBe(hexOf(before[name]))
  })

  it('a different PPK changes exactly SK_d, SK_pi and SK_pr, and none equals the plain value', () => {
    const base = applyPpk(plain(), PPK).keys
    const other = applyPpk(plain(), flip(PPK, 31)).keys
    for (const name of ['skD', 'skPi', 'skPr'] as const) {
      expect(hexOf(other[name]), name).not.toBe(hexOf(base[name]))
      expect(hexOf(base[name]), name).not.toBe(hexOf(plain()[name]))
    }
    for (const name of ['skAi', 'skAr', 'skEi', 'skEr'] as const)
      expect(hexOf(other[name]), name).toBe(hexOf(base[name]))
  })

  it('refuses a PPK under 256 bits and a non-byte PPK', () => {
    expect(MIN_PPK_BYTES).toBe(32)
    expect(() => applyPpk(plain(), PPK.subarray(1))).toThrow(/256 bits/)
    expect(() => applyPpk(plain(), 'abc' as unknown as Uint8Array)).toThrow(/byte array/)
  })
})

describe('the sample with each peer fetching the key from its own QKD node', () => {
  it('both peers derive the same keys: with PPK path uses the mixed SK_d, SK_pi, SK_pr', () => {
    const result = runIkeQkdSample(inputs())
    expect(result.actual.path).toBe('ppk')
    if (result.actual.path !== 'ppk') return
    expect(hexOf(result.actual.ppkId)).toBe(EXPECT.ppkId)
    for (const side of [result.actual.initiator, result.actual.responder]) {
      expect(hexOf(side.keys.skD)).toBe(EXPECT.mixed.skD)
      expect(hexOf(side.keys.skPi)).toBe(EXPECT.mixed.skPi)
      expect(hexOf(side.keys.skPr)).toBe(EXPECT.mixed.skPr)
    }
    expect(result.actual.resistsLaterBreakOfEcdh).toBe(true)
    expect(hexOf(result.sharedXInitiator)).toBe(hexOf(result.sharedXResponder))
  })

  it('the PPK path and the fallback path are both produced for the same exchange', () => {
    const result = runIkeQkdSample(inputs())
    expect(result.withPpk.path).toBe('ppk')
    expect(result.withoutPpk.path).toBe('plain-ikev2')
    if (result.withoutPpk.path !== 'plain-ikev2') return
    expect(hexOf(result.withoutPpk.keys.skD)).toBe(EXPECT.plain.skD)
    expect(result.withoutPpk.resistsLaterBreakOfEcdh).toBe(false)
  })

  it('fallback: a responder whose own node lacks the key ID continues as plain IKEv2, not quantum-safe', () => {
    const result = runIkeQkdSample(inputs({ responderNode: node([]) }))
    expect(result.actual.path).toBe('plain-ikev2')
    if (result.actual.path !== 'plain-ikev2') return
    expect(result.actual.resistsLaterBreakOfEcdh).toBe(false)
    expect(result.actual.reason).toMatch(/NO_PPK_AUTH/)
    expect(hexOf(result.actual.keys.skD)).toBe(EXPECT.plain.skD)
    expect(hexOf(result.actual.keys.skPi)).toBe(EXPECT.plain.skPi)
    expect(hexOf(result.actual.keys.skPr)).toBe(EXPECT.plain.skPr)
  })

  it('fallback: an initiator without the key sends no USE_PPK and the exchange is plain IKEv2', () => {
    const result = runIkeQkdSample(inputs({ initiatorNode: node([]), responderNode: node([]) }))
    expect(result.actual.path).toBe('plain-ikev2')
  })

  it('mandatory PPK: a missing key aborts instead of falling back (RFC 8784 Table 1)', () => {
    const responderMissing = runIkeQkdSample(
      inputs({ responderNode: node([]), ppkMandatory: true })
    )
    expect(responderMissing.actual.path).toBe('abort')
    expect(responderMissing.withoutPpk.path).toBe('abort')
    if (responderMissing.actual.path === 'abort')
      expect(responderMissing.actual.reason).toMatch(/AUTHENTICATION_FAILED/)
    const initiatorMissing = runIkeQkdSample(
      inputs({ initiatorNode: node([]), responderNode: node([]), ppkMandatory: true })
    )
    expect(initiatorMissing.actual.path).toBe('abort')
  })

  it('peers holding different bytes under the same key ID do not continue', () => {
    const result = runIkeQkdSample(inputs({ responderNode: node([[KEY_ID, flip(PPK)]]) }))
    expect(result.actual.path).toBe('abort')
    if (result.actual.path === 'abort') expect(result.actual.reason).toMatch(/AUTH/)
  })

  it('a node answers only for the exact key ID it holds', () => {
    const other = '00000000-0000-4000-8000-000000000000'
    const result = runIkeQkdSample(inputs({ responderNode: node([[other, PPK]]) }))
    expect(result.actual.path).toBe('plain-ikev2')
  })

  it('refuses a key ID that is not a UUID before any derivation', () => {
    expect(() => runIkeQkdSample(inputs({ qkdKeyId: 'abc' }))).toThrow(/UUID/)
  })
})
