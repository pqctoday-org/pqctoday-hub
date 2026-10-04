// SPDX-License-Identifier: GPL-3.0-only
/**
 * Learn-content versioning + drift reconciliation (B2).
 * Guards the declarative rename-map + orphan detection so a renamed/removed
 * module never silently loses or strands progress.
 */
import { describe, it, expect } from 'vitest'
import {
  LEARN_CONTENT_VERSION,
  MODULE_IDS,
  MODULE_ID_RENAMES,
  MODULE_CONTENT_MOVES,
  applyContentMoves,
  applyModuleRenames,
  findOrphanedModuleIds,
  getModuleVersionFingerprint,
  diffModuleVersions,
} from './contentVersion'
import { MANIFESTS } from './registry'
import type { LearningProgress } from '@/services/storage/types'

type ModuleEntry = LearningProgress['modules'][string]
const entry = (over: Partial<ModuleEntry> = {}): ModuleEntry => ({
  status: 'in-progress',
  lastVisited: 1,
  timeSpent: 10,
  completedSteps: [],
  quizScores: {},
  ...over,
})

describe('B2 content versioning', () => {
  it('exposes a numeric content version and the full canonical id set', () => {
    expect(typeof LEARN_CONTENT_VERSION).toBe('number')
    expect(MODULE_IDS.size).toBe(MANIFESTS.length)
    expect(MODULE_IDS.has('hsm-pqc')).toBe(true)
  })

  it('every rename maps an OLD (retired) id to a CURRENT catalog id', () => {
    for (const [oldId, newId] of Object.entries(MODULE_ID_RENAMES)) {
      expect(MODULE_IDS.has(newId), `${oldId}→${newId}: target must be a real module`).toBe(true)
      expect(MODULE_IDS.has(oldId), `${oldId} should be retired (not a live module id)`).toBe(false)
    }
  })

  it('applyModuleRenames carries progress from an old id to the new id', () => {
    const modules = { 'old-id': entry({ completedSteps: ['s1'] }) }
    const out = applyModuleRenames(modules, { 'old-id': 'new-id' })
    expect(out['old-id']).toBeUndefined()
    expect(out['new-id'].completedSteps).toEqual(['s1'])
  })

  it('applyModuleRenames merges losslessly when the new id already has progress', () => {
    const modules = {
      'old-id': entry({ status: 'completed', timeSpent: 50, completedSteps: ['a'] }),
      'new-id': entry({ status: 'in-progress', timeSpent: 10, completedSteps: ['b'] }),
    }
    const out = applyModuleRenames(modules, { 'old-id': 'new-id' })
    expect(out['old-id']).toBeUndefined()
    expect(out['new-id'].status).toBe('completed') // most-advanced
    expect(out['new-id'].timeSpent).toBe(50) // max
    expect(out['new-id'].completedSteps.sort()).toEqual(['a', 'b']) // union
  })

  it('applyModuleRenames is a no-op when the old id is absent (idempotent)', () => {
    const modules = { 'hsm-pqc': entry() }
    const out = applyModuleRenames(modules, { 'old-id': 'new-id' })
    expect(out).toEqual(modules)
  })

  it('findOrphanedModuleIds flags removed ids only (not current, not renamed-away)', () => {
    const orphans = findOrphanedModuleIds(['hsm-pqc', 'a-removed-module', 'quiz'])
    expect(orphans).toContain('a-removed-module')
    expect(orphans).not.toContain('hsm-pqc')
    expect(orphans).not.toContain('quiz')
  })
})

describe('B2 module-change diff ("What\'s New")', () => {
  it('getModuleVersionFingerprint covers every manifest, defaulting to version 1', () => {
    const fp = getModuleVersionFingerprint()
    expect(Object.keys(fp).length).toBe(MANIFESTS.length)

    // The default is checked against a manifest that HAS no contentVersion, found
    // at run time rather than named. This asserted `fp['hsm-pqc'] === 1`, which
    // broke on 2026-08-22 when emit_revision.py bumped that module to 2 — the
    // bump was correct, and hard-coding one module as "the unversioned one" made
    // a routine content edit look like a defect. Every module is versioned
    // eventually; the DEFAULT is the invariant, so assert that instead.
    const unversioned = MANIFESTS.find((m) => m.contentVersion === undefined)
    if (unversioned) expect(fp[unversioned.id]).toBe(1)
    for (const m of MANIFESTS) {
      expect(fp[m.id], `${m.id} fingerprint`).toBe(m.contentVersion ?? 1)
    }
  })

  it('detects added modules', () => {
    expect(diffModuleVersions({ a: 1 }, { a: 1, b: 1 }).added).toEqual(['b'])
  })

  it('detects retired modules (progress kept, surfaced as retired)', () => {
    expect(diffModuleVersions({ a: 1, b: 1 }, { a: 1 }).retired).toEqual(['b'])
  })

  it('detects updated modules (content version bumped)', () => {
    expect(diffModuleVersions({ a: 1 }, { a: 2 }).updated).toEqual(['a'])
  })

  it('reports no changes when fingerprints match', () => {
    expect(diffModuleVersions({ a: 1, b: 2 }, { a: 1, b: 2 })).toEqual({
      added: [],
      retired: [],
      updated: [],
      renamed: [],
    })
  })
})

describe('MODULE_CONTENT_MOVES (content that moved between live modules)', () => {
  const byId = new Map(MANIFESTS.map((m) => [m.id, m]))

  it('names live modules, steps and sections that exist on the receiving module only', () => {
    expect(MODULE_CONTENT_MOVES.length).toBeGreaterThan(0)
    for (const move of MODULE_CONTENT_MOVES) {
      const from = byId.get(move.from)
      const to = byId.get(move.to)
      expect(from, `${move.from} is live`).toBeDefined()
      expect(to, `${move.to} is live`).toBeDefined()
      const fromSteps = new Set((from!.workshopSteps ?? []).map((st) => st.id))
      const toSteps = new Set((to!.workshopSteps ?? []).map((st) => st.id))
      for (const id of move.steps) {
        expect(fromSteps.has(id), `${move.from} no longer has step ${id}`).toBe(false)
        expect(toSteps.has(id), `${move.to} has step ${id}`).toBe(true)
      }
      const fromSections = new Set((from!.learnSections ?? []).map((sec) => sec.id))
      const toSections = new Set((to!.learnSections ?? []).map((sec) => sec.id))
      for (const [oldId, newIds] of Object.entries(move.sections)) {
        expect(fromSections.has(oldId), `${move.from} no longer has section ${oldId}`).toBe(false)
        for (const id of newIds)
          expect(toSections.has(id), `${move.to} has section ${id}`).toBe(true)
      }
    }
  })

  it('does not touch a module whose progress has nothing that moved', () => {
    const modules = { 'confidential-computing': entry({ completedSteps: ['tee-hsm-channel'] }) }
    expect(applyContentMoves(modules)).toEqual(modules)
  })
})
