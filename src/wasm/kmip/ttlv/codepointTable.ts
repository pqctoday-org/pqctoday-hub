// SPDX-License-Identifier: GPL-3.0-only
//
// codepointTable.ts — KMIP 3.0 tag/enum codepoint table, ported from
// pqctoday-hsm/kmip/python-client/src/pqctoday_kmip/_ttlv.py's
// `CodepointTable`. Loads the same spec-extraction JSON
// (kmip-spec-3.0-tags-enums.json, staged as a public asset by
// scripts/build-kmip-wasm.sh — as of 2026-07-24 extracted from the
// published CSD02 HTML, not CSD01) plus the same hand-curated patches for
// what that JSON still gets wrong or omits: `norm()`-collision aliases
// (the spec's own hyphenation/casing doesn't match our request-builder's
// option strings), genuine vendor extensions (FrodoKEM, Classic-McEliece,
// LAMPS composites — never OASIS codepoints), and one table
// (`DeactivationReasonCode`) the extractor still attributes to the wrong
// spec table. Keep these patches in sync with `_ttlv.py`'s
// `_SPEC_EXTRACT_PATCHES`/`_SPEC_EXTRACT_TAG_PATCHES` if either ever needs
// updating — they are NOT auto-derived from one another.

import { norm } from './nodes'

interface SpecTag {
  name: string
  codepoint: string // "0x420001"
}
interface SpecEnumMember {
  name: string
  value: string // "0x00000001"
}
interface SpecJson {
  tags: SpecTag[]
  enums: Record<string, SpecEnumMember[]>
}

/** Tag entries kept as an explicit, independently-verified cross-check
 * against `pqctoday-hsm/kmip/src/kmip30/wire.rs`'s own `tags::*` constants
 * (the decoder these requests are built to match) — every one of these is
 * ALSO present natively in the spec-extraction JSON under its spaced name
 * ("Certificate Value", …), so `norm()`-based lookup would find it anyway.
 * Mirrors `_ttlv.py`'s `_SPEC_EXTRACT_TAG_PATCHES`.
 *
 * (2026-07-24 CSD02 migration: the 8 WD19-only KEM/PQC tags this block used
 * to carry — KEMAlgorithm, Deterministic, ContextString, Seed,
 * InputKeyMaterial, Internal, ExternalMu, Random — are now supplied natively
 * by the regenerated spec JSON and were removed. §6.1.64 Validate /
 * §6.1.6 Certify / §6.1.52 Re-certify's tags below predate that migration
 * and stay for the cross-check reason above, not a spec gap.) */
export const SPEC_EXTRACT_TAG_PATCHES: Record<string, number> = {
  CertificateValue: 0x42001e,
  CertificateRequestType: 0x420019,
  CertificateRequest: 0x420018,
  CertificateRequestValue: 0x420140,
  CertificateRequestUniqueIdentifier: 0x420139,
  ValidityDate: 0x42009a,
  ValidityIndicator: 0x42009b,
}

/** Enum members the spec-extraction JSON either omits or gets wrong, plus
 * `norm()`-collision aliases — the punctuation-insensitive lookup below is
 * still case-SENSITIVE (`norm()` only strips non-alphanumerics), so e.g. the
 * spec's own "Re-key" norms to `Rekey` while our request-builder's option
 * string is `ReKey`: different strings, real collision. Mirrors `_ttlv.py`'s
 * `_SPEC_EXTRACT_PATCHES`.
 *
 * (2026-07-24 CSD02 migration: every entry here was re-verified against the
 * regenerated CSD02-sourced JSON. Entries that turned out to be exact
 * case-sensitive matches natively — `KeyFormatType.SeedPrivateKey`,
 * `CertificateRequestType.PKCS10`/`PEM`, all of `ValidityIndicator`,
 * `CredentialType`'s 5 members other than `UsernameAndPassword`,
 * `CryptographicAlgorithm.DES`/`RC4`/`X25519MLKEM768`, and
 * `Operation.Encapsulate`/`Decapsulate` — were removed. What survives below
 * is either a genuine casing/hyphenation alias, a vendor extension, or the
 * `DeactivationReasonCode` table the extractor still mis-attributes.) */
