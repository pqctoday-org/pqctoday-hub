// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection */
// ── JWT Helper Utilities ────────────────────────────────────────────────────

import { ml_dsa44, ml_dsa65, ml_dsa87 } from '@noble/post-quantum/ml-dsa.js'
import {
  slh_dsa_sha2_128s,
  slh_dsa_sha2_192s,
  slh_dsa_sha2_256s,
} from '@noble/post-quantum/slh-dsa.js'
import { ed25519 } from '@noble/curves/ed25519.js'
import { ed448 } from '@noble/curves/ed448.js'
import { p256, p384 } from '@noble/curves/nist.js'
import { sha256, sha512 } from '@noble/hashes/sha2.js'
import { shake256 } from '@noble/hashes/sha3.js'
import {
  hsm_generateMLDSAKeyPair,
  hsm_signBytesMLDSA,
  hsm_verifyBytes,
  hsm_extractKeyValue,
  hsm_importMLDSAPublicKey,
  hsm_destroyObject,
  hsm_generateSLHDSAKeyPair,
  hsm_signBytesSLHDSA,
  hsm_slhdsaVerify,
  hsm_importSLHDSAPublicKey,
  CKP_SLH_DSA_SHA2_128S,
  CKP_SLH_DSA_SHA2_192S,
  CKP_SLH_DSA_SHA2_256S,
} from '@/wasm/softhsm'
import type { SoftHSMModule } from '@/wasm/softhsm'

/**
 * Encode a Uint8Array as a base64url string (no padding).
 */
