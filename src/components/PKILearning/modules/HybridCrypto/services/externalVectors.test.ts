// SPDX-License-Identifier: GPL-3.0-only
// Cross-implementation regression guard.
//
// Every other test in this module signs with our code and verifies with our
// code. That symmetry is exactly why the 2026-08-17 traditional-hash bug (F17)
// survived a full green suite: signer, verifier and the KMIP cross-engine test
// all shared one misreading of draft §6, so every round-trip agreed while the
// output was non-interoperable with the rest of the world.
//
// These vectors were produced by OTHER implementations. They are the only tests
// here that can fail when our assumptions are wrong but self-consistent.
import { describe, it, expect } from 'vitest'
import {
  EXTERNAL_COMPOSITE_VECTORS,
  DRAFT_RAW_VECTORS,
  DRAFT_VECTOR_MESSAGE,
} from '../data/externalVectors'
import { verifyCompositeCert, findCompositeProfile } from './compositeVerifier'
import { buildCompositeMessageRepresentative } from './certBuilder'
import { ml_dsa44, ml_dsa65, ml_dsa87 } from '@noble/post-quantum/ml-dsa.js'
import { p256, p384 } from '@noble/curves/nist.js'
import { sha256, sha384 } from '@noble/hashes/sha2.js'

/**
 * Per-vector parameters straight from draft §6. Kept local to the test rather
 * than read from our profile table so this file is an INDEPENDENT statement of
 * the spec — if the profile table regresses, these still describe the truth.
 */
const VECTOR_PARAMS: Record<
  string,
  {
    mldsaPk: number
    mldsaSig: number
    label: string
    ph: 'SHA-256' | 'SHA-512'
    trad: 'SHA-256' | 'SHA-384'
  }
> = {
  'id-MLDSA44-ECDSA-P256-SHA256': {
    mldsaPk: 1312,
    mldsaSig: 2420,
    label: 'COMPSIG-MLDSA44-ECDSA-P256-SHA256',
    ph: 'SHA-256',
    trad: 'SHA-256',
  },
  'id-MLDSA65-ECDSA-P256-SHA512': {
    mldsaPk: 1952,
    mldsaSig: 3309,
    label: 'COMPSIG-MLDSA65-ECDSA-P256-SHA512',
    ph: 'SHA-512',
    trad: 'SHA-256',
  },
  'id-MLDSA65-ECDSA-P384-SHA512': {
    mldsaPk: 1952,
    mldsaSig: 3309,
    label: 'COMPSIG-MLDSA65-ECDSA-P384-SHA512',
    ph: 'SHA-512',
    trad: 'SHA-384',
  },
  'id-MLDSA87-ECDSA-P384-SHA512': {
    mldsaPk: 2592,
    mldsaSig: 4627,
    label: 'COMPSIG-MLDSA87-ECDSA-P384-SHA512',
    ph: 'SHA-512',
    trad: 'SHA-384',
  },
}

const decode = (b64: string) => Uint8Array.from(Buffer.from(b64, 'base64'))

