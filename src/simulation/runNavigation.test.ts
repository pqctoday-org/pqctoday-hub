// SPDX-License-Identifier: GPL-3.0-only
/**
 * W5.4 / W5.5 — durable navigation and a challenge that is actually the same
 * scenario.
 *
 * Two audited defects:
 *  - the selected phase tab was component state, so reloading while working in
 *    Resources dropped the player back on Decide;
 *  - the challenge link carried ONLY the seed, while difficulty drives every
 *    event probability and country drives the regulatory deadline — so "same
 *    world, different choices" was not true.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { useSimulationStore } from '@/store/useSimulationStore'
import { validateSave, SAVE_SCHEMA_VERSION } from './saveSchema'

const s = () => useSimulationStore.getState()

describe('phase tab survives a reload (W5.5)', () => {
  beforeEach(() => s().reset())

  it('defaults to Decide on a fresh run', () => {
    expect(s().activeTab).toBe('decide')
  })

  it('persists the selected tab in the run slice', () => {
    s().setActiveTab('resources')
    expect(s().activeTab).toBe('resources')
    // The run slice is what survives a reload (partialize) and what travels in
    // an export — a tab is navigation state the player expects to come back to.
    const save = JSON.parse(s().exportSave())
    expect(save.state.activeTab).toBe('resources')
  })

  it('restores the tab through an export → import round trip', () => {
    s().setActiveTab('signals')
    const json = s().exportSave()
    s().reset()
    expect(s().activeTab).toBe('decide')
    expect(s().importSave(json)).toBe(true)
    expect(s().activeTab).toBe('signals')
  })

  it('rejects an unknown tab rather than restoring a broken view', () => {
    const save = JSON.parse(s().exportSave())
    save.state.activeTab = 'not-a-tab'
    const result = validateSave(save)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.errors.join(' ')).toMatch(/activeTab/)
  })
})

describe('a challenge shares the scenario, not just randomness (W5.4)', () => {
  beforeEach(() => s().reset())

  it('the seed alone does not determine the world', () => {
    // Difficulty and country materially change the run: difficulty drives every
    // quarter-event probability, country drives the regulatory due date. Two
    // runs on one seed with different dials are different scenarios, which is
    // why the link has to carry them.
    s().setSeed(4242)
    s().setDifficulty('hard')
    s().setCountry('DE')
    const a = { seed: s().seed, difficulty: s().difficulty, country: s().country }

    s().reset()
    s().setSeed(4242)
    s().setDifficulty('easy')
    s().setCountry('US')
    const b = { seed: s().seed, difficulty: s().difficulty, country: s().country }

    expect(a.seed).toBe(b.seed)
    expect(a).not.toEqual(b)
  })

  it('carries no personal evidence into a challenge baseline', () => {
    // A challenge starts from a clean baseline. Nothing the player produced
    // should be reachable from a link — it is a scenario configuration, not a
    // copy of their run.
    s().recordEvidence({
      id: 'e1',
      runId: 'run-1',
      phase: 'p0',
      resourceId: 'pqc-risk-management',
      kind: 'learn',
      origin: 'learner',
      status: 'comprehension-checked',
      fingerprint: 'mid/US/financial',
      createdAt: 1,
    })
    expect(s().evidence).toHaveLength(1)
    // The link contract is seed + scenario dials only.
    const linkParams = ['seed', 'difficulty', 'size', 'sector', 'country']
    expect(linkParams).not.toContain('evidence')
    expect(linkParams).not.toContain('attempts')
  })

  it('a fresh run started from a challenge has no attempts or evidence', () => {
    s().recordAttempt('p0:0.1:/learn/x', 1, false)
    s().reset()
    expect(Object.keys(s().attempts)).toHaveLength(0)
    expect(s().evidence).toHaveLength(0)
    expect(s().events).toHaveLength(0)
  })
})

describe('reset keeps what it says it keeps (W5.6)', () => {
  beforeEach(() => s().reset())

  it('clears the run but preserves lifetime achievements', () => {
    s().recordSimRunCompletion({
      country: 'US',
      difficulty: 'realistic',
      trapsThisRun: 0,
      objectivesOnTime: 3,
    })
    const runs = s().simRunsCompleted
    expect(runs).toBeGreaterThan(0)

    s().recordAttempt('p0:0.1:/learn/x', 0, true)
    s().reset()

    expect(Object.keys(s().attempts)).toHaveLength(0)
    expect(s().simRunsCompleted).toBe(runs)
  })

  it('a reset run is a clean baseline, not a half-cleared one', () => {
    s().setActiveTab('signals')
    s().markRefVisited('threats')
    s().incrementTrapsThisRun()
    s().reset()
    expect(s().activeTab).toBe('decide')
    expect(s().visitedRefs).toHaveLength(0)
    expect(s().trapsThisRun).toBe(0)
  })
})

describe('the save envelope states its schema version', () => {
  it('exports the version this build writes', () => {
    const save = JSON.parse(useSimulationStore.getState().exportSave())
    expect(save.version).toBe(SAVE_SCHEMA_VERSION)
  })
})

describe('the open resource survives a reload (W5.5)', () => {
  beforeEach(() => s().reset())

  it('remembers which resource was open, not just which tab', () => {
    s().setActiveTab('resources')
    s().setOpenStepRef({ kind: 'learn', label: 'Risk', to: '/learn/pqc-risk-management' })
    const save = JSON.parse(s().exportSave())
    expect(save.state.activeTab).toBe('resources')
    expect(save.state.openStepRef).toMatchObject({ to: '/learn/pqc-risk-management' })
  })

  it('restores it through an export → import round trip', () => {
    s().setOpenStepRef({ kind: 'learn', label: 'Risk', to: '/learn/pqc-risk-management' })
    const json = s().exportSave()
    s().reset()
    expect(s().openStepRef).toBeNull()
    expect(s().importSave(json)).toBe(true)
    expect(s().openStepRef).toMatchObject({ to: '/learn/pqc-risk-management' })
  })

  it('treats a deliberate return to the board as no resume point', () => {
    s().setOpenStepRef({ kind: 'learn', label: 'Risk', to: '/learn/pqc-risk-management' })
    s().setOpenStepRef(null)
    expect(s().openStepRef).toBeNull()
  })

  it('rejects a malformed openStepRef rather than restoring a broken pane', () => {
    const save = JSON.parse(s().exportSave())
    save.state.openStepRef = 42
    const result = validateSave(save)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.errors.join(' ')).toMatch(/openStepRef/)
  })
})
