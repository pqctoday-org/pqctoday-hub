// SPDX-License-Identifier: GPL-3.0-only
//
// Published-vector replay of the post-quantum CKM_HPKE suites (hsm #310,
// eda62b31) through the hub's own JS/WASM binding in ./softhsm — the
// marshalling the JWE workshop uses, not the engine's Rust test path.
//
//   - draft-ietf-hpke-pq-04 Appendix A (hpkewg/hpke-pq test-vectors.json):
//     every suite whose KEM is pure ML-KEM or a PQ/T hybrid and whose KDF the
//     engine implements (HKDF-SHA256/384/512, SHAKE256).
//   - draft-irtf-cfrg-concrete-hybrid-kems (cfrg test-vectors.json): all 30.
//
// What is checked, all through the token:
//   seed import (CKA_SEED)       → public key = pkRm / encapsulation_key
//   Encap with ephemeralSeed     → enc = published enc / ciphertext
//   key schedule                 → base_nonce on both sides; exporter_secret
//                                  (extractable exporter template) on both sides
//   AEAD key (non-extractable)   → every published encryption reproduced with
//                                  C_Encrypt on the sender's key handle at
//                                  nonce = base_nonce XOR seq, and opened with
//                                  the recipient's key handle
//
// ephemeralSeed is the test-only deterministic-encapsulation hook (hsm
// remediation plan D3). Known-answer code like this file is the only place it
// may be passed; hpkeJweHsm.local.test.ts asserts no workshop code does.
// Not checked here: the published shared_secret itself (CKM_HPKE never
// releases it) and the export values (no export call in the binding) — both
// are covered by the engine's cargo tests (rust/src/hpke_pq_vectors_tests.rs).
import { describe, it, expect, beforeAll } from 'vitest'
import * as SoftHSM from './softhsm'
import type { AttrDef } from './softhsm'
import hpkePqFile from '@/data/acvp/hpke-pq-04-test-vectors.json'
import cfrgFile from '@/data/acvp/cfrg-concrete-hybrid-kems-test-vectors.json'

const hpkePq = hpkePqFile.vectors
const cfrg = cfrgFile.vectors

const {
  hsm_generateHpkeKeyPair,
  hsm_hpkeEncapsulate,
  hsm_hpkeDecapsulate,
  hsm_aesEncrypt,
  hsm_aesDecrypt,
  hsm_chacha20Poly1305Encrypt,
  hsm_chacha20Poly1305Decrypt,
  hsm_extractKeyValue,
  CKP_HPKE_KEM_ML_KEM_512,
  CKP_HPKE_KEM_ML_KEM_768,
  CKP_HPKE_KEM_ML_KEM_1024,
  CKP_HPKE_KEM_MLKEM768_P256,
  CKP_HPKE_KEM_MLKEM1024_P384,
  CKP_HPKE_KEM_MLKEM768_X25519,
  CKD_HPKE_HKDF_SHA256,
  CKD_HPKE_HKDF_SHA384,
  CKD_HPKE_HKDF_SHA512,
  CKD_HPKE_SHAKE256,
  CKZ_HPKE_AEAD_256_GCM,
  CKZ_HPKE_AEAD_CHACHA20POLY1305,
  CKZ_HPKE_MODE_BASE,
  CKA_EXTRACTABLE,
  CKA_SENSITIVE,
} = SoftHSM

const hex = (b: Uint8Array): string =>
  Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('')
const unhex = (s: string): Uint8Array =>
  Uint8Array.from(s.match(/../g) ?? [], (x) => parseInt(x, 16))

const PQ_KEMS = new Set<number>([
  CKP_HPKE_KEM_ML_KEM_512,
  CKP_HPKE_KEM_ML_KEM_768,
  CKP_HPKE_KEM_ML_KEM_1024,
  CKP_HPKE_KEM_MLKEM768_P256,
  CKP_HPKE_KEM_MLKEM1024_P384,
  CKP_HPKE_KEM_MLKEM768_X25519,
])
// Owner decision D1: SHAKE256 is the only one-stage KDF implemented;
// SHAKE128 (0x0010) and TurboSHAKE (0x0012/0x0013) are out of scope.
const ENGINE_KDFS = new Set<number>([
  CKD_HPKE_HKDF_SHA256,
  CKD_HPKE_HKDF_SHA384,
  CKD_HPKE_HKDF_SHA512,
  CKD_HPKE_SHAKE256,
])

/** RFC 9180 §5.2 ComputeNonce: base_nonce XOR I2OSP(seq, Nn). */
function seqNonce(base: Uint8Array, seq: number): Uint8Array {
  const n = Uint8Array.from(base)
  for (let i = 0; i < 4; i++) n[n.length - 1 - i] ^= (seq >>> (8 * i)) & 0xff
  return n
}

const extractableExporter: AttrDef[] = [
  { type: CKA_EXTRACTABLE, boolVal: true },
  { type: CKA_SENSITIVE, boolVal: false },
]

