// SPDX-License-Identifier: GPL-3.0-only
/**
 * Direct unit coverage for migrateSimulationState (Wave 2 exit check: "all
 * store migrations covered by a migrate test"). Previously this logic only
 * ran inline inside persist()'s config and was exercised indirectly, if at
 * all, through rehydration — a real upgrade bug (e.g. the STORE_VERSION
 * 13→14 seenConceptPeeks addition, WP2.3) could have shipped unnoticed.
 * Extended for the 14→15 bump (Wave 4 WP4.1-4.3: securedBudgetM/spentBudgetM/
 * trapsThisRun) — run-scoped like edgeDecisions/year/q, reset on a real
 * migration rather than reinterpreted (see migrateSimulationState's comment).
 * Extended again for 15→16 (WP4.5: the 5 lifetime achievement counters) —
 * these are preserved like tourSeen/guided, NOT reset.
 */
import { describe, it, expect } from 'vitest'
import { migrateSimulationState } from './useSimulationStore'

describe('migrateSimulationState', () => {
  it('defaults every field from an empty/legacy blob (pre-any-fields persisted state)', () => {
    const out = migrateSimulationState({})
    expect(out.size).toBe('mid')
    expect(out.country).toBe('US')
    expect(out.sector).toBe('healthcare')
    expect(out.seat).toBe('executive')
    expect(out.sel).toBe('p0')
    expect(out.edgeDecisions).toEqual({})
    expect(out.visitedRefs).toEqual([])
    expect(out.visitedWorkshops).toEqual([])
    expect(out.visitedScenarios).toEqual([])
    expect(out.runCompleteSeen).toBe(false)
    expect(out.picks).toEqual([])
    expect(out.catalogCompleted).toEqual([])
    expect(out.auto).toEqual([])
    expect(typeof out.seed).toBe('number')
    expect(out.difficulty).toBe('realistic')
    expect(out.tourSeen).toBe(false)
    expect(out.seenConceptPeeks).toEqual([])
    expect(out.securedBudgetM).toBe(0)
    expect(out.spentBudgetM).toBe(0)
    expect(out.trapsThisRun).toBe(0)
    expect(out.simRunsCompleted).toBe(0)
    expect(out.simZeroTrapPhases).toBe(0)
    expect(out.simHardWin).toBe(false)
    expect(out.simOnTimeObjectives).toBe(0)
    expect(out.simJurisdictionsPlayed).toEqual([])
  })

  it('handles a null/undefined persisted blob the same as empty', () => {
    expect(migrateSimulationState(null).size).toBe('mid')
    expect(migrateSimulationState(undefined).seenConceptPeeks).toEqual([])
  })

  it('preserves org setup and visited-resource fields from a pre-v14 blob missing seenConceptPeeks', () => {
    const legacy = {
      size: 'large',
      country: 'DE',
      sector: 'finance',
      seat: 'ciso',
      visitedRefs: ['threats', 'timeline'],
      visitedWorkshops: ['tls-simulator'],
      picks: ['3.1', '3.2'],
      catalogCompleted: ['VND-001'],
      auto: ['0.1'],
      seed: 12345,
      difficulty: 'hard',
      tourSeen: true,
      // no seenConceptPeeks — the field this migration introduced
    }
    const out = migrateSimulationState(legacy)
    expect(out.size).toBe('large')
    expect(out.country).toBe('DE')
    expect(out.sector).toBe('finance')
    expect(out.seat).toBe('ciso')
    expect(out.visitedRefs).toEqual(['threats', 'timeline'])
    expect(out.visitedWorkshops).toEqual(['tls-simulator'])
    expect(out.picks).toEqual(['3.1', '3.2'])
    expect(out.catalogCompleted).toEqual(['VND-001'])
    expect(out.auto).toEqual(['0.1'])
    expect(out.seed).toBe(12345)
    expect(out.difficulty).toBe('hard')
    expect(out.tourSeen).toBe(true)
    expect(out.seenConceptPeeks).toEqual([]) // new field defaults cleanly, doesn't crash
  })

  // v16 → v17 (2026-08-02): GUIDED mode was retired. The field is DROPPED rather
  // than translated — mapping guided:true → difficulty:'easy' would also silently
  // change the budget multiplier, event probabilities, CRQC creep and AI advance
  // chance for a player who only ever wanted the calmer layout. Pinned so a later
  // "helpful" migration can't quietly rebalance someone's run.
  it('drops the retired `guided` field without touching difficulty (v16 → v17)', () => {
    const v16 = { difficulty: 'realistic', guided: true, tourSeen: true }
    const out = migrateSimulationState(v16)
    expect('guided' in out).toBe(false)
    expect(out.difficulty).toBe('realistic')
    expect(out.tourSeen).toBe(true)
  })

  it('preserves seenConceptPeeks when a future re-migration already carries it', () => {
    const out = migrateSimulationState({ seenConceptPeeks: ['hybrid-crypto', 'hndl'] })
    expect(out.seenConceptPeeks).toEqual(['hybrid-crypto', 'hndl'])
  })

  it('always resets edgeDecisions on a real migration, even if the old blob had some (v3 gating reset, by design)', () => {
    const out = migrateSimulationState({ edgeDecisions: { 'lb-app1-mTLS': 'hybrid' } })
    expect(out.edgeDecisions).toEqual({})
  })

  it('always resets securedBudgetM/spentBudgetM/trapsThisRun on a real migration, even if the old blob had some (same run-reset rule as edgeDecisions)', () => {
    const out = migrateSimulationState({
      securedBudgetM: 42,
      spentBudgetM: 30,
      trapsThisRun: 5,
    })
    expect(out.securedBudgetM).toBe(0)
    expect(out.spentBudgetM).toBe(0)
    expect(out.trapsThisRun).toBe(0)
  })

  it('preserves lifetime achievement counters on a real migration, unlike the run-scoped fields above (WP4.5)', () => {
    const out = migrateSimulationState({
      simRunsCompleted: 3,
      simZeroTrapPhases: 1,
      simHardWin: true,
      simOnTimeObjectives: 2,
      simJurisdictionsPlayed: ['US', 'DE'],
    })
    expect(out.simRunsCompleted).toBe(3)
    expect(out.simZeroTrapPhases).toBe(1)
    expect(out.simHardWin).toBe(true)
    expect(out.simOnTimeObjectives).toBe(2)
    expect(out.simJurisdictionsPlayed).toEqual(['US', 'DE'])
  })

  it('falls back to a safe default difficulty for a garbage/unknown value', () => {
    expect(migrateSimulationState({ difficulty: 'nightmare' }).difficulty).toBe('realistic')
    expect(migrateSimulationState({ difficulty: 42 }).difficulty).toBe('realistic')
  })

  it('ignores non-array garbage in array fields instead of crashing', () => {
    const out = migrateSimulationState({
      visitedRefs: 'not-an-array',
      picks: { bad: true },
      seenConceptPeeks: 123,
      simJurisdictionsPlayed: 'US',
      simRunsCompleted: 'lots',
      simHardWin: 'yes',
    })
    expect(out.visitedRefs).toEqual([])
    expect(out.picks).toEqual([])
    expect(out.seenConceptPeeks).toEqual([])
    expect(out.simJurisdictionsPlayed).toEqual([])
    expect(out.simRunsCompleted).toBe(0)
    expect(out.simHardWin).toBe(false)
  })
})
