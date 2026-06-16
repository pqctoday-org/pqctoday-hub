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
  applyModuleRenames,
  findOrphanedModuleIds,
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
