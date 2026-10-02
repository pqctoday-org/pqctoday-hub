// SPDX-License-Identifier: GPL-3.0-only
/**
 * PQ JWE via HPKE Integrated Encryption.
 *
 *   - JWE wiring: draft-ietf-jose-hpke-encrypt-22 §5 (Integrated Encryption)
 *     and §7 (producing / consuming JWEs).
 *   - PQ suites: draft-ietf-jose-hpke-pq-pqt-01 §3 — HPKE-12 (ML-KEM-768) and
 *     HPKE-9 (MLKEM768-X25519, the X-Wing PQ/T hybrid), both with the
 *     single-stage SHAKE256 KDF and AES-256-GCM.
 *
 * The HPKE key schedule comes from the `hpke` package. Its built-in ML-KEM and
 * cSHAKE need WebCrypto "Modern Algorithms", which most browsers (and Node 20)
 * lack, so the KEMs and the KDF are plugged in from @noble/post-quantum and
 * @noble/hashes.
 *
 * The SoftHSM backend does not use the `hpke` package at all: the whole HPKE
 * operation (Encap/Decap, the SHAKE256 key schedule and AES-256-GCM) runs
 * inside the token through PKCS#11 CKM_HPKE — see HsmHpkeOps and
 * hpkeJweHsm.ts. This file then only does the JWE wiring around it.
 *
 * Verified against the draft's own published examples
 * (src/data/acvp/jose-hpke-pq-pqt-01-examples.json, hpkeJwe.test.ts).
 */
import * as HPKE from 'hpke'
import { ml_kem768 } from '@noble/post-quantum/ml-kem.js'
import { ml_kem768_x25519 } from '@noble/post-quantum/hybrid.js'
import { shake256 } from '@noble/hashes/sha3.js'
import { base64urlDecode, base64urlEncode } from './jwtUtils'

export type HpkeJweAlg = 'HPKE-12' | 'HPKE-9'

export interface HpkeJweSuiteInfo {
  alg: HpkeJweAlg
  /** HPKE KEM name as registered in draft-ietf-hpke-pq. */
  kemName: 'ML-KEM-768' | 'MLKEM768-X25519'
  kemId: number
  kind: 'pure-pq' | 'pq-t-hybrid'
  label: string
  /** Public key bytes (SerializePublicKey). */
  Npk: number
  /** Encapsulated secret bytes — the JWE Encrypted Key. */
  Nenc: number
  /** Private key bytes (SerializePrivateKey = the KEM seed). */
  Nsk: number
}

export const HPKE_JWE_SUITES: Record<HpkeJweAlg, HpkeJweSuiteInfo> = {
  'HPKE-12': {
    alg: 'HPKE-12',
    kemName: 'ML-KEM-768',
    kemId: 0x0041,
    kind: 'pure-pq',
    label: 'HPKE-12 · ML-KEM-768 (pure PQ)',
    Npk: 1184,
    Nenc: 1088,
    Nsk: 64,
  },
  'HPKE-9': {
    alg: 'HPKE-9',
    kemName: 'MLKEM768-X25519',
    kemId: 0x647a,
    kind: 'pq-t-hybrid',
    label: 'HPKE-9 · ML-KEM-768 + X25519 (X-Wing, PQ/T hybrid)',
    Npk: 1216,
    Nenc: 1120,
    Nsk: 32,
  },
}

export const HPKE_JWE_ALGS = Object.keys(HPKE_JWE_SUITES) as HpkeJweAlg[]

/** Draft revisions this implementation is pinned to. */
export const HPKE_JWE_SPEC = {
  jwe: 'draft-ietf-jose-hpke-encrypt-22',
  suites: 'draft-ietf-jose-hpke-pq-pqt-01',
} as const

/** Both suites: one-stage SHAKE256 KDF (kdf_id 0x0011) and AES-256-GCM (aead_id 0x0002). */
export const HPKE_JWE_KDF_ID = 0x0011
export const HPKE_JWE_AEAD_ID = 0x0002

