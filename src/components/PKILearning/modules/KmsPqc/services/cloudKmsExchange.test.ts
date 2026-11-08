// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Cloud KMS exchange simulation: the parts that need no HSM.
 *
 *  - The independent RFC 9180 reference used by the engine tests is itself
 *    checked here against the published draft-ietf-hpke-pq vectors, so a
 *    mismatch later means the engine is wrong, not the reference.
 *  - The suite table matches the IANA code points and the FIPS 203 sizes that
 *    the Hub's own HPKE service carries.
 *  - The engine sequence rules (pure ML-KEM is the same in v3.2 and v3.3).
 */
import { describe, it, expect } from 'vitest'
import hpkePqFile from '@/data/acvp/hpke-pq-04-test-vectors.json'
import { HPKE_AEAD, HPKE_KDF, HPKE_KEM, kemInfo } from '../../HybridCrypto/services/hpkeService'
import {
  CLASSICAL_PROFILES,
  HPKE_IMPORT_SUITES,
  effectiveEngine,
  hexPreview,
  hpkeEngineNote,
  suiteById,
  X_WING_V33_SENTENCE,
} from './cloudKmsExchange'
import { ENGINES } from '../data/cloudKmsExchangeData'
import {
  aeadSealReference,
  hpkeKeyScheduleReference,
  rsaAesKeyWrapReference,
} from './cloudKmsExchange.fixtures'

const unhex = (s: string): Uint8Array =>
  Uint8Array.from(s.match(/../g) ?? [], (x) => parseInt(x, 16))
const hex = (b: Uint8Array): string =>
  Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('')

type PqVector = (typeof hpkePqFile.vectors)[number]
const HKDF_BASE_VECTORS = hpkePqFile.vectors.filter(
  (v: PqVector) => v.mode === 0 && [1, 2, 3].includes(v.kdf_id)
)

describe('independent RFC 9180 reference (checked against the published vectors)', () => {
  it('has published base-mode HKDF vectors to check against, including the three Google KEMs', () => {
    const kems = new Set(HKDF_BASE_VECTORS.map((v: PqVector) => v.kem_id))
    expect(kems.has(HPKE_KEM.MLKEM768_X25519)).toBe(true)
    expect(kems.has(HPKE_KEM.MLKEM768)).toBe(true)
    expect(kems.has(HPKE_KEM.MLKEM1024)).toBe(true)
  })

  it.each(
    HKDF_BASE_VECTORS.map(
      (v: PqVector) =>
        [`kem 0x${v.kem_id.toString(16)} kdf ${v.kdf_id} aead ${v.aead_id}`, v] as const
    )
  )('reproduces key, base_nonce and the first published ciphertext: %s', (_name, v) => {
    const ks = hpkeKeyScheduleReference({
      kemId: v.kem_id,
      kdfId: v.kdf_id,
      aeadId: v.aead_id,
      sharedSecret: unhex(v.shared_secret),
      info: unhex(v.info),
    })
    expect(hex(ks.key)).toBe(v.key.toLowerCase())
    expect(hex(ks.baseNonce)).toBe(v.base_nonce.toLowerCase())
    const first = v.encryptions[0]
    const ct = aeadSealReference(
      v.aead_id,
      ks.key,
      ks.baseNonce,
      0,
      unhex(first.aad),
      unhex(first.pt)
    )
    expect(hex(ct)).toBe(first.ct.toLowerCase())
  })

  it('is sensitive to its input: a flipped shared-secret bit changes the key', () => {
    const v = HKDF_BASE_VECTORS[0]
    const ss = unhex(v.shared_secret)
    ss[0] ^= 1
    const ks = hpkeKeyScheduleReference({
      kemId: v.kem_id,
      kdfId: v.kdf_id,
      aeadId: v.aead_id,
      sharedSecret: ss,
      info: unhex(v.info),
    })
    expect(hex(ks.key)).not.toBe(v.key.toLowerCase())
  })
})

