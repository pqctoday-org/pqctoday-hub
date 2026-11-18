// SPDX-License-Identifier: AGPL-3.0-only
//
// Cross-checks hpkeService.ts against two independent sources of truth:
//
// 1. RFC 9180 Appendix A.3 (DHKEM(P-256, HKDF-SHA256), HKDF-SHA256,
//    AES-128-GCM) — all four HPKE modes, byte-exact. The ephemeral (skEm) and
//    static (skRm/skSm) private keys are forced to their published values via
//    hsm_importECPrivateKey, so every derived value (enc, shared_secret, key,
//    base_nonce, exporter_secret, and each mode's Seal ciphertexts) is
//    reproduced through real C_DeriveKey(CKM_ECDH1_DERIVE) +
//    C_DeriveKey(CKM_HKDF_DERIVE) + C_Encrypt(CKM_AES_GCM) PKCS#11 calls and
//    compared against the RFC's own worked values.
//    Source: https://www.rfc-editor.org/rfc/rfc9180.html#appendix-A.3
//
// 2. The PQ and PQ/T hybrid KEM paths on PKCS#11 v3.2 (pqDecap, hybridDecap,
//    hybridEncap, keyScheduleSecure, sealHandle, openHandle) are cross-checked
//    across:
//    (a) All 54 (3 KEMs × 3 KDFs × 3 AEADs × 2 modes) independent-keygen round trips;
//    (b) All 6 HKDF-based PQ and PQ/T hybrid suites from draft-ietf-hpke-pq-05
//        Appendix A (hpkewg/hpke-pq reference vectors), reproducing base_nonce,
//        exporter_secret, and every published AEAD encryption byte-for-byte;
//    (c) All 30 CFRG draft-irtf-cfrg-concrete-hybrid-kems test vectors; and
//    (d) Bidirectional encapsulation/decapsulation + AEAD interop with
//        @noble/post-quantum/hybrid.js (ml_kem768_x25519, ml_kem768_p256,
//        ml_kem1024_p384).
import { describe, it, expect, beforeAll } from 'vitest'
import { shake256 } from '@noble/hashes/sha3.js'
import { ml_kem512, ml_kem768, ml_kem1024 } from '@noble/post-quantum/ml-kem.js'
import {
  ml_kem768_x25519,
  ml_kem768_p256,
  ml_kem1024_p384,
} from '@noble/post-quantum/hybrid.js'
import * as SoftHSM from '@/wasm/softhsm'
import hpkePqFile from '@/data/acvp/hpke-pq-04-test-vectors.json'
import cfrgFile from '@/data/acvp/cfrg-concrete-hybrid-kems-test-vectors.json'
import {
  HPKE_KEM,
  HPKE_KDF,
  HPKE_AEAD,
  HPKE_MODE,
  type Hctx,
  type HpkeModeId,
  dhkemEncap,
  dhkemDecap,
  dhkemAuthEncap,
  dhkemAuthDecap,
  hybridEncap,
  hybridDecap,
  pqDecap,
  keySchedule,
  keyScheduleSecure,
  seal,
  open,
  sealHandle,
  openHandle,
  hex,
  fromHex,
  kemInfo,
  ecPointRawLen,
  stripEcPointDer,
} from './hpkeService'
import { HPKE_RFC9180_A3_VECTORS } from '../data/hpkeTestVectors'

