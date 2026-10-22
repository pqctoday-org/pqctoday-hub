// SPDX-License-Identifier: AGPL-3.0-only
//
// Engine-free tests for the PKCS#11 v3.3 bindings: runtime feature detection
// (decided from a mechanism list, so an engine without v3.3 reads as "not in
// this engine yet", never as a failure), and the byte constructions the
// lessons teach (the composite KEM combiner input, the TLS concatenation,
// M′). The engine calls themselves are exercised by the *.local.test.ts
// suites against the real wasm engine.
import { describe, it, expect } from 'vitest'
import { sha3_256 } from '@noble/hashes/sha3.js'
import {
  classifyV33Support,
  compositeKemCombinerInput,
  compositeSigMessageRepresentative,
  tlsHybridConcatenation,
  isNotInEngine,
  NotInEngineError,
  V33_MECHANISMS,
  base64ToBytes,
  splitCompositePublic,
  compositeKemSet,
  kemLabelBytes,
} from './v33'
import {
  CKF_DECAPSULATE,
  CKF_DIGEST,
  CKF_ENCAPSULATE,
  CKF_GENERATE_KEY_PAIR,
  CKF_SIGN,
  CKF_VERIFY,
  CKM_COMP_KEM,
  CKM_COMP_KEM_KEY_PAIR_GEN,
  CKM_COMP_SIG_KEY_PAIR_GEN,
  CKM_ML_DSA_EXTERNAL_MU,
  CKM_ML_DSA_EXTERNAL_MU_GEN,
  CKP_COMP_KEM_MLKEM768_X25519,
} from './constants'

const fullInfo = (t: number) => {
  const flags =
    t === CKM_COMP_SIG_KEY_PAIR_GEN || t === CKM_COMP_KEM_KEY_PAIR_GEN
      ? CKF_GENERATE_KEY_PAIR
      : t === CKM_COMP_KEM
        ? CKF_ENCAPSULATE | CKF_DECAPSULATE
        : t === CKM_ML_DSA_EXTERNAL_MU_GEN
          ? CKF_DIGEST
          : CKF_SIGN | CKF_VERIFY
  return { ulMinKeySize: 1, ulMaxKeySize: 2, flags }
}

describe('classifyV33Support', () => {
  it('an engine with none of the v3.3 mechanisms reports none (the safety net)', () => {
    const s = classifyV33Support([0x1d, 0x17], fullInfo, '3.2')
    expect(s.compSig).toBe(false)
    expect(s.compKem).toBe(false)
    expect(s.externalMu).toBe(false)
    expect(Object.values(s.mechs).every((m) => !m.advertised && m.info === null)).toBe(true)
    expect(s.cryptokiVersion).toBe('3.2')
  })

  it('today’s engine: external mu only', () => {
    const s = classifyV33Support(
      [CKM_ML_DSA_EXTERNAL_MU_GEN, CKM_ML_DSA_EXTERNAL_MU],
      fullInfo,
      '3.2'
    )
    expect(s.externalMu).toBe(true)
    expect(s.compKem).toBe(false)
    expect(s.mechs.mlDsaExternalMu.flagsOk).toBe(true)
  })

  it('needs BOTH key generation and the operation for a family', () => {
    expect(classifyV33Support([CKM_COMP_KEM], fullInfo, null).compKem).toBe(false)
    expect(
      classifyV33Support([CKM_COMP_KEM, CKM_COMP_KEM_KEY_PAIR_GEN], fullInfo, null).compKem
    ).toBe(true)
    expect(classifyV33Support([CKM_COMP_SIG_KEY_PAIR_GEN], fullInfo, null).compSig).toBe(false)
  })

  it('flags the draft requires are checked, not assumed', () => {
    const s = classifyV33Support(
      [CKM_COMP_KEM, CKM_COMP_KEM_KEY_PAIR_GEN],
      (t) =>
        t === CKM_COMP_KEM
          ? { ulMinKeySize: 0, ulMaxKeySize: 0, flags: CKF_ENCAPSULATE }
          : fullInfo(t),
      null
    )
    expect(s.compKem).toBe(true)
    expect(s.mechs.compKem.flagsOk).toBe(false)
  })

  it('lists exactly the seven v3.3 mechanisms', () => {
    expect(V33_MECHANISMS.map((m) => m.type).sort((a, b) => a - b)).toEqual([
      0x403b, 0x403c, 0x403d, 0x403e, 0x403f, 0x4040, 0x4041,
    ])
  })

  it('NotInEngineError is recognisable and says "not in this engine yet"', () => {
    const e = new NotInEngineError('CKM_COMP_KEM')
    expect(isNotInEngine(e)).toBe(true)
    expect(e.message).toContain('not in this engine yet')
    expect(isNotInEngine(new Error('x'))).toBe(false)
  })
})