describe('external composite vectors (cross-implementation)', () => {
  it('the fixture set is present and covers more than one producer', () => {
    expect(EXTERNAL_COMPOSITE_VECTORS.length).toBeGreaterThanOrEqual(4)
    const producers = new Set(EXTERNAL_COMPOSITE_VECTORS.map((v) => v.producer))
    // A single-producer set could still be uniformly wrong; require ≥2.
    expect(producers.size).toBeGreaterThanOrEqual(2)
  })

  for (const v of EXTERNAL_COMPOSITE_VECTORS) {
    it(`${v.producer} — ${v.oid} (${v.expect})`, async () => {
      const der = decode(v.derBase64)
      const r = await verifyCompositeCert(der)

      expect(findCompositeProfile(v.oid), `no profile registered for ${v.oid}`).toBeDefined()
      expect(r.recognized, `${v.id}: OID not recognised as composite`).toBe(true)

      // The ML-DSA half must verify for EVERY vector. It only can if we agree
      // with the producer on the composite OID, the ML-DSA-first ordering, the
      // exact split offsets, the raw-concatenation encoding, the M' prefix and
      // label, the pre-hash, AND the FIPS 204 context binding.
      expect(r.mldsa?.verified, `${v.id}: ML-DSA half failed — ${r.mldsa?.detail ?? ''}`).toBe(true)

      if (v.expect === 'valid') {
        // The classical half is what F17 broke. This is the assertion that
        // would have caught it on day one.
        expect(
          r.classical?.verified,
          `${v.id}: classical half failed (${r.classical?.algorithm}) — ` +
            `check the profile's tradHash against draft §6 "Traditional Signature Algorithm". ` +
            `The SHAxxx in a profile NAME is the pre-hash PH, not the traditional hash.`
        ).toBe(true)
        expect(r.valid, `${v.id}: overall verdict`).toBe(true)
      } else {
        // RSA-PSS: not implementable in the @noble stack. Must report
        // "not checkable" (null) and fail closed — never silently pass.
        expect(r.classical?.verified, `${v.id}: RSA-PSS must be null, not a pass`).toBeNull()
        expect(r.valid, `${v.id}: unverifiable classical half must not yield valid`).toBe(false)
      }
    })
  }

  it('tampering any external vector is rejected (guard is real, not vacuous)', async () => {
    for (const v of EXTERNAL_COMPOSITE_VECTORS) {
      const der = decode(v.derBase64)
      const bad = new Uint8Array(der)
      bad[bad.length - 4] ^= 0xff // inside the classical signature tail
      const r = await verifyCompositeCert(bad)
      expect(r.valid, `${v.id}: tampered vector must never be valid`).toBe(false)
    }
  })
})

describe('draft NORMATIVE raw-signature vectors (no certificate encoding)', () => {
  it('covers the profiles our code implements', () => {
    expect(DRAFT_RAW_VECTORS.length).toBeGreaterThanOrEqual(4)
    expect(DRAFT_RAW_VECTORS.filter((v) => v.expect === 'verifies').length).toBeGreaterThanOrEqual(
      3
    )
  })

  for (const v of DRAFT_RAW_VECTORS) {
    it(`${v.tcId} (${v.expect})`, async () => {
      const P = VECTOR_PARAMS[v.tcId]
      const pk = Uint8Array.from(Buffer.from(v.pkBase64, 'base64'))
      const sig = Uint8Array.from(Buffer.from(v.sigBase64, 'base64'))
      const M = new TextEncoder().encode(DRAFT_VECTOR_MESSAGE)

      // M' per §2.2, built from the spec's parameters for THIS vector.
      const profile = {
        signatureLabel: P.label,
        preHash: P.ph,
      } as Parameters<typeof buildCompositeMessageRepresentative>[0]
      const mprime = await buildCompositeMessageRepresentative(profile, M, new Uint8Array(0))

      const impl = P.mldsaSig === 2420 ? ml_dsa44 : P.mldsaSig === 3309 ? ml_dsa65 : ml_dsa87
      const ctx = new TextEncoder().encode(P.label)
      expect(
        impl.verify(sig.slice(0, P.mldsaSig), mprime, pk.slice(0, P.mldsaPk), { context: ctx }),
        `${v.tcId}: ML-DSA half must verify for every vector`
      ).toBe(true)

      const curve = P.trad === 'SHA-384' ? p384 : p256
      const digest = P.trad === 'SHA-384' ? sha384(mprime) : sha256(mprime)
      const ok = (() => {
        try {
          return curve.verify(sig.slice(P.mldsaSig), digest, pk.slice(P.mldsaPk), {
            prehash: false,
            format: 'der',
            // X.509 does not require low-S; @noble enforces it by default.
            lowS: false,
          })
        } catch {
          return false
        }
      })()

      // Pins BOTH bugs: the traditional-hash choice (F17) and low-S
      // over-enforcement. Either regression fails this assertion.
      expect(
        ok,
        `${v.tcId}: classical half failed with ${P.trad}. The spec's OWN vector ` +
          `disagrees with us — check the traditional hash, and check that low-S ` +
          `enforcement is disabled (X.509 permits high-S).`
      ).toBe(true)
    })
  }
})
