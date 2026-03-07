// SPDX-License-Identifier: GPL-3.0-only

/** Achievement categories matching priority behaviors */
export type AchievementCategory = 'consistency' | 'workshop-depth' | 'cross-feature'

/** Rarity tiers drive visual styling (border glow, icon treatment) */
export type AchievementRarity = 'common' | 'uncommon' | 'rare' | 'epic'

/** A single achievement definition in the static catalog */
export interface AchievementDefinition {
  id: string
  title: string
  description: string
  category: AchievementCategory
  rarity: AchievementRarity
  /** lucide-react icon name (resolved via achievementIcons map) */
  icon: string
  /** Returns true when the achievement should unlock */
  condition: (snapshot: ActivitySnapshot) => boolean
  /** Secret achievements hidden until unlocked */
  secret?: boolean
}

/** Record of an unlocked achievement (persisted in Zustand store) */
export interface UnlockedAchievement {
  id: string
  unlockedAt: number
  seen: boolean
}

/**
 * Cross-store activity snapshot assembled by the checker hook.
 * Flat DTO — no store references, no reactive subscriptions.
 */
export interface ActivitySnapshot {
  // Consistency
  currentStreak: number
  longestStreak: number
  totalSessions: number
  lastGapDays: number

  // Workshop depth
  totalCompletedSteps: number
  completedModuleIds: string[]
  completedTrackIds: string[]
  totalArtifactKeys: number
  totalArtifactCerts: number
  totalArtifactCsrs: number
  totalArtifactExecDocs: number
  totalArtifacts: number
  totalTimeMinutes: number
  modulesWithAllLearnSections: string[]
  deepDiveModuleIds: string[]
  quizQuestionsCorrect: number

  // Cross-feature exploration
  playgroundOperationCount: number
  chatMessageCount: number
  assessmentCompleted: boolean
  complianceFrameworkCount: number
  migrateProductCount: number
  sectionsVisited: string[]
}
