// SPDX-License-Identifier: AGPL-3.0-only
//
// The v3.3 draft group in the Conformance suite's generated Python and in the
// selection helpers (plan D6): selectable, exported like the other groups,
// and its rows read separately from the v3.2 result.
import { describe, expect, it } from 'vitest'
import { emitConformanceSuite } from './suiteCodegen'
import { createConformanceBridge } from './suiteBridges'
import {
  FULL_SELECTION,
  selectionIsEmpty,
  v33SummaryText,
  type Pkcs11ConformanceSuite,
  type V33Row,
} from '@/components/Playground/hsm/conformance/usePkcs11Conformance'
import {
  V33_DRAFT_GROUP_LABEL,
  summarizeV33,
} from '@/wasm/pkcs11ConformanceRunner/v33DraftFeatures'

describe('v3.3 draft group in the Conformance suite workbench', () => {
  it('the group alone is a non-empty selection; off by default', () => {
    expect(FULL_SELECTION().v33Draft).toBeFalsy()
    const only = { tierA: new Set<string>(), tierB: false, coverage: false, v33Draft: true }
    expect(selectionIsEmpty(only)).toBe(false)
    expect(selectionIsEmpty({ ...only, v33Draft: false })).toBe(true)
  })

  it('generated Python carries the toggle, the verbatim label and a separate result line', () => {
    const on = emitConformanceSuite({ ...FULL_SELECTION(), v33Draft: true }, 'rust')
    expect(on).toContain('RUN_V33_DRAFT = True')
    expect(on).toContain(
      'conf.run_cases(TIER_A, RUN_TIER_B_PROBES, RUN_MECHANISM_COVERAGE, RUN_V33_DRAFT)'
    )
    expect(on).toContain(V33_DRAFT_GROUP_LABEL)
    expect(on).toContain('v3.3 draft result (separate from the v3.2 result)')
    // The v3.2 tallies are computed from `rows` only, before the draft block.
    expect(on.indexOf('passed = sum(1 for r in rows')).toBeLessThan(on.indexOf('conf.v33_rows()'))
    expect(emitConformanceSuite(FULL_SELECTION(), 'rust')).toContain('RUN_V33_DRAFT = False')
  })

  it('the bridge passes the toggle through and returns draft rows separately', async () => {
    const draft: V33Row[] = [
      {
        id: 'x',
        engine: 'Rust',
        section: 'kat',
        title: 't',
        status: 'not-in-engine',
        observed: 'o',
        expected: 'e',
      },
    ]
    let seen: unknown = null
    const suite = {
      claims: {},
      run: async (sel: unknown) => {
        seen = sel
        return []
      },
      v33RowsRef: { current: draft },
    } as unknown as Pkcs11ConformanceSuite
    const bridge = createConformanceBridge(suite)
    expect(JSON.parse(await bridge.run_cases(['BL-M-1-32'], false, false, true))).toEqual([])
    expect((seen as { v33Draft: boolean }).v33Draft).toBe(true)
    expect(JSON.parse(bridge.v33_rows())).toEqual(draft)
  })

  it('summary text counts every draft status on its own', () => {
    const rows: V33Row[] = (
      ['pass', 'fail', 'not-in-engine', 'not-supported', 'pending-engine'] as const
    ).map((status, i) => ({
      id: `${i}`,
      engine: 'Rust',
      section: 'kat',
      title: '',
      status,
      observed: '',
      expected: '',
    }))
    expect(v33SummaryText(summarizeV33(rows), rows.length)).toBe(
      '1 pass, 1 fail, 1 not in this engine yet, 1 not supported, 1 pending engine (of 5 rows)'
    )
  })
})