describe('HPKE import suites', () => {
  it('uses the IANA code points, HKDF-SHA256 and AES-256-GCM', () => {
    expect(suiteById('xwing').kemId).toBe(0x647a)
    expect(suiteById('mlkem768').kemId).toBe(0x0041)
    expect(suiteById('mlkem1024').kemId).toBe(0x0042)
    for (const s of HPKE_IMPORT_SUITES) {
      expect(s.kdfId).toBe(HPKE_KDF.HKDF_SHA256)
      expect(s.aeadId).toBe(HPKE_AEAD.AES_256_GCM)
    }
  })

  it('carries the provider enum names for the three suites', () => {
    expect(HPKE_IMPORT_SUITES.map((s) => s.apiName)).toEqual([
      'HPKE_KEM_XWING_HKDF_SHA256_AES_256_GCM',
      'HPKE_KEM_ML_KEM_768_HKDF_SHA256_AES_256_GCM',
      'HPKE_KEM_ML_KEM_1024_HKDF_SHA256_AES_256_GCM',
    ])
  })

  it('takes sizes from the Hub HPKE service, which follows FIPS 203 (ML-KEM-768: ek 1184 B, ciphertext 1088 B)', () => {
    const ml768 = kemInfo(suiteById('mlkem768').kemId)
    expect(ml768.Npk).toBe(1184)
    expect(ml768.Nenc).toBe(1088)
    const ml1024 = kemInfo(suiteById('mlkem1024').kemId)
    expect(ml1024.Npk).toBe(1568)
    expect(ml1024.Nenc).toBe(1568)
    // X-Wing adds a 32-byte X25519 point to each.
    const xwing = kemInfo(suiteById('xwing').kemId)
    expect(xwing.Npk).toBe(1184 + 32)
    expect(xwing.Nenc).toBe(1088 + 32)
  })
})

describe('engine sequences', () => {
  it('pure ML-KEM runs the v3.2 sequence under the v3.3 draft and says so', () => {
    expect(effectiveEngine('v33', suiteById('mlkem768'))).toBe('v32')
    expect(effectiveEngine('v33', suiteById('mlkem1024'))).toBe('v32')
    expect(hpkeEngineNote('v33', suiteById('mlkem768'))).toMatch(/same CKM_ML_KEM mechanism/)
    expect(hpkeEngineNote('v32', suiteById('xwing'))).toBeUndefined()
    expect(hpkeEngineNote('candidate', suiteById('xwing'))).toBeUndefined()
  })

  it('X-Wing keeps the v3.3 composite sequence, and the other engines are unchanged', () => {
    expect(effectiveEngine('v33', suiteById('xwing'))).toBe('v33')
    expect(hpkeEngineNote('v33', suiteById('xwing'))).toBe(X_WING_V33_SENTENCE)
  })
})

describe('the X-Wing sentence on the v3.3 path', () => {
  it('is one sentence scoped to X-Wing, the same in the run note and in the engine text', () => {
    expect(X_WING_V33_SENTENCE).toBe(
      'In this engine, an X-Wing message sealed with the v3.2 sequence opens on the v3.3 draft path; the interoperability check shows this.'
    )
    expect(ENGINES.find((e) => e.id === 'v33')!.standing).toContain(X_WING_V33_SENTENCE)
    expect(X_WING_V33_SENTENCE).not.toMatch(/match/i)
  })
})

describe('classical profiles', () => {
  it('models each provider with RSA-3072 and a 256-bit temporary AES key', () => {
    for (const p of Object.values(CLASSICAL_PROFILES)) {
      expect(p.rsaBits).toBe(3072)
      expect(p.aesKeyBits).toBe(256)
    }
  })

  it('differs only in the OAEP hash: SHA-256 for AWS and Google, SHA-1 for Azure', () => {
    expect(CLASSICAL_PROFILES.aws.oaepHash).toBe('sha256')
    expect(CLASSICAL_PROFILES.gcp.oaepHash).toBe('sha256')
    expect(CLASSICAL_PROFILES.azure.oaepHash).toBe('sha1')
  })
})

describe('reference CKM_RSA_AES_KEY_WRAP blob layout', () => {
  it('is the RSA modulus size plus an AES-KWP part sized from the wrapped PKCS#8 key (RFC 5649: padded length plus an 8-byte header)', async () => {
    // Throwaway keys made by Node, only to check the layout of the reference.
    const { generateKeyPairSync } = await import('node:crypto')
    const rsa = generateKeyPairSync('rsa', { modulusLength: 2048 })
    const der = Uint8Array.from(rsa.publicKey.export({ format: 'der', type: 'pkcs1' }))
    const ec = generateKeyPairSync('ec', { namedCurve: 'P-256' })
    const pkcs8 = Uint8Array.from(ec.privateKey.export({ format: 'der', type: 'pkcs8' }))
    const blob = rsaAesKeyWrapReference(der, pkcs8, 'sha256')
    const kwpBytes = 8 * (Math.ceil(pkcs8.length / 8) + 1)
    expect(blob.length).toBe(256 + kwpBytes)
  })
})

describe('hexPreview', () => {
  it('shortens long values and leaves short ones alone', () => {
    expect(hexPreview(new Uint8Array([1, 2, 3]), 16)).toBe('010203')
    expect(hexPreview(new Uint8Array(40).fill(255), 4)).toBe('ffffffff…')
  })
})