// ── Plug-in primitives ──────────────────────────────────────────────────────

/** SHAKE256 single-stage HPKE KDF (id 0x0011): Derive(ikm, L) = SHAKE256(ikm, L). */
const KDF_SHAKE256: HPKE.KDFFactory = () => ({
  id: 0x0011,
  type: 'KDF',
  name: 'SHAKE256',
  Nh: 64,
  stages: 1,
  async Derive(labeledIkm: Uint8Array, L: number) {
    return shake256(labeledIkm, { dkLen: L })
  },
  async Extract() {
    throw new Error('SHAKE256 is a single-stage KDF')
  },
  async Expand() {
    throw new Error('SHAKE256 is a single-stage KDF')
  },
})

/** The key object the plug-in KEMs hand to `hpke`. */
export interface HpkeKey extends HPKE.Key {
  readonly bytes: Uint8Array
  /** Expanded noble secret key (private keys only). */
  readonly sk?: Uint8Array
}

function makeKey(
  name: string,
  type: 'public' | 'private',
  bytes: Uint8Array,
  extra: Partial<HpkeKey> = {}
): HpkeKey {
  return { type, extractable: true, algorithm: { name }, bytes, ...extra } as HpkeKey
}

interface NobleKem {
  keygen(seed?: Uint8Array): { publicKey: Uint8Array; secretKey: Uint8Array }
  encapsulate(pk: Uint8Array): { cipherText: Uint8Array; sharedSecret: Uint8Array }
  decapsulate(ct: Uint8Array, sk: Uint8Array): Uint8Array
}

/** Wrap a noble KEM as an HPKE KEM. Private keys serialize as the KEM seed
 *  (draft-ietf-hpke-pq), which is also the JWK "priv" value. */
function nobleKem(info: HpkeJweSuiteInfo, kem: NobleKem): HPKE.KEMFactory {
  const { kemId: id, kemName: name, Npk, Nenc, Nsk } = info
  const fromSeed = (seed: Uint8Array) => {
    const { publicKey, secretKey } = kem.keygen(seed)
    return {
      publicKey: makeKey(name, 'public', publicKey),
      privateKey: makeKey(name, 'private', seed, { sk: secretKey }),
    }
  }
  return () => ({
    id,
    type: 'KEM',
    name,
    Nsecret: 32,
    Nenc,
    Npk,
    Nsk,
    async DeriveKeyPair() {
      throw new Error('DeriveKeyPair is not used by JWE')
    },
    async GenerateKeyPair() {
      return fromSeed(crypto.getRandomValues(new Uint8Array(Nsk)))
    },
    async SerializePublicKey(key: HPKE.Key) {
      return (key as HpkeKey).bytes
    },
    async DeserializePublicKey(bytes: Uint8Array) {
      if (bytes.length !== Npk) throw new Error(`${name} public key must be ${Npk} bytes`)
      return makeKey(name, 'public', bytes)
    },
    async SerializePrivateKey(key: HPKE.Key) {
      return (key as HpkeKey).bytes
    },
    async DeserializePrivateKey(bytes: Uint8Array) {
      if (bytes.length !== Nsk) throw new Error(`${name} private key must be ${Nsk} bytes`)
      return fromSeed(bytes).privateKey
    },
    async Encap(pkR: HPKE.Key) {
      const { cipherText, sharedSecret } = kem.encapsulate((pkR as HpkeKey).bytes)
      return { enc: cipherText, shared_secret: sharedSecret }
    },
    async Decap(enc: Uint8Array, skR: HPKE.Key) {
      const sk = (skR as HpkeKey).sk
      if (!sk) throw new Error(`${name} private key has no key material`)
      return kem.decapsulate(enc, sk)
    },
  })
}

