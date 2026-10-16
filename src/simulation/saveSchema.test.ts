// SPDX-License-Identifier: AGPL-3.0-only
/**
 * W0.5 regression — a run export must reproduce the run, and a malformed import
 * must change nothing.
 *
 * Observed on the audited build:
 *  - `exportSave` omitted `objectiveAchievedYears` (which drives on-time
 *    objective badges and the run grade), so export→import silently zeroed it.
 *  - `importSave` accepted arbitrary values: `q: 99`, negative years, unknown
 *    phase ids and unsupported schema versions all applied to the live run. The
 *    `version` field it writes was never read back.
 *
 * The invariant: validate BEFORE mutating, reject atomically, and round-trip
 * everything the run's results depend on.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { useSimulationStore } from '@/store/useSimulationStore'
import { validateSave, SAVE_SCHEMA_VERSION } from './saveSchema'

const freshRun = () => {
  useSimulationStore.getState().reset()
}

describe('run export completeness (W0.5 regression)', () => {
  beforeEach(freshRun)

  it('round-trips objective-achievement timing through export → import', () => {
    const store = useSimulationStore.getState()
    store.recordObjectiveAchieved('governance', 2029)
    const json = useSimulationStore.getState().exportSave()

    freshRun()
    expect(useSimulationStore.getState().objectiveAchievedYears).toEqual({})

    expect(useSimulationStore.getState().importSave(json)).toBe(true)
    expect(useSimulationStore.getState().objectiveAchievedYears).toEqual({ governance: 2029 })
  })

  it('round-trips the run world: level, timing, attempts and evidence', () => {
    const s = useSimulationStore.getState()
    s.setSeed(4242)
    s.markRefVisited('threats')
    s.incrementTrapsThisRun()
    s.applyDecisionSetback(1, 'wrong call')
    const before = useSimulationStore.getState()
    const snapshot = {
      seed: before.seed,
      year: before.year,
      q: before.q,
      traps: before.trapsThisRun,
      refs: [...before.visitedRefs],
    }
    const json = before.exportSave()

    freshRun()
    expect(useSimulationStore.getState().importSave(json)).toBe(true)

    const after = useSimulationStore.getState()
    expect(after.seed).toBe(snapshot.seed)
    expect(after.year).toBe(snapshot.year)
    expect(after.q).toBe(snapshot.q)
    expect(after.trapsThisRun).toBe(snapshot.traps)
    expect(after.visitedRefs).toEqual(snapshot.refs)
  })
})

describe('run import validation (W0.5 regression)', () => {
  beforeEach(freshRun)

  const currentRun = () => {
    const s = useSimulationStore.getState()
    return { year: s.year, q: s.q, sel: s.sel, seed: s.seed }
  }

  const rejectsAndLeavesRunUntouched = (state: Record<string, unknown>) => {
    const before = currentRun()
    const json = JSON.stringify({
      app: 'pqc-today',
      kind: 'pqc-simulation-save',
      version: SAVE_SCHEMA_VERSION,
      state,
    })
    expect(useSimulationStore.getState().importSave(json)).toBe(false)
    expect(currentRun()).toEqual(before)
  }

  it('rejects an out-of-range quarter without altering the current run', () => {
    rejectsAndLeavesRunUntouched({ q: 99 })
  })

  it('rejects a negative year without altering the current run', () => {
    rejectsAndLeavesRunUntouched({ year: -5 })
  })

  it('rejects an unknown phase id without altering the current run', () => {
    rejectsAndLeavesRunUntouched({ sel: 'p99' })
  })

  it('rejects an unsupported schema version without altering the current run', () => {
    const before = currentRun()
    const json = JSON.stringify({
      app: 'pqc-today',
      kind: 'pqc-simulation-save',
      version: SAVE_SCHEMA_VERSION + 999,
      state: { year: 2030 },
    })
    expect(useSimulationStore.getState().importSave(json)).toBe(false)
    expect(currentRun()).toEqual(before)
  })

  it('reports what is wrong rather than failing silently', () => {
    const result = validateSave({
      app: 'pqc-today',
      kind: 'pqc-simulation-save',
      version: SAVE_SCHEMA_VERSION,
      state: { q: 99, year: -5, sel: 'p99' },
    })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errors.join(' ')).toMatch(/q/)
      expect(result.errors.length).toBeGreaterThanOrEqual(3)
    }
  })

  it('accepts a well-formed save', () => {
    const json = useSimulationStore.getState().exportSave()
    expect(validateSave(JSON.parse(json)).ok).toBe(true)
  })
})
