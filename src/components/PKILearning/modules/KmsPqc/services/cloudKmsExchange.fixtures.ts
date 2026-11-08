// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Test-only reference code for the cloud-KMS exchange simulation.
 *
 * This is a second, independent implementation of the parts the simulation
 * runs on the in-browser HSM: the RFC 9180 key schedule and AEAD, RSA-OAEP plus
 * AES-KWP, and AES-KW. It uses Node's crypto, so a bug in the HSM path cannot
 * hide by being shared with the code that checks it. The key schedule is itself
 * checked against the published draft-ietf-hpke-pq vectors in
 * cloudKmsExchange.test.ts before anything is compared with the engine.
 */
import {
  constants,
  createCipheriv,
  createDecipheriv,
  createHmac,
  createPublicKey,
  hkdfSync,
  publicEncrypt,
  randomBytes,
} from 'node:crypto'

type Hash = 'sha256' | 'sha384' | 'sha512'
const HASH_LEN: Record<Hash, number> = { sha256: 32, sha384: 48, sha512: 64 }
const KDF_HASH: Record<number, Hash> = { 1: 'sha256', 2: 'sha384', 3: 'sha512' }
const AEAD_KEY_LEN: Record<number, number> = { 1: 16, 2: 32, 3: 32 }
const AEAD_NAME: Record<number, 'aes-128-gcm' | 'aes-256-gcm' | 'chacha20-poly1305'> = {
  1: 'aes-128-gcm',
  2: 'aes-256-gcm',
  3: 'chacha20-poly1305',
}

const utf8 = (s: string) => new TextEncoder().encode(s)
const cat = (...p: Uint8Array[]): Uint8Array => Uint8Array.from(Buffer.concat(p))
const i2osp = (n: number, len: number): Uint8Array => {
  const out = new Uint8Array(len)
  for (let i = len - 1; i >= 0; i--) {
    out[i] = n & 0xff
    n = Math.floor(n / 256)
  }
  return out
}
const hmac = (hash: Hash, key: Uint8Array, data: Uint8Array): Uint8Array =>
  Uint8Array.from(createHmac(hash, key).update(data).digest())

const extract = (hash: Hash, salt: Uint8Array, ikm: Uint8Array): Uint8Array =>
  hmac(hash, salt.length ? salt : new Uint8Array(HASH_LEN[hash]), ikm)

function expand(hash: Hash, prk: Uint8Array, info: Uint8Array, len: number): Uint8Array {
  const out: number[] = []
  let t: Uint8Array = new Uint8Array(0)
  for (let i = 1; out.length < len; i++) {
    t = hmac(hash, prk, cat(t, info, Uint8Array.of(i)))
    out.push(...t)
  }
  return Uint8Array.from(out.slice(0, len))
}

const V1 = utf8('HPKE-v1')

/** RFC 9180 section 5.1 key schedule, base mode, two-stage KDF. */
export function hpkeKeyScheduleReference(p: {
  kemId: number
  kdfId: number
  aeadId: number
  sharedSecret: Uint8Array
  info: Uint8Array
}): { key: Uint8Array; baseNonce: Uint8Array } {
  const hash = KDF_HASH[p.kdfId]
  const suiteId = cat(utf8('HPKE'), i2osp(p.kemId, 2), i2osp(p.kdfId, 2), i2osp(p.aeadId, 2))
  const lExtract = (salt: Uint8Array, label: string, ikm: Uint8Array) =>
    extract(hash, salt, cat(V1, suiteId, utf8(label), ikm))
  const lExpand = (prk: Uint8Array, label: string, info: Uint8Array, len: number) =>
    expand(hash, prk, cat(i2osp(len, 2), V1, suiteId, utf8(label), info), len)

  const empty = new Uint8Array(0)
  const pskIdHash = lExtract(empty, 'psk_id_hash', empty)
  const infoHash = lExtract(empty, 'info_hash', p.info)
  const context = cat(Uint8Array.of(0), pskIdHash, infoHash)
  const secret = lExtract(p.sharedSecret, 'secret', empty)
  return {
    key: lExpand(secret, 'key', context, AEAD_KEY_LEN[p.aeadId]),
    baseNonce: lExpand(secret, 'base_nonce', context, 12),
  }
}

