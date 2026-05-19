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
import { sha256, sha384, sha512 } from '@noble/hashes/sha2.js'
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
 * pattern used by draft-ietf-cose-dilithium-11 Appendix A.1 examples).
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
// Algorithms follow draft-ietf-cose-dilithium-11 (JOSE inherits the alg codes
// from COSE) and draft-ietf-jose-pq-composite-sigs-01 for the hybrid family.
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
  // draft-ietf-jose-pq-composite-sigs-01 Table 2 (all 6 JOSE composite algs)
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
const SLH_DSA_PARAM_SET: Record<
  'SLH-DSA-SHA2-128s' | 'SLH-DSA-SHA2-192s' | 'SLH-DSA-SHA2-256s',
  number
> = {
  'SLH-DSA-SHA2-128s': CKP_SLH_DSA_SHA2_128S,
  'SLH-DSA-SHA2-192s': CKP_SLH_DSA_SHA2_192S,
  'SLH-DSA-SHA2-256s': CKP_SLH_DSA_SHA2_256S,
}

// ── Composite-sig wire format (draft-ietf-jose-pq-composite-sigs-01) ────────
//
// §4.4 (Encoding Rules): byte streams of the keys and signatures are directly
// concatenated, ML-DSA first then traditional. Component sizes are fixed so
// the split is unambiguous.
//
// §4.2 Composite Sign (M' computation):
//   Prefix = "CompositeAlgorithmSignatures2025"  (32 bytes ASCII)
//   Label  = per-alg COMPSIG-* string from Table 4
//   PH(M)  = pre-hash per Table 2 (SHA256 / SHA512 / SHAKE256)
//   M'     = Prefix || Label || 0x00 || PH(M)
//   For JOSE, M' is base64url-encoded before sign/verify (§4.2 last paragraph).
//   ML-DSA component additionally takes ctx = Label.
const COMPOSITE_PREFIX = new TextEncoder().encode('CompositeAlgorithmSignatures2025')

type MlDsaVariant = 44 | 65 | 87
type PreHash = 'SHA256' | 'SHA512' | 'SHAKE256'

interface CompositeSpec {
  /** ML-DSA component variant. */
  mlDsaVariant: MlDsaVariant
  /** ML-DSA public key length per FIPS 204 Table 1. */
  mlDsaPkLen: number
  /** ML-DSA secret key length per FIPS 204 Table 1. */
  mlDsaSkLen: number
  /** ML-DSA signature length per FIPS 204 Table 1. */
  mlDsaSigLen: number
  /** Traditional component public key length. */
  tradPkLen: number
  /** Traditional component secret key length. */
  tradSkLen: number
  /** Traditional component signature length. */
  tradSigLen: number
  /** Label bytes from Table 4 (used both in M' and as ML-DSA ctx). */
  label: Uint8Array
  /** Pre-hash per Table 2 — Schmidt-Hashin/SHAKE256 of the signing input. */
  preHash: PreHash
  /** Traditional component family. Drives the sign/verify code path. */
  traditional: 'ed25519' | 'ed448' | 'ecdsa-p256-sha256' | 'ecdsa-p384-sha384'
}

