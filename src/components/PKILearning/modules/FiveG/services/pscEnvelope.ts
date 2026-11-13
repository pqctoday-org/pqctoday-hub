// SPDX-License-Identifier: AGPL-3.0-only
/* eslint-disable security/detect-object-injection -- fixed-length byte buffers and small enum tables indexed by validated integers */
/**
 * PSC1: the complete byte layout of the Profile C sample in this module.
 *
 * PROJECT SAMPLE FORMAT, NOT A STANDARD. It is not a 3GPP TS 23.003 SUCI encoding and does not use
 * an assigned protection-scheme identifier; the current ETSI/3GPP annex still reserves those. Profile
 * A and Profile B keep their own encodings, untouched.
 *
 * Layout (lengths big-endian):
 *   header (15 bytes) = "PSC1" || mode(1) || MCC(3 ASCII digits) || MNC(3 ASCII digits)
 *                       || routing indicator(1 ASCII digit) || key ID(1) || MSIN-ciphertext length(2)
 *   [ X25519 ephemeral public key, 32 bytes: hybrid mode only ]
 *   ML-KEM-768 ciphertext, 1,088 bytes
 *   encrypted BCD MSIN, n bytes
 *   MAC, 8 bytes: HMAC-SHA3-256 over every preceding byte, truncated
 *
 * Mode 1 = pure ML-KEM-768. Mode 2 = X25519 + ML-KEM-768 with Z = SHA-256(Z_ecdh || Z_kem).
 * KDF: SHA3-256(Z || counter(4) || SharedInfo), counter 1 gives K_enc, counter 2 gives K_mac;
 * SharedInfo is the ephemeral public key in hybrid mode and empty in pure mode. MSIN encryption is
 * AES-256-CTR with a zero IV (a sample choice).
 *
 * The receiver works from the received bytes and its own private keys only. It never sees the
 * sender's handles, secrets, derived keys or plaintext.
 */

export const PSC1_FORMAT_LABEL = 'Project sample format, not a standard'
export const PSC1_MAGIC = 'PSC1'
export const PSC1_HEADER_BYTES = 15
export const PSC1_KEM_CIPHERTEXT_BYTES = 1088
export const PSC1_EPHEMERAL_BYTES = 32
export const PSC1_MAC_BYTES = 8
export const PSC1_MAX_MSIN_CIPHERTEXT_BYTES = 8

/** 1 = pure ML-KEM-768, 2 = X25519 + ML-KEM-768 hybrid. */
export type Psc1Mode = 1 | 2

export interface Psc1Header {
  mode: Psc1Mode
  mcc: string
  mnc: string
  routingIndicator: string
  keyId: number
}

const utf8 = (text: string) => new TextEncoder().encode(text)
const concat = (...parts: Uint8Array[]): Uint8Array => {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0))
  let offset = 0
  for (const part of parts) {
    out.set(part, offset)
    offset += part.length
  }
  return out
}
const equalBytes = (a: Uint8Array, b: Uint8Array) =>
  a.length === b.length && a.every((v, i) => v === b[i])

/** Complete envelope size for a mode and an MSIN ciphertext length. 1,116 / 1,148 for 5 bytes. */
export function psc1TotalBytes(mode: Psc1Mode, msinCiphertextBytes: number): number {
  return (
    PSC1_HEADER_BYTES +
    (mode === 2 ? PSC1_EPHEMERAL_BYTES : 0) +
    PSC1_KEM_CIPHERTEXT_BYTES +
    msinCiphertextBytes +
    PSC1_MAC_BYTES
  )
}

/** Two BCD digits per byte, low nibble first (TS 23.003 order), odd count padded with 0xF. */
export function bcdEncodeMsin(digits: string): Uint8Array {
  if (!/^[0-9]{1,15}$/.test(digits)) throw new Error('PSC1: MSIN must be 1 to 15 decimal digits')
  const padded = digits.length % 2 ? `${digits}f` : digits
  const out = new Uint8Array(padded.length / 2)
  for (let i = 0; i < padded.length; i += 2)
    out[i / 2] = (parseInt(padded[i + 1], 16) << 4) | parseInt(padded[i], 16)
  return out
}

export function bcdDecodeMsin(bytes: Uint8Array): string {
  let digits = ''
  for (const byte of bytes) {
    const low = byte & 0x0f
    const high = byte >> 4
    if (low > 9) throw new Error('PSC1: BCD digit out of range')
    digits += low.toString()
    if (high === 0xf) continue
    if (high > 9) throw new Error('PSC1: BCD digit out of range')
    digits += high.toString()
  }
  return digits
}

const X25519_SPKI_PREFIX = Uint8Array.from([
  0x30, 0x2a, 0x30, 0x05, 0x06, 0x03, 0x2b, 0x65, 0x6e, 0x03, 0x21, 0x00,
])

/**
 * Strict X25519 public key normalization: exactly 32 raw bytes, or the exact 44-byte
 * SubjectPublicKeyInfo for the X25519 OID. Other OIDs, other lengths and malformed wrappers throw.
 */