const seqNonce = (base: Uint8Array, seq: number): Uint8Array => {
  const n = Uint8Array.from(base)
  for (let i = 0; i < 4; i++) n[n.length - 1 - i] ^= (seq >>> (8 * i)) & 0xff
  return n
}

/** AEAD seal, output = ciphertext followed by the 16-byte tag (the HPKE layout). */
export function aeadSealReference(
  aeadId: number,
  key: Uint8Array,
  baseNonce: Uint8Array,
  seq: number,
  aad: Uint8Array,
  pt: Uint8Array
): Uint8Array {
  const c = createCipheriv(AEAD_NAME[aeadId], key, seqNonce(baseNonce, seq), {
    authTagLength: 16,
  } as never) as ReturnType<typeof createCipheriv> & {
    setAAD: (b: Buffer) => void
    getAuthTag: () => Buffer
  }
  c.setAAD(Buffer.from(aad))
  const body = Buffer.concat([c.update(pt), c.final()])
  return Uint8Array.from(Buffer.concat([body, c.getAuthTag()]))
}

/** AEAD open; throws when authentication fails. */
export function aeadOpenReference(
  aeadId: number,
  key: Uint8Array,
  baseNonce: Uint8Array,
  seq: number,
  aad: Uint8Array,
  ct: Uint8Array
): Uint8Array {
  const d = createDecipheriv(AEAD_NAME[aeadId], key, seqNonce(baseNonce, seq), {
    authTagLength: 16,
  } as never) as ReturnType<typeof createDecipheriv> & {
    setAAD: (b: Buffer) => void
    setAuthTag: (b: Buffer) => void
  }
  d.setAAD(Buffer.from(aad))
  d.setAuthTag(Buffer.from(ct.subarray(ct.length - 16)))
  return Uint8Array.from(Buffer.concat([d.update(ct.subarray(0, ct.length - 16)), d.final()]))
}

/** HKDF-SHA-256 (RFC 5869), used by the AWS key-establishment flows. */
export function hkdfSha256Reference(ikm: Uint8Array, info: Uint8Array, len = 32): Uint8Array {
  return Uint8Array.from(Buffer.from(hkdfSync('sha256', ikm, new Uint8Array(0), info, len)))
}

/** AES-KW (RFC 3394) with the default IV, through Node's id-aes256-wrap. */
export function aesKwReference(
  kek: Uint8Array,
  key: Uint8Array,
  mode: 'wrap' | 'unwrap'
): Uint8Array {
  const iv = Buffer.from('A6A6A6A6A6A6A6A6', 'hex')
  const c =
    mode === 'wrap'
      ? createCipheriv('id-aes256-wrap', kek, iv)
      : createDecipheriv('id-aes256-wrap', kek, iv)
  return Uint8Array.from(Buffer.concat([c.update(key), c.final()]))
}

/** AES-KWP (RFC 5649) with the default IV, through Node's id-aes256-wrap-pad. */
export function aesKwpReference(kek: Uint8Array, key: Uint8Array): Uint8Array {
  const c = createCipheriv('id-aes256-wrap-pad', kek, Buffer.from('A65959A6', 'hex'))
  return Uint8Array.from(Buffer.concat([c.update(key), c.final()]))
}

/**
 * What a third party's own tooling would produce for CKM_RSA_AES_KEY_WRAP:
 * RSA-OAEP(temporary AES-256 key) followed by AES-KWP(target key). `publicKeyDer`
 * is the provider's DER RSAPublicKey (RFC 8017 A.1.1).
 */
export function rsaAesKeyWrapReference(
  publicKeyDer: Uint8Array,
  target: Uint8Array,
  oaepHash: 'sha1' | 'sha256'
): Uint8Array {
  const pub = createPublicKey({ key: Buffer.from(publicKeyDer), format: 'der', type: 'pkcs1' })
  const temp = randomBytes(32)
  const rsaPart = publicEncrypt(
    { key: pub, padding: constants.RSA_PKCS1_OAEP_PADDING, oaepHash },
    temp
  )
  return cat(rsaPart, aesKwpReference(temp, target))
}
