// SPDX-License-Identifier: GPL-3.0-only
//
// R2 (pqctoday-hsm/docs/remediation-plan-ckm-hpke-and-hpke-gaps-2026-08-31.md)
// — proves the CKM_HPKE JS/WASM binding (hsm_generateHpkeKeyPair/
// hsm_hpkeEncapsulate/hsm_hpkeDecapsulate in ./softhsm) survives the actual
// WASM/JS boundary a real caller crosses. Deliberately independent of
// PKILearning/HybridCrypto/services/hpkeService.ts: that file's own
// hpkeService.test.ts already proves the RFC 9180 crypto is correct (byte-
// exact A.3 vectors) by COMPOSING primitive PKCS#11 v3.2 calls; this file
// instead proves the single-call CKM_HPKE candidate mechanism's raw
// CK_HPKE_PARAMS marshalling — offsets re-derived independently here (see
// softhsm.ts's own comment above HPKE_PARAMS_SIZE), not shared with either
// hpkeService.ts or the Rust engine's own FFI test module
// (rust/src/ffi.rs's hpke_ffi_tests) — a coincidental agreement between two
// independently-written marshallers is real evidence, a shared one is not.
//
// Correctness (not just "didn't throw") is proven the same way
// hpkeService.test.ts proves its hybrid path: Seal on the sender's key
// handle, Open on the recipient's, through the ACTUAL AEAD mechanism —
// this only succeeds if sender and recipient derived byte-identical
// AEAD keys AND base_nonces from two independent Encap/Decap calls.
import { describe, it, expect, beforeAll } from 'vitest'
import * as SoftHSM from './softhsm'
import type { AttrDef } from './softhsm'

const {
  hsm_generateHpkeKeyPair,
  hsm_hpkeEncapsulate,
  hsm_hpkeDecapsulate,
  hsm_importGenericSecret,
  hsm_aesEncrypt,
  hsm_aesDecrypt,
  hsm_chacha20Poly1305Encrypt,
  hsm_chacha20Poly1305Decrypt,
  hsm_extractKeyValue,
  CKP_HPKE_KEM_DHKEM_P256_HKDF_SHA256,
  CKP_HPKE_KEM_MLKEM768_X25519,
  CKP_HPKE_KEM_MLKEM768_P256,
  CKP_HPKE_KEM_MLKEM1024_P384,
  CKD_HPKE_HKDF_SHA256,
  CKD_HPKE_HKDF_SHA384,
  CKD_HPKE_HKDF_SHA512,
  CKZ_HPKE_AEAD_128_GCM,
  CKZ_HPKE_AEAD_256_GCM,
  CKZ_HPKE_AEAD_CHACHA20POLY1305,
  CKZ_HPKE_AEAD_EXPORT_ONLY,
  CKZ_HPKE_MODE_BASE,
  CKZ_HPKE_MODE_PSK,
  CKZ_HPKE_MODE_AUTH,
  CKA_EXTRACTABLE,
  CKA_SENSITIVE,
} = SoftHSM

const hex = (b: Uint8Array): string =>
  Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('')
const utf8 = (s: string): Uint8Array => new TextEncoder().encode(s)