export function normalizeX25519Public(bytes: Uint8Array): Uint8Array {
  if (bytes.length === PSC1_EPHEMERAL_BYTES) return bytes
  if (bytes.length === X25519_SPKI_PREFIX.length + PSC1_EPHEMERAL_BYTES) {
    if (equalBytes(bytes.subarray(0, X25519_SPKI_PREFIX.length), X25519_SPKI_PREFIX))
      return bytes.subarray(X25519_SPKI_PREFIX.length)
    throw new Error('PSC1: SPKI is not an X25519 public key')
  }
  throw new Error('PSC1: X25519 public key must be 32 raw bytes or a 44-byte X25519 SPKI')
}

function headerBytes(header: Psc1Header, msinCiphertextBytes: number): Uint8Array {
  if (header.mode !== 1 && header.mode !== 2) throw new Error('PSC1: unknown mode')
  if (!/^[0-9]{3}$/.test(header.mcc)) throw new Error('PSC1: MCC must be three digits')
  if (!/^[0-9]{3}$/.test(header.mnc)) throw new Error('PSC1: MNC must be three digits')
  if (!/^[0-9]$/.test(header.routingIndicator))
    throw new Error('PSC1: routing indicator must be one digit')
  if (!Number.isInteger(header.keyId) || header.keyId < 0 || header.keyId > 255)
    throw new Error('PSC1: key ID must be 0..255')
  if (
    !Number.isInteger(msinCiphertextBytes) ||
    msinCiphertextBytes < 1 ||
    msinCiphertextBytes > PSC1_MAX_MSIN_CIPHERTEXT_BYTES
  )
    throw new Error('PSC1: MSIN ciphertext must be 1 to 8 bytes')
  return concat(
    utf8(PSC1_MAGIC),
    Uint8Array.of(header.mode),
    utf8(header.mcc),
    utf8(header.mnc),
    utf8(header.routingIndicator),
    Uint8Array.of(header.keyId),
    Uint8Array.of(msinCiphertextBytes >> 8, msinCiphertextBytes & 0xff)
  )
}

/** Everything the MAC covers: header, optional ephemeral key, KEM ciphertext, MSIN ciphertext. */
export function buildPsc1MacInput(
  header: Psc1Header,
  parts: {
    ephemeralPublicKey?: Uint8Array
    kemCiphertext: Uint8Array
    msinCiphertext: Uint8Array
  }
): Uint8Array {
  const ephemeral =
    header.mode === 2
      ? normalizeX25519Public(parts.ephemeralPublicKey ?? new Uint8Array(0))
      : new Uint8Array(0)
  if (header.mode === 1 && parts.ephemeralPublicKey?.length)
    throw new Error('PSC1: pure mode carries no ephemeral public key')
  if (parts.kemCiphertext.length !== PSC1_KEM_CIPHERTEXT_BYTES)
    throw new Error('PSC1: ML-KEM-768 ciphertext must be 1,088 bytes')
  return concat(
    headerBytes(header, parts.msinCiphertext.length),
    ephemeral,
    parts.kemCiphertext,
    parts.msinCiphertext
  )
}

/** Appends the (truncated) MAC to the covered bytes to make the transmitted envelope. */
export function assemblePsc1(macInput: Uint8Array, tag: Uint8Array): Uint8Array {
  if (tag.length !== PSC1_MAC_BYTES) throw new Error('PSC1: MAC must be 8 bytes')
  return concat(macInput, tag)
}

export interface ParsedPsc1 extends Psc1Header {
  ephemeralPublicKey: Uint8Array
  kemCiphertext: Uint8Array
  msinCiphertext: Uint8Array
  tag: Uint8Array
  /** The bytes the MAC covers: the whole message except the tag. */
  macInput: Uint8Array
}

/** Strict parser: reads only the received bytes and throws on any deviation. */
export function parsePsc1(wire: Uint8Array): ParsedPsc1 {
  const minimum = PSC1_HEADER_BYTES + PSC1_KEM_CIPHERTEXT_BYTES + 1 + PSC1_MAC_BYTES
  if (wire.length < minimum) throw new Error('PSC1: shorter than the smallest envelope')
  if (new TextDecoder().decode(wire.subarray(0, 4)) !== PSC1_MAGIC)
    throw new Error('PSC1: unknown version')
  const mode = wire[4]
  if (mode !== 1 && mode !== 2) throw new Error('PSC1: unknown mode')
  const text = new TextDecoder().decode(wire.subarray(5, 12))
  if (!/^[0-9]{7}$/.test(text)) throw new Error('PSC1: PLMN or routing indicator is not digits')
  const msinLength = (wire[13] << 8) | wire[14]
  if (msinLength < 1 || msinLength > PSC1_MAX_MSIN_CIPHERTEXT_BYTES)
    throw new Error('PSC1: MSIN ciphertext length is not valid')
  const ephemeralBytes = mode === 2 ? PSC1_EPHEMERAL_BYTES : 0
  if (wire.length !== psc1TotalBytes(mode, msinLength))
    throw new Error('PSC1: length does not match the header (truncated, trailing or missing field)')
  let position = PSC1_HEADER_BYTES
  const ephemeralPublicKey = wire.subarray(position, position + ephemeralBytes)
  position += ephemeralBytes
  const kemCiphertext = wire.subarray(position, position + PSC1_KEM_CIPHERTEXT_BYTES)
  position += PSC1_KEM_CIPHERTEXT_BYTES
  const msinCiphertext = wire.subarray(position, position + msinLength)
  position += msinLength
  return {
    mode,
    mcc: text.slice(0, 3),
    mnc: text.slice(3, 6),
    routingIndicator: text.slice(6, 7),
    keyId: wire[12],
    ephemeralPublicKey,
    kemCiphertext,
    msinCiphertext,
    tag: wire.subarray(position),
    macInput: wire.subarray(0, wire.length - PSC1_MAC_BYTES),
  }
}