const NOBLE_KEMS: Record<HpkeJweAlg, HPKE.KEMFactory> = {
  'HPKE-12': nobleKem(HPKE_JWE_SUITES['HPKE-12'], ml_kem768),
  'HPKE-9': nobleKem(HPKE_JWE_SUITES['HPKE-9'], ml_kem768_x25519),
}

/**
 * HPKE single-shot Seal/Open run entirely inside an HSM (PKCS#11 CKM_HPKE,
 * base mode, empty info). Encap/Decap, the key schedule and AES-256-GCM all
 * happen in the token, and the AEAD key is a non-extractable key object: only
 * the encapsulated secret, the ciphertext and the plaintext cross the
 * boundary. Implementations MUST NOT pass a forced ephemeral seed — that hook
 * is for known-answer tests only.
 */
export interface HsmHpkeOps {
  seal(
    alg: HpkeJweAlg,
    pubHandle: number,
    aad: Uint8Array,
    plaintext: Uint8Array
  ): { enc: Uint8Array; ciphertext: Uint8Array }
  open(
    alg: HpkeJweAlg,
    privHandle: number,
    enc: Uint8Array,
    aad: Uint8Array,
    ciphertext: Uint8Array
  ): Uint8Array
}

/** Copy into this realm's Uint8Array: `hpke` checks `instanceof Uint8Array`, and
 *  TextEncoder output can come from another realm (jsdom under Node). */
const u8 = (b: Uint8Array): Uint8Array => new Uint8Array(b)
const utf8 = (s: string): Uint8Array => u8(new TextEncoder().encode(s))

function suiteFor(alg: HpkeJweAlg) {
  return new HPKE.CipherSuite(NOBLE_KEMS[alg], KDF_SHAKE256, HPKE.AEAD_AES_256_GCM)
}

// ── Keys ────────────────────────────────────────────────────────────────────

/** Private JWK for these suites: kty "AKP" (RFC 9964), pq-pqt-01 §4. */
export interface HpkeAkpJwk {
  kty: 'AKP'
  alg: HpkeJweAlg
  kid?: string
  pub: string
  priv?: string
}

export interface HpkeKeyPair {
  alg: HpkeJweAlg
  publicKey: Uint8Array
  /** The KEM seed (SerializePrivateKey). */
  privateKey: Uint8Array
  jwk: HpkeAkpJwk
}

export async function generateHpkeKeyPair(alg: HpkeJweAlg): Promise<HpkeKeyPair> {
  const suite = suiteFor(alg)
  const kp = await suite.GenerateKeyPair(true)
  const publicKey = await suite.SerializePublicKey(kp.publicKey)
  const privateKey = await suite.SerializePrivateKey(kp.privateKey)
  return {
    alg,
    publicKey,
    privateKey,
    jwk: { kty: 'AKP', alg, pub: base64urlEncode(publicKey), priv: base64urlEncode(privateKey) },
  }
}

// ── Encrypt ─────────────────────────────────────────────────────────────────

export interface HpkeJweEncryptResult {
  token: string
  headerB64: string
  /** JWE Encrypted Key = the HPKE encapsulated secret. */
  encapsulatedKey: Uint8Array
  /** JWE Ciphertext = HPKE ciphertext (includes the AEAD tag). */
  ciphertext: Uint8Array
  header: { alg: HpkeJweAlg; kid?: string }
}

function protectedHeader(alg: HpkeJweAlg, kid?: string) {
  const header = kid ? { alg, kid } : { alg }
  return { header, headerB64: base64urlEncode(utf8(JSON.stringify(header))) }
}

function compact(
  headerB64: string,
  encapsulatedKey: Uint8Array,
  ciphertext: Uint8Array,
  header: { alg: HpkeJweAlg; kid?: string }
): HpkeJweEncryptResult {
  const token = [
    headerB64,
    base64urlEncode(encapsulatedKey),
    '',
    base64urlEncode(ciphertext),
    '',
  ].join('.')
  return { token, headerB64, encapsulatedKey, ciphertext, header }
}

