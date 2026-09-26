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
  // process.cwd()-relative, NOT require.resolve('@pqctoday/softhsm-wasm/...'):
  // that file: package resolves through node_modules, and in a worktree whose
  // node_modules is itself symlinked to a SIBLING worktree (a real, supported
  // setup), a relative symlink one level inside that shared node_modules
  // resolves relative to where IT lives, silently landing on the sibling
  // worktree's src/vendor/softhsm-wasm instead of this one's -- probing the
  // wrong C++ binary with no error (found 2026-09-25, P3 combined rebuild).
  const gluePath = path.resolve(process.cwd(), 'src/vendor/softhsm-wasm/wasm/softhsm.js')
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
])('WS-3 attribute coverage (%s engine)', (_engineName, getModule) => {
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

  // RE-PINNED 2026-09-25. This used to be two divergent cases: the C++ engine
  // returned CKA_PUBLIC_KEY_INFO on EC/RSA private keys and the Rust engine did
  // not, and the Rust half asserted `null` + `unavailable === 'absent'` as the
  // honest classification of a spec-legal difference (PKCS#11 v3.2 §4.10 makes
  // it SHOULD, not MUST, on a private key).
  //
  // The divergence is gone, and it closed on purpose. pqctoday-hsm
  // db810542 (2026-09-07), "fix(rust): ... mirror SPKI to private keys (P1)",
  // implements §4.10's SHOULD ("private keys of any type SHOULD store
  // sufficient information to retrieve the public key information", restated for
  // RSA in §6.1.3) in the Rust engine; it reached the hub in the vendored-bundle
  // rebuilds from 2026-09-13 onward. The old expectation went red then and has
  // been red since.
  //
  // Evidence the new behaviour is correct rather than a regression that happens
  // to be non-null — probed against this worktree's bundles on 2026-09-25:
  //   EC P-256 private CKA_PUBLIC_KEY_INFO = 3059 3013 06072a8648ce3d0201
  //     06082a8648ce3d030107 034200 04... — a well-formed ecPublicKey/prime256v1
  //     SubjectPublicKeyInfo, 91 bytes, BYTE-IDENTICAL to the public half's.
  //   RSA-2048 private CKA_PUBLIC_KEY_INFO = 294 bytes, rsaEncryption SPKI,
  //     again byte-identical to the public half's.
  // So the attribute carries the key's real public half, which is the only thing
  // §4.10 asks for. Asserting equality with the public half is what this pins
  // now — a stronger statement than "not null", and one a garbage value fails.
  it('CKA_PUBLIC_KEY_INFO on an EC/RSA PRIVATE key is the public half, byte-for-byte (§4.10)', async () => {
    const { M, hSession } = await setup()
    const ec = S.hsm_generateECKeyPair(M, hSession, 'P-256')
    const rsa = S.hsm_generateRSAKeyPair(M, hSession, 2048)

    const ecPub = S.hsm_getKeyAttributes(M, hSession, ec.pubHandle)
    const ecPriv = S.hsm_getKeyAttributes(M, hSession, ec.privHandle)
    const rsaPub = S.hsm_getKeyAttributes(M, hSession, rsa.pubHandle)
    const rsaPriv = S.hsm_getKeyAttributes(M, hSession, rsa.privHandle)

    const hex = (b: Uint8Array | null | undefined) =>
      b == null ? null : Buffer.from(b).toString('hex')

    expect(ecPriv.ckPublicKeyInfo).not.toBeNull()
    expect(hex(ecPriv.ckPublicKeyInfo)).toBe(hex(ecPub.ckPublicKeyInfo))
    // ecPublicKey + prime256v1 AlgorithmIdentifier, then an uncompressed point.
    expect(hex(ecPriv.ckPublicKeyInfo)).toMatch(
      /^3059301306072a8648ce3d020106082a8648ce3d0301070342000[45]/
    )

    expect(rsaPriv.ckPublicKeyInfo).not.toBeNull()
    expect(hex(rsaPriv.ckPublicKeyInfo)).toBe(hex(rsaPub.ckPublicKeyInfo))
    // rsaEncryption AlgorithmIdentifier with the NULL parameters field.
    expect(hex(rsaPriv.ckPublicKeyInfo)).toMatch(/^3082012230[0-9a-f]{2}06092a864886f70d0101010500/)

    // Present means present: the tri-state must not also be reporting it away.
    expect(ecPriv.unavailable.ckPublicKeyInfo).toBeUndefined()
    expect(rsaPriv.unavailable.ckPublicKeyInfo).toBeUndefined()

    S.hsm_finalize(M, hSession)
  }, 30000)
})