/** Primitives the receiving side supplies; the private keys live inside these closures. */
export interface Psc1ReceiverPrimitives {
  mlKem768Decapsulate(ciphertext: Uint8Array): Promise<Uint8Array> | Uint8Array
  x25519Derive(peerPublicKey: Uint8Array): Promise<Uint8Array> | Uint8Array
  sha256(data: Uint8Array): Promise<Uint8Array> | Uint8Array
  sha3_256(data: Uint8Array): Promise<Uint8Array> | Uint8Array
  hmacSha3_256(key: Uint8Array, data: Uint8Array): Promise<Uint8Array> | Uint8Array
  aes256CtrZeroIv(key: Uint8Array, data: Uint8Array): Promise<Uint8Array> | Uint8Array
}

/** What the receiving home network is configured to accept; checked before any key operation. */
export interface Psc1HomeNetwork {
  mcc: string
  mnc: string
  keyId: number
}

export interface Psc1Recovery {
  header: Psc1Header
  msinDigits: string
  msinBcd: Uint8Array
  /** Values the receiver computed, for display. */
  trace: {
    kemSecret: Uint8Array
    ecdhSecret: Uint8Array | null
    z: Uint8Array
    kEnc: Uint8Array
    kMac: Uint8Array
    recomputedTag: Uint8Array
    receivedTag: Uint8Array
  }
}

export class Psc1Refusal extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'Psc1Refusal'
  }
}

const counter = (n: number) => Uint8Array.of(0, 0, 0, n)

/** Constant-time comparison of the truncated tags. */
function tagsEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i]
  return diff === 0
}

/**
 * Recovers the MSIN from the received bytes alone: parse, check the configured home network,
 * decapsulate, derive the ECDH secret from the transmitted ephemeral key (hybrid), combine, derive
 * K_enc and K_mac, verify the MAC over the whole message, and only then decrypt and BCD-decode.
 * Throws {@link Psc1Refusal} when the MAC fails and plain errors for malformed input.
 */
export async function recoverPsc1(
  wire: Uint8Array,
  receiver: Psc1ReceiverPrimitives,
  homeNetwork: Psc1HomeNetwork
): Promise<Psc1Recovery> {
  const parsed = parsePsc1(wire)
  if (parsed.mcc !== homeNetwork.mcc || parsed.mnc !== homeNetwork.mnc)
    throw new Psc1Refusal('PSC1: PLMN is not this home network')
  if (parsed.keyId !== homeNetwork.keyId) throw new Psc1Refusal('PSC1: unknown home network key ID')
  const kemSecret = await receiver.mlKem768Decapsulate(parsed.kemCiphertext)
  let z = kemSecret
  let ecdhSecret: Uint8Array | null = null
  if (parsed.mode === 2) {
    ecdhSecret = await receiver.x25519Derive(normalizeX25519Public(parsed.ephemeralPublicKey))
    z = await receiver.sha256(concat(ecdhSecret, kemSecret))
  }
  const sharedInfo = parsed.mode === 2 ? parsed.ephemeralPublicKey : new Uint8Array(0)
  const kEnc = await receiver.sha3_256(concat(z, counter(1), sharedInfo))
  const kMac = await receiver.sha3_256(concat(z, counter(2), sharedInfo))
  const recomputedTag = (await receiver.hmacSha3_256(kMac, parsed.macInput)).slice(
    0,
    PSC1_MAC_BYTES
  )
  const trace = { kemSecret, ecdhSecret, z, kEnc, kMac, recomputedTag, receivedTag: parsed.tag }
  if (!tagsEqual(recomputedTag, parsed.tag)) {
    const refusal = new Psc1Refusal('PSC1: MAC refused before decryption')
    ;(refusal as Psc1Refusal & { trace: typeof trace }).trace = trace
    throw refusal
  }
  const msinBcd = await receiver.aes256CtrZeroIv(kEnc, parsed.msinCiphertext)
  return {
    header: {
      mode: parsed.mode,
      mcc: parsed.mcc,
      mnc: parsed.mnc,
      routingIndicator: parsed.routingIndicator,
      keyId: parsed.keyId,
    },
    msinDigits: bcdDecodeMsin(msinBcd),
    msinBcd,
    trace,
  }
}