describe('HPKE composed from PKCS#11 v3.2 primitives', () => {
  let ctx: Hctx

  beforeAll(async () => {
    const M = (await SoftHSM.getSoftHSMRustModule()) as SoftHSM.SoftHSMModule
    SoftHSM.hsm_initialize(M)
    const freeSlot = SoftHSM.hsm_getFirstFreeSlot(M)
    const slotId = SoftHSM.hsm_initToken(M, freeSlot, '1234', 'HPKE Test')
    const hSession = SoftHSM.hsm_openUserSession(M, slotId, '1234', '1234')
    ctx = { M, hSession }
  }, 60_000)

  describe.each(HPKE_RFC9180_A3_VECTORS)('RFC 9180 A.3 — $modeLabel mode', (v) => {
    it('reproduces enc, shared_secret, key, base_nonce, exporter_secret, and Seal ciphertexts byte-for-byte', () => {
      const pkRm = fromHex(v.pkRm)
      const skRHandle = SoftHSM.hsm_importECPrivateKey(
        ctx.M,
        ctx.hSession,
        fromHex(v.skRm),
        'P-256',
        true,
        true
      )
      const forced = { skE: fromHex(v.skEm), pkE: fromHex(v.pkEm) }

      let sharedSecret: Uint8Array
      let enc: Uint8Array
      if (v.mode === HPKE_MODE.AUTH || v.mode === HPKE_MODE.AUTH_PSK) {
        const pkSm = fromHex(v.pkSm!)
        const skSHandle = SoftHSM.hsm_importECPrivateKey(
          ctx.M,
          ctx.hSession,
          fromHex(v.skSm!),
          'P-256',
          true,
          true
        )
        ;({ sharedSecret, enc } = dhkemAuthEncap(
          ctx,
          HPKE_KEM.DHKEM_P256_HKDF_SHA256,
          pkRm,
          skSHandle,
          pkSm,
          forced
        ))
      } else {
        ;({ sharedSecret, enc } = dhkemEncap(ctx, HPKE_KEM.DHKEM_P256_HKDF_SHA256, pkRm, forced))
      }

      expect(hex(enc)).toBe(v.enc)
      expect(hex(sharedSecret)).toBe(v.sharedSecret)

      const psk = v.psk ? fromHex(v.psk) : undefined
      const pskId = v.pskId ? fromHex(v.pskId) : undefined
      const senderCtx = keySchedule(
        ctx,
        v.mode as HpkeModeId,
        v.kemId,
        v.kdfId,
        v.aeadId,
        sharedSecret,
        fromHex(v.info),
        psk,
        pskId
      )
      expect(hex(senderCtx.keyBytes!)).toBe(v.key)
      expect(hex(senderCtx.baseNonce!)).toBe(v.baseNonce)
      expect(hex(senderCtx.exporterSecret)).toBe(v.exporterSecret)

      const pt = fromHex(v.pt)
      for (let seq = 0; seq < v.encryptions.length; seq++) {
        const { ct } = seal(
          ctx,
          senderCtx.keyBytes!,
          v.aeadId,
          senderCtx.baseNonce!,
          seq,
          fromHex(v.encryptions[seq].aad),
          pt
        )
        expect(hex(ct), `seq ${seq}`).toBe(v.encryptions[seq].ct)
      }

      // Recipient side: decap + KeySchedule + Open must reproduce the same
      // secret and recover the plaintext, entirely independently derived.
      let recipientSS: Uint8Array
      if (v.mode === HPKE_MODE.AUTH || v.mode === HPKE_MODE.AUTH_PSK) {
        recipientSS = dhkemAuthDecap(
          ctx,
          HPKE_KEM.DHKEM_P256_HKDF_SHA256,
          enc,
          skRHandle,
          pkRm,
          fromHex(v.pkSm!)
        )
      } else {
        recipientSS = dhkemDecap(ctx, HPKE_KEM.DHKEM_P256_HKDF_SHA256, enc, skRHandle, pkRm)
      }
      expect(hex(recipientSS)).toBe(v.sharedSecret)

      const recipientCtx = keySchedule(
        ctx,
        v.mode as HpkeModeId,
        v.kemId,
        v.kdfId,
        v.aeadId,
        recipientSS,
        fromHex(v.info),
        psk,
        pskId
      )
      for (let seq = 0; seq < v.encryptions.length; seq++) {
        const pt2 = open(
          ctx,
          recipientCtx.keyBytes!,
          v.aeadId,
          recipientCtx.baseNonce!,
          seq,
          fromHex(v.encryptions[seq].aad),
          fromHex(v.encryptions[seq].ct)
        )
        expect(hex(pt2), `seq ${seq}`).toBe(v.pt)
      }
    })
  })

  // ── DHKEM(P-521, HKDF-SHA512) round trip ────────────────────────────────────
  // No RFC 9180 test vector covers P-521 (A.3 only vends P-256), which is
  // exactly why a real Ndh-sizing bug (64 instead of RFC 9180's 66-byte
  // P-521 DH output) went undetected: every other DHKEM curve's Ndh equals
  // its Nsecret, so nothing else exercises a curve where they differ.
  // Round-trip (not byte-exact) is still a real regression guard — a wrong
  // Ndh truncates/misreads the raw ECDH output, so sender and recipient
  // would derive different shared secrets and Open would fail to decrypt.
  it('DHKEM(P-521, HKDF-SHA512) + HKDF-SHA512 + AES-256-GCM, Base mode: round-trips with the correct 66-byte Ndh', () => {
    const kemId = HPKE_KEM.DHKEM_P521_HKDF_SHA512
    const recipient = SoftHSM.hsm_generateECKeyPair(
      ctx.M,
      ctx.hSession,
      'P-521',
      false,
      'HPKE P-521 recipient'
    )
    const pkRRaw = SoftHSM.hsm_extractECPoint(ctx.M, ctx.hSession, recipient.pubHandle)
    const pkRPoint = stripEcPointDer(pkRRaw, ecPointRawLen('P-521'))

    const { sharedSecret, enc } = dhkemEncap(ctx, kemId, pkRPoint)
    expect(enc.length).toBe(133) // Nenc for P-521

    const recipientSS = dhkemDecap(ctx, kemId, enc, recipient.privHandle, pkRPoint)
    expect(hex(recipientSS)).toBe(hex(sharedSecret))

    const info = new TextEncoder().encode('p-521 ndh regression test')
    const senderCtx = keySchedule(
      ctx,
      HPKE_MODE.BASE,
      kemId,
      HPKE_KDF.HKDF_SHA512,
      HPKE_AEAD.AES_256_GCM,
      sharedSecret,
      info
    )
    const recipientCtx = keySchedule(
      ctx,
      HPKE_MODE.BASE,
      kemId,
      HPKE_KDF.HKDF_SHA512,
      HPKE_AEAD.AES_256_GCM,
      recipientSS,
      info
    )
    expect(hex(recipientCtx.baseNonce!)).toBe(hex(senderCtx.baseNonce!))

    const pt = new TextEncoder().encode('DHKEM-P521 Ndh fix regression')
    const aad = new TextEncoder().encode('p521-aad')
    const { ct } = seal(
      ctx,
      senderCtx.keyBytes!,
      HPKE_AEAD.AES_256_GCM,
      senderCtx.baseNonce!,
      0,
      aad,
      pt
    )
    const recovered = open(
      ctx,
      recipientCtx.keyBytes!,
      HPKE_AEAD.AES_256_GCM,
      recipientCtx.baseNonce!,
      0,
      aad,
      ct
    )
    expect(new TextDecoder().decode(recovered)).toBe('DHKEM-P521 Ndh fix regression')
  })

  // ── Full hybrid-KEM cross-product ──────────────────────────────────────────
  // Every combination the workshop's picker actually lets a user select for a
  // PQ/T hybrid KEM: all 3 registered hybrid KEMs × all 3 KDFs × all 3 AEADs ×
  // both modes ML-KEM supports (Auth/AuthPSK are excluded — see
  // hpkeAuthLimitation in content.ts — because draft-ietf-hpke-pq's ML-KEM
  // entries mark the Auth column "no"). 3×3×3×2 = 54 cases. Each one is a
  // full independent-keygen round trip: sender and recipient must derive the
  // identical KeySchedule output and the recipient must recover the exact
  // plaintext through the picked AEAD.
  const HYBRID_KEMS = [
    { name: 'MLKEM768-X25519', kemId: HPKE_KEM.MLKEM768_X25519 },
    { name: 'MLKEM768-P256', kemId: HPKE_KEM.MLKEM768_P256 },
    { name: 'MLKEM1024-P384', kemId: HPKE_KEM.MLKEM1024_P384 },
  ] as const
  const KDFS = [
    { name: 'HKDF-SHA256', kdfId: HPKE_KDF.HKDF_SHA256 },
    { name: 'HKDF-SHA384', kdfId: HPKE_KDF.HKDF_SHA384 },
    { name: 'HKDF-SHA512', kdfId: HPKE_KDF.HKDF_SHA512 },
  ] as const
  const AEADS = [
    { name: 'AES-128-GCM', aeadId: HPKE_AEAD.AES_128_GCM },
    { name: 'AES-256-GCM', aeadId: HPKE_AEAD.AES_256_GCM },
    { name: 'ChaCha20-Poly1305', aeadId: HPKE_AEAD.CHACHA20POLY1305 },
  ] as const
  const MODES = [
    { name: 'Base', mode: HPKE_MODE.BASE },
    { name: 'PSK', mode: HPKE_MODE.PSK },
  ] as const

  const hybridCases = HYBRID_KEMS.flatMap((kem) =>
    KDFS.flatMap((kdf) =>
      AEADS.flatMap((aead) => MODES.map((m) => ({ ...kem, ...kdf, ...aead, ...m })))
    )
  )

  describe.each(hybridCases)(
    'PQ/T hybrid KEM cross-product — $name / $kdfId.name / $aeadId.name / mode $mode',
    (c) => {
      it(`${c.name} + ${KDFS.find((k) => k.kdfId === c.kdfId)!.name} + ${AEADS.find((a) => a.aeadId === c.aeadId)!.name} + ${MODES.find((m) => m.mode === c.mode)!.name}: round-trips`, () => {
        const info = kemInfo(c.kemId)
        if (info.kind !== 'hybrid') throw new Error('expected a hybrid KEM')

        const mlkem = SoftHSM.hsm_generateMLKEMKeyPair(
          ctx.M,
          ctx.hSession,
          info.pqVariant,
          true,
          'HPKE hybrid recipient PQ'
        )
        const ec = SoftHSM.hsm_generateECKeyPair(
          ctx.M,
          ctx.hSession,
          info.curve,
          false,
          'HPKE hybrid recipient EC'
        )
        const ekPQ = SoftHSM.hsm_extractKeyValue(ctx.M, ctx.hSession, mlkem.pubHandle)
        const ekTRaw = SoftHSM.hsm_extractECPoint(ctx.M, ctx.hSession, ec.pubHandle)
        const ekT =
          info.curve === 'X25519' ? ekTRaw : stripEcPointDer(ekTRaw, ecPointRawLen(info.curve))
        const ekH = new Uint8Array(ekPQ.length + ekT.length)
        ekH.set(ekPQ, 0)
        ekH.set(ekT, ekPQ.length)
        expect(ekH.length).toBe(info.Npk)

        const senderResult = hybridEncap(ctx, c.kemId, ekH)
        expect(senderResult.enc.length).toBe(info.Nenc)
        // ss_H is intentionally non-extractable — prove it, don't just assume it.
        expect(() =>
          SoftHSM.hsm_extractKeyValue(ctx.M, ctx.hSession, senderResult.sharedSecretHandle)
        ).toThrow()

        const recipientSharedSecretHandle = hybridDecap(
          ctx,
          c.kemId,
          senderResult.enc,
          mlkem.privHandle,
          ec.privHandle,
          ekH
        )
        expect(() =>
          SoftHSM.hsm_extractKeyValue(ctx.M, ctx.hSession, recipientSharedSecretHandle)
        ).toThrow()

        const infoBytes = new TextEncoder().encode('hpke cross-product test')
        const psk =
          c.mode === HPKE_MODE.PSK ? crypto.getRandomValues(new Uint8Array(32)) : undefined
        const pskId =
          c.mode === HPKE_MODE.PSK ? new TextEncoder().encode('cross-product-psk') : undefined

        const senderCtx = keyScheduleSecure(
          ctx,
          c.mode,
          c.kemId,
          c.kdfId,
          c.aeadId,
          senderResult.sharedSecretHandle,
          infoBytes,
          psk,
          pskId
        )
        const recipientCtx = keyScheduleSecure(
          ctx,
          c.mode,
          c.kemId,
          c.kdfId,
          c.aeadId,
          recipientSharedSecretHandle,
          infoBytes,
          psk,
          pskId
        )
        // base_nonce and exporter_secret are meant to leave the token (RFC 9180's own design) — still checkable byte-for-byte.
        expect(hex(recipientCtx.baseNonce!)).toBe(hex(senderCtx.baseNonce!))
        expect(hex(recipientCtx.exporterSecret)).toBe(hex(senderCtx.exporterSecret))
        // The final AEAD key is intentionally non-extractable too.
        expect(() =>
          SoftHSM.hsm_extractKeyValue(ctx.M, ctx.hSession, senderCtx.keyHandle!)
        ).toThrow()
        expect(() =>
          SoftHSM.hsm_extractKeyValue(ctx.M, ctx.hSession, recipientCtx.keyHandle!)
        ).toThrow()

        const pt = new TextEncoder().encode('Post-quantum hybrid HPKE over PKCS#11 v3.2')
        const aad = new TextEncoder().encode('demo-aad')
        // Correctness is proven black-box: Seal/Open succeeding through two
        // independently-derived, never-extracted keys is only possible if
        // sender and recipient derived byte-identical secrets end to end.
        const { ct } = sealHandle(
          ctx,
          senderCtx.keyHandle!,
          c.aeadId,
          senderCtx.baseNonce!,
          0,
          aad,
          pt
        )
        const recovered = openHandle(
          ctx,
          recipientCtx.keyHandle!,
          c.aeadId,
          recipientCtx.baseNonce!,
          0,
          aad,
          ct
        )
        expect(new TextDecoder().decode(recovered)).toBe(
          'Post-quantum hybrid HPKE over PKCS#11 v3.2'
        )
      })
    }
  )

  // ── Reference-Vector & Reference-Library Cross-Checks on PKCS#11 v3.2 ───────
  // 1. Replays all 6 HKDF-based PQ and PQ/T hybrid suites from draft-ietf-hpke-pq-05
  //    Appendix A (hpkewg/hpke-pq reference vectors) through the PKCS#11 v3.2
  //    pqDecap / hybridDecap + keyScheduleSecure + openHandle path, verifying
  //    byte-exact base_nonce, exporter_secret, and every published AEAD encryption.
  // 2. Replays all 30 CFRG draft-irtf-cfrg-concrete-hybrid-kems vectors through
  //    PKCS#11 v3.2 hybridDecap + keyScheduleSecure and verifies exact agreement
  //    with keySchedule(v.shared_secret).
  // 3. Verifies bidirectional interoperability between PKCS#11 v3.2
  //    hybridEncap / hybridDecap and @noble/post-quantum/hybrid.js
  //    (ml_kem768_x25519, ml_kem768_p256, ml_kem1024_p384).
  const expandMlkemSeed = (variant: 512 | 768 | 1024, seed64: Uint8Array): Uint8Array => {
    if (variant === 512) return ml_kem512.keygen(seed64).secretKey
    if (variant === 768) return ml_kem768.keygen(seed64).secretKey
    return ml_kem1024.keygen(seed64).secretKey
  }

  const pqHkdfVectors = hpkePqFile.vectors.filter(
    (v) =>
      [
        HPKE_KEM.MLKEM512,
        HPKE_KEM.MLKEM768,
        HPKE_KEM.MLKEM1024,
        HPKE_KEM.MLKEM768_P256,
        HPKE_KEM.MLKEM1024_P384,
        HPKE_KEM.MLKEM768_X25519,
      ].includes(v.kem_id as never) &&
      [HPKE_KDF.HKDF_SHA256, HPKE_KDF.HKDF_SHA384, HPKE_KDF.HKDF_SHA512].includes(
        v.kdf_id as never
      )
  )

  describe.each(
    pqHkdfVectors.map((v) => ({
      label: `kem 0x${v.kem_id.toString(16)} kdf 0x${v.kdf_id.toString(16)} aead 0x${v.aead_id.toString(16)}`,
      v,
    }))
  )('draft-ietf-hpke-pq-05 reference vector on PKCS#11 v3.2 — $label', ({ v }) => {
    it('reproduces base_nonce, exporter_secret, and decrypts every published encryption via PKCS#11 v3.2', () => {
      const info = kemInfo(v.kem_id)
      let ssHandle: number
      if (info.kind === 'pq') {
        const dkBytes = expandMlkemSeed(info.pqVariant, fromHex(v.skRm))
        const mlkemPriv = SoftHSM.hsm_importMLKEMPrivateKey(
          ctx.M,
          ctx.hSession,
          info.pqVariant,
          dkBytes
        )
        ssHandle = pqDecap(ctx, v.kem_id, fromHex(v.enc), mlkemPriv)
      } else if (info.kind === 'hybrid') {
        const scalarLen = info.curve === 'P-384' ? 48 : 32
        const expanded = shake256(fromHex(v.skRm), { dkLen: 64 + scalarLen })
        const dkPqBytes = expandMlkemSeed(info.pqVariant, expanded.subarray(0, 64))
        const dkTScalar = expanded.subarray(64)
        const mlkemPriv = SoftHSM.hsm_importMLKEMPrivateKey(
          ctx.M,
          ctx.hSession,
          info.pqVariant,
          dkPqBytes
        )
        const ecPriv = SoftHSM.hsm_importECPrivateKey(
          ctx.M,
          ctx.hSession,
          dkTScalar,
          info.curve,
          true,
          true
        )
        ssHandle = hybridDecap(
          ctx,
          v.kem_id,
          fromHex(v.enc),
          mlkemPriv,
          ecPriv,
          fromHex(v.pkRm)
        )
      } else {
        throw new Error('unexpected kem kind')
      }

      const recipientCtx = keyScheduleSecure(
        ctx,
        v.mode as HpkeModeId,
        v.kem_id,
        v.kdf_id,
        v.aead_id,
        ssHandle,
        fromHex(v.info)
      )
      expect(hex(recipientCtx.baseNonce!)).toBe(v.base_nonce)
      expect(hex(recipientCtx.exporterSecret)).toBe(v.exporter_secret)

      v.encryptions.forEach((encItem, seq) => {
        const pt = openHandle(
          ctx,
          recipientCtx.keyHandle!,
          v.aead_id,
          recipientCtx.baseNonce!,
          seq,
          fromHex(encItem.aad),
          fromHex(encItem.ct)
        )
        expect(hex(pt)).toBe(encItem.pt)
      })
    })
  })

  const CFRG_KEM_MAP: Record<string, number> = {
    mlkem768_x25519: HPKE_KEM.MLKEM768_X25519,
    mlkem768_p256: HPKE_KEM.MLKEM768_P256,
    mlkem1024_p384: HPKE_KEM.MLKEM1024_P384,
  }

  it.each(cfrgFile.vectors.map((v, idx) => [`${v.kem} #${idx}`, v] as const))(
    'CFRG hybrid KEM vector %s on PKCS#11 v3.2: hybridDecap matches published shared_secret schedule',
    (_label, v) => {
      const kemId = CFRG_KEM_MAP[v.kem]
      const info = kemInfo(kemId)
      if (info.kind !== 'hybrid') throw new Error('expected hybrid')
      const dkPqBytes = expandMlkemSeed(info.pqVariant, fromHex(v.decapsulation_key_pq))
      const mlkemPriv = SoftHSM.hsm_importMLKEMPrivateKey(
        ctx.M,
        ctx.hSession,
        info.pqVariant,
        dkPqBytes
      )
      const ecPriv = SoftHSM.hsm_importECPrivateKey(
        ctx.M,
        ctx.hSession,
        fromHex(v.decapsulation_key_t),
        info.curve,
        true,
        true
      )
      const ssHandle = hybridDecap(
        ctx,
        kemId,
        fromHex(v.ciphertext),
        mlkemPriv,
        ecPriv,
        fromHex(v.encapsulation_key)
      )
      const infoBytes = new TextEncoder().encode('cfrg-v32-crosscheck')
      const v32Ks = keyScheduleSecure(
        ctx,
        HPKE_MODE.BASE,
        kemId,
        HPKE_KDF.HKDF_SHA256,
        HPKE_AEAD.AES_256_GCM,
        ssHandle,
        infoBytes
      )
      const expectedKs = keySchedule(
        ctx,
        HPKE_MODE.BASE,
        kemId,
        HPKE_KDF.HKDF_SHA256,
        HPKE_AEAD.AES_256_GCM,
        fromHex(v.shared_secret),
        infoBytes
      )
      expect(hex(v32Ks.baseNonce!)).toBe(hex(expectedKs.baseNonce!))
      expect(hex(v32Ks.exporterSecret)).toBe(hex(expectedKs.exporterSecret))
    }
  )

  describe.each([
    { name: 'MLKEM768-X25519', kemId: HPKE_KEM.MLKEM768_X25519, nobleKem: ml_kem768_x25519 },
    { name: 'MLKEM768-P256', kemId: HPKE_KEM.MLKEM768_P256, nobleKem: ml_kem768_p256 },
    { name: 'MLKEM1024-P384', kemId: HPKE_KEM.MLKEM1024_P384, nobleKem: ml_kem1024_p384 },
  ] as const)(
    'bidirectional PKCS#11 v3.2 ↔ @noble/post-quantum reference library interop — $name',
    ({ kemId, nobleKem }) => {
      it('PKCS#11 v3.2 hybridEncap + sealHandle decrypts cleanly with @noble/post-quantum decapsulate, and vice versa', () => {
        const info = kemInfo(kemId)
        if (info.kind !== 'hybrid') throw new Error('expected hybrid')

        // Direction 1: PKCS#11 v3.2 Sender -> @noble/post-quantum Recipient
        const nobleKp = nobleKem.keygen()
        const v32Sender = hybridEncap(ctx, kemId, nobleKp.publicKey)
        const nobleSharedSecret = nobleKem.decapsulate(v32Sender.enc, nobleKp.secretKey)

        const appInfo = new TextEncoder().encode('bidirectional-v32-noble')
        const aad = new TextEncoder().encode('aad-v32-noble')
        const msg = new TextEncoder().encode('Cross-verified PKCS#11 v3.2 <-> reference KEM')

        const senderKs = keyScheduleSecure(
          ctx,
          HPKE_MODE.BASE,
          kemId,
          HPKE_KDF.HKDF_SHA256,
          HPKE_AEAD.AES_256_GCM,
          v32Sender.sharedSecretHandle,
          appInfo
        )
        const nobleRecipientKs = keySchedule(
          ctx,
          HPKE_MODE.BASE,
          kemId,
          HPKE_KDF.HKDF_SHA256,
          HPKE_AEAD.AES_256_GCM,
          nobleSharedSecret,
          appInfo
        )
        expect(hex(nobleRecipientKs.baseNonce!)).toBe(hex(senderKs.baseNonce!))
        expect(hex(nobleRecipientKs.exporterSecret)).toBe(hex(senderKs.exporterSecret))

        const { ct } = sealHandle(
          ctx,
          senderKs.keyHandle!,
          HPKE_AEAD.AES_256_GCM,
          senderKs.baseNonce!,
          0,
          aad,
          msg
        )
        const openedByNoble = open(
          ctx,
          nobleRecipientKs.keyBytes!,
          HPKE_AEAD.AES_256_GCM,
          nobleRecipientKs.baseNonce!,
          0,
          aad,
          ct
        )
        expect(hex(openedByNoble)).toBe(hex(msg))

        // Direction 2: @noble/post-quantum Sender -> PKCS#11 v3.2 Recipient
        const mlkem = SoftHSM.hsm_generateMLKEMKeyPair(
          ctx.M,
          ctx.hSession,
          info.pqVariant,
          true,
          'v32-recip-pq'
        )
        const ec = SoftHSM.hsm_generateECKeyPair(
          ctx.M,
          ctx.hSession,
          info.curve,
          false,
          'v32-recip-ec'
        )
        const ekPQ = SoftHSM.hsm_extractKeyValue(ctx.M, ctx.hSession, mlkem.pubHandle)
        const ekTRaw = SoftHSM.hsm_extractECPoint(ctx.M, ctx.hSession, ec.pubHandle)
        const ekT =
          info.curve === 'X25519' ? ekTRaw : stripEcPointDer(ekTRaw, ecPointRawLen(info.curve))
        const ekH = new Uint8Array(ekPQ.length + ekT.length)
        ekH.set(ekPQ, 0)
        ekH.set(ekT, ekPQ.length)

        const nobleEncap = nobleKem.encapsulate(ekH)
        const v32RecipSsHandle = hybridDecap(
          ctx,
          kemId,
          nobleEncap.cipherText,
          mlkem.privHandle,
          ec.privHandle,
          ekH
        )
        const nobleSenderKs = keySchedule(
          ctx,
          HPKE_MODE.BASE,
          kemId,
          HPKE_KDF.HKDF_SHA256,
          HPKE_AEAD.AES_256_GCM,
          nobleEncap.sharedSecret,
          appInfo
        )
        const v32RecipKs = keyScheduleSecure(
          ctx,
          HPKE_MODE.BASE,
          kemId,
          HPKE_KDF.HKDF_SHA256,
          HPKE_AEAD.AES_256_GCM,
          v32RecipSsHandle,
          appInfo
        )
        expect(hex(v32RecipKs.baseNonce!)).toBe(hex(nobleSenderKs.baseNonce!))
        expect(hex(v32RecipKs.exporterSecret)).toBe(hex(nobleSenderKs.exporterSecret))
      })
    }
  )
})
