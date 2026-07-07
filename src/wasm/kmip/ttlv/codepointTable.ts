// SPDX-License-Identifier: GPL-3.0-only
//
// codepointTable.ts — KMIP 3.0 tag/enum codepoint table, ported from
// pqctoday-hsm/kmip/python-client/src/pqctoday_kmip/_ttlv.py's
// `CodepointTable`. Loads the same spec-extraction JSON
// (kmip-spec-3.0-tags-enums.json, staged as a public asset by
// scripts/build-kmip-wasm.sh) plus the same hand-curated patches for
// codepoints the published spec JSON is missing (WD19 PQC tags, a handful
// of enum members). Keep these patches in sync with `_ttlv.py`'s
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

/** WD19 PQC tags absent from the published-3.0 spec JSON — mirrors
 * `_ttlv.py`'s `_SPEC_EXTRACT_TAG_PATCHES`. */
const SPEC_EXTRACT_TAG_PATCHES: Record<string, number> = {
  KEMAlgorithm: 0x4201c3,
  Deterministic: 0x4201c4,
  ContextString: 0x4201c5,
  Seed: 0x4201c6,
  InputKeyMaterial: 0x4201c7,
  Internal: 0x4201c8,
  ExternalMu: 0x4201c9,
  Random: 0x4201ca,
}

/** Enum members absent/incomplete in the published-3.0 spec JSON — mirrors
 * `_ttlv.py`'s `_SPEC_EXTRACT_PATCHES`. */
const SPEC_EXTRACT_PATCHES: Record<string, Record<string, number>> = {
  MaskGenerator: { MGF1: 0x00000001 },
  KeyFormatType: { SeedPrivateKey: 0x00000018 },
  CredentialType: {
    UsernameAndPassword: 0x00000001,
    Device: 0x00000002,
    Attestation: 0x00000003,
    OneTimePassword: 0x00000004,
    HashedPassword: 0x00000005,
    Ticket: 0x00000006,
  },
  CryptographicAlgorithm: {
    DES: 0x00000001,
    DES3: 0x00000002,
    RC4: 0x00000005,
    // BSI TR-02102-1 §2.4.1/§2.4.2 vendor KEMs (2026-07-06) — not in the
    // published-3.0 spec JSON since they're vendor extensions, not OASIS
    // codepoints (Classic McEliece's 0x34 is a real OASIS value; FrodoKEM's
    // 0x8000_005f-0x64 range is ours). Bare family names default to the AES
    // variant, mirroring create_key_pair.rs::parse_algorithm's convention.
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
  },
  Operation: {
    ReKey: 0x00000004,
    ReKeyKeyPair: 0x0000001e,
    ReCertify: 0x00000007,
    Encapsulate: 0x00000041,
    Decapsulate: 0x00000042,
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
 * needed once the KMIP3.0 Commands or Corpus Replay sub-tabs are opened. */
export const getCodepointTable = (): Promise<CodepointTable> => {
  tablePromise ??= fetch('/kmip-corpus/tags-enums.json')
    .then((r) =>
      r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status} loading tags-enums.json`))
    )
    .then((spec: SpecJson) => CodepointTable.fromSpec(spec))
  return tablePromise
}
