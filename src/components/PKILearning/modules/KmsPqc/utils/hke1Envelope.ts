// SPDX-License-Identifier: AGPL-3.0-only
/* eslint-disable security/detect-object-injection -- fixed-length byte buffers and small enum tables indexed by validated integers */
/**
 * HKE1: the complete stored/transmitted byte layout of the KMS envelope samples in this module.
 *
 * PROJECT SAMPLE FORMAT, NOT A STANDARD. It is not HPKE, X-Wing, a TLS structure or any cloud
 * provider's wrapped-key format. It exists so the size of "the whole envelope" can be counted from
 * the same bytes a receiver parses, instead of adding up a few chosen fields.
 *
 * Layout (all lengths big-endian):
 *   header (18 bytes) = "HKE1" || mode(1) || suite(1) || six uint16 field lengths
 *   fields, in this order: key ID, salt, info, ephemeral public key, KEM ciphertext, wrapped DEK
 *
 * Boundary: these are the complete binary storage object / transmission bytes. Recipient key
 * provisioning, private keys, shared secrets, HTTP/TLS framing and any hex/base64 text encoding are
 * outside it; a displayed hex or base64 length is a different, separately labelled number.
 */

export const HKE1_FORMAT_LABEL = 'Project sample format, not a standard'
export const HKE1_MAGIC = 'HKE1'
export const HKE1_HEADER_BYTES = 18

/** 1 = RSA-2048 OAEP-SHA256, 2 = ML-KEM-768, 3 = X25519 + ML-KEM-768. The suite byte repeats the mode. */
export type Hke1Mode = 1 | 2 | 3

export const HKE1_MODES: readonly Hke1Mode[] = [1, 2, 3]

export const HKE1_MODE_NAMES: Record<Hke1Mode, string> = {
  1: 'RSA-2048 OAEP-SHA256',
  2: 'ML-KEM-768 + HKDF-SHA-256 + AES-256-KW',
  3: 'X25519 + ML-KEM-768 + HKDF-SHA-256 + AES-256-KW',
}

export const HKE1_KEY_ID = 'demo-kek-1'
export const HKE1_SALT = 'kms-envelope-salt-v1'
export const HKE1_INFO: Record<2 | 3, string> = { 2: 'kms-envelope-v1', 3: 'hybrid-kek' }

const RSA_2048_CIPHERTEXT_BYTES = 256
const ML_KEM_768_CIPHERTEXT_BYTES = 1088
const X25519_PUBLIC_BYTES = 32
/** AES-256-KW (RFC 3394) of a 32-byte DEK: 32 bytes plus the 8-byte integrity block. */
const WRAPPED_DEK_BYTES = 40

export const HKE1_FIELD_NAMES = [
  'Key ID',
  'Salt',
  'Info',
  'Ephemeral public key',
  'KEM ciphertext',
  'Wrapped DEK',
] as const

export interface Hke1Fields {
  keyId: Uint8Array
  salt: Uint8Array
  info: Uint8Array
  ephemeralPublicKey: Uint8Array
  kemCiphertext: Uint8Array
  wrappedDek: Uint8Array
}

const utf8 = (text: string) => new TextEncoder().encode(text)

/** Field lengths a well-formed envelope of this mode carries, in wire order. */
export function hke1FieldLengths(mode: Hke1Mode): number[] {
  return [
    utf8(HKE1_KEY_ID).length,
    mode === 1 ? 0 : utf8(HKE1_SALT).length,
    mode === 1 ? 0 : utf8(HKE1_INFO[mode]).length,
    mode === 3 ? X25519_PUBLIC_BYTES : 0,
    mode === 1 ? 0 : ML_KEM_768_CIPHERTEXT_BYTES,
    mode === 1 ? RSA_2048_CIPHERTEXT_BYTES : WRAPPED_DEK_BYTES,
  ]
}

/** Complete envelope size for a mode, counted from the layout. 284 / 1,191 / 1,218 bytes. */
export function hke1TotalBytes(mode: Hke1Mode): number {
  return hke1FieldLengths(mode).reduce((sum, n) => sum + n, HKE1_HEADER_BYTES)
}

const concat = (...parts: Uint8Array[]): Uint8Array => {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0))
  let offset = 0
  for (const part of parts) {
    out.set(part, offset)
    offset += part.length
  }
  return out
}

const u16 = (n: number): Uint8Array => {
  if (!Number.isInteger(n) || n < 0 || n > 0xffff)
    throw new Error('HKE1 field exceeds 65,535 bytes')
  return new Uint8Array([n >> 8, n & 0xff])
}

/**
 * Generic serializer: writes exactly the fields it is given. It does not check them against the
 * mode, so negative tests can build malformed envelopes; `parseHke1` is the strict side.
 */
export function packHke1(mode: Hke1Mode, fields: readonly Uint8Array[]): Uint8Array {
  if (fields.length !== 6) throw new Error('HKE1 carries exactly six fields')
  return concat(
    utf8(HKE1_MAGIC),
    new Uint8Array([mode, mode]),
    ...fields.map((field) => u16(field.length)),
    ...fields
  )
}

