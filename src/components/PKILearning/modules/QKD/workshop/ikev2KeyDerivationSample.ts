// SPDX-License-Identifier: AGPL-3.0-only
/* eslint-disable security/detect-object-injection -- Map lookup by a validated string key */
/**
 * IKEv2 initial key derivation (RFC 7296 section 2.14) with the optional post-quantum preshared
 * key mixing of RFC 8784, for the sample profile of this module:
 *
 *   DH group 19 (ECP-256), PRF_HMAC_SHA2_256, AES-256-CBC with HMAC-SHA-256-128 (the Hub's classical
 *   IKEv2 profile). Every key is 32 bytes: SK_d, SK_pi and SK_pr are the PRF's preferred key length
 *   (RFC 7296), SK_ei/SK_er the AES-256 key, SK_ai/SK_ar the HMAC-SHA-256-128 integrity key.
 *
 * What runs: the real derivations. What does not: IKE_SA_INIT / IKE_AUTH messages, authentication,
 * Child SAs, any network, any real QKD link. Peers, nonces, SPIs and keys are fictional.
 *
 *   SKEYSEED = prf(Ni | Nr, g^ir)
 *   {SK_d' | SK_ai | SK_ar | SK_ei | SK_er | SK_pi' | SK_pr'} = prf+(SKEYSEED, Ni | Nr | SPIi | SPIr)
 *   RFC 8784, only when a PPK is in use:
 *   SK_d = prf+(PPK, SK_d')   SK_pi = prf+(PPK, SK_pi')   SK_pr = prf+(PPK, SK_pr')
 */
import { hmac } from '@noble/hashes/hmac.js'
import { sha256 } from '@noble/hashes/sha2.js'
import { p256 } from '@noble/curves/nist.js'

export const IKE_SAMPLE_PROFILE = {
  dhGroup: 19,
  dhGroupName: 'ECP-256 (DH Group 19)',
  prf: 'PRF_HMAC_SHA2_256',
  prfName: 'PRF-HMAC-SHA-256',
  encryption: 'AES-256-CBC',
  integrity: 'HMAC-SHA-256-128',
  /** Output size of the PRF and every key length in this profile, in bytes. */
  keyBytes: 32,
} as const

/** RFC 8784 section 5.1: PPK_ID type values; the first octet of the PPK_ID is the type. */
export const PPK_ID_TYPE_OPAQUE = 1
/** RFC 8784 notification types (IANA IKEv2 Notify Message Status Types). */
export const NOTIFY_USE_PPK = 16435
export const NOTIFY_PPK_IDENTITY = 16436
export const NOTIFY_NO_PPK_AUTH = 16437
/** RFC 8784 section 6: the strongest practice is a PPK with at least 256 bits of entropy. */
export const MIN_PPK_BYTES = 32

const KEY_BYTES = IKE_SAMPLE_PROFILE.keyBytes
const NONCE_BYTES = 32
const SPI_BYTES = 8

const concat = (...parts: Uint8Array[]): Uint8Array => {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0))
  let offset = 0
  for (const part of parts) {
    out.set(part, offset)
    offset += part.length
  }
  return out
}

function requireBytes(name: string, value: unknown, length: number): Uint8Array {
  if (!(value instanceof Uint8Array)) throw new Error(`${name} must be a byte array`)
  if (value.length !== length) throw new Error(`${name} must be exactly ${length} bytes`)
  return value
}

export const hexOf = (bytes: Uint8Array): string =>
  Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')

/** The negotiated PRF with its key and data roles: HMAC-SHA-256, key first. */
export function prfHmacSha256(key: Uint8Array, data: Uint8Array): Uint8Array {
  return hmac(sha256, key, data)
}

/**
 * RFC 7296 section 2.13: prf+(K, S) = T1 | T2 | ..., T1 = prf(K, S | 0x01),
 * Tn = prf(K, T(n-1) | S | n). Not defined beyond 255 blocks.
 */
export function prfPlus(key: Uint8Array, seed: Uint8Array, length: number): Uint8Array {
  const blockBytes = KEY_BYTES
  if (!Number.isInteger(length) || length < 0 || length > 255 * blockBytes)
    throw new Error('prf+ output must be 0 to 255 PRF blocks')
  const out = new Uint8Array(length)
  let previous: Uint8Array = new Uint8Array(0)
  for (let n = 1, offset = 0; offset < length; n++, offset += blockBytes) {
    previous = prfHmacSha256(key, concat(previous, seed, Uint8Array.of(n)))
    out.set(previous.subarray(0, Math.min(blockBytes, length - offset)), offset)
  }
  return out
}

