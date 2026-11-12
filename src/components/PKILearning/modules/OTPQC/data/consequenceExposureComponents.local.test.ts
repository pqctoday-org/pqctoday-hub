// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import {
  CONSEQUENCE_SCENARIOS,
  defaultInputs,
  scoreScenario,
  type CommandAuth,
  type FirmwareSigning,
} from './consequenceData'
const s = CONSEQUENCE_SCENARIOS[0]
describe('Configured exposure sets, not a causal risk forecast', () => {
  for (const cmd of ['none', 'classical-pk', 'symmetric', 'pqc'] as CommandAuth[])
    for (const fw of ['none', 'classical', 'pqc'] as FirmwareSigning[])
      it(`${cmd}/${fw} separates currently open paths from additional key-forgery paths`, () => {
        const r = scoreScenario(s, { ...defaultInputs(s), commandAuth: cmd, firmwareSigning: fw })
        const today = [
          ...(cmd === 'none' ? ['command'] : []),
          ...(fw === 'none' ? ['firmware'] : []),
        ]
        const added = [
          ...(cmd === 'classical-pk' ? ['command'] : []),
          ...(fw === 'classical' ? ['firmware'] : []),
        ]
        expect(r.presentDayPaths).toEqual(today)
        expect(r.additionalForgeryPaths).toEqual(added)
        expect(new Set([...today, ...added]).size - today.length).toBe(
          r.additionalForgeryPaths.length
        )
        expect(r.additionalForgeryPaths.some((p) => r.presentDayPaths.includes(p))).toBe(false)
        expect(r.symmetricResidualPaths).toEqual(cmd === 'symmetric' ? ['command'] : [])
        // Independent pinned baseline: consequence97.7 × safety0.5 × life0.9 =>44.
        expect(r.presentDayScore).toBe(today.length ? 44 : 0)
        expect(r.forgeryScore).toBe(added.length ? 44 : 0)
        expect(r.symmetricResidualScore).toBe(cmd === 'symmetric' ? 9 : 0)
        expect(r.compound).toBe(today.length || added.length ? 44 : cmd === 'symmetric' ? 9 : 0)
        expect(r.exploitableToday).toBe(today.length > 0)
      })
  it('two exposed layers do not double the maximum-aggregated consequence score', () => {
    const both = scoreScenario(s)
    expect(both.additionalForgeryPaths).toEqual(['command', 'firmware'])
    expect(both.forgeryScore).toBe(44)
    expect(both.compound).toBe(44)
  })
})