/** Builds the canonical envelope for a mode from the three bytes strings the sender produced. */
export function buildHke1(
  mode: Hke1Mode,
  parts: { ephemeralPublicKey?: Uint8Array; kemCiphertext?: Uint8Array; wrappedDek: Uint8Array }
): Uint8Array {
  const empty = new Uint8Array(0)
  return packHke1(mode, [
    utf8(HKE1_KEY_ID),
    mode === 1 ? empty : utf8(HKE1_SALT),
    mode === 1 ? empty : utf8(HKE1_INFO[mode]),
    mode === 3 ? (parts.ephemeralPublicKey ?? empty) : empty,
    mode === 1 ? empty : (parts.kemCiphertext ?? empty),
    parts.wrappedDek,
  ])
}

export interface ParsedHke1 {
  mode: Hke1Mode
  keyId: Uint8Array
  salt: Uint8Array
  info: Uint8Array
  ephemeralPublicKey: Uint8Array
  kemCiphertext: Uint8Array
  wrappedDek: Uint8Array
}

const equal = (a: Uint8Array, b: Uint8Array) =>
  a.length === b.length && a.every((v, i) => v === b[i])

/** Strict parser: any deviation from the layout throws. Reads only the received bytes. */
export function parseHke1(wire: Uint8Array): ParsedHke1 {
  if (wire.length < HKE1_HEADER_BYTES) throw new Error('HKE1: shorter than the 18-byte header')
  if (new TextDecoder().decode(wire.subarray(0, 4)) !== HKE1_MAGIC)
    throw new Error('HKE1: unknown version')
  const mode = wire[4]
  if (mode !== 1 && mode !== 2 && mode !== 3) throw new Error('HKE1: unknown mode')
  if (wire[5] !== mode) throw new Error('HKE1: suite does not match mode')
  const view = new DataView(wire.buffer, wire.byteOffset, wire.byteLength)
  const expected = hke1FieldLengths(mode)
  const fields: Uint8Array[] = []
  let position = HKE1_HEADER_BYTES
  for (let i = 0; i < 6; i++) {
    const length = view.getUint16(6 + 2 * i, false)
    if (length !== expected[i]) throw new Error(`HKE1: ${HKE1_FIELD_NAMES[i]} length is not valid`)
    if (position + length > wire.length) throw new Error('HKE1: truncated')
    fields.push(wire.subarray(position, position + length))
    position += length
  }
  if (position !== wire.length) throw new Error('HKE1: trailing bytes')
  const [keyId, salt, info, ephemeralPublicKey, kemCiphertext, wrappedDek] = fields
  if (!equal(keyId, utf8(HKE1_KEY_ID))) throw new Error('HKE1: unknown key ID')
  if (mode !== 1) {
    if (!equal(salt, utf8(HKE1_SALT))) throw new Error('HKE1: unexpected salt')
    if (!equal(info, utf8(HKE1_INFO[mode]))) throw new Error('HKE1: unexpected info')
  }
  return { mode, keyId, salt, info, ephemeralPublicKey, kemCiphertext, wrappedDek }
}

/**
 * What the receiving side supplies. Each primitive holds the receiver's own private key; none of
 * them sees the sender's state. HKDF/AES-KW are plain functions of their inputs.
 */
export interface Hke1ReceiverPrimitives {
  rsaOaepSha256Decrypt(ciphertext: Uint8Array): Promise<Uint8Array> | Uint8Array
  mlKem768Decapsulate(ciphertext: Uint8Array): Promise<Uint8Array> | Uint8Array
  x25519Derive(peerPublicKey: Uint8Array): Promise<Uint8Array> | Uint8Array
  hkdfSha256(
    secret: Uint8Array,
    salt: Uint8Array,
    info: Uint8Array,
    length: number
  ): Promise<Uint8Array> | Uint8Array
  aesKwUnwrap(kek: Uint8Array, wrapped: Uint8Array): Promise<Uint8Array> | Uint8Array
}

/**
 * Recovers the DEK from the serialized bytes alone. The secret order for the hybrid is
 * ML-KEM secret first, then X25519, into HKDF-SHA-256.
 */
export async function recoverHke1Dek(
  wire: Uint8Array,
  receiver: Hke1ReceiverPrimitives
): Promise<Uint8Array> {
  const parsed = parseHke1(wire)
  if (parsed.mode === 1) return receiver.rsaOaepSha256Decrypt(parsed.wrappedDek)
  const kemSecret = await receiver.mlKem768Decapsulate(parsed.kemCiphertext)
  const secret =
    parsed.mode === 3
      ? concat(kemSecret, await receiver.x25519Derive(parsed.ephemeralPublicKey))
      : kemSecret
  const kek = await receiver.hkdfSha256(secret, parsed.salt, parsed.info, 32)
  return receiver.aesKwUnwrap(kek, parsed.wrappedDek)
}