/** Fresh ECP-256 key pair. The public value is the uncompressed SEC1 point (library input only). */
export function generateEcp256KeyPair(): { privateKey: Uint8Array; publicKey: Uint8Array } {
  const privateKey = p256.utils.randomSecretKey()
  return { privateKey, publicKey: p256.getPublicKey(privateKey, false) }
}

/**
 * Group 19 shared secret g^ir: the fixed-width 32-byte big-endian x coordinate. The peer's point
 * must be a 65-byte uncompressed SEC1 point that lies on the curve.
 */
export function ecp256SharedX(privateKey: Uint8Array, peerPublicKey: Uint8Array): Uint8Array {
  if (!(privateKey instanceof Uint8Array) || privateKey.length !== 32)
    throw new Error('ECP-256 private key must be 32 bytes')
  if (
    !(peerPublicKey instanceof Uint8Array) ||
    peerPublicKey.length !== 65 ||
    peerPublicKey[0] !== 4
  )
    throw new Error('Peer public value must be a 65-byte uncompressed point')
  let shared: Uint8Array
  try {
    shared = p256.getSharedSecret(privateKey, peerPublicKey, true)
  } catch {
    throw new Error('Peer public value is not a valid ECP-256 point')
  }
  return shared.slice(1)
}

/** SKEYSEED = prf(Ni | Nr, g^ir). The 32-byte widths are this sample's fixture, not an IKE rule. */
export function deriveSkeyseed(ni: Uint8Array, nr: Uint8Array, sharedX: Uint8Array): Uint8Array {
  requireBytes('Ni', ni, NONCE_BYTES)
  requireBytes('Nr', nr, NONCE_BYTES)
  requireBytes('Shared secret g^ir', sharedX, KEY_BYTES)
  return prfHmacSha256(concat(ni, nr), sharedX)
}

export interface IkeSaKeys {
  skeyseed: Uint8Array
  skD: Uint8Array
  skAi: Uint8Array
  skAr: Uint8Array
  skEi: Uint8Array
  skEr: Uint8Array
  skPi: Uint8Array
  skPr: Uint8Array
}

/** Ordinary IKEv2 (no PPK): SKEYSEED and the seven SK_* keys, in order, from prf+. */
export function deriveIkeSaKeys(inputs: {
  ni: Uint8Array
  nr: Uint8Array
  sharedX: Uint8Array
  spiI: Uint8Array
  spiR: Uint8Array
}): IkeSaKeys {
  const spiI = requireBytes('SPIi', inputs.spiI, SPI_BYTES)
  const spiR = requireBytes('SPIr', inputs.spiR, SPI_BYTES)
  if (spiI.every((b) => b === 0) || spiR.every((b) => b === 0))
    throw new Error('SPIi and SPIr must be non-zero')
  const skeyseed = deriveSkeyseed(inputs.ni, inputs.nr, inputs.sharedX)
  const material = prfPlus(skeyseed, concat(inputs.ni, inputs.nr, spiI, spiR), 7 * KEY_BYTES)
  const key = (index: number) => material.slice(index * KEY_BYTES, (index + 1) * KEY_BYTES)
  return {
    skeyseed,
    skD: key(0),
    skAi: key(1),
    skAr: key(2),
    skEi: key(3),
    skEr: key(4),
    skPi: key(5),
    skPr: key(6),
  }
}

export interface PpkMixResult {
  /** The values before mixing (SK_d', SK_pi', SK_pr'). */
  primed: { skD: Uint8Array; skPi: Uint8Array; skPr: Uint8Array }
  /** The keys the SA uses: SK_d, SK_pi and SK_pr replaced, everything else unchanged. */
  keys: IkeSaKeys
}

/**
 * RFC 8784 section 3: SK_d = prf+(PPK, SK_d'), SK_pi = prf+(PPK, SK_pi'), SK_pr = prf+(PPK, SK_pr').
 * SKEYSEED, SK_ai, SK_ar, SK_ei and SK_er are not touched.
 */
export function applyPpk(plain: IkeSaKeys, ppk: Uint8Array): PpkMixResult {
  if (!(ppk instanceof Uint8Array)) throw new Error('PPK must be a byte array')
  if (ppk.length < MIN_PPK_BYTES)
    throw new Error('PPK must be at least 256 bits (RFC 8784 section 6)')
  return {
    primed: { skD: plain.skD, skPi: plain.skPi, skPr: plain.skPr },
    keys: {
      ...plain,
      skD: prfPlus(ppk, plain.skD, plain.skD.length),
      skPi: prfPlus(ppk, plain.skPi, plain.skPi.length),
      skPr: prfPlus(ppk, plain.skPr, plain.skPr.length),
    },
  }
}

