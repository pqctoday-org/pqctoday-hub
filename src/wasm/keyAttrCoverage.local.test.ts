// SPDX-License-Identifier: GPL-3.0-only
// WS-3 acceptance check: hsm_getKeyAttributes must populate every attribute
// both real engines return for a given class, matching the gap report's §1.2
// live-probe table exactly — not a re-guess, the same ground truth that
// found the original 11-attribute gap. Generates one key of each family on
// BOTH engines and asserts the modal's data model (KeyAttributeSet), not the
// rendered DOM — HsmKeyAttrDisplay's own browser check covers rendering.
//
// Venue: *.local.test.ts, real-wasm venue, both engines — same C++ Node-load
// pattern as mechanismNames.local.test.ts.
import { describe, it, expect } from 'vitest'
import { createRequire } from 'node:module'
import path from 'node:path'
import * as S from './softhsm'
import type { SoftHSMModule } from '@pqctoday/softhsm-wasm'

const require_ = createRequire(import.meta.url)

const loadCppEngineInNode = async (): Promise<SoftHSMModule> => {
  const gluePath = require_.resolve('@pqctoday/softhsm-wasm/wasm/softhsm.js')
  const wasmPath = path.join(path.dirname(gluePath), 'softhsm.wasm')
  const createSoftHSMModule = require_(gluePath) as (
    arg?: Record<string, unknown>
  ) => Promise<SoftHSMModule>
  return createSoftHSMModule({
    locateFile: (p: string) => (p.endsWith('.wasm') ? wasmPath : p),
  })
}

