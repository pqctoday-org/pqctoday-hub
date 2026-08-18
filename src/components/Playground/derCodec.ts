// SPDX-License-Identifier: GPL-3.0-only
/**
 * Minimal DER (ASN.1 Distinguished Encoding Rules) primitives.
 *
 * Shared by the HSM VPN cert builder (`hsm/VpnSimulationPanel.tsx`, which encodes
 * an RSAPublicKey + signs an X.509 cert) and the TPM attestation SPKI wrapper
 * (`TpmPlayground/AttestationPanel.tsx`, which wraps an ML-DSA public key). Both
 * previously inlined their own near-identical copies of these encoders; this is
 * the single source of truth, pinned byte-for-byte by `derCodec.test.ts`.
 *
 * These are intentionally minimal (definite-length, primitive tags) — enough for
 * the small certificate/SPKI structures the playground builds, not a general
 * ASN.1 library.
 */

import { canonicalPositiveInteger } from '@/utils/derInteger'

/** Concatenate byte arrays. */
export function derCat(...arrays: Uint8Array[]): Uint8Array {
  const total = arrays.reduce((s, a) => s + a.length, 0)
  const out = new Uint8Array(total)
  let off = 0
  for (const a of arrays) {
    out.set(a, off)
    off += a.length
  }
  return out
}

/**
 * Definite-length encoding. Short form for < 0x80, else long form with the
 * minimum number of length octets (handles up to 4-byte / 0x83 lengths).
 */
export function derLen(n: number): Uint8Array {
  if (n < 0x80) return new Uint8Array([n])
  if (n < 0x100) return new Uint8Array([0x81, n])
  if (n < 0x10000) return new Uint8Array([0x82, (n >>> 8) & 0xff, n & 0xff])
  return new Uint8Array([0x83, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff])
}

/** Tag-Length-Value: a single DER element. */
export function derTLV(tag: number, content: Uint8Array): Uint8Array {
  return derCat(new Uint8Array([tag]), derLen(content.length), content)
}

/** INTEGER (0x02). Pads a leading 0x00 when the high bit is set, so the value
 *  is interpreted as positive (two's-complement). */
export function derInteger(bytes: Uint8Array): Uint8Array {
  // Canonicalizes fully (strips a redundant leading zero, not just pads a
  // set sign bit) — see src/utils/derInteger.ts's header for why the pad-
  // only version of this rule is an incomplete fix, found 2026-08-18.
  const canonical = bytes.length > 0 ? canonicalPositiveInteger(bytes) : new Uint8Array([0x00])
  return derTLV(0x02, canonical)
}

/** SEQUENCE (0x30) wrapper. */
export function derSeq(content: Uint8Array): Uint8Array {
  return derTLV(0x30, content)
}

/** OBJECT IDENTIFIER (0x06) wrapper over an already-encoded OID body. */
export function derOid(oidBody: Uint8Array): Uint8Array {
  return derTLV(0x06, oidBody)
}

/** BIT STRING (0x03) with 0 unused bits (the leading 0x00 octet). */
export function derBitString(bytes: Uint8Array): Uint8Array {
  return derTLV(0x03, derCat(new Uint8Array([0x00]), bytes))
}

/** RSAPublicKey ::= SEQUENCE { modulus INTEGER, publicExponent INTEGER } */
export function encodeRsaPublicKeyDER(n: Uint8Array, e: Uint8Array): Uint8Array {
  return derTLV(0x30, derCat(derInteger(n), derInteger(e)))
}
