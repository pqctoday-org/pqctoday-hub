// SPDX-License-Identifier: GPL-3.0-only
//
// Cross-check guard: the hub states every CKP_* parameter-set ordinal TWICE —
// once in `softhsm/constants.ts` (the values actually sent to the engine to
// GENERATE a key) and once in `pkcs11Inspect.ts`'s CKP_* tables (the values
// used to DISPLAY a key's CKA_PARAMETER_SET). Nothing kept the two in sync.
//
// On 2026-09-03 they disagreed, and the disagreement was a real functional
// bug: constants.ts had CKP_XMSS_SHAKE_10_256 = 0x11 while pkcs11Inspect.ts
// had 0x07 = CKP_XMSS_SHAKE_10_256. 0x11 is CKP_XMSS_SHAKE256_16_256 in both
// engines, so selecting "SHAKE-128, height 10" in the Learn module generated a
// height-16 SHAKE256 key — the engine reported 65,535 remaining signatures
// where the UI claimed 1,024.
//
// A spec-header test could not have caught it: PKCS#11 does not enumerate XMSS
// parameter sets at all (it only typedefs CK_XMSS_PARAMETER_SET_TYPE as an
// opaque CK_ULONG), so these values come from RFC 8391 / the engines. This
// test needs no cross-repo access — it just requires the hub to agree with
// itself, which is enough to catch the whole class.
import { describe, it, expect } from 'vitest'
import * as engineConstants from './softhsm/constants'
import {
  CKP_ML_KEM,
  CKP_ML_DSA,
  CKP_SLH_DSA,
  CKP_XMSS,
  CKP_XMSSMT,
  type ConstEntry,
} from './pkcs11Inspect'

/** name -> ordinal, as the DISPLAY layer believes it. */
const displayPairs = (table: Record<number, ConstEntry>): Array<[string, number]> =>
  Object.entries(table).map(([ordinal, entry]) => [entry.name, Number(ordinal)])

const DISPLAY_TABLES: Array<[string, Record<number, ConstEntry>]> = [
  ['CKP_ML_KEM', CKP_ML_KEM],
  ['CKP_ML_DSA', CKP_ML_DSA],
  ['CKP_SLH_DSA', CKP_SLH_DSA],
  ['CKP_XMSS', CKP_XMSS],
  ['CKP_XMSSMT', CKP_XMSSMT],
]

describe('CKP_* ordinals agree between the generate path and the display path', () => {
  for (const [tableName, table] of DISPLAY_TABLES) {
    describe(tableName, () => {
      for (const [name, displayOrdinal] of displayPairs(table)) {
        const generateOrdinal = (engineConstants as Record<string, unknown>)[name]
        // Only assert on names the generate path actually exports. A display
        // entry with no matching constant is not a defect — the display table
        // deliberately names every value the engine can return, including ones
        // no hub code generates.
        if (typeof generateOrdinal !== 'number') continue

        it(`${name} is 0x${displayOrdinal.toString(16)} in both`, () => {
          expect(generateOrdinal).toBe(displayOrdinal)
        })
      }
    })
  }

  it('covers a meaningful number of names (guard against the tables silently emptying)', () => {
    const overlap = DISPLAY_TABLES.flatMap(([, table]) =>
      displayPairs(table).filter(
        ([name]) => typeof (engineConstants as Record<string, unknown>)[name] === 'number'
      )
    )
    expect(overlap.length).toBeGreaterThan(10)
  })
})