export function base64urlEncode(data: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < data.length; i++) {
    binary += String.fromCharCode(data[i])
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/**
 * Decode a base64url string to a Uint8Array.
 */
export function base64urlDecode(str: string): Uint8Array {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/')
  while (base64.length % 4 !== 0) {
    base64 += '='
  }
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

/**
 * Decode a JWT/JWS string into its three parts: header, payload, signature.
 * Returns null if the token shape or the header is malformed. The payload
 * is parsed as JSON when possible but falls back to `{ raw: <text> }` for
 * RFC 7515 JWS payloads that aren't JSON (e.g. plain UTF-8 text — the
 * pattern used by RFC 9964 Appendix A.1 examples).
 */
export function decodeJWT(
  token: string
): { header: Record<string, unknown>; payload: Record<string, unknown>; signature: string } | null {
  const parts = token.split('.')
  if (parts.length !== 3) return null

  let header: Record<string, unknown>
  let payload: Record<string, unknown>
  try {
    const headerJson = new TextDecoder().decode(base64urlDecode(parts[0]))
    header = JSON.parse(headerJson) as Record<string, unknown>
  } catch {
    return null
  }
  try {
    const payloadJson = new TextDecoder().decode(base64urlDecode(parts[1]))
    try {
      payload = JSON.parse(payloadJson) as Record<string, unknown>
    } catch {
      // Non-JSON JWS payload — preserve the raw text so callers can still display it
      payload = { raw: payloadJson }
    }
  } catch {
    return null
  }
  return { header, payload, signature: parts[2] }
}

/**
 * Create a base64url-encoded JOSE header.
 */
export function createJWTHeader(alg: string, extra?: Record<string, unknown>): string {
  const header = { alg, typ: 'JWT', ...(extra ?? {}) }
  const json = JSON.stringify(header)
  const bytes = new TextEncoder().encode(json)
  return base64urlEncode(bytes)
}

/**
 * Create a base64url-encoded JWT payload from claims.
 */
export function createJWTPayload(claims: Record<string, unknown>): string {
  const json = JSON.stringify(claims)
  const bytes = new TextEncoder().encode(json)
  return base64urlEncode(bytes)
}

/**
 * Calculate JWT sizes given the component sizes.
 * Returns the size of each base64url-encoded part and total with dots.
 */
export function calculateJWTSize(
  headerSize: number,
  payloadSize: number,
  sigBytes: number
): { headerB64: number; payloadB64: number; signatureB64: number; total: number; dots: number } {
  const headerB64 = Math.ceil((headerSize * 4) / 3)
  const payloadB64 = Math.ceil((payloadSize * 4) / 3)
  const signatureB64 = Math.ceil((sigBytes * 4) / 3)
  const dots = 2
  const total = headerB64 + payloadB64 + signatureB64 + dots

  return { headerB64, payloadB64, signatureB64, total, dots }
}

// ── PQC JWS adapter ─────────────────────────────────────────────────────────
//
// Real sign/verify for the API Security & JWT workshop.
//
// Algorithms follow RFC 9964 (ML-DSA for JOSE and COSE, published May 2026)
// and draft-ietf-jose-pq-composite-sigs-04 for the hybrid family.
//
// Two backends are supported:
//   - 'noble'    — @noble/post-quantum + @noble/curves (pure JS)
//   - 'softhsmv3' — in-repo SoftHSM3 WASM via PKCS#11 v3.2
// Tokens produced by one backend MUST verify under the other; this invariant
// is enforced by unit tests in jwtUtils.test.ts.

export type JwsAlg =
  | 'ML-DSA-44'
  | 'ML-DSA-65'
  | 'ML-DSA-87'
  | 'SLH-DSA-SHA2-128s'
  | 'SLH-DSA-SHA2-192s'
  | 'SLH-DSA-SHA2-256s'
  // draft-ietf-jose-pq-composite-sigs-04 Table 5 (all 6 JOSE composite algs)
  | 'ML-DSA-44-ES256'
  | 'ML-DSA-65-ES256'
  | 'ML-DSA-87-ES384'
  | 'ML-DSA-44-Ed25519'
  | 'ML-DSA-65-Ed25519'
  | 'ML-DSA-87-Ed448'

export type CompositeAlg =
  | 'ML-DSA-44-ES256'
  | 'ML-DSA-65-ES256'
  | 'ML-DSA-87-ES384'
  | 'ML-DSA-44-Ed25519'
  | 'ML-DSA-65-Ed25519'
  | 'ML-DSA-87-Ed448'

export type JwsBackend = 'noble' | 'softhsmv3'

export interface HsmContext {
  M: SoftHSMModule
  session: number
}

export interface JwsKeyPair {
  alg: JwsAlg
  publicKey: Uint8Array
  /**
   * Bytes form of the secret key.
   *  - For noble backends this is the actual secret key material.
   *  - For softhsmv3 the field holds a 4-byte big-endian PKCS#11 object handle
   *    so the same KeyPair type can be passed around. Use `hsmHandles` to
   *    recover the live handles when the backend is softhsmv3.
   */
  secretKey: Uint8Array
  hsmHandles?: { pubHandle: number; privHandle: number }
  /**
   * 32-byte FIPS 204 KeyGen seed (ξ) for ML-DSA — the canonical private-key
   * representation per RFC 9964 §3 (AKP `priv` parameter). Only populated for
   * pure ML-DSA noble keys (we generate the seed ourselves so we can expose it).
   * Undefined for HSM-backed keys (seed is sealed), composite keys, and SLH-DSA
   * (RFC 9964 is signature-only and limited to ML-DSA).
   */
  mldsaSeed?: Uint8Array
}

export interface SignedJwsResult {
  token: string
  headerB64: string
  payloadB64: string
  signatureB64: string
  signature: Uint8Array
  signingInput: string
}

export interface VerifyJwsResult {
  valid: boolean
  header: Record<string, unknown>
  payload: Record<string, unknown>
  signature: Uint8Array
}

interface MlDsaSignOpts {
  /** ML-DSA `ctx` per FIPS 204; used by composite-sigs to bind alg label. */
  context?: Uint8Array
  /** false → deterministic (rnd=0); undefined → hedged (random rnd). */
  extraEntropy?: false | Uint8Array
}

interface MlDsaVerifyOpts {
  context?: Uint8Array
}

interface MlDsaSuite {
  keygen: (seed?: Uint8Array) => { publicKey: Uint8Array; secretKey: Uint8Array }
  sign: (msg: Uint8Array, sk: Uint8Array, opts?: MlDsaSignOpts) => Uint8Array
  verify: (sig: Uint8Array, msg: Uint8Array, pk: Uint8Array, opts?: MlDsaVerifyOpts) => boolean
}

const ML_DSA_SUITES: Record<'ML-DSA-44' | 'ML-DSA-65' | 'ML-DSA-87', MlDsaSuite> = {
  'ML-DSA-44': ml_dsa44 as unknown as MlDsaSuite,
  'ML-DSA-65': ml_dsa65 as unknown as MlDsaSuite,
  'ML-DSA-87': ml_dsa87 as unknown as MlDsaSuite,
}

const ML_DSA_VARIANT: Record<'ML-DSA-44' | 'ML-DSA-65' | 'ML-DSA-87', 44 | 65 | 87> = {
  'ML-DSA-44': 44,
  'ML-DSA-65': 65,
  'ML-DSA-87': 87,
}

interface SlhDsaSuite {
  keygen: () => { publicKey: Uint8Array; secretKey: Uint8Array }
  sign: (msg: Uint8Array, sk: Uint8Array) => Uint8Array
  verify: (sig: Uint8Array, msg: Uint8Array, pk: Uint8Array) => boolean
}

const SLH_DSA_SUITES: Record<
  'SLH-DSA-SHA2-128s' | 'SLH-DSA-SHA2-192s' | 'SLH-DSA-SHA2-256s',
  SlhDsaSuite
> = {
  'SLH-DSA-SHA2-128s': slh_dsa_sha2_128s as unknown as SlhDsaSuite,
  'SLH-DSA-SHA2-192s': slh_dsa_sha2_192s as unknown as SlhDsaSuite,
  'SLH-DSA-SHA2-256s': slh_dsa_sha2_256s as unknown as SlhDsaSuite,
}

// PKCS#11 v3.2 CKP_SLH_DSA_* parameter-set IDs for the SoftHSM3 keygen path.
//
// A lazy function, not a top-level literal: the production build wraps the
// softhsm import in vite-plugin-top-level-await, so a top-level literal here
// would capture the CKP_SLH_DSA_* constants as `undefined` (assigned only
// once that chunk's own top-level await resolves, which happens AFTER this
// module's top-level runs). Dev/vitest don't use that plugin, so this bug is
// invisible outside a real production build. See
// pqctoday-priv/design/design_handoff_kmip_pkcs11_playground/GAPS-CLOSEOUT-PLAN-2026-09-02.md §2.1.
const slhDsaParamSet = (): Record<
  'SLH-DSA-SHA2-128s' | 'SLH-DSA-SHA2-192s' | 'SLH-DSA-SHA2-256s',
  number
> => ({
  'SLH-DSA-SHA2-128s': CKP_SLH_DSA_SHA2_128S,
  'SLH-DSA-SHA2-192s': CKP_SLH_DSA_SHA2_192S,
  'SLH-DSA-SHA2-256s': CKP_SLH_DSA_SHA2_256S,
})

// ── Composite-sig wire format (draft-ietf-jose-pq-composite-sigs-04) ────────
//
// Conformance is checked against the draft's own Appendix A.1 JOSE examples
// (src/data/acvp/composite-sigs-04-jose-examples.json) — all six algorithms.
//
// §4.4 (Encoding Rules): byte streams of the keys and signatures are directly
// concatenated, ML-DSA first then traditional. The ML-DSA part is fixed-length,
// so the split is unambiguous even though a DER ECDSA signature is not.
//
// §4.1 key encodings (taken from draft-ietf-lamps-pq-composite-sigs):
//   public  = ML-DSA pk || trad pk   (ECDSA: X9.62 UNCOMPRESSED 0x04||x||y;
//                                     EdDSA: the RFC 8032 public key)
//   private = ML-DSA 32-byte seed || trad sk
//                                    (ECDSA: RFC 5915 ECPrivateKey, §4.5.2;
//                                     EdDSA: the RFC 8032 seed)
//
// §4.2 Composite Sign:
//   Prefix = "CompositeAlgorithmSignatures2025"  (32 bytes ASCII)
//   Label  = per-alg COMPSIG-* string from Table 7
//   PH(M)  = pre-hash per Table 5 (SHA256 / SHA512 / SHAKE256)
//   M'     = Prefix || Label || 0x00 || PH(M)
//   "M' is signed as a raw octet string in both JOSE and COSE." (-01 and -02
//   base64url-encoded M' for JOSE; -03 dropped that, and this code did not
//   follow until -04.)
//   ML-DSA component additionally takes ctx = Label.
//   ECDSA component signature is a DER Ecdsa-Sig-Value (§4.5.1) — new in -04;
//   -02/-03 used raw r||s.
const COMPOSITE_PREFIX = new TextEncoder().encode('CompositeAlgorithmSignatures2025')

type MlDsaVariant = 44 | 65 | 87
type PreHash = 'SHA256' | 'SHA512' | 'SHAKE256'

interface CompositeSpec {
  /** ML-DSA component variant. */
  mlDsaVariant: MlDsaVariant
  /** ML-DSA public key length per FIPS 204 Table 1. */
  mlDsaPkLen: number
  /** ML-DSA signature length per FIPS 204 Table 1. */
  mlDsaSigLen: number
  /** Traditional component public key length (ECDSA: uncompressed point). */
  tradPkLen: number
  /** Label bytes from Table 7 (used both in M' and as ML-DSA ctx). */
  label: Uint8Array
  /** Pre-hash per Table 5. */
  preHash: PreHash
  /** Traditional component family. Drives the sign/verify code path. */
  traditional: 'ed25519' | 'ed448' | 'ecdsa-p256' | 'ecdsa-p384'
}

const COMPOSITE_SPECS: Record<CompositeAlg, CompositeSpec> = {
  'ML-DSA-44-ES256': {
    mlDsaVariant: 44,
    mlDsaPkLen: 1312,
    mlDsaSigLen: 2420,
    tradPkLen: 65,
    label: new TextEncoder().encode('COMPSIG-MLDSA44-ECDSA-P256-SHA256'),
    preHash: 'SHA256',
    traditional: 'ecdsa-p256',
  },
  'ML-DSA-65-ES256': {
    mlDsaVariant: 65,
    mlDsaPkLen: 1952,
    mlDsaSigLen: 3309,
    tradPkLen: 65,
    label: new TextEncoder().encode('COMPSIG-MLDSA65-ECDSA-P256-SHA512'),
    preHash: 'SHA512',
    traditional: 'ecdsa-p256',
  },
  'ML-DSA-87-ES384': {
    mlDsaVariant: 87,
    mlDsaPkLen: 2592,
    mlDsaSigLen: 4627,
    tradPkLen: 97,
    label: new TextEncoder().encode('COMPSIG-MLDSA87-ECDSA-P384-SHA512'),
    preHash: 'SHA512',
    traditional: 'ecdsa-p384',
  },
  'ML-DSA-44-Ed25519': {
    mlDsaVariant: 44,
    mlDsaPkLen: 1312,
    mlDsaSigLen: 2420,
    tradPkLen: 32,
    label: new TextEncoder().encode('COMPSIG-MLDSA44-Ed25519-SHA512'),
    preHash: 'SHA512',
    traditional: 'ed25519',
  },
  'ML-DSA-65-Ed25519': {
    mlDsaVariant: 65,
    mlDsaPkLen: 1952,
    mlDsaSigLen: 3309,
    tradPkLen: 32,
    label: new TextEncoder().encode('COMPSIG-MLDSA65-Ed25519-SHA512'),
    preHash: 'SHA512',
    traditional: 'ed25519',
  },
  'ML-DSA-87-Ed448': {
    mlDsaVariant: 87,
    mlDsaPkLen: 2592,
    mlDsaSigLen: 4627,
    tradPkLen: 57,
    label: new TextEncoder().encode('COMPSIG-MLDSA87-Ed448-SHAKE256'),
    preHash: 'SHAKE256',
    traditional: 'ed448',
  },
}

/** Length of the ML-DSA seed that opens a composite private key (§4.1). */
const MLDSA_SEED_LEN = 32

// §4.5.2 Table 4: an ECPrivateKey is the raw scalar d between two fixed byte
// strings that depend only on the curve (publicKey field omitted).
const EC_PRIVATE_KEY_FRAME = {
  'ecdsa-p256': {
    before: Uint8Array.from([0x30, 0x31, 0x02, 0x01, 0x01, 0x04, 0x20]),
    after: Uint8Array.from([
      0xa0, 0x0a, 0x06, 0x08, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x03, 0x01, 0x07,
    ]),
    dLen: 32,
  },
  'ecdsa-p384': {
    before: Uint8Array.from([0x30, 0x3e, 0x02, 0x01, 0x01, 0x04, 0x30]),
    after: Uint8Array.from([0xa0, 0x07, 0x06, 0x05, 0x2b, 0x81, 0x04, 0x00, 0x22]),
    dLen: 48,
  },
} as const

function encodeEcPrivateKey(curve: 'ecdsa-p256' | 'ecdsa-p384', d: Uint8Array): Uint8Array {
  const f = EC_PRIVATE_KEY_FRAME[curve]
  return concatBytes(f.before, d, f.after)
}

function decodeEcPrivateKey(curve: 'ecdsa-p256' | 'ecdsa-p384', der: Uint8Array): Uint8Array {
  const f = EC_PRIVATE_KEY_FRAME[curve]
  if (der.length !== f.before.length + f.dLen + f.after.length) {
    throw new Error('ECPrivateKey has the wrong length for this curve')
  }
  const ok =
    f.before.every((b, i) => der[i] === b) &&
    f.after.every((b, i) => der[f.before.length + f.dLen + i] === b)
  if (!ok) throw new Error('ECPrivateKey framing does not match draft §4.5.2 Table 4')
  return der.subarray(f.before.length, f.before.length + f.dLen)
}

function isComposite(alg: JwsAlg): alg is CompositeAlg {
  return alg in COMPOSITE_SPECS
}

function mlDsaSuiteForVariant(v: MlDsaVariant): MlDsaSuite {
  return ML_DSA_SUITES[v === 44 ? 'ML-DSA-44' : v === 65 ? 'ML-DSA-65' : 'ML-DSA-87']
}

function preHashBytes(preHash: PreHash, input: Uint8Array): Uint8Array {
  if (preHash === 'SHA256') return sha256(input)
  if (preHash === 'SHA512') return sha512(input)
  // SHAKE256 with a 64-byte output — confirmed by the ML-DSA-87-Ed448
  // raw_message_representative in draft -04 Appendix A.1.
  return shake256(input, { dkLen: 64 })
}

/** Compute the composite message representative M' per draft -04 §4.2 (raw octets). */
export function compositeMessageRepresentative(
  alg: CompositeAlg,
  signingInput: Uint8Array
): Uint8Array {
  const spec = COMPOSITE_SPECS[alg]
  const ph = preHashBytes(spec.preHash, signingInput)
  return concatBytes(COMPOSITE_PREFIX, spec.label, Uint8Array.of(0x00), ph)
}

/** Generate the traditional component as (encoded public key, encoded private key). */
function generateTraditionalKeyPair(spec: CompositeSpec): {
  publicKey: Uint8Array
  secretKey: Uint8Array
} {
  switch (spec.traditional) {
    case 'ed25519':
      return ed25519.keygen()
    case 'ed448':
      return ed448.keygen()
    case 'ecdsa-p256': {
      const d = p256.utils.randomSecretKey()
      return {
        publicKey: p256.getPublicKey(d, false),
        secretKey: encodeEcPrivateKey('ecdsa-p256', d),
      }
    }
    case 'ecdsa-p384': {
      const d = p384.utils.randomSecretKey()
      return {
        publicKey: p384.getPublicKey(d, false),
        secretKey: encodeEcPrivateKey('ecdsa-p384', d),
      }
    }
  }
}

/** Sign M' with the traditional component. EdDSA signs M' per RFC 8032.
 *  ECDSA hashes M' with the curve's hash (noble's default prehash: SHA-256 for
 *  P-256, SHA-384 for P-384 — "ecdsa-with-SHA256/SHA384" in Table 5) and emits
 *  a DER Ecdsa-Sig-Value per -04 §4.5.1. Do NOT pre-hash M' here as well:
 *  noble already does, and a second hash makes a signature no other
 *  implementation verifies (the pre-2026-10-01 code had exactly that bug). */
function traditionalSign(spec: CompositeSpec, mPrime: Uint8Array, sk: Uint8Array): Uint8Array {
  switch (spec.traditional) {
    case 'ed25519':
      return ed25519.sign(mPrime, sk)
    case 'ed448':
      return ed448.sign(mPrime, sk)
    case 'ecdsa-p256':
      return p256.sign(mPrime, decodeEcPrivateKey('ecdsa-p256', sk), { format: 'der' })
    case 'ecdsa-p384':
      return p384.sign(mPrime, decodeEcPrivateKey('ecdsa-p384', sk), { format: 'der' })
  }
}

/** Verify the traditional component signature over M'. `lowS: false` because
 *  other implementations are free to emit high-S ECDSA signatures. */
function traditionalVerify(
  spec: CompositeSpec,
  mPrime: Uint8Array,
  sig: Uint8Array,
  pk: Uint8Array
): boolean {
  try {
    switch (spec.traditional) {
      case 'ed25519':
        return ed25519.verify(sig, mPrime, pk)
      case 'ed448':
        return ed448.verify(sig, mPrime, pk)
      case 'ecdsa-p256':
        return p256.verify(sig, mPrime, pk, { format: 'der', lowS: false })
      case 'ecdsa-p384':
        return p384.verify(sig, mPrime, pk, { format: 'der', lowS: false })
    }
  } catch {
    return false
  }
}

/**
 * Composite sign per draft-ietf-jose-pq-composite-sigs-04 §4.2.
 *   M' = Prefix || Label || 0x00 || PH(signing_input)   (raw octets)
 *   ML-DSA signs M' with ctx=Label, using the key re-derived from its seed;
 *   the traditional component signs M'; output = ML-DSA sig || trad sig.
 * `secretKey` is the §4.1 composite private key (32-byte ML-DSA seed || trad sk).
 */
export function compositeSign(
  alg: CompositeAlg,
  secretKey: Uint8Array,
  signingInput: Uint8Array
): Uint8Array {
  const spec = COMPOSITE_SPECS[alg]
  const seed = secretKey.subarray(0, MLDSA_SEED_LEN)
  const tradSk = secretKey.subarray(MLDSA_SEED_LEN)
  const ml = mlDsaSuiteForVariant(spec.mlDsaVariant)
  const mPrime = compositeMessageRepresentative(alg, signingInput)
  // ML-DSA with extraEntropy:false uses the FIPS 204 rnd=0 path, which is what
  // the draft's Appendix A.1 examples were produced with; EdDSA is
  // deterministic by RFC 8032; noble's ECDSA uses RFC 6979 nonces.
  const mlSig = ml.sign(mPrime, ml.keygen(seed).secretKey, {
    context: spec.label,
    extraEntropy: false,
  })
  return concatBytes(mlSig, traditionalSign(spec, mPrime, tradSk))
}

/**
 * Composite verify per draft -04 §4.3: split ML-DSA (fixed length) from the
 * traditional part, rebuild M', and require BOTH components to verify.
 * A component key of the wrong length is an invalid signature (§4.3 step 1).
 */
export function compositeVerify(
  alg: CompositeAlg,
  publicKey: Uint8Array,
  signingInput: Uint8Array,
  signature: Uint8Array
): boolean {
  const spec = COMPOSITE_SPECS[alg]
  if (publicKey.length !== spec.mlDsaPkLen + spec.tradPkLen) return false
  if (signature.length <= spec.mlDsaSigLen) return false
  const mPrime = compositeMessageRepresentative(alg, signingInput)
  try {
    const mlValid = mlDsaSuiteForVariant(spec.mlDsaVariant).verify(
      signature.subarray(0, spec.mlDsaSigLen),
      mPrime,
      publicKey.subarray(0, spec.mlDsaPkLen),
      { context: spec.label }
    )
    return (
      mlValid &&
      traditionalVerify(
        spec,
        mPrime,
        signature.subarray(spec.mlDsaSigLen),
        publicKey.subarray(spec.mlDsaPkLen)
      )
    )
  } catch {
    return false
  }
}

function isMlDsa(alg: JwsAlg): alg is 'ML-DSA-44' | 'ML-DSA-65' | 'ML-DSA-87' {
  return alg === 'ML-DSA-44' || alg === 'ML-DSA-65' || alg === 'ML-DSA-87'
}

function isSlhDsa(
  alg: JwsAlg
): alg is 'SLH-DSA-SHA2-128s' | 'SLH-DSA-SHA2-192s' | 'SLH-DSA-SHA2-256s' {
  return alg === 'SLH-DSA-SHA2-128s' || alg === 'SLH-DSA-SHA2-192s' || alg === 'SLH-DSA-SHA2-256s'
}

/**
 * Generate a real keypair for the given JWS algorithm.
 * Softhsmv3 backend supports ML-DSA and SLH-DSA; composite algs always run on noble.
 */
export async function generateJwsKeyPair(opts: {
  alg: JwsAlg
  backend: JwsBackend
  hsm?: HsmContext
}): Promise<JwsKeyPair> {
  const { alg, backend, hsm } = opts

  if (backend === 'softhsmv3' && isMlDsa(alg)) {
    if (!hsm) throw new Error('softhsmv3 backend requires HSM context')
    const variant = ML_DSA_VARIANT[alg]
    const { pubHandle, privHandle } = hsm_generateMLDSAKeyPair(
      hsm.M,
      hsm.session,
      variant,
      true /* extractable so we can show the bytes */
    )
    const publicKey = hsm_extractKeyValue(hsm.M, hsm.session, pubHandle)
    return {
      alg,
      publicKey,
      secretKey: new Uint8Array(4), // sentinel — real material stays in HSM
      hsmHandles: { pubHandle, privHandle },
    }
  }

  if (backend === 'softhsmv3' && isSlhDsa(alg)) {
    if (!hsm) throw new Error('softhsmv3 backend requires HSM context')
    const paramSet = slhDsaParamSet()[alg]
    const { pubHandle, privHandle } = hsm_generateSLHDSAKeyPair(
      hsm.M,
      hsm.session,
      paramSet,
      true /* extractable so we can show the bytes */
    )
    const publicKey = hsm_extractKeyValue(hsm.M, hsm.session, pubHandle)
    return {
      alg,
      publicKey,
      secretKey: new Uint8Array(4),
      hsmHandles: { pubHandle, privHandle },
    }
  }

  if (isMlDsa(alg)) {
    // Generate the 32-byte FIPS 204 seed ourselves so we can expose it as the
    // RFC 9964 §3 AKP `priv` parameter. Without this, noble produces a random
    // seed internally and discards it.
    const seed = new Uint8Array(32)
    crypto.getRandomValues(seed)
    const { publicKey, secretKey } = ML_DSA_SUITES[alg].keygen(seed)
    return { alg, publicKey, secretKey, mldsaSeed: seed }
  }

  if (isSlhDsa(alg)) {
    const { publicKey, secretKey } = SLH_DSA_SUITES[alg].keygen()
    return { alg, publicKey, secretKey }
  }

  if (isComposite(alg)) {
    // Composite key per draft-ietf-jose-pq-composite-sigs-04 §4.1: ML-DSA
    // component first, then traditional. The private key holds the 32-byte
    // ML-DSA seed, not the expanded key, so it is also the AKP `priv` value.
    const spec = COMPOSITE_SPECS[alg]
    const seed = new Uint8Array(MLDSA_SEED_LEN)
    crypto.getRandomValues(seed)
    const ml = mlDsaSuiteForVariant(spec.mlDsaVariant).keygen(seed)
    const trad = generateTraditionalKeyPair(spec)
    return {
      alg,
      publicKey: concatBytes(ml.publicKey, trad.publicKey),
      secretKey: concatBytes(seed, trad.secretKey),
    }
  }

  throw new Error(`Unsupported alg: ${alg}`)
}

/**
 * Sign a JWT and return the compact JWS token.
 * The signing input is `b64u(header).b64u(payload)` per RFC 7515 §5.1.
 * `payload` is a JWT claims object, or a string used as the raw payload
 * (e.g. the inner compact JWT of a nested JWT, RFC 7519 §5.2 `cty: "JWT"`).
 */
export async function signJWS(opts: {
  alg: JwsAlg
  header?: Record<string, unknown>
  payload: Record<string, unknown> | string
  keyPair: JwsKeyPair
  backend: JwsBackend
  hsm?: HsmContext
}): Promise<SignedJwsResult> {
  const { alg, header, payload, keyPair, backend, hsm } = opts
  if (keyPair.alg !== alg) {
    throw new Error(`keyPair alg ${keyPair.alg} does not match requested alg ${alg}`)
  }
  const headerB64 = createJWTHeader(alg, header)
  const payloadB64 =
    typeof payload === 'string'
      ? base64urlEncode(new TextEncoder().encode(payload))
      : createJWTPayload(payload)
  const signingInput = `${headerB64}.${payloadB64}`
  const signingBytes = new TextEncoder().encode(signingInput)

  let signature: Uint8Array

  if (backend === 'softhsmv3' && isMlDsa(alg)) {
    if (!hsm) throw new Error('softhsmv3 backend requires HSM context')
    if (!keyPair.hsmHandles) {
      throw new Error('keyPair has no hsmHandles — generated on a different backend')
    }
    signature = hsm_signBytesMLDSA(hsm.M, hsm.session, keyPair.hsmHandles.privHandle, signingBytes)
  } else if (backend === 'softhsmv3' && isSlhDsa(alg)) {
    if (!hsm) throw new Error('softhsmv3 backend requires HSM context')
    if (!keyPair.hsmHandles) {
      throw new Error('keyPair has no hsmHandles — generated on a different backend')
    }
    signature = hsm_signBytesSLHDSA(hsm.M, hsm.session, keyPair.hsmHandles.privHandle, signingBytes)
  } else if (isMlDsa(alg)) {
    signature = ML_DSA_SUITES[alg].sign(signingBytes, keyPair.secretKey)
  } else if (isSlhDsa(alg)) {
    signature = SLH_DSA_SUITES[alg].sign(signingBytes, keyPair.secretKey)
  } else if (isComposite(alg)) {
    signature = compositeSign(alg, keyPair.secretKey, signingBytes)
  } else {
    throw new Error(`Unsupported alg: ${alg}`)
  }

  const signatureB64 = base64urlEncode(signature)
  return {
    token: `${signingInput}.${signatureB64}`,
    headerB64,
    payloadB64,
    signatureB64,
    signature,
    signingInput,
  }
}

/**
 * Verify a compact JWS token. Returns `valid: false` (not throw) for any signature mismatch.
 */
export async function verifyJWS(opts: {
  token: string
  publicKey: Uint8Array
  backend: JwsBackend
  hsm?: HsmContext
}): Promise<VerifyJwsResult> {
  const { token, publicKey, backend, hsm } = opts
  const parts = token.split('.')
  if (parts.length !== 3) {
    return {
      valid: false,
      header: {},
      payload: {},
      signature: new Uint8Array(0),
    }
  }
  // Decode the JOSE header (must be JSON per RFC 7515 §4). The payload is
  // opaque to verifyJWS — RFC 7515 makes no claim about its format, so we
  // try to parse it as JSON but fall back to {} for non-JWT payloads (the
  // RFC 9964 Appendix A.1 JOSE examples sign plain UTF-8 text).
  let header: Record<string, unknown>
  let payload: Record<string, unknown> = {}
  try {
    header = JSON.parse(new TextDecoder().decode(base64urlDecode(parts[0]))) as Record<
      string,
      unknown
    >
  } catch {
    return {
      valid: false,
      header: {},
      payload: {},
      signature: new Uint8Array(0),
    }
  }
  try {
    payload = JSON.parse(new TextDecoder().decode(base64urlDecode(parts[1]))) as Record<
      string,
      unknown
    >
  } catch {
    payload = {}
  }
  const alg = header['alg'] as JwsAlg
  const signingInput = `${parts[0]}.${parts[1]}`
  const signingBytes = new TextEncoder().encode(signingInput)
  const signature = base64urlDecode(parts[2])

  let valid = false
  try {
    if (backend === 'softhsmv3' && isMlDsa(alg)) {
      if (!hsm) throw new Error('softhsmv3 backend requires HSM context')
      const variant = ML_DSA_VARIANT[alg]
      // Import the public key as a session object, run verify, then destroy
      // the object so repeated verify calls in a long-running session don't
      // leak PKCS#11 handles.
      const pubHandle = hsm_importMLDSAPublicKey(hsm.M, hsm.session, variant, publicKey)
      try {
        valid = hsm_verifyBytes(hsm.M, hsm.session, pubHandle, signingBytes, signature)
      } finally {
        try {
          hsm_destroyObject(hsm.M, hsm.session, pubHandle)
        } catch {
          // Best-effort cleanup — never let destroy failures mask a verify result
        }
      }
    } else if (backend === 'softhsmv3' && isSlhDsa(alg)) {
      if (!hsm) throw new Error('softhsmv3 backend requires HSM context')
      const paramSet = slhDsaParamSet()[alg]
      // Import the public key, verify, destroy — same pattern as ML-DSA
      // (prevents pubHandle accumulation in a long-running session).
      const pubHandle = hsm_importSLHDSAPublicKey(hsm.M, hsm.session, paramSet, publicKey)
      try {
        const signingInputStr = new TextDecoder().decode(signingBytes)
        valid = hsm_slhdsaVerify(hsm.M, hsm.session, pubHandle, signingInputStr, signature)
      } finally {
        try {
          hsm_destroyObject(hsm.M, hsm.session, pubHandle)
        } catch {
          // Best-effort cleanup
        }
      }
    } else if (isMlDsa(alg)) {
      valid = ML_DSA_SUITES[alg].verify(signature, signingBytes, publicKey)
    } else if (isSlhDsa(alg)) {
      valid = SLH_DSA_SUITES[alg].verify(signature, signingBytes, publicKey)
    } else if (isComposite(alg)) {
      valid = compositeVerify(alg, publicKey, signingBytes, signature)
    }
  } catch {
    valid = false
  }

  return {
    valid,
    header,
    payload,
    signature,
  }
}

/** Returns true if the algorithm can be signed/verified via the SoftHSM3 WASM backend. */
export function isSoftHsmSupported(alg: JwsAlg): boolean {
  return isMlDsa(alg) || isSlhDsa(alg)
}

function concatBytes(...arrs: Uint8Array[]): Uint8Array {
  const total = arrs.reduce((s, a) => s + a.length, 0)
  const out = new Uint8Array(total)
  let off = 0
  for (const a of arrs) {
    out.set(a, off)
    off += a.length
  }
  return out
}

/** Convert a Uint8Array to a hex string (no `0x` prefix). */
export function bytesToHex(bytes: Uint8Array): string {
  let hex = ''
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0')
  }
  return hex
}

/**
 * AKP JWK shape per RFC 9964 §3 — Algorithm Key Pair (kty="AKP") for ML-DSA.
 * `priv` is the 32-byte FIPS 204 KeyGen seed (NOT the expanded private key),
 * `pub` is the encoded public key. The `alg` field carries the JOSE name
 * inherited from the COSE registrations (ML-DSA-44/65/87).
 */
export interface AkpJwk {
  kty: 'AKP'
  alg: 'ML-DSA-44' | 'ML-DSA-65' | 'ML-DSA-87'
  pub: string
  priv?: string
  kid?: string
}

/**
 * Render a JwsKeyPair as an RFC 9964 §3 AKP JWK. Only meaningful for pure
 * ML-DSA; returns null for SLH-DSA (not in RFC 9964 scope), composite
 * (separate draft), or HSM-backed keys when the seed is sealed.
 *
 * When `includePrivate` is true and the seed is known, emits the full keypair
 * with `priv` (base64url 32-byte seed). Otherwise emits the public-only JWK.
 */
export function toAkpJwk(
  keyPair: JwsKeyPair,
  opts: { includePrivate?: boolean; kid?: string } = {}
): AkpJwk | null {
  if (!isMlDsa(keyPair.alg)) return null
  const out: AkpJwk = {
    kty: 'AKP',
    alg: keyPair.alg,
    pub: base64urlEncode(keyPair.publicKey),
  }
  if (opts.includePrivate && keyPair.mldsaSeed) {
    out.priv = base64urlEncode(keyPair.mldsaSeed)
  }
  if (opts.kid) out.kid = opts.kid
  return out
}
