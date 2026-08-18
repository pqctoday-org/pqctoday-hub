// SPDX-License-Identifier: GPL-3.0-only
//
// Canonicalize a positive-integer magnitude for DER `INTEGER` content, per
// the two's-complement minimality rule X.690 §8.3.2 requires: the value
// MUST use the fewest possible octets, and a leading `0x00` is added only
// when omitting it would make an intended-positive value read as negative
// (top bit of the first content byte set).
//
// Found 2026-08-18 in certBuilder.ts::generateSerialBytes(): masking only
// the top bit of byte 0 (`bytes[0] &= 0x7f`) stops a value from NEEDING a
// sign-pad but not the mirror case — a genuinely random byte 0 of `0x00`
// (or a `0xff` followed by another byte with its own top bit set) is a
// REDUNDANT leading byte, which is itself non-canonical DER. A certificate
// carrying such a serial verifies (a lenient parser tolerates it), but a
// second, stricter re-parse used elsewhere to detect optional extensions
// rejects it outright — degrading an otherwise-genuinely-valid
// certificate's overall verdict. A real CA would never emit a
// non-canonical serial in the first place; every random-serial generator
// in this repo should produce the same canonical form a real CA would.

/**
 * Always returns a fresh, tightly-sized array — never a `subarray()` VIEW
 * into the input. A subarray's own `.buffer` is the ORIGINAL (unsliced)
 * ArrayBuffer whenever its byteOffset is nonzero, so a caller doing
 * `view.buffer` after trimming would silently get back the untrimmed bytes.
 */
export function canonicalPositiveInteger(bytes: Uint8Array): Uint8Array {
  let i = 0
  while (i < bytes.length - 1 && bytes[i] === 0) i++
  const needsPad = (bytes[i] & 0x80) !== 0
  const out = new Uint8Array((needsPad ? 1 : 0) + (bytes.length - i))
  out.set(bytes.subarray(i), needsPad ? 1 : 0)
  return out
}