export const SPEC_EXTRACT_PATCHES: Record<string, Record<string, number>> = {
  // Spec's own table has a typo — "MFG1", not "MGF1" — so this is a real
  // alias, not a redundant safety net.
  MaskGenerator: { MGF1: 0x00000001 },
  // §6.1.6 Certify / §6.1.52 Re-certify's `Certificate Request Type` —
  // matches `kmip30::ops::CertificateRequestType`. Spec's own member is
  // "CRMF" (all-caps); our request-builder's option string is "Crmf". Only
  // this one is a genuine alias — PKCS10/PEM already match natively.
  CertificateRequestType: { Crmf: 0x00000001 },
  // §6.1.14 Deactivate's `Deactivation Reason Code` — the spec-extraction
  // JSON's "Deactivation Reason Code" table is still a PDF/HTML-extraction
  // mismatch under CSD02 too (`Unspecified`/"Deactivation Date"/"Protect
  // Stop Date"/"Usage Limit" — the wrong table, re-confirmed 2026-07-24),
  // not the 7-member set `kmip30::ops::DeactivationReason` actually
  // implements. Patched with the real values, verified 1:1 against
  // `Revocation Reason Code` (`ops.rs`'s `DeactivationReason` enum mirrors
  // `RevocationReason`'s codepoints exactly, both derived from the same
  // §10.2-style table).
  DeactivationReasonCode: {
    Unspecified: 0x00000001,
    KeyCompromise: 0x00000002,
    CACompromise: 0x00000003,
    AffiliationChanged: 0x00000004,
    Superseded: 0x00000005,
    CessationOfOperation: 0x00000006,
    PrivilegeWithdrawn: 0x00000007,
  },
  // Spec's own member is "Username and Password" (lowercase "and"); our
  // option string is "UsernameAndPassword" — real casing alias. The other 5
  // members match the spec natively now.
  CredentialType: {
    UsernameAndPassword: 0x00000001,
  },
  CryptographicAlgorithm: {
    // Spec's own member is "3DES"; ours is "DES3" — real alias, not just a
    // casing difference.
    DES3: 0x00000002,
    // BSI TR-02102-1 §2.4.1/§2.4.2 vendor KEMs (2026-07-06) — not in the
    // published spec JSON since they're vendor extensions, not OASIS
    // codepoints (Classic McEliece's 0x34 is a real OASIS value, reused
    // here under our own parameter-set-specific name; FrodoKEM's
    // 0x8000_005f-0x64 range is ours outright). Bare family names default
    // to the AES variant, mirroring create_key_pair.rs::parse_algorithm's
    // convention.
    'FrodoKEM-640': 0x8000005f,
    'FrodoKEM-640-AES': 0x8000005f,
    'FrodoKEM-640-SHAKE': 0x80000060,
    'FrodoKEM-976': 0x80000061,
    'FrodoKEM-976-AES': 0x80000061,
    'FrodoKEM-976-SHAKE': 0x80000062,
    'FrodoKEM-1344': 0x80000063,
    'FrodoKEM-1344-AES': 0x80000063,
    'FrodoKEM-1344-SHAKE': 0x80000064,
    'Classic-McEliece-6688128': 0x00000034,
    // LAMPS composite signatures (draft-ietf-lamps-pq-composite-sigs-19,
    // 2026-07-10) — vendor-extension range per KMIP 3.0 §11.12, immediately
    // after Hss's 0x80000065 (kmip/src/kmip30/algos.rs is the source of truth
    // for these values).
    'ML-DSA-44-RSA2048-PSS': 0x80000066,
    'ML-DSA-65-ECDSA-P256': 0x80000067,
    'ML-DSA-87-ECDSA-P384': 0x80000068,
    // Published CSD02 hybrid KEM (§11.12) — spec's own member is
    // "SECP256R1MLKEM768" (all-caps); ours is "SecP256r1MLKEM768" (matching
    // the Rust engine's own naming) — real casing alias. X25519MLKEM768
    // matches the spec's own casing exactly now and needs no patch.
    SecP256r1MLKEM768: 0x0000005d,
  },
  RevocationReasonCode: {
    // Spec member is "Cessation of Operation" (lowercase "of"), which norms
    // to a different key than this op-template's option string — same
    // case-sensitive-norm trap as CredentialType above.
    CessationOfOperation: 0x00000006,
  },
  Operation: {
    // Spec's own hyphenated names ("Re-key", "Re-key Key Pair",
    // "Re-certify") norm to `Rekey`/`RekeyKeyPair`/`Recertify` — different
    // capitalization than our request-builder's option strings below.
    // Encapsulate/Decapsulate matched the spec's own casing exactly and
    // needed no patch even before this migration.
    ReKey: 0x00000004,
    ReKeyKeyPair: 0x0000001d,
    ReCertify: 0x00000007,
  },
  PKCS11Function: {
    CInitialize: 0x00000001,
    CFinalize: 0x00000002,
    CGetInfo: 0x00000003,
    CGetSlotList: 0x00000004,
    CGetSlotInfo: 0x00000005,
    CGetTokenInfo: 0x00000006,
    COpenSession: 0x00000007,
    CCloseSession: 0x00000008,
    CLogin: 0x00000009,
    CLogout: 0x0000000a,
  },
  MaskGeneratorHashingAlgorithm: {
    SHA1: 0x00000004,
    SHA224: 0x00000005,
    SHA256: 0x00000006,
    SHA384: 0x00000007,
    SHA512: 0x00000008,
  },
  PKCS11ReturnCode: {
    OK: 0x00000000,
    Cancel: 0x00000001,
    HostMemory: 0x00000002,
    FunctionFailed: 0x00000006,
    ArgumentsBad: 0x00000007,
    AttributeReadOnly: 0x00000010,
    AttributeTypeInvalid: 0x00000012,
    AttributeValueInvalid: 0x00000013,
  },
}