/**
 * JWE Compact Serialization with HPKE Integrated Encryption (-22 §5, §7.1):
 * protected header {alg[, kid]} with no "enc" and no "ek"; Encrypted Key =
 * encapsulated secret; IV and Tag empty; HPKE aad = ASCII(Encoded Protected
 * Header); HPKE info empty (mode_base).
 */
export async function hpkeJweEncrypt(opts: {
  alg: HpkeJweAlg
  plaintext: Uint8Array
  /** Recipient public key bytes. */
  publicKey: Uint8Array
  kid?: string
}): Promise<HpkeJweEncryptResult> {
  const suite = suiteFor(opts.alg)
  const pkR = await suite.DeserializePublicKey(u8(opts.publicKey))
  const { header, headerB64 } = protectedHeader(opts.alg, opts.kid)
  const { encapsulatedSecret, ciphertext } = await suite.Seal(pkR, u8(opts.plaintext), {
    aad: utf8(headerB64),
  })
  return compact(headerB64, encapsulatedSecret, ciphertext, header)
}

/** Same JWE as hpkeJweEncrypt, with the HPKE Seal run inside the HSM. */
export function hpkeJweEncryptInHsm(opts: {
  alg: HpkeJweAlg
  plaintext: Uint8Array
  hsm: HsmHpkeOps
  /** Recipient public key handle (CKK_HPKE_KEM). */
  pubHandle: number
  kid?: string
}): HpkeJweEncryptResult {
  const { header, headerB64 } = protectedHeader(opts.alg, opts.kid)
  const { enc, ciphertext } = opts.hsm.seal(
    opts.alg,
    opts.pubHandle,
    utf8(headerB64),
    u8(opts.plaintext)
  )
  return compact(headerB64, enc, ciphertext, header)
}

// ── Decrypt ─────────────────────────────────────────────────────────────────

export class HpkeJweError extends Error {}

interface ParsedHeader {
  alg?: unknown
  enc?: unknown
  ek?: unknown
  [k: string]: unknown
}

/** -22 §5 / §7.2 header checks for Integrated Encryption, plus the
 *  application's algorithm allowlist (-22 §7.2, last paragraph). */
function checkIntegratedHeader(header: ParsedHeader, allowed: readonly HpkeJweAlg[]): HpkeJweAlg {
  if (typeof header.alg !== 'string' || !allowed.includes(header.alg as HpkeJweAlg)) {
    throw new HpkeJweError(`"alg" ${JSON.stringify(header.alg)} is not an allowed HPKE algorithm`)
  }
  if ('enc' in header) throw new HpkeJweError('"enc" MUST NOT be present in Integrated Encryption')
  if ('ek' in header) throw new HpkeJweError('"ek" MUST NOT be present in Integrated Encryption')
  if ('psk_id' in header) throw new HpkeJweError('"psk_id" (mode_psk) is not supported here')
  return header.alg as HpkeJweAlg
}

function parseProtected(b64: string): ParsedHeader {
  let header: unknown
  try {
    header = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(base64urlDecode(b64)))
  } catch {
    throw new HpkeJweError('protected header is not valid base64url UTF-8 JSON')
  }
  if (!header || typeof header !== 'object' || Array.isArray(header)) {
    throw new HpkeJweError('protected header must be a JSON object')
  }
  return header as ParsedHeader
}

function checkEncLength(alg: HpkeJweAlg, enc: Uint8Array) {
  if (enc.length !== HPKE_JWE_SUITES[alg].Nenc) {
    throw new HpkeJweError(
      `Encrypted Key must be the ${HPKE_JWE_SUITES[alg].Nenc}-byte encapsulated secret for ${alg}`
    )
  }
}

const OPEN_FAILED = 'HPKE open failed: wrong key, or the token was modified'

