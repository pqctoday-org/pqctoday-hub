// SPDX-License-Identifier: GPL-3.0-only
//
// End-to-end sign-then-verify for every composite profile the workshop offers,
// using REAL keys and REAL primitives — no capturing stubs.
//
// certBuilder.test.ts covers structure (does the DER come out in the right
// shape?) with fake signers, which is the right tool for encoding questions but
// cannot catch a wrong hash, a wrong context, or a wrong key encoding. This
// file closes that: each profile generates keys, mints a certificate, and
// verifies it back through compositeVerifier.
//
// IMPORTANT — what this file can and cannot prove. A round-trip is
// self-consistent by construction: if the signer and the verifier share a
// misreading of draft §6, every test here still passes. That is exactly how F17
// survived a green suite on 2026-08-17. Cross-implementation proof lives in
// externalVectors.test.ts, and the profiles that have no such proof are listed
// in EXTERNAL_VECTOR_COVERAGE_GAPS. Read both before trusting a green run here.
import { describe, it, expect } from 'vitest'
import { AsnConvert } from '@peculiar/asn1-schema'
import { Certificate } from '@peculiar/asn1-x509'
import { ml_dsa44, ml_dsa65, ml_dsa87 } from '@noble/post-quantum/ml-dsa.js'
import { p256, p384 } from '@noble/curves/nist.js'
import { ed25519 } from '@noble/curves/ed25519.js'
import { sha256, sha384 } from '@noble/hashes/sha2.js'
import {
  buildCompositeCertDraft19,
  COMPOSITE_PROFILES_RECOMMENDED,
  COMPOSITE_PROFILE_MLDSA44_ECDSA_P256_SHA256,
  COMPOSITE_PROFILE_MLDSA44_ED25519_SHA512,
  COMPOSITE_PROFILE_MLDSA44_RSA2048_PSS_SHA256,
  COMPOSITE_PROFILE_MLDSA65_ECDSA_P256_SHA512,
  COMPOSITE_PROFILE_MLDSA65_ED25519_SHA512,
  COMPOSITE_PROFILE_MLDSA65_RSA3072_PSS_SHA512,
  COMPOSITE_PROFILE_MLDSA87_ECDSA_P384_SHA512,
  ML_DSA_44_OID_STR,
  ML_DSA_65_OID_STR,
  type CompositeProfileDraft19,
} from './certBuilder'
import { verifyCompositeCert, findCompositeProfile } from './compositeVerifier'
import { EXTERNAL_COMPOSITE_VECTORS, EXTERNAL_VECTOR_COVERAGE_GAPS } from '../data/externalVectors'

const ALL_PROFILES: CompositeProfileDraft19[] = [
  COMPOSITE_PROFILE_MLDSA44_RSA2048_PSS_SHA256,
  COMPOSITE_PROFILE_MLDSA44_ED25519_SHA512,
  COMPOSITE_PROFILE_MLDSA44_ECDSA_P256_SHA256,
  COMPOSITE_PROFILE_MLDSA65_RSA3072_PSS_SHA512,
  COMPOSITE_PROFILE_MLDSA65_ECDSA_P256_SHA512,
  COMPOSITE_PROFILE_MLDSA65_ED25519_SHA512,
  COMPOSITE_PROFILE_MLDSA87_ECDSA_P384_SHA512,
]

function mldsaFor(profile: CompositeProfileDraft19) {
  if (profile.mldsaOid === ML_DSA_44_OID_STR) return ml_dsa44
  if (profile.mldsaOid === ML_DSA_65_OID_STR) return ml_dsa65
  return ml_dsa87
}

/**
 * Pull the PKCS#1 `RSAPublicKey` out of a Web Crypto SPKI export.
 *
 * draft §4.1 puts the bare RSAPublicKey in the composite key, while
 * `exportKey('spki')` wraps it in a SubjectPublicKeyInfo — so the wrapper is
 * stripped here. Walks SEQUENCE { AlgorithmIdentifier, BIT STRING } and returns
 * the BIT STRING contents minus its "unused bits" octet.
 */
