// SPDX-License-Identifier: GPL-3.0-only
/**
 * WS-0 (2026-09-24) — completion under learn paths.
 *
 * EMV (the only shipped multi-path module) must complete exactly as before;
 * the fixture proves the new rules: path-tagged workshop steps, optional
 * reference sections/steps never required. No persisted field was added —
 * `activeLearnPath` has existed since 2026-07-30 — so the last test pins that
 * the migrate ladder carries it through untouched.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useModuleStore } from './useModuleStore'
import { PATH_FIXTURE } from '../components/PKILearning/manifest/__fixtures__/learnPathFixture'
import emv from '../components/PKILearning/modules/EMVPaymentPQC/manifest'

vi.mock('../utils/analytics', () => ({
  logModuleStart: vi.fn(),
  logModuleComplete: vi.fn(),
  logStepComplete: vi.fn(),
  logArtifactGenerated: vi.fn(),
}))

// Register the fixture by id only (not in MANIFESTS), so the derived legacy
// maps and every other module are untouched.
vi.mock('../components/PKILearning/manifest/registry', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('../components/PKILearning/manifest/registry')>()
  const { PATH_FIXTURE: fixture } =
    await import('../components/PKILearning/manifest/__fixtures__/learnPathFixture')
  return { ...actual, MANIFEST_BY_ID: { ...actual.MANIFEST_BY_ID, [fixture.id]: fixture } }
})

const store = () => useModuleStore.getState()
const status = (id: string) => store().modules[id]?.status

describe('module store — EMV learn paths unchanged', () => {
  beforeEach(() => store().resetProgress())

  it('without a path, the banking sections alone do not complete the module', () => {
    const banking = emv.learnPaths!.find((p) => p.id === 'banking')!
    for (const s of banking.sections) store().markLearnSectionRead(emv.id, s)
    expect(status(emv.id)).not.toBe('completed')
  })

  it('on the banking path, its 6 sections complete the module', () => {
    store().setActiveLearnPath(emv.id, 'banking')
    const banking = emv.learnPaths!.find((p) => p.id === 'banking')!
    for (const s of banking.sections.slice(0, -1)) store().markLearnSectionRead(emv.id, s)
    expect(status(emv.id)).not.toBe('completed')
    store().markLearnSectionRead(emv.id, banking.sections.at(-1)!)
    expect(status(emv.id)).toBe('completed')
  })

  it('an unknown stored path falls back to all 12 sections', () => {
    store().setActiveLearnPath(emv.id, 'renamed-away')
    const banking = emv.learnPaths!.find((p) => p.id === 'banking')!
    for (const s of banking.sections) store().markLearnSectionRead(emv.id, s)
    expect(status(emv.id)).not.toBe('completed')
  })

  it('the workshop still needs all 8 steps on every path', () => {
    store().updateModuleProgress(emv.id, { status: 'in-progress' })
    store().setActiveLearnPath(emv.id, 'retail')
    const steps = emv.workshopSteps!.map((s) => s.id)
    for (const s of steps.slice(0, -1)) store().markStepComplete(emv.id, s)
    expect(status(emv.id)).toBe('in-progress')
    store().markStepComplete(emv.id, steps.at(-1)!)
    expect(status(emv.id)).toBe('completed')
  })
})

describe('module store — path-scoped steps and optional references (fixture)', () => {
  const id = PATH_FIXTURE.id
  beforeEach(() => store().resetProgress())

  it('path A completes on its non-optional sections; optional references are not required', () => {
    store().setActiveLearnPath(id, 'a')
    for (const s of ['core-1', 'core-2']) store().markLearnSectionRead(id, s)
    expect(status(id)).not.toBe('completed')
    store().markLearnSectionRead(id, 'a-1')
    expect(status(id)).toBe('completed')
  })

  it('reading only optional references never completes the module', () => {
    store().setActiveLearnPath(id, 'a')
    store().markLearnSectionRead(id, 'a-ref')
    store().markLearnSectionRead(id, 'shared-ref')
    expect(status(id)).not.toBe('completed')
  })

  it("no path: every non-optional section is required (both paths' lessons)", () => {
    for (const s of ['core-1', 'core-2', 'a-1']) store().markLearnSectionRead(id, s)
    expect(status(id)).not.toBe('completed')
    store().markLearnSectionRead(id, 'b-1')
    expect(status(id)).toBe('completed')
  })

  it("path B's workshop completes without path A's step or the optional reference step", () => {
    store().updateModuleProgress(id, { status: 'in-progress' })
    store().setActiveLearnPath(id, 'b')
    store().markStepComplete(id, 'w-core')
    expect(status(id)).toBe('in-progress')
    store().markStepComplete(id, 'w-b')
    expect(status(id)).toBe('completed')
  })

  it('no path: the workshop needs every non-optional step', () => {
    store().updateModuleProgress(id, { status: 'in-progress' })
    for (const s of ['w-core', 'w-a', 'w-ref']) store().markStepComplete(id, s)
    expect(status(id)).toBe('in-progress')
    store().markStepComplete(id, 'w-b')
    expect(status(id)).toBe('completed')
  })

  it('clearing the path ("All sections") stores an empty id and restores the full requirement', () => {
    store().setActiveLearnPath(id, 'a')
    store().setActiveLearnPath(id, '')
    expect(store().modules[id]?.activeLearnPath).toBe('')
    for (const s of ['core-1', 'core-2', 'a-1']) store().markLearnSectionRead(id, s)
    expect(status(id)).not.toBe('completed')
  })
})

describe('module store — persisted shape unchanged by WS-0', () => {
  it('stays at persist version 16 and the migrate ladder keeps activeLearnPath', () => {
    const opts = useModuleStore.persist.getOptions()
    expect(opts.version).toBe(16)
    const persisted = {
      version: '16.0.0',
      timestamp: 1,
      modules: {
        [emv.id]: {
          status: 'in-progress',
          lastVisited: 1,
          timeSpent: 3,
          completedSteps: [],
          quizScores: {},
          learnSectionChecks: { 'interbank-rails': true },
          activeLearnPath: 'banking',
        },
      },
      artifacts: { keys: [], certificates: [], csrs: [], executiveDocuments: [] },
    }
    const migrated = opts.migrate!(JSON.parse(JSON.stringify(persisted)), 16) as {
      modules: Record<string, { activeLearnPath?: string; learnSectionChecks?: object }>
    }
    expect(migrated.modules[emv.id].activeLearnPath).toBe('banking')
    expect(migrated.modules[emv.id].learnSectionChecks).toEqual({ 'interbank-rails': true })
  })
})
