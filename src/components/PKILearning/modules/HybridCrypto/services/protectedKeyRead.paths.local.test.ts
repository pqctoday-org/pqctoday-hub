// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The HPKE workshop's "protected-key probe" at every place it runs, on the real
 * Rust engine and with the real handles each sequence produces: the PKCS#11 v3.3
 * draft composite KEM, pure ML-KEM, the v3.2 hybrid chain, and the single-call
 * proposal. In each, the one read the workshop attempts must come back as the
 * expected C_GetAttributeValue / CKR_ATTRIBUTE_SENSITIVE refusal (not a session
 * or handle error, which the helper would report as incomplete). A readable
 * control key must be reported as a failure.
 * Venue: *.local.test.ts (real-wasm venue).
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import * as S from '@/wasm/softhsm'
import type { SoftHSMModule } from '@pqctoday/softhsm-wasm'
import { hsm_generateCompositeKeyPair } from '@/wasm/softhsm/v33'
import {
  HPKE_AEAD,
  HPKE_KDF,
  HPKE_KEM,
  HPKE_MODE,
  compositeEncap,
  compositeKemCkp,
  hybridEncap,
  pqEncap,
  type Hctx,
} from './hpkeService'
import { requireProtectedKeyReadRefusal } from './protectedKeyRead'

const OBSERVED = 'Sample plaintext-read refusal observed'

describe('protected-key probe on each HPKE sequence (rust engine)', () => {
  let M: SoftHSMModule
  let hSession = 0
  let ctx: Hctx

  beforeAll(async () => {
    M = (await S.getSoftHSMRustModule()) as SoftHSMModule
    S.hsm_initialize(M)
    const slot = S.hsm_getFirstFreeSlot(M)
    const slotId = S.hsm_initToken(M, slot, '12345678', 'ProbePaths')
    hSession = S.hsm_openUserSession(M, slotId, '12345678', 'user1234')
    ctx = { M, hSession }
  }, 60_000)

  afterAll(() => {
    S.hsm_finalize(M, hSession)
  })

  const probe = (handle: number) =>
    requireProtectedKeyReadRefusal(() => S.hsm_extractKeyValue(M, hSession, handle))

  it.each([HPKE_KEM.MLKEM768_X25519, HPKE_KEM.MLKEM768_P256, HPKE_KEM.MLKEM1024_P384] as const)(
    'v3.3 draft sequence, KEM %s: the CKM_COMP_KEM secret refuses the read',
    (kemId) => {
      const kp = hsm_generateCompositeKeyPair(M, hSession, 'kem', compositeKemCkp(kemId)!)
      const { sharedSecretHandle } = compositeEncap(ctx, kp.pubHandle)
      expect(probe(sharedSecretHandle)).toContain(OBSERVED)
    }
  )

  it.each([
    ['ML-KEM-512', HPKE_KEM.MLKEM512, 512],
    ['ML-KEM-768', HPKE_KEM.MLKEM768, 768],
    ['ML-KEM-1024', HPKE_KEM.MLKEM1024, 1024],
  ] as const)('pure %s through the v3.2 pieces: the secret refuses the read', (_n, kemId, v) => {
    const kp = S.hsm_generateMLKEMKeyPair(M, hSession, v, true, 'probe pure')
    const ek = S.hsm_extractKeyValue(M, hSession, kp.pubHandle)
    const { sharedSecretHandle } = pqEncap(ctx, kemId, ek)
    expect(probe(sharedSecretHandle)).toContain(OBSERVED)
  })

  it.each([HPKE_KEM.MLKEM768_X25519, HPKE_KEM.MLKEM768_P256, HPKE_KEM.MLKEM1024_P384] as const)(
    'v3.2 hybrid chain, KEM %s: the combined secret refuses the read',
    (kemId) => {
      // The chain builds its secret from the same key material as the composite
      // pair, so a composite public value is the encapsulation key it needs.
      const kp = hsm_generateCompositeKeyPair(M, hSession, 'kem', compositeKemCkp(kemId)!)
      const ekH = S.hsm_extractKeyValue(M, hSession, kp.pubHandle)
      const { sharedSecretHandle } = hybridEncap(ctx, kemId, ekH)
      expect(probe(sharedSecretHandle)).toContain(OBSERVED)
    }
  )

  it('single-call proposal: the AEAD key handle refuses the read', () => {
    const kemId = HPKE_KEM.MLKEM768_X25519
    const kp = S.hsm_generateHpkeKeyPair(M, hSession, kemId)
    const result = S.hsm_hpkeEncapsulate(M, hSession, kp.pubHandle, {
      kemId,
      kdfId: HPKE_KDF.HKDF_SHA256,
      aeadId: HPKE_AEAD.AES_128_GCM,
      mode: HPKE_MODE.BASE,
      info: new TextEncoder().encode('probe'),
    })
    expect(result.keyHandle).not.toBeNull()
    expect(probe(result.keyHandle!)).toContain(OBSERVED)
  })

  it('a readable control key is reported as a failure, not as protection', () => {
    // hsm_generateAESKey(…, extractable = true): same call the engine test uses.
    const key = S.hsm_generateAESKey(M, hSession, 256, true, true, false, false, false, true)
    expect(() => probe(key)).toThrow('unexpectedly succeeded')
  })

  it('a bad handle is incomplete, not protection', () => {
    expect(() => probe(0xffffffff)).toThrow('check incomplete')
  })
})
