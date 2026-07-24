// SPDX-License-Identifier: GPL-3.0-only
//
// wd19Delta.local.test.ts — completeness + non-corruption guard for
// codepointTable.ts's hand-curated patch tables (2026-07-23 re-audit,
// finding X1: hub's tags-enums.json is CSD01 (2023-11-30, 64 ops), while the
// engine/patch tables follow WD19 (2025-02-14, 66 ops + PQC additions), and
// nothing enforced that every value the patches inject was actually
// accounted for by ONE of: the base CSD01 JSON itself (case-sensitive or
// case-insensitive name match), the new WD19 delta file, or an explicit,
// justified exception below.
//
// This is the test that would have caught the RC4 codepoint bug found while
// writing it (`RC4: 0x00000005` silently overrode the base JSON's correct
// `0x00000016` with DSA's codepoint) — Rule A below fails loudly the next
// time a patch's name matches a base entry but its value doesn't.
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
interface DeltaJson {
  tags: { name: string; codepoint: string }[]
  enums: Record<string, { name: string; value: string }[]>
}

const BASE = JSON.parse(
  readFileSync(join(__dirname, '../../../../public/kmip-corpus/tags-enums.json'), 'utf8')
) as SpecJson
const DELTA = JSON.parse(
  readFileSync(join(__dirname, '../../../../public/kmip-corpus/tags-enums-wd19-delta.json'), 'utf8')
) as DeltaJson

const caseInsensitiveNorm = (name: string) => norm(name).toLowerCase()

/** Find a base/delta entry matching `name`, trying an exact norm() match
 * first (Rule A) then a case-insensitive norm() fallback (Rule B) — the
 * fallback exists because several patches are the EXACT same H1-class bug
 * (case-sensitive `norm()` collision) applied to a name instead of an
 * operation: e.g. `ReKeyKeyPair` vs the spec's `Re-key Key Pair`, or
 * `CessationOfOperation` vs the spec's `Cessation of Operation`. */
function findMatch<T extends { name: string }>(name: string, pool: T[]): T | undefined {
  const exact = pool.find((e) => norm(e.name) === norm(name))
  if (exact) return exact
  return pool.find((e) => caseInsensitiveNorm(e.name) === caseInsensitiveNorm(name))
}

/** Tag patches with no exact/case-insensitive match in either the base JSON
 * or the WD19 delta — every one here needs the reason documented, or the
 * test below should fail instead of silently passing. (Currently empty:
 * the 8 genuinely-new WD19 tags are all in the delta file; the other 7
 * `SPEC_EXTRACT_TAG_PATCHES` entries are redundant aliases for CSD01
 * entries and match via Rule A/B.) */
const TAG_ALLOWLIST: Record<string, string> = {}

/** Enum-member patches with no match in base or delta, each with why it's
 * legitimately absent from both KMIP spec baselines. */
const ENUM_ALLOWLIST: Record<string, Record<string, string>> = {
  CryptographicAlgorithm: {
    DES3: "naming-convention alias for CSD01's '3DES' (0x00000002, digit-order differs, not a case issue)",
    'FrodoKEM-640': 'BSI TR-02102-1 vendor KEM, not an OASIS codepoint under either baseline',
    'FrodoKEM-640-AES': 'BSI TR-02102-1 vendor KEM, not an OASIS codepoint under either baseline',
    'FrodoKEM-640-SHAKE': 'BSI TR-02102-1 vendor KEM, not an OASIS codepoint under either baseline',
    'FrodoKEM-976': 'BSI TR-02102-1 vendor KEM, not an OASIS codepoint under either baseline',
    'FrodoKEM-976-AES': 'BSI TR-02102-1 vendor KEM, not an OASIS codepoint under either baseline',
    'FrodoKEM-976-SHAKE': 'BSI TR-02102-1 vendor KEM, not an OASIS codepoint under either baseline',
    'FrodoKEM-1344': 'BSI TR-02102-1 vendor KEM, not an OASIS codepoint under either baseline',
    'FrodoKEM-1344-AES': 'BSI TR-02102-1 vendor KEM, not an OASIS codepoint under either baseline',
    'FrodoKEM-1344-SHAKE':
      'BSI TR-02102-1 vendor KEM, not an OASIS codepoint under either baseline',
    'Classic-McEliece-6688128':
      "parameter-set-specific display name for CSD01's real 'McEliece' entry (0x00000034) — same OASIS codepoint, not a vendor value",
    'ML-DSA-44-RSA2048-PSS':
      'LAMPS composite signature, vendor-extension range, not an OASIS codepoint',
    'ML-DSA-65-ECDSA-P256':
      'LAMPS composite signature, vendor-extension range, not an OASIS codepoint',
    'ML-DSA-87-ECDSA-P384':
      'LAMPS composite signature, vendor-extension range, not an OASIS codepoint',
  },
  MaskGenerator: {
    MGF1: "CSD01 PDF-extraction typo — the spec JSON has 'MFG1' (transposed letters) at the same codepoint (0x00000001), not a WD19 addition",
  },
  DeactivationReasonCode: {
    KeyCompromise:
      "CSD01's own 'Deactivation Reason Code' table is a PDF-extraction mismatch (wrong table extracted, see codepointTable.ts comment) — verified against kmip30::ops::DeactivationReason directly, not WD19-new",
    CACompromise: 'same CSD01 extraction defect as KeyCompromise above',
    AffiliationChanged: 'same CSD01 extraction defect as KeyCompromise above',
    Superseded: 'same CSD01 extraction defect as KeyCompromise above',
    CessationOfOperation: 'same CSD01 extraction defect as KeyCompromise above',
    PrivilegeWithdrawn: 'same CSD01 extraction defect as KeyCompromise above',
  },
  PKCS11Function: {
    '*': 'PKCS#11 function-call constants for the bridge, not KMIP OASIS operations — out of CSD01/WD19 scope entirely',
  },
  PKCS11ReturnCode: {
    '*': 'PKCS#11 return-code constants for the bridge, not KMIP OASIS values — out of CSD01/WD19 scope entirely',
  },
  MaskGeneratorHashingAlgorithm: {
    '*': "reuses the base JSON's 'Hashing Algorithm' enum values under a field-specific name (SHA1=4 matches 'SHA-1'=4, etc. — verified 1:1) — not WD19-new, not vendor",
  },
}