/** Two-way maps for tag names ↔ 3-byte codepoints, and per-enum name↔value
 * lookups — the punctuation-insensitive (`norm`) surface `encode.ts` reaches
 * for when it turns a friendly `KmipNode` tree into wire-ready
 * tag/enumeration codes. */
export class CodepointTable {
  readonly tagNameToCode = new Map<string, number>()
  readonly tagCodeToName = new Map<number, string>()
  readonly enumNameToValue = new Map<string, Map<string, number>>()

  static fromSpec(spec: SpecJson): CodepointTable {
    const t = new CodepointTable()
    for (const entry of spec.tags) {
      const code = parseInt(entry.codepoint, 16)
      t.tagNameToCode.set(norm(entry.name), code)
      t.tagCodeToName.set(code, entry.name)
    }
    for (const [enumName, members] of Object.entries(spec.enums)) {
      const inner = new Map<string, number>()
      for (const m of members) inner.set(norm(m.name), parseInt(m.value, 16))
      t.enumNameToValue.set(norm(enumName), inner)
    }
    for (const [tag, additions] of Object.entries(SPEC_EXTRACT_PATCHES)) {
      const key = norm(tag)
      const inner = t.enumNameToValue.get(key) ?? new Map<string, number>()
      for (const [name, value] of Object.entries(additions)) inner.set(norm(name), value)
      t.enumNameToValue.set(key, inner)
    }
    for (const [name, code] of Object.entries(SPEC_EXTRACT_TAG_PATCHES)) {
      t.tagNameToCode.set(norm(name), code)
      if (!t.tagCodeToName.has(code)) t.tagCodeToName.set(code, name)
    }
    return t
  }
}

let tablePromise: Promise<CodepointTable> | null = null

/** Fetch + parse the tag/enum spec once per tab — lazy, since it's only
 * needed once the KMIP3.0 Commands sub-tab, or the Dev sub-tab's corpus
 * palette, is opened. */
export const getCodepointTable = (): Promise<CodepointTable> => {
  tablePromise ??= fetch('/kmip-corpus/tags-enums.json')
    .then((r) =>
      r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status} loading tags-enums.json`))
    )
    .then((spec: SpecJson) => CodepointTable.fromSpec(spec))
  return tablePromise
}
