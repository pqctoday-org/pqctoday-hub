// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, beforeAll } from 'vitest'
import { ml_dsa65 } from '@noble/post-quantum/ml-dsa.js'
import { p256 } from '@noble/curves/nist.js'
import { sha256 } from '@noble/hashes/sha2.js'
import {
  buildCompositeCertDraft19,
  buildSelfSignedX509,
  COMPOSITE_PROFILE_MLDSA65_ECDSA_P256_SHA512 as PROFILE,
  ML_DSA_65_OID_STR,
} from './certBuilder'
import { verifyCompositeCert, findCompositeProfile } from './compositeVerifier'

const MLDSA_SIG_BYTES = 3309
const MLDSA_PUB_BYTES = 1952

let mldsaKp: { publicKey: Uint8Array; secretKey: Uint8Array }
let ecPriv: Uint8Array
let ecPub: Uint8Array

/** Mint a composite cert; `ctx` false ⇒ sign ML-DSA WITHOUT the FIPS 204 context. */
async function mintComposite(opts: { withCtx?: boolean } = {}): Promise<Uint8Array> {
  const withCtx = opts.withCtx !== false
  return buildCompositeCertDraft19(
    PROFILE,
    mldsaKp.publicKey,
    ecPub,
    async (mprime, mldsaCtx) =>
      withCtx
        ? ml_dsa65.sign(mprime, mldsaKp.secretKey, { context: mldsaCtx })
        : ml_dsa65.sign(mprime, mldsaKp.secretKey),
    // draft §6: this profile's Traditional Signature Algorithm is
    // ecdsa-with-SHA256 — the SHA512 in the profile NAME is the pre-hash PH.
    async (mprime) => p256.sign(sha256(mprime), ecPriv, { prehash: false, format: 'der' }),
    '/CN=Composite Verify Test/O=PQCToday'
  )
}

/** Flip a byte at `offset` counted from the END of the DER. */
function tamper(der: Uint8Array, offsetFromEnd: number): Uint8Array {
  const copy = new Uint8Array(der)
  copy[copy.length - offsetFromEnd] ^= 0xff
  return copy
}

beforeAll(() => {
  mldsaKp = ml_dsa65.keygen(new Uint8Array(32).fill(7))
  ecPriv = p256.utils.randomSecretKey()
  ecPub = p256.getPublicKey(ecPriv, false)
})

describe('findCompositeProfile', () => {
  it('resolves the MLDSA65-ECDSA-P256-SHA512 OID', () => {
    expect(findCompositeProfile('1.3.6.1.5.5.7.6.45')?.label).toBe('id-MLDSA65-ECDSA-P256-SHA512')
  })
  it('resolves the MLDSA65-ECDSA-P384-SHA512 (.46) OID, added 2026-08-18 for parity with the KMIP engine', () => {
    const profile = findCompositeProfile('1.3.6.1.5.5.7.6.46')
    expect(profile?.label).toBe('id-MLDSA65-ECDSA-P384-SHA512')
    expect(profile?.preHash).toBe('SHA-512')
    // Traditional hash tracks the P-384 curve, not the SHA512 pre-hash in
    // the profile name — same trap as .45/.49 (see certBuilder.ts).
    expect(profile?.classical).toMatchObject({ kind: 'ecdsa', curve: 'P-384', tradHash: 'SHA-384' })
  })
  it('returns undefined for a non-composite OID', () => {
    expect(findCompositeProfile(ML_DSA_65_OID_STR)).toBeUndefined()
  })
})

describe('verifyCompositeCert — valid certificate', () => {
  it('verifies BOTH components and splits at the ML-DSA fixed length', async () => {
    const r = await verifyCompositeCert(await mintComposite())

    expect(r.recognized).toBe(true)
    expect(r.profileLabel).toBe('id-MLDSA65-ECDSA-P256-SHA512')
    expect(r.valid).toBe(true)

    expect(r.mldsa?.verified).toBe(true)
    expect(r.mldsa?.bytes).toBe(MLDSA_SIG_BYTES)
    expect(r.classical?.verified).toBe(true)

    // §4.1 — key is mldsaPK || tradPK, so total = 1952 + 65 (X9.62 point)
    expect(r.publicKeyBytes).toBe(MLDSA_PUB_BYTES + 65)
    // §4.3 — signature is mldsaSig || tradSig (ECDSA DER varies 70-72 B)
    expect(r.signatureBytes).toBeGreaterThan(MLDSA_SIG_BYTES)
    expect(r.errors).toHaveLength(0)
  })
})

describe('verifyCompositeCert — negative controls', () => {
  it('REJECTS a tampered ML-DSA component', async () => {
    // Land inside the ML-DSA half: past the classical tail, well inside 3309 B.
    const der = await mintComposite()
    const r = await verifyCompositeCert(tamper(der, 1000))
    expect(r.mldsa?.verified).toBe(false)
    expect(r.valid).toBe(false)
  })

  it('REJECTS a tampered classical component', async () => {
    // Final bytes of the DER are the tail of the ECDSA Ecdsa-Sig-Value.
    const der = await mintComposite()
    const r = await verifyCompositeCert(tamper(der, 3))
    expect(r.classical?.verified).toBe(false)
    expect(r.valid).toBe(false)
  })

  it('REJECTS an ML-DSA signature made WITHOUT the FIPS 204 context', async () => {
    // This is the non-separability property (draft §9.2.3): a signature that
    // omits the composite signature label as ctx must not verify, even though
    // the key and message are otherwise correct.
    const r = await verifyCompositeCert(await mintComposite({ withCtx: false }))
    expect(r.mldsa?.verified).toBe(false)
    expect(r.valid).toBe(false)
    // the classical half is unaffected — proving the failure is ctx-specific
    expect(r.classical?.verified).toBe(true)
  })

  it('REJECTS a certificate whose components are in the WRONG ORDER', async () => {
    // Swap so the classical component leads — the superseded draft-02 layout.
    // Splitting at ML-DSA's fixed length then reads garbage, so both fail.
    const der = await mintComposite()
    const cert = await verifyCompositeCert(der)
    expect(cert.valid).toBe(true) // sanity: baseline is good

    const swapped = new Uint8Array(der)
    // Reverse the last (sigLen) bytes region crudely: flip the leading ML-DSA
    // byte and the trailing classical byte to simulate a reordered payload.
    swapped[swapped.length - 1] ^= 0xff
    swapped[swapped.length - MLDSA_SIG_BYTES] ^= 0xff
    const r = await verifyCompositeCert(swapped)
    expect(r.valid).toBe(false)
  })
})

describe('verifyCompositeCert — non-composite input', () => {
  it('reports a pure ML-DSA certificate as not composite', async () => {
    const pure = await buildSelfSignedX509(
      mldsaKp.publicKey,
      async (tbs) => ml_dsa65.sign(tbs, mldsaKp.secretKey),
      ML_DSA_65_OID_STR,
      '/CN=Pure'
    )
    const r = await verifyCompositeCert(pure)
    expect(r.recognized).toBe(false)
    expect(r.valid).toBe(false)
    expect(r.errors[0]).toContain('not a known composite profile')
  })

  it('reports unparseable input rather than throwing', async () => {
    const r = await verifyCompositeCert(new Uint8Array([1, 2, 3, 4]))
    expect(r.recognized).toBe(false)
    expect(r.valid).toBe(false)
    expect(r.errors[0]).toContain('Not a parseable X.509 certificate')
  })
})