describe('byte constructions taught in the v3.3 lessons', () => {
  const mlkemSS = new Uint8Array(32).fill(1)
  const tradSS = new Uint8Array(32).fill(2)
  const tradCT = new Uint8Array(32).fill(3)
  const tradPK = new Uint8Array(32).fill(4)
  const label = kemLabelBytes(compositeKemSet(CKP_COMP_KEM_MLKEM768_X25519)!)

  it('TLS concatenation and the composite combiner give different secrets from the same inputs', () => {
    const tls = tlsHybridConcatenation(mlkemSS, tradSS)
    expect(tls.length).toBe(64)
    const comb = sha3_256(compositeKemCombinerInput({ mlkemSS, tradSS, tradCT, tradPK, label }))
    expect(comb.length).toBe(32)
    expect(Buffer.from(comb).equals(Buffer.from(tls.slice(0, 32)))).toBe(false)
  })

  it('the combiner binds the label, the classical ciphertext and the classical public key', () => {
    const base = sha3_256(compositeKemCombinerInput({ mlkemSS, tradSS, tradCT, tradPK, label }))
    const otherLabel = sha3_256(
      compositeKemCombinerInput({ mlkemSS, tradSS, tradCT, tradPK, label: new Uint8Array([1]) })
    )
    const otherCt = sha3_256(
      compositeKemCombinerInput({ mlkemSS, tradSS, tradCT: tradPK, tradPK, label })
    )
    expect(Buffer.from(base).equals(Buffer.from(otherLabel))).toBe(false)
    expect(Buffer.from(base).equals(Buffer.from(otherCt))).toBe(false)
    // …while the TLS concatenation of the same two secrets cannot change.
    expect(tlsHybridConcatenation(mlkemSS, tradSS)).toEqual(tlsHybridConcatenation(mlkemSS, tradSS))
  })

  it('combiner input layout is mlkemSS ‖ tradSS ‖ tradCT ‖ tradPK ‖ Label', () => {
    const inp = compositeKemCombinerInput({ mlkemSS, tradSS, tradCT, tradPK, label })
    expect(inp.length).toBe(32 * 4 + label.length)
    expect(inp[0]).toBe(1)
    expect(inp[32]).toBe(2)
    expect(inp[64]).toBe(3)
    expect(inp[96]).toBe(4)
    expect(Array.from(inp.slice(128))).toEqual(Array.from(label))
  })

  it('M′ = Prefix ‖ Label ‖ len(ctx) ‖ ctx ‖ PH(M)', () => {
    const m = compositeSigMessageRepresentative({
      prefix: new Uint8Array([0xaa]),
      label: new Uint8Array([0xbb, 0xbb]),
      context: new Uint8Array([0xcc, 0xcc, 0xcc]),
      preHash: new Uint8Array([0xdd]),
    })
    expect(Array.from(m)).toEqual([0xaa, 0xbb, 0xbb, 3, 0xcc, 0xcc, 0xcc, 0xdd])
    expect(() =>
      compositeSigMessageRepresentative({
        prefix: new Uint8Array(),
        label: new Uint8Array(),
        context: new Uint8Array(256),
        preHash: new Uint8Array(),
      })
    ).toThrow()
  })

  it('splitCompositePublic and base64ToBytes', () => {
    const v = new Uint8Array(1216).map((_, i) => i & 0xff)
    const { ml, trad } = splitCompositePublic({ mlPublicKeyBytes: 1184 }, v)
    expect(ml.length).toBe(1184)
    expect(trad.length).toBe(32)
    expect(Array.from(base64ToBytes('AQID'))).toEqual([1, 2, 3])
  })
})
