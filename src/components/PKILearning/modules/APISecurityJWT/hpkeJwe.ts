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
 * @noble/hashes. A SoftHSM-backed ML-KEM-768 KEM can be swapped in for HPKE-12.
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
  /** SoftHSM object handle, when the key lives in the HSM. */
  readonly handle?: number
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

/** PKCS#11 operations an HSM-backed ML-KEM-768 KEM needs. Keys stay in the HSM:
 *  only the public key value and the per-message shared secret leave it. */
export interface HsmMlKemOps {
  encapsulate(pubHandle: number): { enc: Uint8Array; sharedSecret: Uint8Array }
  decapsulate(privHandle: number, enc: Uint8Array): Uint8Array
}

/** ML-KEM-768 KEM backed by SoftHSM (HPKE-12 only — the HSM has no X-Wing). */
export function hsmMlKem768(ops: HsmMlKemOps): HPKE.KEMFactory {
  const base = NOBLE_KEMS['HPKE-12']()
  return () => ({
    ...base,
    async Encap(pkR: HPKE.Key) {
      const handle = (pkR as HpkeKey).handle
      if (handle === undefined) throw new Error('HSM public key handle missing')
      const { enc, sharedSecret } = ops.encapsulate(handle)
      return { enc, shared_secret: sharedSecret }
    },
    async Decap(enc: Uint8Array, skR: HPKE.Key) {
      const handle = (skR as HpkeKey).handle
      if (handle === undefined) throw new Error('HSM private key handle missing')
      return ops.decapsulate(handle, enc)
    },
  })
}

/** Key objects that point at SoftHSM handles, for use with hsmMlKem768(). */
export function hsmKeyPair(publicKey: Uint8Array, pubHandle: number, privHandle: number) {
  const name = HPKE_JWE_SUITES['HPKE-12'].kemName
  return {
    publicKey: makeKey(name, 'public', publicKey, { handle: pubHandle }),
    privateKey: makeKey(name, 'private', new Uint8Array(0), { handle: privHandle }),
  }
}

/** Copy into this realm's Uint8Array: `hpke` checks `instanceof Uint8Array`, and
 *  TextEncoder output can come from another realm (jsdom under Node). */
const u8 = (b: Uint8Array): Uint8Array => new Uint8Array(b)
const isBytes = (k: unknown): k is Uint8Array => ArrayBuffer.isView(k)
const utf8 = (s: string): Uint8Array => u8(new TextEncoder().encode(s))

function suiteFor(alg: HpkeJweAlg, kem?: HPKE.KEMFactory) {
  return new HPKE.CipherSuite(kem ?? NOBLE_KEMS[alg], KDF_SHAKE256, HPKE.AEAD_AES_256_GCM)
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

/**
 * JWE Compact Serialization with HPKE Integrated Encryption (-22 §5, §7.1):
 * protected header {alg[, kid]} with no "enc" and no "ek"; Encrypted Key =
 * encapsulated secret; IV and Tag empty; HPKE aad = ASCII(Encoded Protected
 * Header); HPKE info empty (mode_base).
 */
export async function hpkeJweEncrypt(opts: {
  alg: HpkeJweAlg
  plaintext: Uint8Array
  /** Recipient public key bytes, or a prepared key object (e.g. HSM-backed). */
  publicKey: Uint8Array | HpkeKey
  kid?: string
  kem?: HPKE.KEMFactory
}): Promise<HpkeJweEncryptResult> {
  const suite = suiteFor(opts.alg, opts.kem)
  const pkR = isBytes(opts.publicKey)
    ? await suite.DeserializePublicKey(u8(opts.publicKey))
    : opts.publicKey
  const header = opts.kid ? { alg: opts.alg, kid: opts.kid } : { alg: opts.alg }
  const headerB64 = base64urlEncode(utf8(JSON.stringify(header)))
  const { encapsulatedSecret, ciphertext } = await suite.Seal(pkR, u8(opts.plaintext), {
    aad: utf8(headerB64),
  })
  const token = [
    headerB64,
    base64urlEncode(encapsulatedSecret),
    '',
    base64urlEncode(ciphertext),
    '',
  ].join('.')
  return { token, headerB64, encapsulatedKey: encapsulatedSecret, ciphertext, header }
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

async function open(
  alg: HpkeJweAlg,
  enc: Uint8Array,
  ciphertext: Uint8Array,
  aad: Uint8Array,
  privateKey: Uint8Array | HpkeKey,
  kem?: HPKE.KEMFactory
): Promise<Uint8Array> {
  if (enc.length !== HPKE_JWE_SUITES[alg].Nenc) {
    throw new HpkeJweError(
      `Encrypted Key must be the ${HPKE_JWE_SUITES[alg].Nenc}-byte encapsulated secret for ${alg}`
    )
  }
  const suite = suiteFor(alg, kem)
  const skR = isBytes(privateKey)
    ? await suite.DeserializePrivateKey(u8(privateKey), true)
    : privateKey
  try {
    return await suite.Open(skR, u8(enc), u8(ciphertext), { aad: u8(aad) })
  } catch {
    throw new HpkeJweError('HPKE open failed: wrong key, or the token was modified')
  }
}

export async function hpkeJweDecrypt(opts: {
  token: string
  /** The recipient's key algorithm — the token's "alg" must equal it. */
  alg: HpkeJweAlg
  privateKey: Uint8Array | HpkeKey
  kem?: HPKE.KEMFactory
}): Promise<{ plaintext: Uint8Array; header: ParsedHeader }> {
  const parts = opts.token.split('.')
  if (parts.length !== 5) throw new HpkeJweError('JWE Compact Serialization must have 5 parts')
  const [headerB64, ekB64, ivB64, ctB64, tagB64] = parts
  const header = parseProtected(headerB64)
  checkIntegratedHeader(header, [opts.alg])
  if (ivB64 !== '' || tagB64 !== '') {
    throw new HpkeJweError('JWE Initialization Vector and Authentication Tag MUST be empty')
  }
  const plaintext = await open(
    opts.alg,
    base64urlDecode(ekB64),
    base64urlDecode(ctB64),
    utf8(headerB64),
    opts.privateKey,
    opts.kem
  )
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
  privateKey: Uint8Array | HpkeKey
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
