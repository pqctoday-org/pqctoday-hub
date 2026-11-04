// SPDX-License-Identifier: AGPL-3.0-only
//
// The HPKE workshop's "PKCS#11 v3.3 draft" sequence (key agreement through
// one CKM_COMP_KEM call) and its pure ML-KEM sequence, run on the REAL Rust
// engine through the same helpers the workshop calls (compositeEncap /
// compositeDecap / pqEncap / pqDecap, then keyScheduleSecure).
//
// What is proven, and against what:
//   1. All 30 CFRG concrete-hybrid-KEM vectors: a composite private key
//      assembled from the vector's published components decapsulates the
//      vector's ciphertext to the vector's shared_secret (the secret is read
//      with the lessons' readable template, only here).
//   2. The published HPKE-PQ vectors for MLKEM768-X25519 (X-Wing): the full
//      chain composite Decap -> KeySchedule reproduces the vector's base_nonce
//      and exporter_secret, with the KEM secret kept as a protected handle.
//   3. Agreement between the two ways to do the same step: the v3.2 chain
//      (hybridEncap, CKM_ML_KEM + CKM_ECDH1_DERIVE + concatenations +
//      CKM_SHA3_256_KEY_DERIVATION) encapsulates to a composite public key's
//      bytes, and the one-call composite Decap recovers a secret that gives
//      the same KeySchedule output. All three hybrid suites, fresh keys.
//   4. Seal/Open round trips through the one-call path, and a tampered
//      ciphertext is refused.
//   5. Pure ML-KEM through the v3.2 pieces: a round trip, with the ML-KEM
//      secret used as an HKDF salt key without ever being read.
//
// Venue: *.local.test.ts (real-wasm venue, run by `npm run test:local`).
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { shake256 } from '@noble/hashes/sha3.js'
import { bytesToHex, concatBytes, hexToBytes } from '@noble/hashes/utils.js'
import * as S from '@/wasm/softhsm'
import type { SoftHSMModule } from '@pqctoday/softhsm-wasm'
import {
  hsm_compositeDecapsulate,
  hsm_generateCompositeKeyPair,
  hsm_importCompositeKeyRv,
} from '@/wasm/softhsm/v33'
import cfrgFile from '@/data/acvp/cfrg-concrete-hybrid-kems-test-vectors.json'
import hpkePqFile from '@/data/acvp/hpke-pq-04-test-vectors.json'
import {
  HPKE_AEAD,
  HPKE_KDF,
  HPKE_KEM,
  HPKE_MODE,
  compositeDecap,
  compositeEncap,
  compositeKemCkp,
  hybridEncap,
  keyScheduleSecure,
  openHandle,
  pqDecap,
  pqEncap,
  sealHandle,
  type Hctx,
} from './hpkeService'

const HYBRID_KEMS = [HPKE_KEM.MLKEM768_X25519, HPKE_KEM.MLKEM768_P256, HPKE_KEM.MLKEM1024_P384]
const CFRG_KEM: Record<string, number> = {
  mlkem768_x25519: HPKE_KEM.MLKEM768_X25519,
  mlkem768_p256: HPKE_KEM.MLKEM768_P256,
  mlkem1024_p384: HPKE_KEM.MLKEM1024_P384,
}

// DER ECPrivateKey with the curve parameters and no publicKey field, the one
// encoding composite-kem-23 allows for an ECDH traditional key.
const der = (tag: number, body: Uint8Array) => {
  if (body.length >= 128) throw new Error('long-form DER not needed here')
  return concatBytes(Uint8Array.of(tag, body.length), body)
}
const CURVE_OID: Record<number, string> = {
  [HPKE_KEM.MLKEM768_P256]: '2a8648ce3d030107', // prime256v1
  [HPKE_KEM.MLKEM1024_P384]: '2b81040022', // secp384r1
}
const traditionalPrivate = (kemId: number, scalar: Uint8Array): Uint8Array =>
  kemId === HPKE_KEM.MLKEM768_X25519
    ? scalar
    : der(
        0x30,
        concatBytes(
          Uint8Array.of(0x02, 0x01, 0x01),
          der(0x04, scalar),
          der(0xa0, der(0x06, hexToBytes(CURVE_OID[kemId])))
        )
      )

