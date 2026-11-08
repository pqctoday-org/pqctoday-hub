// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Cloud KMS exchange simulation on the real in-browser HSM engine.
 *
 * What is proven, and against what:
 *  1. Classical import (CKM_RSA_AES_KEY_WRAP): the blob is the RSA part plus the
 *     AES-KWP part and opens by hand; a blob built by Node's crypto (RSA-OAEP,
 *     SHA-1 and SHA-256, then AES-KWP) is accepted by the engine; a blob
 *     wrapped with one OAEP hash is refused under the other.
 *  2. The inner wraps against published vectors: AES-KWP (Wycheproof, AES-256,
 *     32-byte key) and AES-KW (NIST ACVP, AES-256).
 *  3. HPKE import on all three engines and all three suites: round trip, sizes
 *     measured from the objects returned, and interoperability with an
 *     independent sender (noble ML-KEM / X-Wing plus the Node reference key
 *     schedule), which is itself checked against the published vectors in
 *     cloudKmsExchange.test.ts.
 *  4. The Open path of each engine on published draft-ietf-hpke-pq vectors.
 *  5. AWS key establishment: secrets, sizes, and the KEK and AES-KW output
 *     recomputed with Node's crypto.
 *
 * What is NOT proven, and why: the v3.2 composed and v3.3 CKM_COMP_KEM paths
 * draw fresh encapsulation randomness, so the same seed cannot be fed to both to
 * compare enc/ct byte for byte (only the candidate CKM_HPKE binding takes a
 * test seed). The composed path also cannot replay the published X-Wing vector,
 * because no raw X25519 private-key import exists in the engine. Equivalence of
 * the sequences is shown instead by cross-engine interoperability.
 */
import { describe, it, expect, beforeAll } from 'vitest'
import { shake256 } from '@noble/hashes/sha3.js'
import { ml_kem768, ml_kem1024 } from '@noble/post-quantum/ml-kem.js'
import { ml_kem768_x25519 } from '@noble/post-quantum/hybrid.js'
import * as S from '@/wasm/softhsm'
import type { SoftHSMModule } from '@pqctoday/softhsm-wasm'
import { hsm_importCompositeKeyRv } from '@/wasm/softhsm/v33'
import hpkePqFile from '@/data/acvp/hpke-pq-04-test-vectors.json'
import aesKwAcvp from '@/data/acvp/aeskw_acvp_test.json'
import wycheproofKwp from '@/data/acvp/wycheproof_aes_kwp_test.json'
import { HPKE_KEM, compositeKemCkp } from '../../HybridCrypto/services/hpkeService'
import {
  CLASSICAL_PROFILES,
  HKDF_INFO_HYBRID,
  HKDF_INFO_MLKEM,
  HPKE_IMPORT_SUITES,
  aesKwWrap,
  aesKwpWrap,
  concat,
  createHpkeRecipient,
  generateWrappingKeyPair,
  hpkeOpenWith,
  hpkeSealKey,
  rsaAesKeyUnwrap,
  rsaAesKeyWrap,
  runAwsHybridEstablishment,
  runAwsMlKemEstablishment,
  runClassicalImport,
  runHpkeImport,
  suiteById,
  type Hctx,
  type HpkeEngine,
  type HpkeImportSuite,
  type HpkeRecipient,
} from './cloudKmsExchange'
import {
  aeadOpenReference,
  aeadSealReference,
  aesKwReference,
  hkdfSha256Reference,
  hpkeKeyScheduleReference,
  rsaAesKeyWrapReference,
} from './cloudKmsExchange.fixtures'

const unhex = (s: string): Uint8Array =>
  Uint8Array.from(s.match(/../g) ?? [], (x) => parseInt(x, 16))
const hex = (b: Uint8Array): string =>
  Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('')
const same = (a: Uint8Array, b: Uint8Array): boolean => hex(a) === hex(b)

