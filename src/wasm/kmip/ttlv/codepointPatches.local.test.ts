// SPDX-License-Identifier: GPL-3.0-only
//
// codepointPatches.local.test.ts — completeness + non-corruption guard for
// codepointTable.ts's hand-curated patch tables. Every patched tag/enum
// value must be either a verified alias for an entry the spec-extraction
// JSON already carries (case-sensitive `norm()` match, or a documented
// case-insensitive/renamed alias), or an explicit, justified exception
// below (a vendor extension, or a table the extractor still mis-attributes).
//
// Replaces wd19Delta.local.test.ts (2026-07-24 CSD02 migration): that test
// existed because hub's spec JSON (CSD01, 2024-08-23) trailed the engine's
// actual WD19-based implementation, and OASIS had never published a WD19
// HTML export to re-extract from — so genuinely-new WD19 values were
// tracked by hand in kmip-spec-3.0-wd19-delta.json instead. CSD02
// (2026-05-07) is a real HTML-exportable published stage that supersedes
// both CSD01 and the unpublished WD19 draft, so the spec JSON was
// regenerated directly from it and the delta file retired — this test now
// checks patches against ONE baseline instead of two.
//
// This is the test that would have caught the RC4 codepoint bug found while
// writing the original version of it (`RC4: 0x00000005` silently overrode
// the base JSON's correct `0x00000016` with DSA's codepoint) — Rule A below
// fails loudly the next time a patch's name matches a base entry but its
// value doesn't.
/* eslint-disable security/detect-non-literal-fs-filename -- reads a fixed repo dir */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it, expect } from 'vitest'
import { norm } from './nodes'
import { SPEC_EXTRACT_TAG_PATCHES, SPEC_EXTRACT_PATCHES } from './codepointTable'

interface SpecTag {
  name: string
  codepoint: string
}
interface SpecEnumMember {
  name: string
  value: string
}
interface SpecJson {
  tags: SpecTag[]
  enums: Record<string, SpecEnumMember[]>
}

const BASE = JSON.parse(
  readFileSync(join(__dirname, '../../../../public/kmip-corpus/tags-enums.json'), 'utf8')
) as SpecJson

const caseInsensitiveNorm = (name: string) => norm(name).toLowerCase()

/** Find a base entry matching `name`, trying an exact norm() match first
 * (Rule A) then a case-insensitive norm() fallback (Rule B) — the fallback
 * exists because several patches are the exact same case-sensitive-`norm()`
 * collision applied to a name instead of an operation: e.g. `ReKeyKeyPair`
 * vs the spec's `Re-key Key Pair`, or `CessationOfOperation` vs the spec's
 * `Cessation of Operation`. */
function findMatch<T extends { name: string }>(name: string, pool: T[]): T | undefined {
  const exact = pool.find((e) => norm(e.name) === norm(name))
  if (exact) return exact
  return pool.find((e) => caseInsensitiveNorm(e.name) === caseInsensitiveNorm(name))
}

/** Tag patches with no exact/case-insensitive match in the base JSON — every
 * one here needs the reason documented, or the test below should fail
 * instead of silently passing. (Currently empty: the surviving
 * `SPEC_EXTRACT_TAG_PATCHES` entries are all redundant cross-check aliases
 * for CSD02 entries and match via Rule A.) */
const TAG_ALLOWLIST: Record<string, string> = {}

/** Enum-member patches with no match in the base JSON, each with why it's
 * legitimately absent. */