function spkiToRsaPublicKey(spki: Uint8Array): Uint8Array {
  const readTlv = (b: Uint8Array, off: number) => {
    const tag = b[off]
    let len = b[off + 1]
    let p = off + 2
    if (len & 0x80) {
      const n = len & 0x7f
      len = 0
      for (let i = 0; i < n; i++) len = (len << 8) | b[p + i]
      p += n
    }
    return { tag, value: b.subarray(p, p + len), next: p + len }
  }
  const seq = readTlv(spki, 0)
  const algId = readTlv(seq.value, 0)
  const bitStr = readTlv(seq.value, algId.next)
  expect(bitStr.tag, 'expected a BIT STRING as the second SPKI field').toBe(0x03)
  return bitStr.value.subarray(1) // drop the unused-bits octet
}

/**
 * Generate a key pair and a signer for a profile's traditional half, returning
 * the public key in the exact encoding draft §4.1 requires for that family.
 */
async function makeClassical(profile: CompositeProfileDraft19) {
  const spec = profile.classical
  switch (spec.kind) {
    case 'ecdsa': {
      const curve = spec.curve === 'P-384' ? p384 : p256
      const { secretKey } = curve.keygen()
      // `keygen()` returns a COMPRESSED point (33 / 49 B). draft §4.1 requires
      // the uncompressed X9.62 form "including the leading byte 0x04", so the
      // second argument is not optional cosmetics — a compressed key here
      // produces a certificate the draft forbids.
      const publicKey = curve.getPublicKey(secretKey, false)
      return {
        publicKey,
        sign: async (mprime: Uint8Array) => {
          const digest = spec.tradHash === 'SHA-384' ? sha384(mprime) : sha256(mprime)
          return curve.sign(digest, secretKey, { prehash: false, format: 'der', lowS: false })
        },
      }
    }
    case 'ed25519': {
      const { publicKey, secretKey } = ed25519.keygen()
      // PureEdDSA: M' is signed whole, never pre-hashed.
      return { publicKey, sign: async (mprime: Uint8Array) => ed25519.sign(mprime, secretKey) }
    }
    case 'rsa-pss': {
      const pair = (await crypto.subtle.generateKey(
        {
          name: 'RSA-PSS',
          modulusLength: spec.modulusBits,
          publicExponent: new Uint8Array([0x01, 0x00, 0x01]), // 65537
          hash: spec.tradHash,
        },
        true,
        ['sign', 'verify']
      )) as CryptoKeyPair
      const spki = new Uint8Array(await crypto.subtle.exportKey('spki', pair.publicKey))
      return {
        publicKey: spkiToRsaPublicKey(spki),
        sign: async (mprime: Uint8Array) =>
          new Uint8Array(
            await crypto.subtle.sign(
              { name: 'RSA-PSS', saltLength: spec.saltLength },
              pair.privateKey,
              mprime as BufferSource
            )
          ),
      }
    }
  }
}

/** Mint a real self-signed composite certificate for a profile. */
async function mintCert(profile: CompositeProfileDraft19) {
  const mldsa = mldsaFor(profile)
  const { publicKey: mldsaPub, secretKey: mldsaSec } = mldsa.keygen()
  const classical = await makeClassical(profile)

  const der = await buildCompositeCertDraft19(
    profile,
    mldsaPub,
    classical.publicKey,
    // The signature label MUST be forwarded as the FIPS 204 ctx (draft §9.2.3).
    async (mprime, mldsaCtx) => mldsa.sign(mprime, mldsaSec, { context: mldsaCtx }),
    classical.sign,
    '/CN=Composite Round-Trip Test/O=pqctoday'
  )
  return { der, mldsaPub, classicalPub: classical.publicKey }
}