// --- QKD key identity (ETSI GS QKD 014) as the RFC 8784 PPK_ID -----------------------------------

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** The 16 octets of an ETSI GS QKD 014 key_ID (a UUID string). Anything else is refused. */
export function qkdKeyIdOctets(keyId: string): Uint8Array {
  if (typeof keyId !== 'string' || !UUID_PATTERN.test(keyId))
    throw new Error('QKD key_ID must be a UUID')
  const hex = keyId.replace(/-/g, '')
  return Uint8Array.from(hex.match(/../g)!, (pair) => parseInt(pair, 16))
}

/**
 * PPK_ID as sent in the PPK_IDENTITY notification: the first octet is the PPK_ID type
 * (PPK_ID_OPAQUE = 1), then the identifier. RFC 8784 leaves the opaque content to the peers; this
 * sample sends the 16 UUID octets of the QKD key_ID. Not a standardized QKD binding.
 */
export function ppkIdOpaqueFromQkdKeyId(keyId: string): Uint8Array {
  return concat(Uint8Array.of(PPK_ID_TYPE_OPAQUE), qkdKeyIdOctets(keyId))
}

/** What each peer's QKD node can supply: the key stored under a key_ID, or nothing. */
export interface QkdKeyStore {
  /** ETSI GS QKD 014 Get key with key IDs (dec_keys) on the node's own KME. */
  getKeyWithId(keyId: string): Uint8Array | undefined
}

/** Local stand-in for one QKD node. No network, no real link. */
export function createSampleQkdNode(held: ReadonlyMap<string, Uint8Array>): QkdKeyStore {
  return { getKeyWithId: (keyId) => held.get(keyId.toLowerCase()) }
}

// --- the whole sample ---------------------------------------------------------------------------

export class PpkAbort extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PpkAbort'
  }
}

export interface IkeQkdSampleInputs {
  ni: Uint8Array
  nr: Uint8Array
  spiI: Uint8Array
  spiR: Uint8Array
  initiator: { privateKey: Uint8Array; publicKey: Uint8Array }
  responder: { privateKey: Uint8Array; publicKey: Uint8Array }
  /** ETSI GS QKD 014 key_ID the initiator obtained and sends as the PPK_ID. */
  qkdKeyId: string
  /** Each peer fetches the key from its OWN node by that key ID. */
  initiatorNode: QkdKeyStore
  responderNode: QkdKeyStore
  /** RFC 8784 mandatory_or_not: when true, a missing PPK aborts instead of falling back. */
  ppkMandatory: boolean
}

export type PpkPathOutcome =
  | {
      path: 'ppk'
      ppkId: Uint8Array
      /** Both peers' results, each computed from that peer's own inputs. */
      initiator: PpkMixResult
      responder: PpkMixResult
      /** The PPK influences SK_d, SK_pi and SK_pr, so the SA no longer rests on ECDH alone. */
      resistsLaterBreakOfEcdh: true
    }
  | {
      path: 'plain-ikev2'
      reason: string
      keys: IkeSaKeys
      /** Plain IKEv2 with ECP-256 only: a recorded exchange is exposed once ECDH is broken. */
      resistsLaterBreakOfEcdh: false
    }
  | { path: 'abort'; reason: string; resistsLaterBreakOfEcdh: false }

export interface IkeQkdSampleResult {
  /** Same exchange for both paths. */
  sharedXInitiator: Uint8Array
  sharedXResponder: Uint8Array
  plain: IkeSaKeys
  /** The case where both peers fetch the key. */
  withPpk: PpkPathOutcome
  /** The case where the responder cannot supply the key: plain IKEv2, or abort if mandatory. */
  withoutPpk: PpkPathOutcome
  /** What actually happens for the supplied key stores. */
  actual: PpkPathOutcome
}

function peerKeys(
  own: { privateKey: Uint8Array },
  peerPublic: Uint8Array,
  inputs: Pick<IkeQkdSampleInputs, 'ni' | 'nr' | 'spiI' | 'spiR'>
) {
  const sharedX = ecp256SharedX(own.privateKey, peerPublic)
  return { sharedX, plain: deriveIkeSaKeys({ ...inputs, sharedX }) }
}