// Un-quarantined 2026-09-01: hsm PR #196 (feat/ckm-hpke-candidate, merged as
// 33ae22b4) lands a real CKM_HPKE mechanism in the engine — the softhsmrustv3
// wasm bundle now ships from that commit, rebuilt fresh via
// rust/build-wasm-bundle.sh and staged byte-identically into all 3 hub
// locations (see wasm-provenance.json's softhsmrustv3-engine entry). The
// engine's own cargo test --lib (449/449, including 14 HPKE-specific native
// + FFI-level tests) already proved the mechanism; this suite proves the
// hub's independent JS/WASM binding survives the same boundary.
describe('CKM_HPKE JS/WASM binding (candidate mechanism, single-call Encap/Decap)', () => {
  let M: SoftHSM.SoftHSMModule
  let hSession: number

  beforeAll(async () => {
    M = (await SoftHSM.getSoftHSMRustModule()) as SoftHSM.SoftHSMModule
    SoftHSM.hsm_initialize(M)
    const freeSlot = SoftHSM.hsm_getFirstFreeSlot(M)
    const slotId = SoftHSM.hsm_initToken(M, freeSlot, '1234', 'CKM_HPKE Binding Test')
    hSession = SoftHSM.hsm_openUserSession(M, slotId, '1234', '1234')
  }, 60_000)

  /** Seal (sender key) / Open (recipient key) at seq=0 — nonce = baseNonce
   * unmodified, so this exercises the AEAD key + base_nonce exactly as
   * derived, with no dependency on hpkeService.ts's computeNonce. */
  function sealOpenRoundTrip(
    aeadId: number,
    senderKeyHandle: number,
    recipientKeyHandle: number,
    baseNonce: Uint8Array,
    aad: Uint8Array,
    pt: Uint8Array
  ): Uint8Array {
    if (aeadId === CKZ_HPKE_AEAD_CHACHA20POLY1305) {
      const ct = hsm_chacha20Poly1305Encrypt(M, hSession, senderKeyHandle, baseNonce, aad, pt)
      return hsm_chacha20Poly1305Decrypt(M, hSession, recipientKeyHandle, baseNonce, aad, ct)
    }
    const { ciphertext } = hsm_aesEncrypt(M, hSession, senderKeyHandle, pt, 'gcm', baseNonce, aad)
    return hsm_aesDecrypt(M, hSession, recipientKeyHandle, ciphertext, baseNonce, 'gcm', aad)
  }

  it('classical DHKEM(P-256, HKDF-SHA256), Base mode: keygen + single-call Encap/Decap round-trips', () => {
    const kemId = CKP_HPKE_KEM_DHKEM_P256_HKDF_SHA256
    const recipient = hsm_generateHpkeKeyPair(M, hSession, kemId)
    expect(recipient.pubHandle).toBeGreaterThan(0)
    expect(recipient.privHandle).toBeGreaterThan(0)

    const info = utf8('ckm_hpke binding classical base')
    const enc1 = hsm_hpkeEncapsulate(M, hSession, recipient.pubHandle, {
      kemId,
      kdfId: CKD_HPKE_HKDF_SHA256,
      aeadId: CKZ_HPKE_AEAD_128_GCM,
      mode: CKZ_HPKE_MODE_BASE,
      info,
    })
    expect(enc1.enc.length).toBe(65) // uncompressed P-256 SEC1 point
    expect(enc1.keyHandle).not.toBeNull()
    expect(enc1.baseNonce).not.toBeNull()

    const dec1 = hsm_hpkeDecapsulate(M, hSession, recipient.privHandle, enc1.enc, {
      kemId,
      kdfId: CKD_HPKE_HKDF_SHA256,
      aeadId: CKZ_HPKE_AEAD_128_GCM,
      mode: CKZ_HPKE_MODE_BASE,
      info,
    })
    expect(dec1.keyHandle).not.toBeNull()
    expect(hex(dec1.baseNonce!)).toBe(hex(enc1.baseNonce!))

    const pt = utf8('CKM_HPKE single-call classical round trip')
    const aad = utf8('ckm-hpke-aad')
    const recovered = sealOpenRoundTrip(
      CKZ_HPKE_AEAD_128_GCM,
      enc1.keyHandle!,
      dec1.keyHandle!,
      enc1.baseNonce!,
      aad,
      pt
    )
    expect(new TextDecoder().decode(recovered)).toBe('CKM_HPKE single-call classical round trip')
  })

  it('Auth mode: hSenderStaticKey (Encap) + senderPk (Decap) round-trip', () => {
    const kemId = CKP_HPKE_KEM_DHKEM_P256_HKDF_SHA256
    const recipient = hsm_generateHpkeKeyPair(M, hSession, kemId)
    const sender = hsm_generateHpkeKeyPair(M, hSession, kemId)
    const senderPk = hsm_extractKeyValue(M, hSession, sender.pubHandle)

    const info = utf8('ckm_hpke binding auth mode')
    const enc1 = hsm_hpkeEncapsulate(M, hSession, recipient.pubHandle, {
      kemId,
      kdfId: CKD_HPKE_HKDF_SHA256,
      aeadId: CKZ_HPKE_AEAD_128_GCM,
      mode: CKZ_HPKE_MODE_AUTH,
      info,
      hSenderStaticKey: sender.privHandle,
    })
    const dec1 = hsm_hpkeDecapsulate(M, hSession, recipient.privHandle, enc1.enc, {
      kemId,
      kdfId: CKD_HPKE_HKDF_SHA256,
      aeadId: CKZ_HPKE_AEAD_128_GCM,
      mode: CKZ_HPKE_MODE_AUTH,
      info,
      senderPk,
    })
    expect(hex(dec1.baseNonce!)).toBe(hex(enc1.baseNonce!))

    const pt = utf8('auth mode round trip')
    const aad = utf8('auth-aad')
    const recovered = sealOpenRoundTrip(
      CKZ_HPKE_AEAD_128_GCM,
      enc1.keyHandle!,
      dec1.keyHandle!,
      enc1.baseNonce!,
      aad,
      pt
    )
    expect(new TextDecoder().decode(recovered)).toBe('auth mode round trip')
  })

  it('aeadId = CKZ_HPKE_AEAD_EXPORT_ONLY: keyHandle is the exporter secret, baseNonce is null', () => {
    const kemId = CKP_HPKE_KEM_DHKEM_P256_HKDF_SHA256
    const recipient = hsm_generateHpkeKeyPair(M, hSession, kemId)
    const info = utf8('ckm_hpke binding export-only')
    // Override extractability via the nested CK_DERIVED_KEY template so the
    // test can compare bytes directly (default is non-extractable).
    // register_exporter_key's "absorb-after-defaults" only overrides what the
    // caller's template explicitly names — CKA_SENSITIVE defaults true and is
    // independent of CKA_EXTRACTABLE, so C_GetAttributeValue(CKA_VALUE) stays
    // blocked (CKR_ATTRIBUTE_SENSITIVE) unless both are overridden together,
    // matching every other extractable-key helper's convention in softhsm.ts.
    const extractableTpl: AttrDef[] = [
      { type: CKA_EXTRACTABLE, boolVal: true },
      { type: CKA_SENSITIVE, boolVal: false },
    ]

    const enc1 = hsm_hpkeEncapsulate(
      M,
      hSession,
      recipient.pubHandle,
      {
        kemId,
        kdfId: CKD_HPKE_HKDF_SHA256,
        aeadId: CKZ_HPKE_AEAD_EXPORT_ONLY,
        mode: CKZ_HPKE_MODE_BASE,
        info,
      },
      extractableTpl
    )
    expect(enc1.baseNonce).toBeNull()
    expect(enc1.keyHandle).not.toBeNull()

    const dec1 = hsm_hpkeDecapsulate(
      M,
      hSession,
      recipient.privHandle,
      enc1.enc,
      {
        kemId,
        kdfId: CKD_HPKE_HKDF_SHA256,
        aeadId: CKZ_HPKE_AEAD_EXPORT_ONLY,
        mode: CKZ_HPKE_MODE_BASE,
        info,
      },
      extractableTpl
    )
    expect(dec1.baseNonce).toBeNull()

    const senderSecret = hsm_extractKeyValue(M, hSession, enc1.keyHandle!)
    const recipientSecret = hsm_extractKeyValue(M, hSession, dec1.keyHandle!)
    expect(senderSecret.length).toBe(32) // HKDF-SHA256 Nh
    expect(hex(senderSecret)).toBe(hex(recipientSecret))
  })

  it('exporterTemplate alongside a real AEAD key: separate handle, nested CK_DERIVED_KEY marshalled correctly', () => {
    const kemId = CKP_HPKE_KEM_DHKEM_P256_HKDF_SHA256
    const recipient = hsm_generateHpkeKeyPair(M, hSession, kemId)
    const info = utf8('ckm_hpke binding exporter alongside aead key')
    // register_exporter_key's "absorb-after-defaults" only overrides what the
    // caller's template explicitly names — CKA_SENSITIVE defaults true and is
    // independent of CKA_EXTRACTABLE, so C_GetAttributeValue(CKA_VALUE) stays
    // blocked (CKR_ATTRIBUTE_SENSITIVE) unless both are overridden together,
    // matching every other extractable-key helper's convention in softhsm.ts.
    const extractableTpl: AttrDef[] = [
      { type: CKA_EXTRACTABLE, boolVal: true },
      { type: CKA_SENSITIVE, boolVal: false },
    ]

    const enc1 = hsm_hpkeEncapsulate(
      M,
      hSession,
      recipient.pubHandle,
      {
        kemId,
        kdfId: CKD_HPKE_HKDF_SHA256,
        aeadId: CKZ_HPKE_AEAD_128_GCM,
        mode: CKZ_HPKE_MODE_BASE,
        info,
      },
      extractableTpl
    )
    expect(enc1.keyHandle).not.toBeNull()
    expect(enc1.exporterHandle).not.toBeNull()
    expect(enc1.exporterHandle).not.toBe(enc1.keyHandle)

    const dec1 = hsm_hpkeDecapsulate(
      M,
      hSession,
      recipient.privHandle,
      enc1.enc,
      {
        kemId,
        kdfId: CKD_HPKE_HKDF_SHA256,
        aeadId: CKZ_HPKE_AEAD_128_GCM,
        mode: CKZ_HPKE_MODE_BASE,
        info,
      },
      extractableTpl
    )
    expect(dec1.exporterHandle).not.toBeNull()

    const senderExp = hsm_extractKeyValue(M, hSession, enc1.exporterHandle!)
    const recipientExp = hsm_extractKeyValue(M, hSession, dec1.exporterHandle!)
    expect(hex(senderExp)).toBe(hex(recipientExp))

    // The AEAD key alongside it must still work.
    const pt = utf8('aead key alongside exporter')
    const aad = utf8('aad')
    const recovered = sealOpenRoundTrip(
      CKZ_HPKE_AEAD_128_GCM,
      enc1.keyHandle!,
      dec1.keyHandle!,
      enc1.baseNonce!,
      aad,
      pt
    )
    expect(new TextDecoder().decode(recovered)).toBe('aead key alongside exporter')
  })

  // ── Full hybrid-KEM cross-product — same matrix as hpkeService.test.ts's
  // hybrid suite (3 hybrid KEMs × 3 KDFs × 3 AEADs × 2 modes = 54 cases),
  // now proving it through the single-call CKM_HPKE binding instead of the
  // composed-from-primitives path.
  const HYBRID_KEMS = [
    { name: 'MLKEM768-X25519', kemId: CKP_HPKE_KEM_MLKEM768_X25519 },
    { name: 'MLKEM768-P256', kemId: CKP_HPKE_KEM_MLKEM768_P256 },
    { name: 'MLKEM1024-P384', kemId: CKP_HPKE_KEM_MLKEM1024_P384 },
  ] as const
  const KDFS = [
    { name: 'HKDF-SHA256', kdfId: CKD_HPKE_HKDF_SHA256 },
    { name: 'HKDF-SHA384', kdfId: CKD_HPKE_HKDF_SHA384 },
    { name: 'HKDF-SHA512', kdfId: CKD_HPKE_HKDF_SHA512 },
  ] as const
  const AEADS = [
    { name: 'AES-128-GCM', aeadId: CKZ_HPKE_AEAD_128_GCM },
    { name: 'AES-256-GCM', aeadId: CKZ_HPKE_AEAD_256_GCM },
    { name: 'ChaCha20-Poly1305', aeadId: CKZ_HPKE_AEAD_CHACHA20POLY1305 },
  ] as const
  const MODES = [
    { name: 'Base', mode: CKZ_HPKE_MODE_BASE },
    { name: 'PSK', mode: CKZ_HPKE_MODE_PSK },
  ] as const

  const hybridCases = HYBRID_KEMS.flatMap((kem) =>
    KDFS.flatMap((kdf) =>
      AEADS.flatMap((aead) => MODES.map((m) => ({ ...kem, ...kdf, ...aead, ...m })))
    )
  )

  describe.each(hybridCases)(
    'hybrid cross-product — $name / $kdfId.name / $aeadId.name / mode $mode',
    (c) => {
      it(`${c.name} + ${KDFS.find((k) => k.kdfId === c.kdfId)!.name} + ${AEADS.find((a) => a.aeadId === c.aeadId)!.name} + ${MODES.find((m) => m.mode === c.mode)!.name}: single-call CKM_HPKE round-trips`, () => {
        const recipient = hsm_generateHpkeKeyPair(M, hSession, c.kemId)
        expect(recipient.pubHandle).toBeGreaterThan(0)
        expect(recipient.privHandle).toBeGreaterThan(0)

        const info = utf8('ckm_hpke hybrid cross-product test')
        let hPsk: number | undefined
        let pskId: Uint8Array | undefined
        if (c.mode === CKZ_HPKE_MODE_PSK) {
          const pskBytes = crypto.getRandomValues(new Uint8Array(32))
          hPsk = hsm_importGenericSecret(M, hSession, pskBytes)
          pskId = utf8('cross-product-psk-id')
        }

        const enc1 = hsm_hpkeEncapsulate(M, hSession, recipient.pubHandle, {
          kemId: c.kemId,
          kdfId: c.kdfId,
          aeadId: c.aeadId,
          mode: c.mode,
          info,
          hPsk,
          pskId,
        })
        expect(enc1.enc.length).toBeGreaterThan(0)
        expect(enc1.keyHandle).not.toBeNull()
        expect(enc1.baseNonce).not.toBeNull()

        const dec1 = hsm_hpkeDecapsulate(M, hSession, recipient.privHandle, enc1.enc, {
          kemId: c.kemId,
          kdfId: c.kdfId,
          aeadId: c.aeadId,
          mode: c.mode,
          info,
          hPsk,
          pskId,
        })
        expect(dec1.keyHandle).not.toBeNull()
        expect(hex(dec1.baseNonce!)).toBe(hex(enc1.baseNonce!))

        const pt = utf8('CKM_HPKE hybrid cross-product plaintext')
        const aad = utf8('hybrid-cross-product-aad')
        const recovered = sealOpenRoundTrip(
          c.aeadId,
          enc1.keyHandle!,
          dec1.keyHandle!,
          enc1.baseNonce!,
          aad,
          pt
        )
        expect(new TextDecoder().decode(recovered)).toBe('CKM_HPKE hybrid cross-product plaintext')
      })
    }
  )
})
