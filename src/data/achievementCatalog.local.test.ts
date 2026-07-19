// SPDX-License-Identifier: GPL-3.0-only
/**
 * Direct coverage for the Wave 4 (WP4.5) simulation achievements — no prior
 * test exercised ACHIEVEMENT_CATALOG's condition functions at all before this.
 */
import { describe, it, expect } from 'vitest'
import { ACHIEVEMENT_CATALOG } from './achievementCatalog'
import { achievementIconMap } from './achievementIcons'
import type { ActivitySnapshot } from '@/types/AchievementTypes'

const baseSnapshot: ActivitySnapshot = {
  currentStreak: 0,
  longestStreak: 0,
  totalSessions: 0,
  lastGapDays: 0,
  totalCompletedSteps: 0,
  completedModuleIds: [],
  completedTrackIds: [],
  totalArtifactKeys: 0,
  totalArtifactCerts: 0,
  totalArtifactCsrs: 0,
  totalArtifactExecDocs: 0,
  totalArtifacts: 0,
  totalTimeMinutes: 0,
  modulesWithAllLearnSections: [],
  deepDiveModuleIds: [],
  quizQuestionsCorrect: 0,
  playgroundOperationCount: 0,
  playgroundToolsUsed: [],
  chatMessageCount: 0,
  assessmentCompleted: false,
  complianceFrameworkCount: 0,
  migrateProductCount: 0,
  sectionsVisited: [],
  endorsementCount: 0,
  businessToolsUsed: [],
  simRunsCompleted: 0,
  simZeroTrapPhases: 0,
  simHardWin: false,
  simOnTimeObjectives: 0,
  simJurisdictionsPlayed: [],
}

function find(id: string) {
  const a = ACHIEVEMENT_CATALOG.find((x) => x.id === id)
  if (!a) throw new Error(`achievement "${id}" not found in catalog`)
  return a
}

describe('Wave 4 (WP4.5) simulation achievements', () => {
  it('every catalog entry resolves to a real, registered icon', () => {
    const missing = ACHIEVEMENT_CATALOG.filter((a) => !achievementIconMap[a.icon]).map(
      (a) => `${a.id} -> ${a.icon}`
    )
    expect(missing, `unregistered icons: ${missing.join(', ')}`).toEqual([])
  })

  it('every catalog id is unique', () => {
    const ids = ACHIEVEMENT_CATALOG.map((a) => a.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('sim-run-complete unlocks once a run has ever completed', () => {
    const a = find('sim-run-complete')
    expect(a.condition(baseSnapshot)).toBe(false)
    expect(a.condition({ ...baseSnapshot, simRunsCompleted: 1 })).toBe(true)
  })

  it('sim-clean-run requires at least one zero-trap completion', () => {
    const a = find('sim-clean-run')
    expect(a.condition(baseSnapshot)).toBe(false)
    expect(a.condition({ ...baseSnapshot, simZeroTrapPhases: 1 })).toBe(true)
  })

  it('sim-hard-win requires the lifetime Hard flag', () => {
    const a = find('sim-hard-win')
    expect(a.condition(baseSnapshot)).toBe(false)
    expect(a.condition({ ...baseSnapshot, simHardWin: true })).toBe(true)
  })

  it('sim-on-time requires all 3 objectives on time in one run (the high-water mark)', () => {
    const a = find('sim-on-time')
    expect(a.condition({ ...baseSnapshot, simOnTimeObjectives: 2 })).toBe(false)
    expect(a.condition({ ...baseSnapshot, simOnTimeObjectives: 3 })).toBe(true)
  })

  it('sim-jurisdictions requires 3+ distinct countries played', () => {
    const a = find('sim-jurisdictions')
    expect(a.condition({ ...baseSnapshot, simJurisdictionsPlayed: ['US', 'DE'] })).toBe(false)
    expect(a.condition({ ...baseSnapshot, simJurisdictionsPlayed: ['US', 'DE', 'JP'] })).toBe(true)
  })

  it('full-journey now requires simulation alongside learn/assess/migrate/playground', () => {
    const a = find('full-journey')
    const almost = {
      ...baseSnapshot,
      sectionsVisited: ['learn', 'assess', 'migrate', 'playground'],
      chatMessageCount: 1,
    }
    expect(a.condition(almost)).toBe(false) // missing 'simulation'
    expect(
      a.condition({
        ...almost,
        sectionsVisited: [...almost.sectionsVisited, 'simulation'],
      })
    ).toBe(true)
  })
})