const COMPOSITE_SPECS: Record<CompositeAlg, CompositeSpec> = {
  'ML-DSA-44-ES256': {
    mlDsaVariant: 44,
    mlDsaPkLen: 1312,
    mlDsaSkLen: 2560,
    mlDsaSigLen: 2420,
    tradPkLen: 33, // compressed SEC1: 0x02|0x03 || X(32) — noble default
    tradSkLen: 32,
    tradSigLen: 64, // raw r||s
    label: new TextEncoder().encode('COMPSIG-MLDSA44-ECDSA-P256-SHA256'),
    preHash: 'SHA256',
    traditional: 'ecdsa-p256-sha256',
  },
  'ML-DSA-65-ES256': {
    mlDsaVariant: 65,
    mlDsaPkLen: 1952,
    mlDsaSkLen: 4032,
    mlDsaSigLen: 3309,
    tradPkLen: 33,
    tradSkLen: 32,
    tradSigLen: 64,
    label: new TextEncoder().encode('COMPSIG-MLDSA65-ECDSA-P256-SHA512'),
    preHash: 'SHA512',
    traditional: 'ecdsa-p256-sha256',
  },
  'ML-DSA-87-ES384': {
    mlDsaVariant: 87,
    mlDsaPkLen: 2592,
    mlDsaSkLen: 4896,
    mlDsaSigLen: 4627,
    tradPkLen: 49, // compressed P-384 SEC1
    tradSkLen: 48,
    tradSigLen: 96, // raw r||s (48+48)
    label: new TextEncoder().encode('COMPSIG-MLDSA87-ECDSA-P384-SHA512'),
    preHash: 'SHA512',
    traditional: 'ecdsa-p384-sha384',
  },
  'ML-DSA-44-Ed25519': {
    mlDsaVariant: 44,
    mlDsaPkLen: 1312,
    mlDsaSkLen: 2560,
    mlDsaSigLen: 2420,
    tradPkLen: 32,
    tradSkLen: 32,
    tradSigLen: 64,
    label: new TextEncoder().encode('COMPSIG-MLDSA44-Ed25519-SHA512'),
    preHash: 'SHA512',
    traditional: 'ed25519',
  },
  'ML-DSA-65-Ed25519': {
    mlDsaVariant: 65,
    mlDsaPkLen: 1952,
    mlDsaSkLen: 4032,
    mlDsaSigLen: 3309,
    tradPkLen: 32,
    tradSkLen: 32,
    tradSigLen: 64,
    label: new TextEncoder().encode('COMPSIG-MLDSA65-Ed25519-SHA512'),
    preHash: 'SHA512',
    traditional: 'ed25519',
  },
  'ML-DSA-87-Ed448': {
    mlDsaVariant: 87,
    mlDsaPkLen: 2592,
    mlDsaSkLen: 4896,
    mlDsaSigLen: 4627,
    tradPkLen: 57,
    tradSkLen: 57,
    tradSigLen: 114,
    label: new TextEncoder().encode('COMPSIG-MLDSA87-Ed448-SHAKE256'),
    preHash: 'SHAKE256',
    traditional: 'ed448',
  },
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
  // SHAKE256 with the Ed448 pairing — draft §4.2 + Table 2 don't pin a length,
  // but FIPS 202 says SHAKE output length is caller-chosen. Match Ed448's
  // sign-hash internal context (114 bytes = sig size). 64 is a common
  // canonical choice in COSE/JOSE contexts; use 64 for spec-equivalence to
  // SHA512 byte-budget. Document if upstream pins something different.
  return shake256(input, { dkLen: 64 })
}

/** Compute the composite message representative M' per draft §4.2 (JOSE encoding) */
function compositeMessageRepresentative(spec: CompositeSpec, signingInput: Uint8Array): Uint8Array {
  const ph = preHashBytes(spec.preHash, signingInput)
  const m = new Uint8Array(COMPOSITE_PREFIX.length + spec.label.length + 1 + ph.length)
  let off = 0
  m.set(COMPOSITE_PREFIX, off)
  off += COMPOSITE_PREFIX.length
  m.set(spec.label, off)
  off += spec.label.length
  m[off] = 0x00
  off += 1
  m.set(ph, off)
  // JOSE encoding step: base64url-encode M' before signing.
  return new TextEncoder().encode(base64urlEncode(m))
}

/** Generate a traditional keypair for the given composite spec. */
function generateTraditionalKeyPair(spec: CompositeSpec): {
  publicKey: Uint8Array
  secretKey: Uint8Array
} {
  switch (spec.traditional) {
    case 'ed25519':
      return ed25519.keygen()
    case 'ed448':
      return ed448.keygen()
    case 'ecdsa-p256-sha256':
      return p256.keygen()
    case 'ecdsa-p384-sha384':
      return p384.keygen()
  }
}

/** Sign with the traditional component over M'. ECDSA signs the hashed M';
 *  EdDSA signs M' directly per RFC 8032. Output is always raw r||s for
 *  ECDSA and the standard 64/114-byte Ed25519/Ed448 sig. */
function traditionalSign(spec: CompositeSpec, mPrime: Uint8Array, sk: Uint8Array): Uint8Array {
  switch (spec.traditional) {
    case 'ed25519':
      return ed25519.sign(mPrime, sk)
    case 'ed448':
      return ed448.sign(mPrime, sk)
    case 'ecdsa-p256-sha256':
      // noble returns Uint8Array (raw r||s, 64 B for P-256)
      return p256.sign(sha256(mPrime), sk)
    case 'ecdsa-p384-sha384':
      // noble returns Uint8Array (raw r||s, 96 B for P-384)
      return p384.sign(sha384(mPrime), sk)
  }
}