const sameBytes = (a: Uint8Array, b: Uint8Array) =>
  a.length === b.length && a.every((v, i) => v === b[i])

function ppkOutcomeFor(
  initiator: ReturnType<typeof peerKeys>,
  responder: ReturnType<typeof peerKeys>,
  ppkInitiator: Uint8Array | undefined,
  ppkResponder: Uint8Array | undefined,
  ppkId: Uint8Array,
  mandatory: boolean
): PpkPathOutcome {
  if (!ppkInitiator) {
    if (mandatory)
      return {
        path: 'abort',
        reason:
          'The initiator has no PPK and PPK use is mandatory for it, so it does not start the exchange.',
        resistsLaterBreakOfEcdh: false,
      }
    return {
      path: 'plain-ikev2',
      reason:
        'The initiator has no PPK, so it sends no USE_PPK notification and the exchange is plain IKEv2.',
      keys: initiator.plain,
      resistsLaterBreakOfEcdh: false,
    }
  }
  if (!ppkResponder) {
    if (mandatory)
      return {
        path: 'abort',
        reason:
          'The responder cannot find the PPK for the received PPK_ID and PPK use is mandatory: it sends AUTHENTICATION_FAILED and the negotiation fails (RFC 8784 section 3, Table 1).',
        resistsLaterBreakOfEcdh: false,
      }
    return {
      path: 'plain-ikev2',
      reason:
        'The responder cannot find the PPK for the received PPK_ID. PPK use is optional, so the initiator included NO_PPK_AUTH and the exchange continues as plain IKEv2.',
      keys: initiator.plain,
      resistsLaterBreakOfEcdh: false,
    }
  }
  const mixedInitiator = applyPpk(initiator.plain, ppkInitiator)
  const mixedResponder = applyPpk(responder.plain, ppkResponder)
  // A mismatch would make the AUTH payload fail in a real exchange; refuse rather than continue.
  if (
    !sameBytes(mixedInitiator.keys.skD, mixedResponder.keys.skD) ||
    !sameBytes(mixedInitiator.keys.skPi, mixedResponder.keys.skPi) ||
    !sameBytes(mixedInitiator.keys.skPr, mixedResponder.keys.skPr)
  )
    return {
      path: 'abort',
      reason:
        'The two peers hold different keys under this PPK_ID, so their SK_d, SK_pi and SK_pr differ and AUTH verification would fail.',
      resistsLaterBreakOfEcdh: false,
    }
  return {
    path: 'ppk',
    ppkId,
    initiator: mixedInitiator,
    responder: mixedResponder,
    resistsLaterBreakOfEcdh: true,
  }
}

/**
 * Runs the sample: both peers derive from their own inputs, then the PPK path (both fetch the key
 * from their own node) and the fallback path (the responder's node has no such key) are computed
 * from the same exchange.
 */
export function runIkeQkdSample(inputs: IkeQkdSampleInputs): IkeQkdSampleResult {
  const ppkId = ppkIdOpaqueFromQkdKeyId(inputs.qkdKeyId)
  const common = { ni: inputs.ni, nr: inputs.nr, spiI: inputs.spiI, spiR: inputs.spiR }
  const initiator = peerKeys(inputs.initiator, inputs.responder.publicKey, common)
  const responder = peerKeys(inputs.responder, inputs.initiator.publicKey, common)
  if (!sameBytes(initiator.sharedX, responder.sharedX))
    throw new Error('The two peers computed different ECDH shared secrets')
  if (!sameBytes(initiator.plain.skeyseed, responder.plain.skeyseed))
    throw new Error('The two peers computed different SKEYSEED values')

  const ppkInitiator = inputs.initiatorNode.getKeyWithId(inputs.qkdKeyId)
  const ppkResponder = inputs.responderNode.getKeyWithId(inputs.qkdKeyId)
  const outcome = (a: Uint8Array | undefined, b: Uint8Array | undefined) =>
    ppkOutcomeFor(initiator, responder, a, b, ppkId, inputs.ppkMandatory)
  return {
    sharedXInitiator: initiator.sharedX,
    sharedXResponder: responder.sharedX,
    plain: initiator.plain,
    // Hypothetical view: the key one node holds is given to both. Only `actual` says what the
    // supplied stores produce; a page must not present this path as what happened unless
    // `actual.path === 'ppk'`.
    withPpk: outcome(ppkInitiator ?? ppkResponder, ppkResponder ?? ppkInitiator),
    withoutPpk: outcome(ppkInitiator, undefined),
    actual: outcome(ppkInitiator, ppkResponder),
  }
}