const ENUM_ALLOWLIST: Record<string, Record<string, string>> = {
  CryptographicAlgorithm: {
    DES3: "naming-convention alias for the spec's '3DES' (0x00000002, digit-order differs, not a case issue)",
    'FrodoKEM-640': 'BSI TR-02102-1 vendor KEM, not an OASIS codepoint',
    'FrodoKEM-640-AES': 'BSI TR-02102-1 vendor KEM, not an OASIS codepoint',
    'FrodoKEM-640-SHAKE': 'BSI TR-02102-1 vendor KEM, not an OASIS codepoint',
    'FrodoKEM-976': 'BSI TR-02102-1 vendor KEM, not an OASIS codepoint',
    'FrodoKEM-976-AES': 'BSI TR-02102-1 vendor KEM, not an OASIS codepoint',
    'FrodoKEM-976-SHAKE': 'BSI TR-02102-1 vendor KEM, not an OASIS codepoint',
    'FrodoKEM-1344': 'BSI TR-02102-1 vendor KEM, not an OASIS codepoint',
    'FrodoKEM-1344-AES': 'BSI TR-02102-1 vendor KEM, not an OASIS codepoint',
    'FrodoKEM-1344-SHAKE': 'BSI TR-02102-1 vendor KEM, not an OASIS codepoint',
    'Classic-McEliece-6688128':
      "parameter-set-specific display name for the spec's real 'McEliece' entry (0x00000034) — same OASIS codepoint, not a vendor value",
    'ML-DSA-44-RSA2048-PSS':
      'LAMPS composite signature, vendor-extension range, not an OASIS codepoint',
    'ML-DSA-65-ECDSA-P256':
      'LAMPS composite signature, vendor-extension range, not an OASIS codepoint',
    'ML-DSA-87-ECDSA-P384':
      'LAMPS composite signature, vendor-extension range, not an OASIS codepoint',
    SecP256r1MLKEM768:
      "casing alias for the spec's own 'SECP256R1MLKEM768' (all-caps) — matches the Rust engine's naming instead",
  },
  MaskGenerator: {
    MGF1: "spec's own table has 'MFG1' (transposed letters) at the same codepoint (0x00000001) — a spec typo, not a missing value",
  },
  DeactivationReasonCode: {
    KeyCompromise:
      "the spec's own 'Deactivation Reason Code' table is still a PDF/HTML-extraction mismatch under CSD02 (wrong table extracted, see codepointTable.ts comment) — verified against kmip30::ops::DeactivationReason directly",
    CACompromise: 'same extraction defect as KeyCompromise above',
    AffiliationChanged: 'same extraction defect as KeyCompromise above',
    Superseded: 'same extraction defect as KeyCompromise above',
    CessationOfOperation: 'same extraction defect as KeyCompromise above',
    PrivilegeWithdrawn: 'same extraction defect as KeyCompromise above',
  },
  PKCS11Function: {
    '*': 'PKCS#11 function-call constants for the bridge, not KMIP OASIS operations',
  },
  PKCS11ReturnCode: {
    '*': 'PKCS#11 return-code constants for the bridge, not KMIP OASIS values',
  },
  MaskGeneratorHashingAlgorithm: {
    '*': "reuses the base JSON's 'Hashing Algorithm' enum values under a field-specific name (SHA1=4 matches 'SHA-1'=4, etc. — verified 1:1)",
  },
}

describe('codepoint patch completeness + non-corruption guard (2026-07-24 CSD02 migration)', () => {
  it('every SPEC_EXTRACT_TAG_PATCHES entry is a verified spec alias or an explicit exception', () => {
    for (const [name, patchedCode] of Object.entries(SPEC_EXTRACT_TAG_PATCHES)) {
      const inBase = findMatch(
        name,
        BASE.tags.map((t) => ({ name: t.name, code: parseInt(t.codepoint, 16) }))
      )
      if (inBase) {
        expect(patchedCode, `tag '${name}' patch value diverges from the spec's own value`).toBe(
          inBase.code
        )
        continue
      }
      expect(
        TAG_ALLOWLIST[name],
        `tag '${name}' (0x${patchedCode.toString(16)}) is not in the spec JSON and not an explicit exception — is this a value the extractor is missing?`
      ).toBeDefined()
    }
  })

  it('every SPEC_EXTRACT_PATCHES enum member is a verified spec alias or an explicit exception', () => {
    for (const [enumName, members] of Object.entries(SPEC_EXTRACT_PATCHES)) {
      const baseEnum = findMatch(
        enumName,
        Object.keys(BASE.enums).map((k) => ({ name: k, key: k }))
      )
      const baseMembers = baseEnum
        ? BASE.enums[baseEnum.key].map((m) => ({ name: m.name, value: parseInt(m.value, 16) }))
        : []
      const allowlistForEnum = ENUM_ALLOWLIST[enumName]

      for (const [memberName, patchedValue] of Object.entries(members)) {
        const inBase = findMatch(memberName, baseMembers)
        if (inBase) {
          expect(
            patchedValue,
            `${enumName}.${memberName} patch value diverges from the spec's own value`
          ).toBe(inBase.value)
          continue
        }
        const allowed = allowlistForEnum?.[memberName] ?? allowlistForEnum?.['*']
        expect(
          allowed,
          `${enumName}.${memberName} (0x${patchedValue.toString(16)}) is not in the spec JSON and not an explicit exception — is this a value the extractor is missing?`
        ).toBeDefined()
      }
    }
  })

  it('the allowlists are not vacuous (sanity check the test itself can fail)', () => {
    // Prove ENUM_ALLOWLIST is actually load-bearing: temporarily remove one
    // real exception and confirm the completeness check above would have
    // failed without it, using DES3 as the probe.
    const withoutDes3 = { ...ENUM_ALLOWLIST.CryptographicAlgorithm }
    delete (withoutDes3 as Record<string, string>).DES3
    const baseAlgos = BASE.enums['Cryptographic Algorithm'].map((m) => ({
      name: m.name,
      value: parseInt(m.value, 16),
    }))
    const des3InBase = findMatch('DES3', baseAlgos)
    expect(
      des3InBase,
      'DES3 unexpectedly matches the spec by name — probe assumption invalid'
    ).toBeUndefined()
    expect(withoutDes3.DES3, 'probe removal failed').toBeUndefined()
  })
})