/** Verify the traditional component signature over M'. */
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
      case 'ecdsa-p256-sha256':
        return p256.verify(sig, sha256(mPrime), pk)
      case 'ecdsa-p384-sha384':
        return p384.verify(sig, sha384(mPrime), pk)
    }
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
    const paramSet = SLH_DSA_PARAM_SET[alg]
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
    const { publicKey, secretKey } = ML_DSA_SUITES[alg].keygen()
    return { alg, publicKey, secretKey }
  }

  if (isSlhDsa(alg)) {
    const { publicKey, secretKey } = SLH_DSA_SUITES[alg].keygen()
    return { alg, publicKey, secretKey }
  }

  if (isComposite(alg)) {
    // Composite key: ML-DSA component first, then traditional — per
    // draft-ietf-jose-pq-composite-sigs-01 §4.4 (Encoding Rules).
    const spec = COMPOSITE_SPECS[alg]
    const ml = mlDsaSuiteForVariant(spec.mlDsaVariant).keygen()
    const trad = generateTraditionalKeyPair(spec)
    return {
      alg,
      publicKey: concatBytes(ml.publicKey, trad.publicKey),
      secretKey: concatBytes(ml.secretKey, trad.secretKey),
    }
  }

  throw new Error(`Unsupported alg: ${alg}`)
}

/**
 * Sign a JWT and return the compact JWS token.
 * The signing input is `b64u(header).b64u(payload)` per RFC 7515 §5.1.
 */
export async function signJWS(opts: {
  alg: JwsAlg
  header?: Record<string, unknown>
  payload: Record<string, unknown>
  keyPair: JwsKeyPair
  backend: JwsBackend
  hsm?: HsmContext
}): Promise<SignedJwsResult> {
  const { alg, header, payload, keyPair, backend, hsm } = opts
  if (keyPair.alg !== alg) {
    throw new Error(`keyPair alg ${keyPair.alg} does not match requested alg ${alg}`)
  }
  const headerB64 = createJWTHeader(alg, header)
  const payloadB64 = createJWTPayload(payload)
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
    // draft-ietf-jose-pq-composite-sigs-01 §4.2:
    //   M' = base64url(Prefix || Label || 0x00 || PH(signing_input))
    //   ML-DSA component signs M' with ctx=Label (deterministic mode)
    //   Traditional component signs M'
    //   Output sig = ML-DSA sig || traditional sig
    // Secret-key layout (set in generateJwsKeyPair): ML-DSA first, then traditional.
    const spec = COMPOSITE_SPECS[alg]
    const mlSk = keyPair.secretKey.subarray(0, spec.mlDsaSkLen)
    const tradSk = keyPair.secretKey.subarray(spec.mlDsaSkLen, spec.mlDsaSkLen + spec.tradSkLen)
    const mPrime = compositeMessageRepresentative(spec, signingBytes)
    // Ed25519/Ed448 are deterministic by RFC 8032 §5.1.6 / RFC 8032 §5.2.6;
    // ECDSA via WebCrypto is randomized (no determinism opt-in); ML-DSA with
    // extraEntropy:false uses the FIPS 204 rnd=0 path.
    const mlSig = mlDsaSuiteForVariant(spec.mlDsaVariant).sign(mPrime, mlSk, {
      context: spec.label,
      extraEntropy: false,
    })
    const tradSig = traditionalSign(spec, mPrime, tradSk)
    signature = concatBytes(mlSig, tradSig)
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
  // draft-ietf-cose-dilithium-11 JOSE examples sign plain UTF-8 text).
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
      const paramSet = SLH_DSA_PARAM_SET[alg]
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
      // Split per draft §4.4: ML-DSA first, then traditional. Sizes are fixed.
      const spec = COMPOSITE_SPECS[alg]
      const mlSig = signature.subarray(0, spec.mlDsaSigLen)
      const tradSig = signature.subarray(spec.mlDsaSigLen)
      const mlPk = publicKey.subarray(0, spec.mlDsaPkLen)
      const tradPk = publicKey.subarray(spec.mlDsaPkLen)
      const mPrime = compositeMessageRepresentative(spec, signingBytes)
      // §4.3: both component signatures must verify on M'. ML-DSA additionally
      // takes ctx=Label so the verifier must too.
      const mlValid = mlDsaSuiteForVariant(spec.mlDsaVariant).verify(mlSig, mPrime, mlPk, {
        context: spec.label,
      })
      const tradValid = traditionalVerify(spec, mPrime, tradSig, tradPk)
      valid = mlValid && tradValid
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