describe('composite profiles — real sign/verify round-trip', () => {
  for (const profile of ALL_PROFILES) {
    it(`${profile.label} (${profile.compositeOid}) mints and verifies`, async () => {
      const { der, mldsaPub, classicalPub } = await mintCert(profile)
      const r = await verifyCompositeCert(der)

      expect(r.recognized, `${profile.label}: OID not registered in the verifier`).toBe(true)
      expect(r.profileLabel).toBe(profile.label)
      expect(r.errors, `${profile.label}: structural errors`).toEqual([])
      expect(r.mldsa?.verified, `${profile.label}: ML-DSA half — ${r.mldsa?.detail ?? ''}`).toBe(
        true
      )
      expect(
        r.classical?.verified,
        `${profile.label}: classical half (${r.classical?.algorithm}) — ${r.classical?.detail ?? ''}`
      ).toBe(true)
      expect(r.valid, `${profile.label}: overall verdict`).toBe(true)

      // §4.1: the composite key is exactly mldsaPK || tradPK, with no framing.
      expect(r.publicKeyBytes).toBe(mldsaPub.length + classicalPub.length)
      expect(mldsaPub.length).toBe(profile.mldsaPubKeyBytes)
    }, 20_000) // RSA-3072 keygen dominates
  }

  it.each(ALL_PROFILES)(
    'tampering the classical half of $label is rejected',
    async (profile) => {
      const { der } = await mintCert(profile)
      const bad = new Uint8Array(der)
      bad[bad.length - 4] ^= 0xff // inside the trailing classical signature
      const r = await verifyCompositeCert(bad)
      expect(r.valid, `${profile.label}: tampered cert must not verify`).toBe(false)
    },
    20_000
  )
})

describe('draft §6 profile parameters', () => {
  it('registers all six profiles §10.4 recommends', () => {
    expect(COMPOSITE_PROFILES_RECOMMENDED).toHaveLength(6)
    for (const p of COMPOSITE_PROFILES_RECOMMENDED) {
      expect(findCompositeProfile(p.compositeOid), `${p.label} not in the verifier`).toBeDefined()
    }
    // The exact OIDs §10.4 names, so a silent substitution fails here.
    expect(COMPOSITE_PROFILES_RECOMMENDED.map((p) => p.compositeOid).sort()).toEqual([
      '1.3.6.1.5.5.7.6.39',
      '1.3.6.1.5.5.7.6.40',
      '1.3.6.1.5.5.7.6.41',
      '1.3.6.1.5.5.7.6.45',
      '1.3.6.1.5.5.7.6.48',
      '1.3.6.1.5.5.7.6.49',
    ])
  })

  it('pins each profile to its §6 parameters', () => {
    // Written out literally rather than derived from the profile objects: a
    // table that reads itself proves nothing. These values come from the draft.
    const EXPECTED: Record<string, { ph: string; label: string; classical: string }> = {
      '1.3.6.1.5.5.7.6.37': {
        ph: 'SHA-256',
        label: 'COMPSIG-MLDSA44-RSA2048-PSS-SHA256',
        classical: 'rsa-pss/2048/SHA-256',
      },
      '1.3.6.1.5.5.7.6.39': {
        ph: 'SHA-512',
        label: 'COMPSIG-MLDSA44-Ed25519-SHA512',
        classical: 'ed25519',
      },
      '1.3.6.1.5.5.7.6.40': {
        ph: 'SHA-256',
        label: 'COMPSIG-MLDSA44-ECDSA-P256-SHA256',
        classical: 'ecdsa/P-256/SHA-256',
      },
      '1.3.6.1.5.5.7.6.41': {
        ph: 'SHA-512',
        label: 'COMPSIG-MLDSA65-RSA3072-PSS-SHA512',
        // §6.1 Table 2: SHA-256 even though PH is SHA-512.
        classical: 'rsa-pss/3072/SHA-256',
      },
      '1.3.6.1.5.5.7.6.45': {
        ph: 'SHA-512',
        label: 'COMPSIG-MLDSA65-ECDSA-P256-SHA512',
        // ecdsa-with-SHA256: the hash tracks the CURVE, not the profile name.
        classical: 'ecdsa/P-256/SHA-256',
      },
      '1.3.6.1.5.5.7.6.48': {
        ph: 'SHA-512',
        label: 'COMPSIG-MLDSA65-Ed25519-SHA512',
        classical: 'ed25519',
      },
      '1.3.6.1.5.5.7.6.49': {
        ph: 'SHA-512',
        label: 'COMPSIG-MLDSA87-ECDSA-P384-SHA512',
        classical: 'ecdsa/P-384/SHA-384',
      },
    }

    for (const p of ALL_PROFILES) {
      const want = EXPECTED[p.compositeOid]
      expect(want, `no expectation recorded for ${p.compositeOid}`).toBeDefined()
      expect(p.preHash, `${p.label}: pre-hash`).toBe(want.ph)
      expect(p.signatureLabel, `${p.label}: signature label`).toBe(want.label)

      const c = p.classical
      const got =
        c.kind === 'ed25519'
          ? 'ed25519'
          : c.kind === 'rsa-pss'
            ? `rsa-pss/${c.modulusBits}/${c.tradHash}`
            : `ecdsa/${c.curve}/${c.tradHash}`
      expect(got, `${p.label}: traditional algorithm`).toBe(want.classical)
    }
  })

  it('keeps the ML-DSA split lengths at their FIPS 204 values', () => {
    const BY_OID: Record<string, [number, number]> = {
      [ML_DSA_44_OID_STR]: [1312, 2420],
      [ML_DSA_65_OID_STR]: [1952, 3309],
    }
    for (const p of ALL_PROFILES) {
      const want = BY_OID[p.mldsaOid] ?? [2592, 4627]
      expect([p.mldsaPubKeyBytes, p.mldsaSigBytes], `${p.label}: split lengths`).toEqual(want)
    }
  })
})