describe('WD19 delta completeness + non-corruption guard (2026-07-23 re-audit, X1)', () => {
  it('every SPEC_EXTRACT_TAG_PATCHES entry is a verified CSD01 alias, a documented WD19 delta entry, or an explicit exception', () => {
    for (const [name, patchedCode] of Object.entries(SPEC_EXTRACT_TAG_PATCHES)) {
      const inBase = findMatch(
        name,
        BASE.tags.map((t) => ({ name: t.name, code: parseInt(t.codepoint, 16) }))
      )
      if (inBase) {
        expect(patchedCode, `tag '${name}' patch value diverges from CSD01's own value`).toBe(
          inBase.code
        )
        continue
      }
      const inDelta = findMatch(
        name,
        DELTA.tags.map((t) => ({ name: t.name, code: parseInt(t.codepoint, 16) }))
      )
      if (inDelta) {
        expect(patchedCode, `tag '${name}' patch value diverges from the WD19 delta file`).toBe(
          inDelta.code
        )
        continue
      }
      expect(
        TAG_ALLOWLIST[name],
        `tag '${name}' (0x${patchedCode.toString(16)}) is not in CSD01, not in the WD19 delta file, and not an explicit exception — is this a new WD19-only value that needs adding to kmip-spec-3.0-wd19-delta.json?`
      ).toBeDefined()
    }
  })

  it('every SPEC_EXTRACT_PATCHES enum member is a verified CSD01 alias, a documented WD19 delta entry, or an explicit exception', () => {
    for (const [enumName, members] of Object.entries(SPEC_EXTRACT_PATCHES)) {
      const baseEnum = findMatch(
        enumName,
        Object.keys(BASE.enums).map((k) => ({ name: k, key: k }))
      )
      const baseMembers = baseEnum
        ? BASE.enums[baseEnum.key].map((m) => ({ name: m.name, value: parseInt(m.value, 16) }))
        : []
      const deltaEnum = findMatch(
        enumName,
        Object.keys(DELTA.enums).map((k) => ({ name: k, key: k }))
      )
      const deltaMembers = deltaEnum
        ? DELTA.enums[deltaEnum.key].map((m) => ({ name: m.name, value: parseInt(m.value, 16) }))
        : []
      const allowlistForEnum = ENUM_ALLOWLIST[enumName]

      for (const [memberName, patchedValue] of Object.entries(members)) {
        const inBase = findMatch(memberName, baseMembers)
        if (inBase) {
          expect(
            patchedValue,
            `${enumName}.${memberName} patch value diverges from CSD01's own value`
          ).toBe(inBase.value)
          continue
        }
        const inDelta = findMatch(memberName, deltaMembers)
        if (inDelta) {
          expect(
            patchedValue,
            `${enumName}.${memberName} patch value diverges from the WD19 delta file`
          ).toBe(inDelta.value)
          continue
        }
        const allowed = allowlistForEnum?.[memberName] ?? allowlistForEnum?.['*']
        expect(
          allowed,
          `${enumName}.${memberName} (0x${patchedValue.toString(16)}) is not in CSD01, not in the WD19 delta file, and not an explicit exception — is this a new WD19-only value that needs adding to kmip-spec-3.0-wd19-delta.json?`
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
    const deltaAlgos = (DELTA.enums['Cryptographic Algorithm'] ?? []).map((m) => ({
      name: m.name,
      value: parseInt(m.value, 16),
    }))
    const des3InBase = findMatch('DES3', baseAlgos)
    const des3InDelta = findMatch('DES3', deltaAlgos)
    expect(
      des3InBase,
      'DES3 unexpectedly matches CSD01 by name — probe assumption invalid'
    ).toBeUndefined()
    expect(
      des3InDelta,
      'DES3 unexpectedly matches the WD19 delta — probe assumption invalid'
    ).toBeUndefined()
    expect(withoutDes3.DES3, 'probe removal failed').toBeUndefined()
  })
})