async function open(
  alg: HpkeJweAlg,
  enc: Uint8Array,
  ciphertext: Uint8Array,
  aad: Uint8Array,
  privateKey: Uint8Array
): Promise<Uint8Array> {
  checkEncLength(alg, enc)
  const suite = suiteFor(alg)
  const skR = await suite.DeserializePrivateKey(u8(privateKey), true)
  try {
    return await suite.Open(skR, u8(enc), u8(ciphertext), { aad: u8(aad) })
  } catch {
    throw new HpkeJweError(OPEN_FAILED)
  }
}

/** -22 §7.2 compact parsing and header checks, shared by both backends. */
function parseCompact(token: string, alg: HpkeJweAlg) {
  const parts = token.split('.')
  if (parts.length !== 5) throw new HpkeJweError('JWE Compact Serialization must have 5 parts')
  const [headerB64, ekB64, ivB64, ctB64, tagB64] = parts
  const header = parseProtected(headerB64)
  checkIntegratedHeader(header, [alg])
  if (ivB64 !== '' || tagB64 !== '') {
    throw new HpkeJweError('JWE Initialization Vector and Authentication Tag MUST be empty')
  }
  return {
    header,
    aad: utf8(headerB64),
    enc: base64urlDecode(ekB64),
    ciphertext: base64urlDecode(ctB64),
  }
}

export async function hpkeJweDecrypt(opts: {
  token: string
  /** The recipient's key algorithm — the token's "alg" must equal it. */
  alg: HpkeJweAlg
  /** The KEM seed (SerializePrivateKey). */
  privateKey: Uint8Array
}): Promise<{ plaintext: Uint8Array; header: ParsedHeader }> {
  const { header, aad, enc, ciphertext } = parseCompact(opts.token, opts.alg)
  const plaintext = await open(opts.alg, enc, ciphertext, aad, opts.privateKey)
  return { plaintext, header }
}

/** Same checks as hpkeJweDecrypt, with the HPKE Open run inside the HSM. */
export function hpkeJweDecryptInHsm(opts: {
  token: string
  alg: HpkeJweAlg
  hsm: HsmHpkeOps
  /** Recipient private key handle (CKK_HPKE_KEM). */
  privHandle: number
}): { plaintext: Uint8Array; header: ParsedHeader } {
  const { header, aad, enc, ciphertext } = parseCompact(opts.token, opts.alg)
  checkEncLength(opts.alg, enc)
  let plaintext: Uint8Array
  try {
    plaintext = opts.hsm.open(opts.alg, opts.privHandle, enc, aad, ciphertext)
  } catch {
    throw new HpkeJweError(OPEN_FAILED)
  }
  return { plaintext, header }
}

/** Flattened JWE JSON Serialization, single recipient, optional JWE AAD. */
export interface FlattenedJwe {
  protected: string
  encrypted_key: string
  ciphertext: string
  aad?: string
  iv?: string
  tag?: string
  header?: Record<string, unknown>
  unprotected?: Record<string, unknown>
}

export async function hpkeJweDecryptFlattened(opts: {
  jwe: FlattenedJwe
  alg: HpkeJweAlg
  privateKey: Uint8Array
}): Promise<{ plaintext: Uint8Array; header: ParsedHeader }> {
  const { jwe } = opts
  const header = {
    ...parseProtected(jwe.protected),
    ...(jwe.unprotected ?? {}),
    ...(jwe.header ?? {}),
  }
  checkIntegratedHeader(header, [opts.alg])
  if ((jwe.iv ?? '') !== '' || (jwe.tag ?? '') !== '') {
    throw new HpkeJweError('JWE Initialization Vector and Authentication Tag MUST be empty')
  }
  const aad = jwe.aad !== undefined ? `${jwe.protected}.${jwe.aad}` : jwe.protected
  const plaintext = await open(
    opts.alg,
    base64urlDecode(jwe.encrypted_key),
    base64urlDecode(jwe.ciphertext),
    utf8(aad),
    opts.privateKey
  )
  return { plaintext, header }
}