describe('RSA size enforcement (draft §6 "RSA size" + §3.3 step 2)', () => {
  it('rejects a .41 certificate carrying a 2048-bit modulus', async () => {
    // The whole point of the check: mint a structurally perfect
    // id-MLDSA65-RSA3072-PSS-SHA512 certificate whose only fault is an RSA key
    // of the wrong size. Both signatures are genuine and both would verify, so
    // nothing but the explicit size check can catch this.
    const profile = COMPOSITE_PROFILE_MLDSA65_RSA3072_PSS_SHA512
    const undersized: CompositeProfileDraft19 = {
      ...profile,
      classical: { ...profile.classical, kind: 'rsa-pss', modulusBits: 2048 } as never,
    }
    const mldsa = ml_dsa65
    const { publicKey: mldsaPub, secretKey: mldsaSec } = mldsa.keygen()
    const classical = await makeClassical(undersized)

    const der = await buildCompositeCertDraft19(
      profile, // claims .41 …
      mldsaPub,
      classical.publicKey, // … but carries a 2048-bit key
      async (mprime, ctx) => mldsa.sign(mprime, mldsaSec, { context: ctx }),
      classical.sign,
      '/CN=Undersized RSA/O=pqctoday'
    )

    const r = await verifyCompositeCert(der)
    expect(r.recognized).toBe(true)
    expect(r.mldsa?.verified, 'the ML-DSA half is genuinely valid here').toBe(true)
    expect(r.classical?.verified, 'undersized RSA key must fail, not warn').toBe(false)
    expect(r.classical?.detail).toMatch(/2048 bits.*3072 bits/)
    expect(r.valid).toBe(false)
  }, 20_000)

  it('accepts the RECOMMENDED exponent silently and flags any other', async () => {
    const { der } = await mintCert(COMPOSITE_PROFILE_MLDSA44_RSA2048_PSS_SHA256)
    const r = await verifyCompositeCert(der)
    expect(r.valid).toBe(true)
    // 65537 is what generateKey was asked for, so no note is expected.
    expect(r.classical?.detail).toBeUndefined()
  }, 20_000)
})

describe('EC point encoding (draft §4.1)', () => {
  it('rejects a compressed EC public key even though the signature is genuine', async () => {
    // draft §4.1: "public key MUST be encoded as an uncompressed X9.62 [...]
    // including the leading byte 0x04". @noble's keygen() hands back a
    // compressed point by default, so this is a mistake an implementer will
    // actually make — and one where every signature still verifies, because
    // the compressed and uncompressed forms are the same key.
    const profile = COMPOSITE_PROFILE_MLDSA65_ECDSA_P256_SHA512
    const { secretKey } = p256.keygen()
    const compressedPub = p256.getPublicKey(secretKey, true)
    expect(compressedPub.length, 'sanity: this should be the compressed form').toBe(33)

    const { publicKey: mldsaPub, secretKey: mldsaSec } = ml_dsa65.keygen()
    const der = await buildCompositeCertDraft19(
      profile,
      mldsaPub,
      compressedPub,
      async (mprime, ctx) => ml_dsa65.sign(mprime, mldsaSec, { context: ctx }),
      async (mprime) =>
        p256.sign(sha256(mprime), secretKey, { prehash: false, format: 'der', lowS: false }),
      '/CN=Compressed Point/O=pqctoday'
    )

    const r = await verifyCompositeCert(der)
    expect(r.classical?.verified, 'a compressed point must be rejected').toBe(false)
    expect(r.classical?.detail).toMatch(/COMPRESSED point/)
    expect(r.valid).toBe(false)
  }, 20_000)
})