describe('cloud KMS key exchange simulation (real engine)', () => {
  let M: SoftHSMModule
  let hSession = 0
  let ctx: Hctx

  beforeAll(async () => {
    M = (await S.getSoftHSMRustModule()) as SoftHSMModule
    S.hsm_initialize(M)
    const slot = S.hsm_getFirstFreeSlot(M)
    const slotId = S.hsm_initToken(M, slot, '12345678', 'CloudKms')
    hSession = S.hsm_openUserSession(M, slotId, '12345678', 'user1234')
    ctx = { M, hSession }
  }, 60_000)

  // ── 1. Classical import ────────────────────────────────────────────────────
  describe('classical import with CKM_RSA_AES_KEY_WRAP', () => {
    it.each(Object.entries(CLASSICAL_PROFILES))(
      '%s: 384-byte RSA part + 40-byte AES-KWP part, recovered key identical, structure opens by hand',
      (_provider, profile) => {
        const r = runClassicalImport(ctx, profile)
        expect(r.rsaPartBytes).toBe(profile.rsaBits / 8)
        expect(r.kwpPartBytes).toBe(40)
        expect(r.wrappedBytes).toBe(384 + 40)
        expect(r.matches).toBe(true)
        expect(r.structureVerified).toBe(true)
        expect(r.sourceKey.length).toBe(32)
      }
    )

    it.each(['sha256', 'sha1'] as const)(
      'accepts a blob made by an independent implementation (Node RSA-OAEP %s + AES-KWP)',
      (oaepHash) => {
        const kp = generateWrappingKeyPair(ctx, 3072)
        const key = S.hsm_generateRandom(M, hSession, 32)
        const blob = rsaAesKeyWrapReference(kp.publicKeyDer, key, oaepHash)
        const handle = rsaAesKeyUnwrap(ctx, kp.privHandle, blob, {
          aesKeyBits: 256,
          oaepHash,
        })
        expect(same(S.hsm_extractKeyValue(M, hSession, handle), key)).toBe(true)
      }
    )

    it('refuses a blob wrapped under one OAEP hash when opened under the other (control)', () => {
      const kp = generateWrappingKeyPair(ctx, 3072)
      const target = S.hsm_generateAESKey(M, hSession, 256)
      const blob = rsaAesKeyWrap(ctx, kp.pubHandle, target, { aesKeyBits: 256, oaepHash: 'sha1' })
      expect(() =>
        rsaAesKeyUnwrap(ctx, kp.privHandle, blob, { aesKeyBits: 256, oaepHash: 'sha256' })
      ).toThrow()
    })

    it('refuses a blob with a flipped bit in the AES-KWP part (control)', () => {
      const kp = generateWrappingKeyPair(ctx, 3072)
      const target = S.hsm_generateAESKey(M, hSession, 256)
      const opts = { aesKeyBits: 256 as const, oaepHash: 'sha256' as const }
      const blob = rsaAesKeyWrap(ctx, kp.pubHandle, target, opts)
      blob[blob.length - 1] ^= 1
      expect(() => rsaAesKeyUnwrap(ctx, kp.privHandle, blob, opts)).toThrow()
    })
  })

  // ── 2. The inner wraps against published vectors ───────────────────────────
  describe('inner wraps against published vectors', () => {
    const kwp = wycheproofKwp.testGroups
      .filter((g) => g.keySize === 256)
      .flatMap((g) => g.tests)
      .filter((t) => t.result === 'valid' && t.msg.length / 2 === 32)
      .slice(0, 5)

    it('has AES-256 KWP vectors with a 32-byte key to check', () => {
      expect(kwp.length).toBeGreaterThan(0)
    })

    it.each(kwp.map((t) => [`tc${t.tcId}`, t] as const))(
      'AES-KWP (RFC 5649) wrap matches Wycheproof %s',
      (_n, t) => {
        expect(hex(aesKwpWrap(ctx, unhex(t.key), unhex(t.msg)))).toBe(t.ct.toLowerCase())
      }
    )

    const kw = aesKwAcvp.testGroups
      .filter(
        (g) =>
          g.algorithm === 'ACVP-AES-KW' &&
          g.direction === 'encrypt' &&
          Number(g.keyLen) === 256 &&
          Number(g.payloadLen) === 128
      )
      .flatMap((g) => g.tests)
    it('has an ACVP AES-256 KW vector to check', () => {
      expect(kw.length).toBeGreaterThan(0)
    })
    it.each(kw.map((t) => [`tc${t.tcId}`, t] as const))(
      'AES-KW (RFC 3394) wrap matches NIST ACVP %s',
      (_n, t) => {
        expect(hex(aesKwWrap(ctx, unhex(t.key), unhex(t.pt)))).toBe(t.ct.toLowerCase())
        // and the independent implementation agrees with the same vector
        expect(hex(aesKwReference(unhex(t.key), unhex(t.pt), 'wrap'))).toBe(t.ct.toLowerCase())
      }
    )
  })

  // ── 3. HPKE import: engines x suites ───────────────────────────────────────
  const ENGINES: HpkeEngine[] = ['v32', 'v33', 'candidate']
  describe.each(HPKE_IMPORT_SUITES.map((s) => [s.apiName, s] as const))(
    'HPKE import, %s',
    (_n, suite) => {
      it.each(ENGINES)(
        'engine %s: round trip, sizes measured from the objects returned',
        (engine) => {
          const r = runHpkeImport(ctx, { engine, suite })
          expect(r.matches).toBe(true)
          const xw = suite.id === 'xwing'
          const ekBytes = suite.id === 'mlkem1024' ? 1568 : 1184 + (xw ? 32 : 0)
          const encBytes = suite.id === 'mlkem1024' ? 1568 : 1088 + (xw ? 32 : 0)
          expect(r.publicKeyBytes).toBe(ekBytes)
          expect(r.encBytes).toBe(encBytes)
          // 32-byte key + 16-byte GCM tag
          expect(r.ctBytes).toBe(48)
          expect(r.overheadBytes).toBe(16)
          expect(r.wireBytes).toBe(encBytes + 48)
          expect(same(r.wire, concat(r.enc, r.ct))).toBe(true)
        }
      )

      it('a tampered ciphertext is refused (control)', () => {
        const recipient = createHpkeRecipient(ctx, 'v32', suite)
        const key = S.hsm_generateRandom(M, hSession, 32)
        const sealed = hpkeSealKey(ctx, 'v32', recipient, key)
        const bad = Uint8Array.from(sealed.ct)
        bad[0] ^= 1
        expect(() => recipient.open(sealed.enc, bad)).toThrow()
      })
    }
  )

  describe('cross-engine interoperability (third-party v3.2 sender, provider on another engine)', () => {
    it.each([
      ['xwing', 'v33'],
      ['xwing', 'candidate'],
      ['mlkem768', 'candidate'],
      ['mlkem1024', 'candidate'],
    ] as const)('%s: v3.2 sealed, opened on %s', (id, engine) => {
      const r = runHpkeImport(ctx, { engine, senderEngine: 'v32', suite: suiteById(id) })
      expect(r.matches).toBe(true)
      expect(r.senderEngine).toBe('v32')
      expect(r.engine).toBe(engine)
    })

    it('a CKM_HPKE sender cannot seal toward a v3.2 recipient (it needs a CKM_HPKE key object)', () => {
      expect(() =>
        runHpkeImport(ctx, { engine: 'v32', senderEngine: 'candidate', suite: suiteById('xwing') })
      ).toThrow(/CKM_HPKE/)
    })
  })

  // ── independent sender / independent receiver, per engine ──────────────────
  type IndepKem = {
    encapsulate: (pk: Uint8Array) => { cipherText: Uint8Array; sharedSecret: Uint8Array }
    decapsulate: (ct: Uint8Array, sk: Uint8Array) => Uint8Array
    keygen: (seed?: Uint8Array) => { publicKey: Uint8Array; secretKey: Uint8Array }
  }
  const INDEP: Record<HpkeImportSuite['id'], IndepKem> = {
    xwing: ml_kem768_x25519 as unknown as IndepKem,
    mlkem768: ml_kem768 as unknown as IndepKem,
    mlkem1024: ml_kem1024 as unknown as IndepKem,
  }

  describe('independent implementation on the other side', () => {
    it.each(HPKE_IMPORT_SUITES.map((s) => [s.id, s] as const))(
      '%s: an engine Seal opens with noble KEM + the Node key schedule',
      (_id, suite) => {
        const kem = INDEP[suite.id]
        const kp = kem.keygen()
        // A recipient built from an independent key pair; only its public key is used by the v3.2 sender.
        const recipient: HpkeRecipient = {
          engine: 'v32',
          suite,
          publicKey: kp.publicKey,
          keygenMechanisms: [],
          open: () => {
            throw new Error('not used')
          },
        }
        const key = S.hsm_generateRandom(M, hSession, 32)
        const sealed = hpkeSealKey(ctx, 'v32', recipient, key)
        const ss = kem.decapsulate(sealed.enc, kp.secretKey)
        const ks = hpkeKeyScheduleReference({
          kemId: suite.kemId,
          kdfId: suite.kdfId,
          aeadId: suite.aeadId,
          sharedSecret: ss,
          info: new Uint8Array(0),
        })
        const opened = aeadOpenReference(
          suite.aeadId,
          ks.key,
          ks.baseNonce,
          0,
          new Uint8Array(0),
          sealed.ct
        )
        expect(same(opened, key)).toBe(true)
      }
    )

    const OPEN_CASES: Array<[HpkeImportSuite['id'], HpkeEngine]> = [
      ['xwing', 'v33'],
      ['xwing', 'candidate'],
      ['mlkem768', 'v32'],
      ['mlkem768', 'candidate'],
      ['mlkem1024', 'v32'],
      ['mlkem1024', 'candidate'],
    ]
    it.each(OPEN_CASES)(
      '%s: a message from an independent sender opens on engine %s',
      (id, engine) => {
        const suite = suiteById(id)
        const recipient = createHpkeRecipient(ctx, engine, suite)
        const kem = INDEP[id]
        const e = kem.encapsulate(recipient.publicKey)
        const ks = hpkeKeyScheduleReference({
          kemId: suite.kemId,
          kdfId: suite.kdfId,
          aeadId: suite.aeadId,
          sharedSecret: e.sharedSecret,
          info: new Uint8Array(0),
        })
        const key = S.hsm_generateRandom(M, hSession, 32)
        const ct = aeadSealReference(suite.aeadId, ks.key, ks.baseNonce, 0, new Uint8Array(0), key)
        const opened = recipient.open(e.cipherText, ct)
        expect(same(opened.plaintext, key)).toBe(true)
      }
    )
  })

  // ── 4. Open path on published draft-ietf-hpke-pq vectors ───────────────────
  describe('Open on published draft-ietf-hpke-pq vectors', () => {
    const find = (kemId: number) =>
      hpkePqFile.vectors.find((v) => v.kem_id === kemId && v.mode === 0)!
    const suiteOf = (v: (typeof hpkePqFile.vectors)[number]): HpkeImportSuite => ({
      id: 'xwing',
      apiName: 'published vector',
      kemId: v.kem_id,
      kdfId: v.kdf_id,
      aeadId: v.aead_id,
      label: 'published vector',
    })
    const openAll = (
      engine: HpkeEngine,
      v: (typeof hpkePqFile.vectors)[number],
      keys: Parameters<typeof hpkeOpenWith>[3]
    ) => {
      v.encryptions.forEach((e, seq) => {
        const r = hpkeOpenWith(ctx, engine, suiteOf(v), keys, unhex(v.enc), unhex(e.ct), {
          info: unhex(v.info),
          aad: unhex(e.aad),
          seq,
        })
        expect(hex(r.plaintext)).toBe(e.pt.toLowerCase())
      })
    }

    it.each([
      ['X-Wing', HPKE_KEM.MLKEM768_X25519],
      ['ML-KEM-768', HPKE_KEM.MLKEM768],
      ['ML-KEM-1024', HPKE_KEM.MLKEM1024],
    ] as const)('candidate CKM_HPKE opens every published %s message', (_n, kemId) => {
      const v = find(kemId)
      const kp = S.hsm_generateHpkeKeyPair(M, hSession, kemId, unhex(v.skRm))
      expect(hex(S.hsm_extractKeyValue(M, hSession, kp.pubHandle))).toBe(v.pkRm.toLowerCase())
      openAll('candidate', v, { privHandle: kp.privHandle })
    })

    it('v3.3 CKM_COMP_KEM opens every published X-Wing message', () => {
      const v = find(HPKE_KEM.MLKEM768_X25519)
      // X-Wing: SHAKE256 expands the 32-byte seed into mlkem seed (64) + X25519 scalar (32).
      const dk = shake256(unhex(v.skRm), { dkLen: 96 })
      const imp = hsm_importCompositeKeyRv(
        M,
        hSession,
        'kem',
        'private',
        compositeKemCkp(HPKE_KEM.MLKEM768_X25519)!,
        dk
      )
      expect(imp.rv).toBe(0)
      openAll('v33', v, { privHandle: imp.handle })
    })

    it.each([
      ['ML-KEM-768', HPKE_KEM.MLKEM768, 768, ml_kem768],
      ['ML-KEM-1024', HPKE_KEM.MLKEM1024, 1024, ml_kem1024],
    ] as const)(
      'v3.2 CKM_ML_KEM (also the v3.3 mechanism) opens every published %s message',
      (_n, kemId, variant, impl) => {
        const v = find(kemId)
        const kp = impl.keygen(unhex(v.skRm))
        expect(hex(kp.publicKey)).toBe(v.pkRm.toLowerCase())
        const dk = S.hsm_importMLKEMPrivateKey(M, hSession, variant, kp.secretKey)
        openAll('v32', v, { privHandle: dk })
        openAll('v33', v, { privHandle: dk }) // pure ML-KEM: same sequence under the v3.3 draft
      }
    )

    it('a flipped ciphertext bit is refused on the candidate engine (control)', () => {
      const v = find(HPKE_KEM.MLKEM768)
      const kp = S.hsm_generateHpkeKeyPair(M, hSession, v.kem_id, unhex(v.skRm))
      const bad = unhex(v.encryptions[0].ct)
      bad[0] ^= 1
      expect(() =>
        hpkeOpenWith(
          ctx,
          'candidate',
          suiteOf(v),
          { privHandle: kp.privHandle },
          unhex(v.enc),
          bad,
          {
            info: unhex(v.info),
            aad: unhex(v.encryptions[0].aad),
          }
        )
      ).toThrow()
    })
  })

  // ── 5. AWS key establishment ───────────────────────────────────────────────
  describe('AWS ML-KEM key establishment', () => {
    it.each([512, 768, 1024] as const)(
      'ML-KEM-%d: sizes from FIPS 203, secret returned in plaintext, KEK and AES-KW recomputed',
      (variant) => {
        const r = runAwsMlKemEstablishment(ctx, variant)
        const sizes = { 512: [800, 768], 768: [1184, 1088], 1024: [1568, 1568] }[variant]
        expect(r.encapsulationKeyBytes).toBe(sizes[0])
        expect(r.ciphertextBytes).toBe(sizes[1])
        expect(r.secretReturnedToCaller.length).toBe(32)
        expect(r.secretsMatch).toBe(true)
        expect(r.wrappedBytes).toBe(40)
        expect(r.matches).toBe(true)
        // The KEK and the AES-KW output recomputed by Node's crypto.
        const kek = hkdfSha256Reference(r.secretReturnedToCaller, HKDF_INFO_MLKEM)
        expect(same(aesKwReference(kek, r.wrapped, 'unwrap'), r.sourceKey)).toBe(true)
      }
    )

    it('the Decapsulate output is the secret an independent ML-KEM implementation derives from the same ciphertext', () => {
      // Independent side: encapsulate to the engine key's public key, then compare with what the engine
      // recovers for that ciphertext through the same Decapsulate call.
      const kms = S.hsm_generateMLKEMKeyPair(M, hSession, 768, true, 'independent check')
      const ek = S.hsm_extractKeyValue(M, hSession, kms.pubHandle)
      const e = ml_kem768.encapsulate(ek)
      const dec = S.hsm_extractKeyValue(
        M,
        hSession,
        S.hsm_decapsulate(M, hSession, kms.privHandle, e.cipherText, 768, true)
      )
      expect(same(dec, e.sharedSecret)).toBe(true)
    })
  })

  describe('AWS hybrid in the application', () => {
    it('both secrets are 32 bytes, both sides agree, ML-KEM secret goes first, KEK recomputed', () => {
      const r = runAwsHybridEstablishment(ctx, 768)
      expect(r.ecdhSecretBytes).toBe(32)
      expect(r.mlkemSecretBytes).toBe(32)
      expect(r.ecdhSecretsMatch).toBe(true)
      expect(r.mlkemSecretsMatch).toBe(true)
      expect(r.combinerInputOrder[0]).toMatch(/^ML-KEM/)
      expect(r.matches).toBe(true)
      const kek = hkdfSha256Reference(concat(r.mlkemSecret, r.ecdhSecret), HKDF_INFO_HYBRID)
      expect(same(aesKwReference(kek, r.wrapped, 'unwrap'), r.sourceKey)).toBe(true)
      // Order matters: the other order does not open the wrap (control).
      const wrongKek = hkdfSha256Reference(concat(r.ecdhSecret, r.mlkemSecret), HKDF_INFO_HYBRID)
      expect(() => aesKwReference(wrongKek, r.wrapped, 'unwrap')).toThrow()
    })
  })
})
