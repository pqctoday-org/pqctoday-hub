// SPDX-License-Identifier: GPL-3.0-only
//
// tagRules.ts — the tag-classification tables shared by bindings.ts
// (placeholder harvesting) and compare.ts (response comparison). Every
// entry is grounded in a specific item of KMIP Profiles v3.0 §4.1
// "Permitted Test Case Variations" — the spec enumerates exactly which
// fields MAY differ between a test's expected response and a server's
// actual output; anything not enumerated there SHALL be deemed
// non-conformant (§4.1 closing sentence). Ported verbatim from
// pqctoday-hsm/kmip/conformance/harness/dispatcher_replay.py — keep the
// two in sync if either ever needs updating.
import { norm } from '../ttlv/nodes'

/** §4.1.1 Variable Items — values are permitted to differ between expected
 * and actual. Keys are `norm()`-form (alphanumeric only). */
const VARIABLE_ITEM_TAGS = new Set(
  [
    'TimeStamp', // §4.1.1 item 6
    'ServerCorrelationValue', // §4.1.1 item 18
    'ClientCorrelationValue', // §4.1.1 item 19
    'AsynchronousCorrelationValue', // §4.1.1 item 5
    'ActivationDate', // §4.1.1 item 9.a
    'ArchiveDate', // §4.1.1 item 9.b
    'BuildDate', // §4.1.1 item 9.c
    'CompromiseDate', // §4.1.1 item 9.d
    'CompromiseOccurrenceDate', // §4.1.1 item 9.e
    'DeactivationDate', // §4.1.1 item 9.f
    'DestroyDate', // §4.1.1 item 9.g
    'InitialDate', // §4.1.1 item 9.h
    'LastChangeDate', // §4.1.1 item 9.i
    'ProtectStopDate', // §4.1.1 item 9.j
    'ProcessStartDate', // §4.1.1 item 9.k
    'RotateDate', // §4.1.1 item 9.l
    'SubmissionDate', // §4.1.1 item 9.m
    'ValidityDate', // §4.1.1 item 9.n
    'OriginalCreationDate', // §4.1.1 item 9.o
    'Digest', // §4.1.1 item 10
    'KeyFormatType', // §4.1.1 item 11
    'VendorIdentification', // §4.1 Response Variations item 5
  ].map(norm)
)

export const isVolatileTag = (tag: string): boolean => VARIABLE_ITEM_TAGS.has(norm(tag))

/** A handful of §4.1.1 Variable Items are ALSO optional-presence per the
 * main KMIP 3.0 §6.4 message-envelope rules — the server MAY emit or omit
 * them. Different OASIS fixtures pick one form or the other for the same
 * op, so the comparator drops these from both sides before structural
 * (child-count) comparison, rather than treating presence/absence as a
 * mismatch. */
const OPTIONAL_PRESENCE_TAGS = new Set(
  ['ServerCorrelationValue', 'ClientCorrelationValue', 'PKCS_11OutputParameters', 'PKCS11OutputParameters'].map(norm)
)

export const isOptionalPresence = (tag: string): boolean => OPTIONAL_PRESENCE_TAGS.has(norm(tag))

/** §4.1 Response Variations item 8 (Server Information) + item 10/12
 * (Digest) + item 6 (RNG fields) — the structure's presence is checked,
 * its interior is opaque. */
const OPAQUE_STRUCTURE_TAGS = new Set(['ServerInformation', 'Digest', 'RandomNumberGenerator'].map(norm))

export const isOpaqueStructure = (tag: string): boolean => OPAQUE_STRUCTURE_TAGS.has(norm(tag))

/** Tags whose leaf value is volatile across runs even though the tag isn't
 * in the §4.1.1 Variable Items table — auto-binding from these would bind
 * a stale value into a later request. UID is bound via the positional
 * `$UNIQUE_IDENTIFIER_n` mechanism, not by tag name. */
const AUTO_BIND_SKIP = new Set(['TimeStamp', 'UniqueIdentifier', 'ServerCorrelationValue', 'ClientCorrelationValue', 'CorrelationValue'])

/** `MACData` → `MAC_DATA`; `KeyMaterial` → `KEY_MATERIAL`. OASIS transcripts
 * use this convention for placeholders like `$MAC_DATA` — the leaf value
 * is printed literally in a response but referenced by upper-underscore
 * name in a later request. `null` for tags never auto-bound. */
export function tagToPlaceholder(tag: string): string | null {
  if (AUTO_BIND_SKIP.has(tag)) return null
  const s1 = tag.replace(/(.)([A-Z][a-z]+)/g, '$1_$2')
  const s2 = s1.replace(/([a-z0-9])([A-Z])/g, '$1_$2')
  return s2 ? s2.toUpperCase() : null
}