describe('fail-closed contract', () => {
  it('treats an unrecognised composite OID as invalid, never as a pass', async () => {
    const { der } = await mintCert(COMPOSITE_PROFILE_MLDSA44_ECDSA_P256_SHA256)
    const cert = AsnConvert.parse(der, Certificate)
    cert.signatureAlgorithm.algorithm = '1.3.6.1.5.5.7.6.53' // a real draft OID we do not implement
    const r = await verifyCompositeCert(new Uint8Array(AsnConvert.serialize(cert)))
    expect(r.recognized).toBe(false)
    expect(r.valid).toBe(false)
    expect(r.errors.join(' ')).toMatch(/not a known composite profile/)
  }, 20_000)

  it('rejects a composite key too short to hold both components', async () => {
    const profile = COMPOSITE_PROFILE_MLDSA65_ECDSA_P256_SHA512
    const { der } = await mintCert(profile)
    const cert = AsnConvert.parse(der, Certificate)
    // Truncate the composite key to exactly the ML-DSA half: a conformant
    // verifier must not read a zero-length traditional key as "nothing to check".
    cert.tbsCertificate.subjectPublicKeyInfo.subjectPublicKey = new Uint8Array(
      profile.mldsaPubKeyBytes
    ).buffer as ArrayBuffer
    const r = await verifyCompositeCert(new Uint8Array(AsnConvert.serialize(cert)))
    expect(r.valid).toBe(false)
    expect(r.errors.join(' ')).toMatch(/expected more than/)
  }, 20_000)
})

describe('cross-implementation coverage', () => {
  it('every implemented profile has an external vector, and the gap list says so', () => {
    // The real assertion: no profile may be implemented without an outside
    // witness unless the gap is recorded. Round-trips are self-consistent by
    // construction, so a profile with neither a vector nor a recorded gap is
    // exactly the blind spot F17 lived in.
    const witnessed = new Set(EXTERNAL_COMPOSITE_VECTORS.map((v) => v.oid))
    const recordedGaps = new Set(EXTERNAL_VECTOR_COVERAGE_GAPS.map((g) => g.oid))

    for (const p of ALL_PROFILES) {
      expect(
        witnessed.has(p.compositeOid) || recordedGaps.has(p.compositeOid),
        `${p.label} is implemented with neither an external vector nor a recorded ` +
          `gap in EXTERNAL_VECTOR_COVERAGE_GAPS. Add one or the other — an ` +
          `unwitnessed profile that nothing flags is how F17 survived a green suite.`
      ).toBe(true)
    }

    // As of 2026-08-18 all three gaps closed, so this should be empty. If a
    // future profile lands without a vector this stops being true, and the
    // entry it needs must explain what specifically goes unchecked.
    expect(EXTERNAL_VECTOR_COVERAGE_GAPS).toEqual([])
    for (const g of EXTERNAL_VECTOR_COVERAGE_GAPS) {
      expect(findCompositeProfile(g.oid), `${g.label} is listed but not implemented`).toBeDefined()
      expect(g.unverified.length, `${g.label}: say what goes unchecked`).toBeGreaterThan(80)
    }
  })

  it('covers every §10.4-recommended profile with an external vector', () => {
    const witnessed = new Set(EXTERNAL_COMPOSITE_VECTORS.map((v) => v.oid))
    for (const p of COMPOSITE_PROFILES_RECOMMENDED) {
      expect(witnessed.has(p.compositeOid), `${p.label}: no external vector`).toBe(true)
    }
  })
})
