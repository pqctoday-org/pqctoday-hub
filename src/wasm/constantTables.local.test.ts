// SPDX-License-Identifier: GPL-3.0-only
//
// Drift guard for the SPEC-SOURCED constant tables — CKA_TABLE, CKO_TABLE,
// CKK_TABLE and CKR_TABLE in pkcs11Inspect.ts — against the canonical
// PKCS#11 headers vendored in the pqctoday-hsm repo.
//
// Why this exists: the 2026-09-03 audit found genuinely WRONG values in
// these tables (CKM_XMSS labelling 0x4035, which is actually
// CKM_XMSSMT_KEY_PAIR_GEN; CKM_AES_KEY_WRAP_KWP given _PAD's value), and
// they survived because nothing compared them to the standard. Only
// MECH_TABLE had a guard.
//
// Two guards are needed and they are NOT interchangeable:
//   - This one, for values PKCS#11 actually defines. It reads the header.
//   - ckpConstantAgreement.test.ts, for CKP_* parameter sets, which the
//     spec does NOT enumerate at all (it only typedefs them as CK_ULONG),
//     so they can only be cross-checked hub-internally.
//
// Venue: `*.local.test.ts` — excluded from CI globs, run by the local gate
// (directive 2026-07-01), because it reads a sibling repo. It skips
// cleanly when that repo is not checked out rather than failing.
import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { CKA_TABLE, CKO_TABLE, CKK_TABLE, CKR_TABLE } from './pkcs11Inspect'

const HEADER = path.resolve(__dirname, '../../../pqctoday-hsm/docs/refs/pkcs11t-canonical-v3.2.h')

/** name -> value, for every `#define CKx_... 0x...UL` in the header. */
const parseHeader = (): Map<string, number> => {
  const out = new Map<string, number>()
  const src = readFileSync(HEADER, 'utf8')
  const re = /^#define\s+(CK[AOKR]_[A-Z0-9_]+)\s+\(?\s*(0x[0-9a-fA-F]+)UL/gm
  let m: RegExpExecArray | null
  while ((m = re.exec(src))) out.set(m[1], Number(m[2]))
  return out
}

const describeIfPresent = existsSync(HEADER) ? describe : describe.skip

describeIfPresent('spec-sourced constant tables match the canonical v3.2 header', () => {
  const spec = parseHeader()

  const check = (label: string, table: Record<number, { name: string }>) => {
    it(`${label}: every entry matches the header`, () => {
      const wrong: string[] = []
      for (const [ordinal, entry] of Object.entries(table)) {
        const expected = spec.get(entry.name)
        // Names absent from the header are vendor-defined or spec-deferred
        // (e.g. CKO_VENDOR_*), and are covered by other guards — skip rather
        // than fail, so this test only asserts what the header can settle.
        if (expected === undefined) continue
        if (expected !== Number(ordinal)) {
          wrong.push(
            `${entry.name}: table says 0x${Number(ordinal).toString(16)}, header says 0x${expected.toString(16)}`
          )
        }
      }
      expect(wrong).toEqual([])
    })

    it(`${label}: covers a meaningful number of header-defined names`, () => {
      const covered = Object.values(table).filter((e) => spec.has(e.name))
      expect(covered.length).toBeGreaterThan(3)
    })
  }

  check('CKA_TABLE', CKA_TABLE)
  check('CKO_TABLE', CKO_TABLE)
  check('CKK_TABLE', CKK_TABLE)
  check('CKR_TABLE', CKR_TABLE)

  it('the header actually parsed (guard against a silently empty regex)', () => {
    expect(spec.size).toBeGreaterThan(200)
    expect(spec.get('CKK_ML_KEM')).toBe(0x49)
    expect(spec.get('CKR_KEY_EXHAUSTED')).toBe(0x203)
  })
})