describe('HPKE workshop: PKCS#11 v3.3 draft sequence and pure ML-KEM (rust engine)', () => {
  let M: SoftHSMModule
  let hSession = 0
  let ctx: Hctx

  beforeAll(async () => {
    M = (await S.getSoftHSMRustModule()) as SoftHSMModule
    S.hsm_initialize(M)
    const slot = S.hsm_getFirstFreeSlot(M)
    const slotId = S.hsm_initToken(M, slot, '12345678', 'HpkeV33')
    hSession = S.hsm_openUserSession(M, slotId, '12345678', 'user1234')
    ctx = { M, hSession }
  }, 60_000)

  afterAll(() => {
    S.hsm_finalize(M, hSession)
  })

  const importPrivate = (kemId: number, value: Uint8Array) => {
    const r = hsm_importCompositeKeyRv(
      M,
      hSession,
      'kem',
      'private',
      compositeKemCkp(kemId)!,
      value
    )
    expect(r.rv).toBe(0)
    return r.handle
  }

  it.each(cfrgFile.vectors.map((v, i) => [`${v.kem} #${i}`, v] as const))(
    'CFRG vector %s: composite decapsulation gives the published shared_secret',
    (_name, v) => {
      const kemId = CFRG_KEM[v.kem]
      const dk = concatBytes(
        hexToBytes(v.decapsulation_key_pq),
        traditionalPrivate(kemId, hexToBytes(v.decapsulation_key_t))
      )
      const h = importPrivate(kemId, dk)
      // Readable template: the lessons' default, used here only to compare bytes.
      const secret = S.hsm_extractKeyValue(
        M,
        hSession,
        hsm_compositeDecapsulate(M, hSession, h, hexToBytes(v.ciphertext))
      )
      expect(bytesToHex(secret)).toBe(v.shared_secret)

      // Control: a flipped ciphertext bit must not reproduce it.
      const bad = hexToBytes(v.ciphertext)
      bad[0] ^= 1
      const other = S.hsm_extractKeyValue(
        M,
        hSession,
        hsm_compositeDecapsulate(M, hSession, h, bad)
      )
      expect(bytesToHex(other)).not.toBe(v.shared_secret)
    }
  )

  const xwingHkdf = hpkePqFile.vectors.filter(
    (v) => v.kem_id === HPKE_KEM.MLKEM768_X25519 && [1, 2, 3].includes(v.kdf_id) && v.mode === 0
  )
  it('has published X-Wing HPKE-PQ vectors with an HKDF suite to replay', () => {
    expect(xwingHkdf.length).toBeGreaterThan(0)
  })
  it.each(xwingHkdf.map((v) => [`kdf ${v.kdf_id} aead ${v.aead_id}`, v] as const))(
    'HPKE-PQ X-Wing vector (%s): composite Decap + KeySchedule reproduce base_nonce and exporter_secret',
    (_name, v) => {
      // X-Wing: SHAKE256 expands the 32-byte seed to mlkemSeed(64) || X25519 scalar(32).
      const dk = shake256(hexToBytes(v.skRm), { dkLen: 96 })
      const h = importPrivate(HPKE_KEM.MLKEM768_X25519, dk)
      const secretHandle = compositeDecap(ctx, h, hexToBytes(v.enc))
      // The workshop's secret is protected: it cannot be read back.
      expect(() => S.hsm_extractKeyValue(M, hSession, secretHandle)).toThrow()
      const ks = keyScheduleSecure(
        ctx,
        v.mode as 0,
        v.kem_id,
        v.kdf_id,
        v.aead_id,
        secretHandle,
        hexToBytes(v.info)
      )
      expect(bytesToHex(ks.baseNonce!)).toBe(v.base_nonce)
      expect(bytesToHex(ks.exporterSecret)).toBe(v.exporter_secret)
    }
  )

  describe.each(HYBRID_KEMS.map((k) => [`kem 0x${k.toString(16)}`, k] as const))(
    'hybrid suite %s',
    (_name, kemId) => {
      const ckp = () => compositeKemCkp(kemId)!
      const info = new TextEncoder().encode('pqctoday HPKE workshop')
      const aad = new TextEncoder().encode('hpke-workshop-v1')
      const pt = new TextEncoder().encode('The quantum-safe fox jumps over the classical dog.')

      it('the v3.2 chain encapsulates, the one-call composite decapsulates to the same KeySchedule output', () => {
        const kp = hsm_generateCompositeKeyPair(M, hSession, 'kem', ckp())
        const ekH = S.hsm_extractKeyValue(M, hSession, kp.pubHandle)
        const sender = hybridEncap(ctx, kemId, ekH) // CKM_ML_KEM + CKM_ECDH1_DERIVE + concatenations + SHA3-256
        const recipientSecret = compositeDecap(ctx, kp.privHandle, sender.enc) // one CKM_COMP_KEM call
        const a = keyScheduleSecure(
          ctx,
          HPKE_MODE.BASE,
          kemId,
          HPKE_KDF.HKDF_SHA256,
          HPKE_AEAD.AES_128_GCM,
          sender.sharedSecretHandle,
          info
        )
        const b = keyScheduleSecure(
          ctx,
          HPKE_MODE.BASE,
          kemId,
          HPKE_KDF.HKDF_SHA256,
          HPKE_AEAD.AES_128_GCM,
          recipientSecret,
          info
        )
        expect(bytesToHex(b.baseNonce!)).toBe(bytesToHex(a.baseNonce!))
        expect(bytesToHex(b.exporterSecret)).toBe(bytesToHex(a.exporterSecret))
        const { ct } = sealHandle(
          ctx,
          a.keyHandle!,
          HPKE_AEAD.AES_128_GCM,
          a.baseNonce!,
          0,
          aad,
          pt
        )
        expect(
          bytesToHex(openHandle(ctx, b.keyHandle!, HPKE_AEAD.AES_128_GCM, b.baseNonce!, 0, aad, ct))
        ).toBe(bytesToHex(pt))
      })

      it.each([
        ['Base', HPKE_MODE.BASE],
        ['PSK', HPKE_MODE.PSK],
      ] as const)(
        'one-call round trip, %s mode, ChaCha20-Poly1305, and a tampered ciphertext is refused',
        (_m, mode) => {
          const kp = hsm_generateCompositeKeyPair(M, hSession, 'kem', ckp())
          const { sharedSecretHandle, enc } = compositeEncap(ctx, kp.pubHandle)
          const recipient = compositeDecap(ctx, kp.privHandle, enc)
          const psk = mode === HPKE_MODE.PSK ? new Uint8Array(32).fill(7) : undefined
          const pskId =
            mode === HPKE_MODE.PSK ? new TextEncoder().encode('workshop-psk') : undefined
          const aead = HPKE_AEAD.CHACHA20POLY1305
          const s = keyScheduleSecure(
            ctx,
            mode,
            kemId,
            HPKE_KDF.HKDF_SHA384,
            aead,
            sharedSecretHandle,
            info,
            psk,
            pskId
          )
          const r = keyScheduleSecure(
            ctx,
            mode,
            kemId,
            HPKE_KDF.HKDF_SHA384,
            aead,
            recipient,
            info,
            psk,
            pskId
          )
          const { ct } = sealHandle(ctx, s.keyHandle!, aead, s.baseNonce!, 0, aad, pt)
          expect(bytesToHex(openHandle(ctx, r.keyHandle!, aead, r.baseNonce!, 0, aad, ct))).toBe(
            bytesToHex(pt)
          )
          const bad = Uint8Array.from(ct)
          bad[0] ^= 1
          expect(() => openHandle(ctx, r.keyHandle!, aead, r.baseNonce!, 0, aad, bad)).toThrow()
        }
      )
    }
  )

  describe.each([
    ['ML-KEM-512', HPKE_KEM.MLKEM512, 512],
    ['ML-KEM-768', HPKE_KEM.MLKEM768, 768],
    ['ML-KEM-1024', HPKE_KEM.MLKEM1024, 1024],
  ] as const)('pure %s through the v3.2 pieces', (_name, kemId, variant) => {
    it('round trip: the ML-KEM secret feeds KeySchedule as a salt key without being read', () => {
      const kp = S.hsm_generateMLKEMKeyPair(M, hSession, variant, true, 'pure ML-KEM test')
      const ek = S.hsm_extractKeyValue(M, hSession, kp.pubHandle)
      const { sharedSecretHandle, enc } = pqEncap(ctx, kemId, ek)
      expect(() => S.hsm_extractKeyValue(M, hSession, sharedSecretHandle)).toThrow()
      const recipient = pqDecap(ctx, kemId, enc, kp.privHandle)
      const info = new TextEncoder().encode('pure ML-KEM')
      const s = keyScheduleSecure(
        ctx,
        HPKE_MODE.BASE,
        kemId,
        HPKE_KDF.HKDF_SHA256,
        HPKE_AEAD.AES_256_GCM,
        sharedSecretHandle,
        info
      )
      const r = keyScheduleSecure(
        ctx,
        HPKE_MODE.BASE,
        kemId,
        HPKE_KDF.HKDF_SHA256,
        HPKE_AEAD.AES_256_GCM,
        recipient,
        info
      )
      expect(bytesToHex(r.baseNonce!)).toBe(bytesToHex(s.baseNonce!))
      const pt = new TextEncoder().encode('ML-KEM only')
      const { ct } = sealHandle(
        ctx,
        s.keyHandle!,
        HPKE_AEAD.AES_256_GCM,
        s.baseNonce!,
        0,
        new Uint8Array(0),
        pt
      )
      expect(
        bytesToHex(
          openHandle(
            ctx,
            r.keyHandle!,
            HPKE_AEAD.AES_256_GCM,
            r.baseNonce!,
            0,
            new Uint8Array(0),
            ct
          )
        )
      ).toBe(bytesToHex(pt))
      const bad = Uint8Array.from(enc)
      bad[0] ^= 1
      // ML-KEM rejects implicitly: a different secret, so a different key, so Open fails.
      const wrong = keyScheduleSecure(
        ctx,
        HPKE_MODE.BASE,
        kemId,
        HPKE_KDF.HKDF_SHA256,
        HPKE_AEAD.AES_256_GCM,
        pqDecap(ctx, kemId, bad, kp.privHandle),
        info
      )
      expect(() =>
        openHandle(
          ctx,
          wrong.keyHandle!,
          HPKE_AEAD.AES_256_GCM,
          wrong.baseNonce!,
          0,
          new Uint8Array(0),
          ct
        )
      ).toThrow()
    })
  })
})