describe('CKM_HPKE post-quantum suites — published-vector replay through the JS/WASM binding', () => {
  let M: SoftHSM.SoftHSMModule
  let hSession: number

  beforeAll(async () => {
    M = (await SoftHSM.getSoftHSMRustModule()) as SoftHSM.SoftHSMModule
    SoftHSM.hsm_initialize(M)
    const freeSlot = SoftHSM.hsm_getFirstFreeSlot(M)
    const slotId = SoftHSM.hsm_initToken(M, freeSlot, '1234', 'HPKE-PQ vectors')
    hSession = SoftHSM.hsm_openUserSession(M, slotId, '1234', '1234')
  }, 60_000)

  const inScope = hpkePq.filter((v) => PQ_KEMS.has(v.kem_id) && ENGINE_KDFS.has(v.kdf_id))

  it('covers the 7 in-scope draft-ietf-hpke-pq-04 suites', () => {
    expect(inScope.map((v) => `${v.kem_id.toString(16)}/${v.kdf_id.toString(16)}`).sort()).toEqual([
      '40/1',
      '41/1',
      '42/2',
      '50/1',
      '51/2',
      '647a/1',
      '647a/11',
    ])
  })

  const tagged = inScope.map((v) => ({
    tag: `kem 0x${v.kem_id.toString(16)} kdf 0x${v.kdf_id.toString(16)} aead 0x${v.aead_id.toString(16)}`,
    v,
  }))
  describe.each(tagged)('hpke-pq-04 $tag', ({ v }) => {
    {
      it('seed import, Encap(ikmE), Decap, key schedule and every encryption match', () => {
        const params = {
          kemId: v.kem_id,
          kdfId: v.kdf_id,
          aeadId: v.aead_id,
          mode: CKZ_HPKE_MODE_BASE,
          info: unhex(v.info),
        }
        expect(v.mode).toBe(CKZ_HPKE_MODE_BASE)

        const r = hsm_generateHpkeKeyPair(M, hSession, v.kem_id, unhex(v.skRm))
        expect(hex(hsm_extractKeyValue(M, hSession, r.pubHandle))).toBe(v.pkRm)

        const snd = hsm_hpkeEncapsulate(
          M,
          hSession,
          r.pubHandle,
          { ...params, ephemeralSeed: unhex(v.ikmE) },
          extractableExporter
        )
        expect(hex(snd.enc)).toBe(v.enc)
        const rcp = hsm_hpkeDecapsulate(
          M,
          hSession,
          r.privHandle,
          unhex(v.enc),
          params,
          extractableExporter
        )
        for (const side of [snd, rcp]) {
          expect(hex(side.baseNonce!)).toBe(v.base_nonce)
          expect(hex(hsm_extractKeyValue(M, hSession, side.exporterHandle!))).toBe(
            v.exporter_secret
          )
        }

        v.encryptions.forEach((e, seq) => {
          const nonce = seqNonce(snd.baseNonce!, seq)
          const aad = unhex(e.aad)
          if (v.aead_id === CKZ_HPKE_AEAD_CHACHA20POLY1305) {
            const ct = hsm_chacha20Poly1305Encrypt(
              M,
              hSession,
              snd.keyHandle!,
              nonce,
              aad,
              unhex(e.pt)
            )
            expect(hex(ct)).toBe(e.ct)
            expect(
              hex(hsm_chacha20Poly1305Decrypt(M, hSession, rcp.keyHandle!, nonce, aad, ct))
            ).toBe(e.pt)
          } else {
            const { ciphertext } = hsm_aesEncrypt(
              M,
              hSession,
              snd.keyHandle!,
              unhex(e.pt),
              'gcm',
              nonce,
              aad
            )
            expect(hex(ciphertext)).toBe(e.ct)
            expect(
              hex(hsm_aesDecrypt(M, hSession, rcp.keyHandle!, ciphertext, nonce, 'gcm', aad))
            ).toBe(e.pt)
          }
        })
      })
    }
  })

  const CFRG_KEMS = [
    ['mlkem768_x25519', CKP_HPKE_KEM_MLKEM768_X25519],
    ['mlkem768_p256', CKP_HPKE_KEM_MLKEM768_P256],
    ['mlkem1024_p384', CKP_HPKE_KEM_MLKEM1024_P384],
  ] as const

  it.each(CFRG_KEMS)(
    'CFRG concrete hybrid KEM %s: seed → encapsulation key, randomness → ciphertext, both sides agree',
    (name, kemId) => {
      const cases = cfrg.filter((t) => t.kem === name)
      expect(cases).toHaveLength(10)
      const params = {
        kemId,
        kdfId: CKD_HPKE_HKDF_SHA256,
        aeadId: CKZ_HPKE_AEAD_256_GCM,
        mode: CKZ_HPKE_MODE_BASE,
      }
      for (const t of cases) {
        const r = hsm_generateHpkeKeyPair(M, hSession, kemId, unhex(t.seed))
        expect(hex(hsm_extractKeyValue(M, hSession, r.pubHandle))).toBe(t.encapsulation_key)
        const snd = hsm_hpkeEncapsulate(M, hSession, r.pubHandle, {
          ...params,
          ephemeralSeed: unhex(t.randomness),
        })
        expect(hex(snd.enc)).toBe(t.ciphertext)
        const rcp = hsm_hpkeDecapsulate(M, hSession, r.privHandle, snd.enc, params)
        expect(hex(rcp.baseNonce!)).toBe(hex(snd.baseNonce!))
        const aad = new TextEncoder().encode(name)
        const pt = new TextEncoder().encode('cfrg round trip')
        const { ciphertext } = hsm_aesEncrypt(
          M,
          hSession,
          snd.keyHandle!,
          pt,
          'gcm',
          snd.baseNonce!,
          aad
        )
        expect(
          hex(hsm_aesDecrypt(M, hSession, rcp.keyHandle!, ciphertext, rcp.baseNonce!, 'gcm', aad))
        ).toBe(hex(pt))
      }
    }
  )
})
