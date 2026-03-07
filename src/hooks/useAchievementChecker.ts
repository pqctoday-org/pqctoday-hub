// SPDX-License-Identifier: GPL-3.0-only
import { useMemo, useEffect, useRef } from 'react'
import { useModuleStore } from '@/store/useModuleStore'
import { useAssessmentStore } from '@/store/useAssessmentStore'
import { useChatStore } from '@/store/useChatStore'
import { useComplianceSelectionStore } from '@/store/useComplianceSelectionStore'
import { useMigrateSelectionStore } from '@/store/useMigrateSelectionStore'
import { useAchievementStore } from '@/store/useAchievementStore'
import { ACHIEVEMENT_CATALOG } from '@/data/achievementCatalog'
import { MODULE_TRACKS, LEARN_SECTIONS } from '@/components/PKILearning/moduleData'
import type { ActivitySnapshot } from '@/types/AchievementTypes'

/**
 * Evaluates achievement conditions against current app state.
 * Mounted once in App.tsx — re-evaluates when any relevant store changes.
 */
export function useAchievementChecker() {
  // Granular Zustand selectors
  const modules = useModuleStore((s) => s.modules)
  const artifacts = useModuleStore((s) => s.artifacts)
  const sessionTracking = useModuleStore((s) => s.sessionTracking)
  const quizMastery = useModuleStore((s) => s.quizMastery)

  const assessmentStatus = useAssessmentStore((s) => s.assessmentStatus)
  const conversations = useChatStore((s) => s.conversations)
  const myFrameworks = useComplianceSelectionStore((s) => s.myFrameworks)
  const myProducts = useMigrateSelectionStore((s) => s.myProducts)

  const playgroundOpCount = useAchievementStore((s) => s.playgroundOpCount)
  const sectionsVisited = useAchievementStore((s) => s.sectionsVisited)
  const unlocked = useAchievementStore((s) => s.unlocked)
  const unlock = useAchievementStore((s) => s.unlock)

  const prevUnlockedCount = useRef(unlocked.length)

  const snapshot = useMemo<ActivitySnapshot>(() => {
    // Consistency
    const currentStreak = sessionTracking?.currentStreak ?? 0
    const longestStreak = sessionTracking?.longestStreak ?? 0
    const totalSessions = sessionTracking?.totalSessions ?? 0
    const lastGapDays = sessionTracking?.lastGapDays ?? 0

    // Workshop depth
    let totalCompletedSteps = 0
    const completedModuleIds: string[] = []
    const deepDiveModuleIds: string[] = []
    const modulesWithAllLearnSections: string[] = []
    let totalTimeMinutes = 0

    for (const [id, mod] of Object.entries(modules)) {
      if (!mod) continue

      totalCompletedSteps += mod.completedSteps?.length ?? 0
      totalTimeMinutes += mod.timeSpent ?? 0

      if (mod.status === 'completed') {
        completedModuleIds.push(id)
      }
      if ((mod.timeSpent ?? 0) >= 30) {
        deepDiveModuleIds.push(id)
      }

      // Check if all learn sections completed
      const sections = LEARN_SECTIONS[id]
      if (sections && sections.length > 0 && mod.learnSectionChecks) {
        const allChecked = sections.every((s) => mod.learnSectionChecks?.[s.id])
        if (allChecked) modulesWithAllLearnSections.push(id)
      }
    }

    // Track completion
    const completedTrackIds: string[] = []
    for (const track of MODULE_TRACKS) {
      const trackModuleIds = track.modules.map((m) => m.id)
      if (
        trackModuleIds.length > 0 &&
        trackModuleIds.every((id) => completedModuleIds.includes(id))
      ) {
        completedTrackIds.push(track.track)
      }
    }

    // Artifacts
    const totalArtifactKeys = artifacts?.keys?.length ?? 0
    const totalArtifactCerts = artifacts?.certificates?.length ?? 0
    const totalArtifactCsrs = artifacts?.csrs?.length ?? 0
    const totalArtifactExecDocs = artifacts?.executiveDocuments?.length ?? 0

    // Chat
    let chatMessageCount = 0
    for (const conv of conversations ?? []) {
      chatMessageCount += conv.messages?.filter((m) => m.role === 'user').length ?? 0
    }

    return {
      currentStreak,
      longestStreak,
      totalSessions,
      lastGapDays,
      totalCompletedSteps,
      completedModuleIds,
      completedTrackIds,
      totalArtifactKeys,
      totalArtifactCerts,
      totalArtifactCsrs,
      totalArtifactExecDocs,
      totalArtifacts:
        totalArtifactKeys + totalArtifactCerts + totalArtifactCsrs + totalArtifactExecDocs,
      totalTimeMinutes,
      modulesWithAllLearnSections,
      deepDiveModuleIds,
      playgroundOperationCount: playgroundOpCount,
      chatMessageCount,
      assessmentCompleted: assessmentStatus === 'complete',
      complianceFrameworkCount: myFrameworks?.length ?? 0,
      migrateProductCount: myProducts?.length ?? 0,
      sectionsVisited: sectionsVisited ?? [],
      quizQuestionsCorrect: quizMastery?.correctQuestionIds?.length ?? 0,
    }
  }, [
    modules,
    artifacts,
    sessionTracking,
    quizMastery,
    assessmentStatus,
    conversations,
    myFrameworks,
    myProducts,
    playgroundOpCount,
    sectionsVisited,
  ])

  useEffect(() => {
    // Skip if the change was caused by unlock() itself
    if (unlocked.length !== prevUnlockedCount.current) {
      prevUnlockedCount.current = unlocked.length
      return
    }

    const unlockedIds = new Set(unlocked.map((u) => u.id))

    for (const achievement of ACHIEVEMENT_CATALOG) {
      if (unlockedIds.has(achievement.id)) continue

      try {
        if (achievement.condition(snapshot)) {
          unlock(achievement.id)
        }
      } catch {
        // Silently skip broken conditions
      }
    }
  }, [snapshot, unlocked, unlock])
}