describe.each([
  ['rust', () => S.getSoftHSMRustModule()],
  ['cpp', () => loadCppEngineInNode()],
])('WS-3 attribute coverage (%s engine)', (name, getModule) => {
  const setup = async () => {
    const M = (await getModule()) as SoftHSMModule
    S.hsm_initialize(M)
    const slot = S.hsm_getFirstFreeSlot(M)
    const slotId = S.hsm_initToken(M, slot, '12345678', 'Coverage')
    const hSession = S.hsm_openUserSession(M, slotId, '12345678', 'user1234')
    return { M, hSession }
  }

  // Fields every object carries per §1.2, both engines, all classes.
  const assertStorageObjectFields = (attrs: S.KeyAttributeSet) => {
    expect(attrs.ckUniqueId).not.toBeNull()
    expect(attrs.ckModifiable).not.toBeNull()
    expect(attrs.ckCopyable).not.toBeNull()
    expect(attrs.ckDestroyable).not.toBeNull()
  }

  it('EC key pair — CKA_EC_PARAMS/CKA_EC_POINT/CKA_TRUSTED/CKA_PUBLIC_KEY_INFO on pub', async () => {
    const { M, hSession } = await setup()
    const { pubHandle, privHandle } = S.hsm_generateECKeyPair(M, hSession, 'P-256')
    const pub = S.hsm_getKeyAttributes(M, hSession, pubHandle)
    const priv = S.hsm_getKeyAttributes(M, hSession, privHandle)

    assertStorageObjectFields(pub)
    assertStorageObjectFields(priv)

    expect(pub.ckEcParams).not.toBeNull()
    expect(priv.ckEcParams).not.toBeNull()
    expect(pub.ckEcPoint).not.toBeNull()
    expect(pub.ckTrusted).not.toBeNull() // present (public key)
    expect(priv.ckWrapWithTrusted).not.toBeNull() // present (private key)
    expect(pub.ckPublicKeyInfo).not.toBeNull() // mandatory on public keys, both engines

    S.hsm_finalize(M, hSession)
  }, 30000)

  it('RSA key pair — CKA_MODULUS_BITS/CKA_MODULUS/CKA_PUBLIC_EXPONENT', async () => {
    const { M, hSession } = await setup()
    const { pubHandle, privHandle } = S.hsm_generateRSAKeyPair(M, hSession, 2048)
    const pub = S.hsm_getKeyAttributes(M, hSession, pubHandle)
    const priv = S.hsm_getKeyAttributes(M, hSession, privHandle)

    expect(pub.ckModulusBits).toBe(2048)
    expect(pub.ckModulus).not.toBeNull()
    expect(pub.ckModulus?.length).toBe(256) // 2048 bits / 8
    expect(pub.ckPublicExponent).not.toBeNull()
    expect(priv.ckModulus).not.toBeNull() // private carries CKA_MODULUS too
    expect(pub.ckPublicKeyInfo).not.toBeNull()

    S.hsm_finalize(M, hSession)
  }, 30000)

  it('AES key — CKA_VALUE_LEN still the size source, storage-object fields present', async () => {
    const { M, hSession } = await setup()
    const handle = S.hsm_generateAESKey(M, hSession, 256)
    const attrs = S.hsm_getKeyAttributes(M, hSession, handle)

    assertStorageObjectFields(attrs)
    expect(attrs.ckValueLen).toBe(32)
    // Symmetric keys have no EC/RSA material.
    expect(attrs.ckEcParams).toBeNull()
    expect(attrs.ckModulus).toBeNull()

    S.hsm_finalize(M, hSession)
  }, 30000)

  it('ML-KEM key pair — PQC parameter set + SPKI present on both halves', async () => {
    const { M, hSession } = await setup()
    const { pubHandle, privHandle } = S.hsm_generateMLKEMKeyPair(M, hSession, 768)
    const pub = S.hsm_getKeyAttributes(M, hSession, pubHandle)
    const priv = S.hsm_getKeyAttributes(M, hSession, privHandle)

    expect(pub.ckParameterSet).not.toBeNull()
    expect(pub.ckPublicKeyInfo).not.toBeNull()
    // §1.2: ML-KEM is the one family where Rust DOES carry CKA_PUBLIC_KEY_INFO
    // on the private half too (unlike EC/RSA) — real, engine-specific behavior.
    expect(priv.ckPublicKeyInfo).not.toBeNull()

    S.hsm_finalize(M, hSession)
  }, 30000)

  if (name === 'rust') {
    it('Rust engine: CKA_PUBLIC_KEY_INFO is genuinely absent on EC/RSA private keys (§1.2)', async () => {
      const { M, hSession } = await setup()
      const { privHandle: ecPriv } = S.hsm_generateECKeyPair(M, hSession, 'P-256')
      const { privHandle: rsaPriv } = S.hsm_generateRSAKeyPair(M, hSession, 2048)

      const ecAttrs = S.hsm_getKeyAttributes(M, hSession, ecPriv)
      const rsaAttrs = S.hsm_getKeyAttributes(M, hSession, rsaPriv)

      // This is the real, spec-legal divergence tri-state exists for (G-5):
      // Rust doesn't materialize SPKI on EC/RSA private keys; the spec makes
      // it SHOULD/MAY there, not MUST — 'absent' is the honest classification,
      // not a bug to paper over.
      expect(ecAttrs.ckPublicKeyInfo).toBeNull()
      expect(ecAttrs.unavailable.ckPublicKeyInfo).toBe('absent')
      expect(rsaAttrs.ckPublicKeyInfo).toBeNull()
      expect(rsaAttrs.unavailable.ckPublicKeyInfo).toBe('absent')

      S.hsm_finalize(M, hSession)
    }, 30000)
  }

  if (name === 'cpp') {
    it('C++ engine: CKA_PUBLIC_KEY_INFO IS present on EC/RSA private keys (§1.2)', async () => {
      const { M, hSession } = await setup()
      const { privHandle: ecPriv } = S.hsm_generateECKeyPair(M, hSession, 'P-256')
      const { privHandle: rsaPriv } = S.hsm_generateRSAKeyPair(M, hSession, 2048)

      const ecAttrs = S.hsm_getKeyAttributes(M, hSession, ecPriv)
      const rsaAttrs = S.hsm_getKeyAttributes(M, hSession, rsaPriv)

      expect(ecAttrs.ckPublicKeyInfo).not.toBeNull()
      expect(rsaAttrs.ckPublicKeyInfo).not.toBeNull()

      S.hsm_finalize(M, hSession)
    }, 30000)
  }
})
